import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Trash2, ArrowLeft, Image as ImageIcon, Loader2, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useConfirm } from '../lib/confirm-dialog';

export default function AdminProducts() {
    const [currentView, setCurrentView] = useState('list');
    const [products, setProducts] = useState([]);
    const [collections, setCollections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [carouselIndices, setCarouselIndices] = useState({});

    const [formData, setFormData] = useState({
        name: '', collection_id: '', description: '', category: '', sizes: [], status: 'Available'
    });
    const [imageManager, setImageManager] = useState([]);
    const [errors, setErrors] = useState({});

    const confirm = useConfirm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, collectionsRes, categoriesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/products'),
                axios.get('http://localhost:5000/api/collections'),
                axios.get('http://localhost:5000/api/categories')
            ]);
            setProducts(productsRes.data);
            setCollections(collectionsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNextImage = (e, productId, totalImages) => {
        e.stopPropagation();
        setCarouselIndices(prev => ({
            ...prev,
            [productId]: prev[productId] !== undefined ? (prev[productId] + 1) % totalImages : 1 % totalImages
        }));
    };

    const handlePrevImage = (e, productId, totalImages) => {
        e.stopPropagation();
        setCarouselIndices(prev => ({
            ...prev,
            [productId]: prev[productId] !== undefined ? (prev[productId] - 1 + totalImages) % totalImages : (totalImages - 1) % totalImages
        }));
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (imageManager.length + files.length > 5) {
            const errorMsg = "Total maksimal 5 gambar yang diizinkan";
            setErrors({ images: errorMsg });
            notify.warning(errorMsg);
            return;
        }

        const newImages = files.map((file, idx) => ({
            id: `new_${Date.now()}_${idx}`,
            file: file,
            previewUrl: URL.createObjectURL(file),
            isExisting: false,
            isPrimary: imageManager.length === 0 && idx === 0
        }));

        setImageManager(prev => [...prev, ...newImages]);
        setErrors({});
        e.target.value = '';
        notify.success(`${files.length} gambar berhasil ditambahkan`);
    };

    const removeImage = (idToRemove) => {
        setImageManager(prev => {
            const filtered = prev.filter(img => img.id !== idToRemove);
            if (prev.find(img => img.id === idToRemove)?.isPrimary && filtered.length > 0) {
                filtered[0].isPrimary = true;
            }
            return filtered;
        });
    };

    const setAsPrimary = (idToMakePrimary) => {
        setImageManager(prev => prev.map(img => ({
            ...img,
            isPrimary: img.id === idToMakePrimary
        })));
    };

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const handleSizeToggle = (size) => {
        setFormData(prev => {
            const currentSizes = Array.isArray(prev.sizes) ? prev.sizes : [];
            if (currentSizes.includes(size)) {
                return { ...prev, sizes: currentSizes.filter(s => s !== size) };
            } else {
                return { ...prev, sizes: [...currentSizes, size] };
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            notify.error("Nama produk wajib diisi");
            return setErrors({ name: "Nama produk wajib diisi" });
        }
        if (!formData.category) {
            notify.error("Kategori wajib dipilih");
            return setErrors({ category: "Kategori wajib dipilih" });
        }
        if (imageManager.length === 0) {
            notify.error("Minimal 1 gambar wajib diunggah/dipertahankan");
            return setErrors({ images: "Minimal 1 gambar wajib diunggah/dipertahankan" });
        }

        const formPayload = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'sizes') {
                formPayload.append(key, Array.isArray(formData[key]) ? formData[key].join(', ') : '');
            } else {
                formPayload.append(key, formData[key]);
            }
        });

        const retainedImages = [];
        let coverIdentifier = '';

        imageManager.forEach(img => {
            if (img.isPrimary) coverIdentifier = img.isExisting ? img.previewUrl.replace('http://localhost:5000', '') : img.file.originalname;
            if (img.isExisting) retainedImages.push(img.previewUrl.replace('http://localhost:5000', ''));
            else formPayload.append('images', img.file);
        });

        formPayload.append('retained_images', JSON.stringify(retainedImages));
        formPayload.append('cover_identifier', coverIdentifier);

        const token = localStorage.getItem('token');
        try {
            const loadingToastId = notify.loading(currentView === 'create' ? 'Membuat produk...' : 'Menyimpan perubahan...');

            if (currentView === 'create') {
                await axios.post('http://localhost:5000/api/products', formPayload, { headers: { 'Authorization': `Bearer ${token}` } });
                notify.update(loadingToastId, { render: 'Produk berhasil dibuat!', type: 'success', isLoading: false, autoClose: 3000 });
            } else {
                await axios.put(`http://localhost:5000/api/products/${selectedProduct.product_id}`, formPayload, { headers: { 'Authorization': `Bearer ${token}` } });
                notify.update(loadingToastId, { render: 'Produk berhasil diperbarui!', type: 'success', isLoading: false, autoClose: 3000 });
            }
            await fetchData();
            setCurrentView('list');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal menyimpan produk';
            notify.error(errorMessage);
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);

        const parsedSizes = product.sizes && typeof product.sizes === 'string'
            ? product.sizes.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        setFormData({
            name: product.name, collection_id: product.collection_id || '', description: product.description || '',
            category: product.category || '', sizes: parsedSizes, status: product.status || 'Available'
        });

        if (product.images && product.images.length > 0) {
            const existingManager = product.images.map((imgUrl, idx) => ({
                id: `old_${idx}`,
                file: null,
                previewUrl: `http://localhost:5000${imgUrl}`,
                isExisting: true,
                isPrimary: imgUrl === product.primary_image
            }));
            setImageManager(existingManager);
        } else {
            setImageManager([]);
        }
        setCurrentView('edit');
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'Hapus Produk',
            description: 'Yakin ingin menghapus produk ini? Semua file gambarnya akan ikut terhapus dan tidak dapat dikembalikan!',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });

        if (confirmed) {
            try {
                const loadingToastId = notify.loading('Menghapus produk...');
                await axios.delete(`http://localhost:5000/api/products/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                setProducts(products.filter(p => p.product_id !== id));
                notify.update(loadingToastId, { render: 'Produk berhasil dihapus!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Gagal menghapus produk";
                notify.error(errorMessage);
            }
        }
    };

    const openCreateForm = () => {
        setFormData({ name: '', collection_id: '', description: '', category: '', sizes: [], status: 'Available' });
        setImageManager([]); setErrors({}); setCurrentView('create');
    };

    if (currentView === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><ShoppingBag className="text-rose-500" /> Manajemen Produk</h2>
                        <p className="text-sm text-zinc-400 mt-1">Kelola data katalog produk, kategori, dan stok.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 pl-9 pr-4 text-sm text-zinc-100 focus:border-rose-500 transition-colors" />
                        </div>
                        <button onClick={openCreateForm} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0">
                            <Plus size={16} /><span className="hidden sm:inline">Tambah Baru</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-500" size={32} /></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                        <ShoppingBag size={48} className="text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-300">Tidak ada produk ditemukan</h3>
                        <p className="text-zinc-500 mt-1">Coba gunakan kata kunci pencarian yang lain atau tambah produk baru.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => {
                            const cIndex = carouselIndices[product.product_id] || 0;
                            const hasMultipleImages = product.images && product.images.length > 1;

                            return (
                                <div key={product.product_id} onClick={() => handleEdit(product)} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group cursor-pointer hover:border-zinc-600 transition-all hover:-translate-y-1">
                                    <div className="aspect-square bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800 group-hover:opacity-90 transition-opacity">

                                        {product.images && product.images.length > 0 ? (
                                            <img src={`http://localhost:5000${product.images[cIndex]}`} alt={product.name} className="object-cover w-full h-full"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x400/18181b/a1a1aa?text=Image+Error'; }} />
                                        ) : (<ImageIcon className="text-zinc-800" size={48} />)}

                                        {hasMultipleImages && (
                                            <>
                                                <button onClick={(e) => handlePrevImage(e, product.product_id, product.images.length)} className="absolute left-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button onClick={(e) => handleNextImage(e, product.product_id, product.images.length)} className="absolute right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight size={16} />
                                                </button>
                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                                    {product.images.map((_, idx) => (
                                                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === cIndex ? 'bg-white' : 'bg-white/30'}`} />
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleDelete(product.product_id, e)} className="p-1.5 bg-red-500/90 text-white rounded hover:bg-red-600" title="Hapus"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${product.status === 'Available' ? 'bg-zinc-100 text-zinc-900' : 'bg-red-500 text-white'}`}>{product.status}</span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-base font-bold text-zinc-100 group-hover:text-rose-400 transition-colors line-clamp-1">{product.name}</h3>
                                        <p className="text-xs text-zinc-400 mb-2">{product.category}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentView('list')} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><ShoppingBag className="text-rose-500" /> {currentView === 'create' ? 'Tambah Produk Baru' : 'Edit Data Produk'}</h2>
                    <p className="text-sm text-zinc-400 mt-1">Atur foto, jadikan cover, dan lengkapi rincian.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Nama Produk <span className="text-rose-500">*</span></label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:border-rose-500" />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Koleksi</label>
                        <select name="collection_id" value={formData.collection_id} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100">
                            <option value="">-- Tanpa Koleksi --</option>
                            {collections.map(c => <option key={c.collection_id} value={c.collection_id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Kategori <span className="text-rose-500">*</span></label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className={`w-full bg-zinc-950 border rounded-md py-2 px-4 text-zinc-100 ${errors.category ? 'border-red-500' : 'border-zinc-800'}`}
                        >
                            <option value="">-- Pilih Kategori --</option>
                            {categories.length > 0 ? (
                                categories.map((cat, index) => {
                                    const catName = cat.name || cat.nama || cat.category_name || cat.category || (typeof cat === 'string' ? cat : 'Unknown');
                                    const catId = cat.id || cat.category_id || `cat-${index}`;

                                    return (
                                        <option key={catId} value={catName}>
                                            {catName}
                                        </option>
                                    );
                                })
                            ) : (
                                <option value="" disabled>Tidak ada kategori</option>
                            )}
                        </select>
                        {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Ukuran (Bisa pilih lebih dari 1)</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {['S', 'M', 'L', 'XL', 'XXL'].map(size => {
                                const isSelected = Array.isArray(formData.sizes) && formData.sizes.includes(size);
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => handleSizeToggle(size)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all duration-200 ${isSelected
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100"
                        >
                            <option value="Available">Available</option>
                            <option value="Sold Out">Sold Out</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium text-zinc-300">Deskripsi Detail</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                        placeholder="Tuliskan deskripsi detail bahan, cutting, panduan ukuran, dll..."
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div>
                        <label className="text-sm font-medium text-zinc-300">Gallery Foto ({imageManager.length}/5) <span className="text-rose-500">*</span></label>
                        <p className="text-xs text-zinc-500 mb-4">Tambahkan foto, klik tombol bintang untuk menjadikannya cover depan.</p>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            {imageManager.map((img) => (
                                <div key={img.id} className={`relative aspect-square rounded-md overflow-hidden border-2 ${img.isPrimary ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'border-zinc-800'}`}>
                                    <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />

                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <button type="button" onClick={() => removeImage(img.id)} className="self-end bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                                            <X size={14} />
                                        </button>
                                        {!img.isPrimary && (
                                            <button type="button" onClick={() => setAsPrimary(img.id)} className="w-full bg-zinc-900/80 text-white text-[10px] py-1 rounded hover:bg-rose-500 transition-colors flex items-center justify-center gap-1">
                                                <Star size={10} /> Set Cover
                                            </button>
                                        )}
                                    </div>

                                    {img.isPrimary && (
                                        <div className="absolute top-1 left-1 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                            <Star size={8} fill="currentColor" /> Cover
                                        </div>
                                    )}
                                </div>
                            ))}

                            {imageManager.length < 5 && (
                                <label className="aspect-square rounded-md border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-zinc-500 hover:text-zinc-300">
                                    <Plus size={24} className="mb-2" />
                                    <span className="text-xs font-medium">Upload File</span>
                                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                </label>
                            )}
                        </div>
                        {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                    <button type="button" onClick={() => setCurrentView('list')} className="px-4 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-md hover:bg-zinc-700">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-rose-500 text-white font-medium rounded-md hover:bg-rose-600">Simpan Produk</button>
                </div>
            </form>
        </div>
    );
}