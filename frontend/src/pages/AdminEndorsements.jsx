import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Loader2, Image as ImageIcon, Edit2, X, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useConfirm } from '../lib/confirm-dialog';

export default function AdminEndorsements() {
    const [currentView, setCurrentView] = useState('list');
    const [endorsements, setEndorsements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', image: null, is_active: true });
    const [preview, setPreview] = useState(null);
    const [selectedEndorsement, setSelectedEndorsement] = useState(null);
    const confirm = useConfirm();

    const fetchEndorsements = async () => {
        setLoading(true);
        try {
            const res = await axios.get(import.meta.env.VITE_API_URL + '/api/endorsements');
            setEndorsements(res.data);
        } catch { notify.error("Failed to load endorsement data"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEndorsements(); }, []);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleEdit = (endorsement) => {
        setSelectedEndorsement(endorsement);
        setFormData({
            name: endorsement.name,
            image: null,
            is_active: endorsement.is_active === true || endorsement.is_active === 'true'
        });
        setPreview(`${import.meta.env.VITE_API_URL}${endorsement.image_path}`);
        setCurrentView('form');
    };

    const handleCancelEdit = () => {
        setCurrentView('list');
        setSelectedEndorsement(null);
        setFormData({ name: '', image: null, is_active: true });
        setPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return notify.error("Name is required!");
        if (selectedEndorsement === null && !formData.image) return notify.error("An image is required!");

        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('is_active', formData.is_active);
        if (formData.image) payload.append('image', formData.image);

        try {
            const token = localStorage.getItem('token');
            const loadingToastId = notify.loading(selectedEndorsement === null ? 'Adding endorsement...' : 'Saving changes...');
            let res;
            if (selectedEndorsement === null) {
                res = await axios.post(import.meta.env.VITE_API_URL + '/api/endorsements', payload, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await axios.put(`${import.meta.env.VITE_API_URL}/api/endorsements/${selectedEndorsement.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
            }
            notify.update(loadingToastId, { render: res.data.message || (selectedEndorsement ? "Endorsement updated successfully!" : "Endorsement added successfully!"), type: 'success', isLoading: false, autoClose: 3000 });
            setEndorsements(res.data.data);
            handleCancelEdit();
        } catch (error) {
            notify.error(error.response?.data?.message || (selectedEndorsement ? "Failed to update endorsement" : "Failed to add endorsement"));
        }
    };

    const handleDelete = async (id, name) => {
        const confirmed = await confirm({
            title: 'Delete Endorsement',
            description: `Are you sure you want to delete the endorsement "${name}"? This action cannot be undone!`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            try {
                const token = localStorage.getItem('token');
                const loadingToastId = notify.loading('Deleting endorsement...');
                const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/endorsements/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEndorsements(res.data.data);
                if (selectedEndorsement?.id === id) handleCancelEdit();
                notify.update(loadingToastId, { render: res.data.message || 'Endorsement deleted successfully!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Failed to delete endorsement";
                notify.error(errorMessage);
            }
        }
    };

    const handleToggleActive = async (endorsement) => {
        const newActiveState = !(endorsement.is_active === true || endorsement.is_active === 'true');
        const payload = new FormData();
        payload.append('name', endorsement.name);
        payload.append('is_active', newActiveState);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/endorsements/${endorsement.id}`, payload, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setEndorsements(res.data.data);
            notify.success(`Endorsement ${newActiveState ? 'activated' : 'deactivated'}`);
        } catch {
            notify.error("Failed to update endorsement status");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {currentView === 'list' ? (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                                <Award className="text-rose-500" /> Endorsements
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Manage social proof / endorsements displayed on the landing page.</p>
                        </div>
                        <button onClick={() => { setCurrentView('form'); setSelectedEndorsement(null); setFormData({ name: '', image: null, is_active: true }); setPreview(null); }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md font-medium flex items-center gap-2 transition-colors">
                            <Plus size={18} /> Add Endorsement
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-10 text-center">
                            <Loader2 className="animate-spin text-rose-500 mx-auto" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {endorsements.length === 0 ? (
                                <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                                    <Award size={48} className="text-zinc-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-zinc-300">No endorsements yet</h3>
                                    <p className="text-zinc-500 mt-1">Add your first endorsement to display on the Landing Page.</p>
                                </div>
                            ) : (
                                endorsements.map((item) => {
                                    const isActive = item.is_active === true || item.is_active === 'true';
                                    return (
                                        <div key={item.id} className={`bg-zinc-900 border rounded-lg overflow-hidden group hover:border-zinc-600 transition-colors ${isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}>
                                            <div className="aspect-square bg-zinc-950 relative border-b border-zinc-800">
                                                <img src={`${import.meta.env.VITE_API_URL}${item.image_path}`} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="bg-blue-500/90 text-white p-2 rounded-md hover:bg-blue-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(item.id, item.name)} className="bg-red-500/90 text-white p-2 rounded-md hover:bg-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                                {!isActive && (
                                                    <span className="absolute top-2 left-2 bg-zinc-800/90 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Inactive</span>
                                                )}
                                            </div>
                                            <div className="p-4 flex items-center justify-between">
                                                <h3 className="font-semibold text-sm text-zinc-100 truncate flex-1 mr-3">{item.name}</h3>
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
                            <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><Award className="text-rose-500" /> {selectedEndorsement ? 'Edit Endorsement' : 'Add New Endorsement'}</h2>
                            <p className="text-sm text-zinc-400 mt-1">Manage social proof for the landing page.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-4">
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Endorser Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Example: John Doe / @username" className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors" />
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <label className="text-sm text-zinc-400">Active Status</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`transition-colors ${formData.is_active ? 'text-emerald-400' : 'text-zinc-600'}`}
                                >
                                    {formData.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                                <span className={`text-xs font-mono uppercase tracking-wider ${formData.is_active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                    {formData.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <label className="text-sm text-zinc-400 mb-1 block">Upload Photo</label>
                            <label 
                                className="flex-1 border-2 border-dashed border-zinc-700 bg-zinc-950 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden relative min-h-[180px]"
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        handleFile({ target: { files: e.dataTransfer.files } });
                                    }
                                }}
                            >
                                {preview ? <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" /> : <ImageIcon size={32} className="text-zinc-600 mb-2" />}
                                <span className="text-xs text-zinc-400 z-10 bg-zinc-900/80 px-2 py-1 rounded">Drag & Drop or Click</span>
                                <input type="file" onChange={handleFile} accept="image/*" className="hidden" />
                            </label>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"><Plus size={18} /> {selectedEndorsement ? 'Update' : 'Save'}</button>
                                <button type="button" onClick={handleCancelEdit} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"><X size={18} /> Cancel</button>
                            </div>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}
