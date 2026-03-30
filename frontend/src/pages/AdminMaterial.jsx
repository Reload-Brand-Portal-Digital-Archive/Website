import React, { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Loader2, Image as ImageIcon, Edit2, X, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useConfirm } from '../lib/confirm-dialog';

export default function AdminMaterials() {
    const [currentView, setCurrentView] = useState('list');
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', description: '', image: null });
    const [preview, setPreview] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const confirm = useConfirm();

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/materials');
            setMaterials(res.data);
        } catch (error) { notify.error("Gagal memuat material"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMaterials(); }, []);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleEdit = (material) => {
        setSelectedMaterial(material);
        setFormData({ title: material.title, description: material.description, image: null });
        setPreview(`http://localhost:5000${material.image_path}`);
        setCurrentView('form');
    };

    const handleCancelEdit = () => {
        setCurrentView('list');
        setSelectedMaterial(null);
        setFormData({ title: '', description: '', image: null });
        setPreview(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (selectedMaterial === null && materials.length >= 3) return notify.warning("Maksimal 3 Material! Hapus yang lama dulu");
        if (!formData.title) return notify.error("Judul wajib!");
        if (selectedMaterial === null && !formData.image) return notify.error("Gambar wajib!");

        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description);
        if (formData.image) payload.append('image', formData.image);

        try {
            const token = localStorage.getItem('token');
            const loadingToastId = notify.loading(selectedMaterial === null ? 'Menambah material...' : 'Menyimpan perubahan...');
            let res;
            if (selectedMaterial === null) {
                res = await axios.post('http://localhost:5000/api/materials', payload, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await axios.put(`http://localhost:5000/api/materials/${selectedMaterial.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
            }
            notify.update(loadingToastId, { render: res.data.message || (selectedMaterial ? "Material berhasil diperbarui!" : "Material berhasil ditambahkan!"), type: 'success', isLoading: false, autoClose: 3000 });
            setMaterials(res.data.data);
            handleCancelEdit();
        } catch (error) {
            notify.error(error.response?.data?.message || (selectedMaterial ? "Gagal memperbarui material" : "Gagal menambah material"));
        }
    };

    const handleDelete = async (id, title) => {
        const confirmed = await confirm({
            title: 'Hapus Material',
            description: `Yakin ingin menghapus material "${title}" dari Landing Page? Tindakan ini tidak dapat dikembalikan!`,
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });

        if (confirmed) {
            try {
                const token = localStorage.getItem('token');
                const loadingToastId = notify.loading('Menghapus material...');
                const res = await axios.delete(`http://localhost:5000/api/materials/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMaterials(res.data.data);
                if (selectedMaterial?.id === id) handleCancelEdit();
                notify.update(loadingToastId, { render: res.data.message || 'Material berhasil dihapus!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) { 
                const errorMessage = error.response?.data?.message || "Gagal menghapus material";
                notify.error(errorMessage);
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {currentView === 'list' ? (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                                <Palette className="text-rose-500" /> Landing Page Materials
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Atur 3 fitur andalan / material produk yang akan disorot di halaman depan.</p>
                        </div>
                        {materials.length < 3 && (
                            <button onClick={() => { setCurrentView('form'); setSelectedMaterial(null); setFormData({ title: '', description: '', image: null }); setPreview(null); }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md font-medium flex items-center gap-2 transition-colors">
                                <Plus size={18} /> Tambah Material
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="py-10 text-center">
                            <Loader2 className="animate-spin text-rose-500 mx-auto" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {materials.length === 0 ? (
                                <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                                    <Palette size={48} className="text-zinc-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-zinc-300">Tidak ada material ditemukan</h3>
                                    <p className="text-zinc-500 mt-1">Coba gunakan kata kunci pencarian yang lain atau tambah material baru.</p>
                                </div>
                            ) : (
                                materials.map((mat, i) => (
                                    <div key={mat.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-zinc-600 transition-colors">
                                        <div className="aspect-[4/3] bg-zinc-950 relative border-b border-zinc-800">
                                            <img src={`http://localhost:5000${mat.image_path}`} alt={mat.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(mat)} className="bg-blue-500/90 text-white p-2 rounded-md hover:bg-blue-600 transition-colors" title="Edit Material"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(mat.id, mat.title)} className="bg-red-500/90 text-white p-2 rounded-md hover:bg-red-600 transition-colors" title="Hapus Material"><Trash2 size={16} /></button>
                                            </div>
                                            <span className="absolute top-2 left-2 bg-zinc-100 text-zinc-900 text-xs font-bold px-2 py-1 rounded">Slot {i + 1}</span>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-lg text-zinc-100 mb-2">{mat.title}</h3>
                                            <p className="text-sm text-zinc-400">{mat.description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCancelEdit} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><Palette className="text-rose-500" /> {selectedMaterial ? 'Edit Material' : 'Tambah Material Baru'}</h2>
                            <p className="text-sm text-zinc-400 mt-1">Atur fitur andalan produk untuk halaman depan.</p>
                        </div>
                    </div>

                    <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-4">
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Judul Highlight</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Premium Fabric" className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Deskripsi Pendek</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <label className="text-sm text-zinc-400 mb-1 block">Upload Foto</label>
                            <label className="flex-1 border-2 border-dashed border-zinc-700 bg-zinc-950 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden relative">
                                {preview ? <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" /> : <ImageIcon size={32} className="text-zinc-600 mb-2" />}
                                <span className="text-xs text-zinc-400 z-10 bg-zinc-900/80 px-2 py-1 rounded">Pilih Gambar</span>
                                <input type="file" onChange={handleFile} accept="image/*" className="hidden" />
                            </label>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"><Plus size={18} /> {selectedMaterial ? 'Update' : 'Simpan'}</button>
                                <button type="button" onClick={handleCancelEdit} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"><X size={18} /> Batal</button>
                            </div>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}