import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit2, Trash2, ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useConfirm } from '../lib/confirm-dialog';

export default function AdminCollections() {
    const [currentView, setCurrentView] = useState('list');
    const [collections, setCollections] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        year: '',
        cover_image: ''
    });

    const [errors, setErrors] = useState({});

    const confirm = useConfirm();

    const getImageUrl = (imageSource) => {
        if (!imageSource) return null;

        if (imageSource instanceof File) {
            return URL.createObjectURL(imageSource);
        }

        return `${import.meta.env.VITE_API_URL}/uploads/${imageSource}`;
    };

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/collections');
            setCollections(response.data);
        } catch (error) {
            console.error("Failed to fetch collections", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const filteredCollections = collections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'cover_image') {
            if (files && files.length > 0) {
                const file = files[0];
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    const errorMsg = "Format tidak didukung. Gunakan JPG, PNG, atau WEBP";
                    setErrors(prev => ({ ...prev, cover_image: errorMsg }));
                    notify.error(errorMsg);
                    return;
                }
                setFormData(prev => ({ ...prev, cover_image: file }));
                setErrors(prev => ({ ...prev, cover_image: null }));
                notify.success("Gambar berhasil diunggah");
            }
            return;
        }

        let newValue = value;

        if (name === 'name') {
            const regex = /^[a-zA-Z\s]*$/;
            if (!regex.test(newValue)) return;
        } else if (name === 'year') {
            const regex = /^\d{0,4}$/;
            if (!regex.test(newValue)) return;
        } else if (name === 'description') {
            const regex = /^[a-zA-Z0-9\s.,!?'"-]*$/;
            if (!regex.test(newValue)) return;
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Nama koleksi wajib diisi";
        if (!formData.year) newErrors.year = "Tahun wajib diisi";
        if (!formData.cover_image) newErrors.cover_image = "File cover image wajib diisi";
        if (formData.name && formData.name.length < 3) newErrors.name = "Nama terlalu pendek";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            Object.values(newErrors).forEach(error => notify.error(error));
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const slug = formData.name.toLowerCase().replace(/\s+/g, '-');

        const formPayload = new FormData();
        formPayload.append('name', formData.name);
        formPayload.append('slug', slug);
        formPayload.append('description', formData.description);
        formPayload.append('year', formData.year);

        if (formData.cover_image instanceof File || typeof formData.cover_image === 'string') {
            formPayload.append('cover_image', formData.cover_image);
        }

        try {
            const loadingToastId = notify.loading(currentView === 'create' ? 'Membuat koleksi...' : 'Menyimpan perubahan...');

            if (currentView === 'create') {
                await axios.post(import.meta.env.VITE_API_URL + '/api/collections', formPayload, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                notify.update(loadingToastId, { render: 'Koleksi berhasil dibuat!', type: 'success', isLoading: false, autoClose: 3000 });
            } else if (currentView === 'edit') {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/collections/${selectedCollection.collection_id}`, formPayload, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                notify.update(loadingToastId, { render: 'Koleksi berhasil diperbarui!', type: 'success', isLoading: false, autoClose: 3000 });
            }

            await fetchCollections();
            setCurrentView('list');
            setSelectedCollection(null);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data';
            notify.error(errorMessage);
        }
    };

    const handleEdit = (collection) => {
        setSelectedCollection(collection);
        setFormData({
            name: collection.name,
            description: collection.description || '',
            year: collection.year.toString(),
            cover_image: collection.cover_image
        });
        setCurrentView('edit');
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'Hapus Koleksi',
            description: 'Apakah Anda yakin ingin menghapus koleksi ini? Tindakan ini tidak dapat dikembalikan',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });

        if (confirmed) {
            try {
                const loadingToastId = notify.loading('Menghapus koleksi...');
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/collections/${id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setCollections(collections.filter(c => c.collection_id !== id));
                notify.update(loadingToastId, { render: 'Koleksi berhasil dihapus!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Gagal menghapus koleksi";
                notify.error(errorMessage);
            }
        }
    };

    const openCreateForm = () => {
        setFormData({ name: '', description: '', year: '', cover_image: '' });
        setErrors({});
        setCurrentView('create');
    };

    if (currentView === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                            <Layers className="text-rose-500" />
                            Manajemen Koleksi
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">Kelola data koleksi beserta gambar sampulnya.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder="Cari koleksi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 pl-9 pr-4 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition-colors"
                            />
                        </div>
                        <button
                            onClick={openCreateForm}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Tambah Baru</span>
                        </button>
                    </div>
                </div>

                {filteredCollections.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                        <Layers size={48} className="text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-300">Tidak ada koleksi ditemukan</h3>
                        <p className="text-zinc-500 mt-1">Coba gunakan kata kunci pencarian yang lain atau tambah koleksi baru.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCollections.map(collection => (
                            <div
                                key={collection.collection_id}
                                onClick={() => handleEdit(collection)}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group cursor-pointer hover:border-zinc-600 transition-all hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800 group-hover:opacity-90 transition-opacity">
                                    {collection.cover_image ? (
                                        <img
                                            src={getImageUrl(collection.cover_image)}
                                            alt={collection.name}
                                            className="object-cover w-full h-full"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/600x400/18181b/a1a1aa?text=Image+Error';
                                            }}
                                        />
                                    ) : (
                                        <ImageIcon className="text-zinc-800" size={48} />
                                    )}

                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDelete(collection.collection_id, e)}
                                            className="p-1.5 bg-red-500/90 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-rose-400 transition-colors line-clamp-1">{collection.name}</h3>
                                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-full font-medium">{collection.year}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 line-clamp-2">{collection.description || 'Tidak ada deskripsi.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentView('list')}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <Layers className="text-rose-500" />
                        {currentView === 'create' ? 'Tambah Koleksi Baru' : 'Edit Data Koleksi'}
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">Formulir pengaturan rincian koleksi dan covernya.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Nama Koleksi <span className="text-rose-500">*</span></label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full bg-zinc-950 border ${errors.name ? 'border-red-500' : 'border-zinc-800'} rounded-md py-2 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors`}
                        placeholder="Contoh: Summer Vibes"
                    />
                    {errors.name ? (
                        <p className="text-xs text-red-500">{errors.name}</p>
                    ) : (
                        <p className="text-xs text-zinc-500">Hanya karakter alfabet A-Z dan a-z yang diizinkan (tanpa angka/simbol khusus).</p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Tahun Koleksi <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            name="year"
                            value={formData.year}
                            onChange={handleInputChange}
                            className={`w-full bg-zinc-950 border ${errors.year ? 'border-red-500' : 'border-zinc-800'} rounded-md py-2 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors`}
                            placeholder="Contoh: 2024"
                        />
                        {errors.year ? (
                            <p className="text-xs text-red-500">{errors.year}</p>
                        ) : (
                            <p className="text-xs text-zinc-500">Hanya angka (0-9).</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">File Cover Image <span className="text-rose-500">*</span></label>

                        {formData.cover_image && (
                            <div className="mb-3 relative w-full aspect-video rounded-md overflow-hidden border border-zinc-800">
                                <img
                                    src={getImageUrl(formData.cover_image)}
                                    className="w-full h-full object-cover"
                                    alt="Preview"
                                />
                            </div>
                        )}
                        <label
                            className={`flex flex-col items-center justify-center w-full ${!formData.cover_image ? 'aspect-video' : 'py-4'} border-2 border-dashed ${errors.cover_image ? 'border-red-500' : 'border-zinc-700 hover:border-rose-500'} bg-zinc-950/50 rounded-md cursor-pointer transition-colors`}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    handleInputChange({ target: { name: 'cover_image', files: e.dataTransfer.files } });
                                }
                            }}
                        >
                            {!formData.cover_image ? (
                                <>
                                    <ImageIcon size={32} className="text-zinc-600 mb-2" />
                                    <span className="text-sm text-zinc-400">Drag & Drop file di sini, atau klik</span>
                                </>
                            ) : (
                                <span className="text-sm font-medium text-rose-500">Ganti Gambar (Drag & Drop / Klik)</span>
                            )}
                            <input
                                type="file"
                                name="cover_image"
                                accept="image/jpeg, image/png, image/webp, image/gif"
                                onChange={handleInputChange}
                                className="hidden"
                            />
                        </label>
                        {errors.cover_image ? (
                            <p className="text-xs text-red-500">{errors.cover_image}</p>
                        ) : (
                            <div className="text-xs text-zinc-500">
                                {typeof formData.cover_image === 'string' && formData.cover_image ? (
                                    <span>Gambar saat ini: {formData.cover_image}</span>
                                ) : (
                                    <span>Otomatis tersimpan ke src/assets/collections/</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Deskripsi Singkat</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                        placeholder="Tuliskan deskripsi singkat mengenai koleksi ini..."
                    />
                    <p className="text-xs text-zinc-500">Gunakan alfabet latin dan angka, tanpa karakter khusus selain tanda baca standar.</p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setCurrentView('list')}
                        className="px-4 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-md hover:bg-zinc-700 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-rose-500 text-white font-medium rounded-md hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                    >
                        Simpan Data
                    </button>
                </div>
            </form>
        </div>
    );
}
