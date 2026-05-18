import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Loader2, Image as ImageIcon, Edit2, X, ArrowLeft, ToggleLeft, ToggleRight, AlignLeft } from 'lucide-react';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useConfirm } from '../lib/confirm-dialog';
import { useTranslation } from 'react-i18next';

const RATIO_OPTIONS = ['4:3', '9:16'];
const DEFAULT_FORM = { name: '', image: null, is_active: true, ratio_type: '4:3', caption: '' };

export default function AdminEndorsements() {
    const { t } = useTranslation();
    const RATIO_LABELS = { '4:3': 'Landscape 4:3', '9:16': 'Portrait 9:16' };
    const [currentView, setCurrentView] = useState('list');
    const [endorsements, setEndorsements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(DEFAULT_FORM);
    const [preview, setPreview] = useState(null);
    const [selectedEndorsement, setSelectedEndorsement] = useState(null);
    const confirm = useConfirm();

    const fetchEndorsements = async () => {
        setLoading(true);
        try {
            const res = await axios.get(import.meta.env.VITE_API_URL + '/api/endorsements');
            setEndorsements(res.data);
        } catch { notify.error(t('admin_endorsement.failed_load')); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEndorsements(); }, []);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleEdit = (endorsement) => {
        setSelectedEndorsement(endorsement);
        setFormData({
            name: endorsement.name,
            image: null,
            is_active: endorsement.is_active === true || endorsement.is_active === 'true',
            ratio_type: RATIO_OPTIONS.includes(endorsement.ratio_type) ? endorsement.ratio_type : '4:3',
            caption: endorsement.caption || '',
        });
        setPreview(`${import.meta.env.VITE_API_URL}${endorsement.image_path}`);
        setCurrentView('form');
    };

    const handleCancelEdit = () => {
        setCurrentView('list');
        setSelectedEndorsement(null);
        setFormData(DEFAULT_FORM);
        setPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return notify.error(t('admin_endorsement.name_required'));
        if (selectedEndorsement === null && !formData.image) return notify.error(t('admin_endorsement.image_required'));

        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('is_active', formData.is_active);
        payload.append('ratio_type', formData.ratio_type);
        payload.append('caption', formData.caption);
        if (formData.image) payload.append('image', formData.image);

        try {
            const token = localStorage.getItem('token');
            const loadingToastId = notify.loading(selectedEndorsement === null ? t('admin_endorsement.adding') : t('admin_endorsement.saving_changes'));
            let res;
            if (selectedEndorsement === null) {
                res = await axios.post(import.meta.env.VITE_API_URL + '/api/endorsements', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                res = await axios.put(`${import.meta.env.VITE_API_URL}/api/endorsements/${selectedEndorsement.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
            }
            notify.update(loadingToastId, {
                render: res.data.message || (selectedEndorsement ? t('admin_endorsement.updated_success') : t('admin_endorsement.added_success')),
                type: 'success', isLoading: false, autoClose: 3000
            });
            setEndorsements(res.data.data);
            handleCancelEdit();
        } catch (error) {
            notify.error(error.response?.data?.message || (selectedEndorsement ? t('admin_endorsement.failed_update') : t('admin_endorsement.failed_add')));
        }
    };

    const handleDelete = async (id, name) => {
        const confirmed = await confirm({
            title: t('admin_endorsement.delete_title'),
            description: t('admin_endorsement.delete_confirm', { name }),
            confirmText: t('admin_endorsement.delete_btn'),
            cancelText: t('admin_endorsement.cancel_btn'),
        });

        if (confirmed) {
            try {
                const token = localStorage.getItem('token');
                const loadingToastId = notify.loading(t('admin_endorsement.deleting'));
                const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/endorsements/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEndorsements(res.data.data);
                if (selectedEndorsement?.id === id) handleCancelEdit();
                notify.update(loadingToastId, { render: res.data.message || t('admin_endorsement.deleted_success'), type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                notify.error(error.response?.data?.message || t('admin_endorsement.failed_delete'));
            }
        }
    };

    const handleToggleActive = async (endorsement) => {
        const newActiveState = !(endorsement.is_active === true || endorsement.is_active === 'true');
        const payload = new FormData();
        payload.append('name', endorsement.name);
        payload.append('is_active', newActiveState);
        payload.append('ratio_type', endorsement.ratio_type || '4:3');
        payload.append('caption', endorsement.caption || '');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/endorsements/${endorsement.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEndorsements(res.data.data);
            notify.success(newActiveState ? t('admin_endorsement.status_activated') : t('admin_endorsement.status_deactivated'));
        } catch {
            notify.error(t('admin_endorsement.failed_update_status'));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {currentView === 'list' ? (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                                <Award className="text-rose-500" /> {t('admin_endorsement.page_title')}
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">{t('admin_endorsement.page_desc')}</p>
                        </div>
                        <button
                            onClick={() => { setCurrentView('form'); setSelectedEndorsement(null); setFormData(DEFAULT_FORM); setPreview(null); }}
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} /> {t('admin_endorsement.add_endorsement')}
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-10 text-center">
                            <Loader2 className="animate-spin text-rose-500 mx-auto" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
                            {endorsements.length === 0 ? (
                                <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                                    <Award size={48} className="text-zinc-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-zinc-300">{t('admin_endorsement.no_endorsements')}</h3>
                                    <p className="text-zinc-500 mt-1">{t('admin_endorsement.no_endorsements_desc')}</p>
                                </div>
                            ) : (
                                endorsements.map((item) => {
                                    const isActive = item.is_active === true || item.is_active === 'true';
                                    const ratioLabel = item.ratio_type === '9:16' ? '9:16' : '4:3';
                                    return (
                                        <div
                                            key={item.id}
                                            className={`bg-zinc-900 border rounded-lg overflow-hidden group hover:border-zinc-600 transition-colors ${isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}
                                        >
                                            {/* Image preview — force 4:3 ratio in list view for uniformity */}
                                            <div className="bg-zinc-950 relative border-b border-zinc-800 overflow-hidden aspect-[4/3]">
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}${item.image_path}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="bg-blue-500/90 text-white p-2 rounded-md hover:bg-blue-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(item.id, item.name)} className="bg-red-500/90 text-white p-2 rounded-md hover:bg-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                                {!isActive && (
                                                    <span className="absolute top-2 left-2 bg-zinc-800/90 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{t('admin_endorsement.inactive_badge')}</span>
                                                )}
                                                <span className="absolute bottom-2 left-2 bg-zinc-950/80 text-zinc-400 text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-widest">{ratioLabel}</span>
                                            </div>
                                            <div className="p-3 flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-sm text-zinc-100 truncate">{item.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border ${ratioLabel === '9:16'
                                                                ? 'border-violet-800 text-violet-400 bg-violet-950/40'
                                                                : 'border-zinc-700 text-zinc-500 bg-zinc-950'
                                                            }`}>{ratioLabel}</span>
                                                        {item.caption && (
                                                            <p className="text-[11px] text-zinc-500 truncate">{item.caption}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleActive(item)}
                                                    className={`shrink-0 transition-colors ${isActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                    title={isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCancelEdit} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                                <Award className="text-rose-500" /> {selectedEndorsement ? t('admin_endorsement.edit_title') : t('admin_endorsement.add_new_title')}
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">{t('admin_endorsement.form_desc')}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left: Fields */}
                        <div className="col-span-2 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">{t('admin_endorsement.endorser_name')} <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={t('admin_endorsement.name_placeholder')}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>

                            {/* Ratio Type */}
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">{t('admin_endorsement.image_ratio')} <span className="text-rose-500">*</span></label>
                                <div className="flex gap-2">
                                    {RATIO_OPTIONS.map(ratio => (
                                        <button
                                            key={ratio}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, ratio_type: ratio }))}
                                            className={`flex-1 py-2 px-4 rounded-md border text-sm font-mono uppercase tracking-widest transition-all ${formData.ratio_type === ratio
                                                    ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                                }`}
                                        >
                                            {ratio}
                                            <span className="block text-[10px] normal-case tracking-normal text-zinc-500 mt-0.5">
                                                {RATIO_LABELS[ratio]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-zinc-600 mt-1.5">
                                    {t('admin_endorsement.ratio_desc')}
                                </p>
                            </div>

                            {/* Caption */}
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 flex items-center gap-1.5">
                                    <AlignLeft size={13} /> {t('admin_endorsement.caption')} <span className="text-zinc-600 font-normal">{t('admin_endorsement.optional')}</span>
                                </label>
                                <textarea
                                    value={formData.caption}
                                    onChange={e => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                                    placeholder={t('admin_endorsement.caption_placeholder')}
                                    rows={3}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors resize-none text-sm leading-relaxed"
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3 py-1">
                                <label className="text-sm text-zinc-400">{t('admin_endorsement.active_status')}</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                    className={`transition-colors ${formData.is_active ? 'text-emerald-400' : 'text-zinc-600'}`}
                                >
                                    {formData.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                                <span className={`text-xs font-mono uppercase tracking-wider ${formData.is_active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                    {formData.is_active ? t('admin_endorsement.active') : t('admin_endorsement.inactive')}
                                </span>
                            </div>
                        </div>

                        {/* Right: Image Upload + Actions */}
                        <div className="flex flex-col gap-4">
                            <label className="text-sm text-zinc-400 mb-1 block">
                                {t('admin_endorsement.upload_photo')} <span className="text-rose-500">*</span>
                                <span className="text-zinc-600 font-normal ml-1">{t('admin_endorsement.photo_req')}</span>
                            </label>

                            {/* Preview box — aspect ratio mirrors the selected ratio_type */}
                            <label
                                className={`border-2 border-dashed border-zinc-700 bg-zinc-950 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-all overflow-hidden relative ${formData.ratio_type === '9:16' ? 'aspect-[9/16]' : 'aspect-[4/3]'
                                    }`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        handleFile({ target: { files: e.dataTransfer.files } });
                                    }
                                }}
                            >
                                {preview
                                    ? <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                    : <>
                                        <ImageIcon size={32} className="text-zinc-600 mb-2" />
                                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                            {formData.ratio_type} {t('admin_endorsement.preview')}
                                        </span>
                                    </>
                                }
                                <span className="text-xs text-zinc-400 z-10 bg-zinc-900/80 px-2 py-1 rounded absolute bottom-2">
                                    {t('admin_endorsement.drag_drop')}
                                </span>
                                <input type="file" onChange={handleFile} accept="image/jpeg,image/png,image/webp" className="hidden" />
                            </label>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors">
                                    <Plus size={18} /> {selectedEndorsement ? t('admin_endorsement.update_btn') : t('admin_endorsement.save_btn')}
                                </button>
                                <button type="button" onClick={handleCancelEdit} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors">
                                    <X size={18} /> {t('admin_endorsement.cancel_btn')}
                                </button>
                            </div>
                        </div>
                    </form>
                </>
            )}
        </div>
    );

}
