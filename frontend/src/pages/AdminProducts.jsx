import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Trash2, ArrowLeft, Image as ImageIcon, Loader2, Star, X, ChevronLeft, ChevronRight, ExternalLink, Upload, FileDown, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useConfirm } from '../lib/confirm-dialog';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function AdminProducts() {
    const [currentView, setCurrentView] = useState('list');
    const [products, setProducts] = useState([]);
    const [collections, setCollections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [carouselIndices, setCarouselIndices] = useState({});

    const [importData, setImportData] = useState([]);
    const [missingCollections, setMissingCollections] = useState([]);
    const [missingCategories, setMissingCategories] = useState([]);
    const [resolvingCollection, setResolvingCollection] = useState(null);
    const [resolvingCategory, setResolvingCategory] = useState(null);
    const [collectionFormData, setCollectionFormData] = useState({ name: '', description: '', year: new Date().getFullYear(), cover_image: null });

    const [formData, setFormData] = useState({
        name: '', collection_id: '', description: '', category: '', sizes: [], status: 'Available',
        shopee_link: '', tiktok_link: ''
    });
    const [imageManager, setImageManager] = useState([]);
    const [errors, setErrors] = useState({});

    const confirm = useConfirm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, collectionsRes, categoriesRes] = await Promise.all([
                axios.get(import.meta.env.VITE_API_URL + '/api/products'),
                axios.get(import.meta.env.VITE_API_URL + '/api/collections'),
                axios.get(import.meta.env.VITE_API_URL + '/api/categories')
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

    useEffect(() => {
        if (resolvingCollection) {
            setCollectionFormData(prev => ({ ...prev, name: resolvingCollection }));
        }
    }, [resolvingCollection]);

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
            setErrors({ ...errors, images: errorMsg });
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
        setErrors(prev => ({...prev, images: null}));
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


    const openImportView = () => {
        setImportData([]);
        setMissingCollections([]);
        setMissingCategories([]);
        setResolvingCollection(null);
        setResolvingCategory(null);
        setCurrentView('import');
    };

    const handleImportFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (fileExt === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    processImportedData(results.data);
                }
            });
        } else if (['xls', 'xlsx'].includes(fileExt)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                processImportedData(json);
            };
            reader.readAsBinaryString(file);
        } else {
            notify.error("Tipe file tidak didukung. Gunakan .xlsx atau .csv");
        }
        e.target.value = '';
    };

    const processImportedData = (data) => {
        const reqCols = new Set();
        const reqCats = new Set();
        
        const processed = data.map((row, idx) => {
            const colName = row.Collection || row['Koleksi'] || row['Nama Koleksi'] || '';
            const catName = row.Category || row['Kategori'] || '';
            if(colName) reqCols.add(colName);
            if(catName) reqCats.add(catName);
    
            return {
                local_id: `import_${Date.now()}_${idx}`,
                name: row.Name || row['Nama Produk'] || '',
                collection_name: colName,
                category: catName,
                description: row.Description || row['Deskripsi'] || '',
                sizes: row.Sizes || row['Ukuran'] ? (row.Sizes || row['Ukuran']).toString().split(',').map(s=>s.trim()) : [],
                status: row.Status || 'Available',
                shopee_link: row.Shopee || row['Link Shopee'] || '',
                tiktok_link: row.TikTok || row['Link TikTok'] || '',
                imageManager: []
            };
        }).filter(item => item.name);
    
        if (processed.length === 0) return notify.error('Tidak ada data valid yang ditemukan dalam file ini.');
    
        setImportData(processed);
    
        const existingColNames = collections.map(c => c.name.toLowerCase());
        const existingCatNames = categories.map(c => typeof c === 'string' ? c.toLowerCase() : (c.name || '').toLowerCase());
    
        const missingCol = Array.from(reqCols).filter(c => !existingColNames.includes(c.toLowerCase()));
        const missingCat = Array.from(reqCats).filter(c => !existingCatNames.includes(c.toLowerCase()));
    
        setMissingCollections(missingCol);
        setMissingCategories(missingCat);
    
        if (missingCol.length > 0) {
            setResolvingCollection(missingCol[0]);
        } else if (missingCat.length > 0) {
            setResolvingCategory(missingCat[0]);
        }
    };

    const handleResolveCollection = async (e) => {
        e.preventDefault();
        if(!collectionFormData.cover_image) {
            return notify.error("Cover image wajib diunggah untuk koleksi baru!");
        }
        
        const slug = collectionFormData.name.toLowerCase().replace(/\s+/g, '-');
        const formPayload = new FormData();
        formPayload.append('name', collectionFormData.name);
        formPayload.append('slug', slug);
        formPayload.append('description', collectionFormData.description);
        formPayload.append('year', collectionFormData.year);
        formPayload.append('cover_image', collectionFormData.cover_image);

        try {
            const loadingToastId = notify.loading('Membuat koleksi...');
            const res = await axios.post(import.meta.env.VITE_API_URL + '/api/collections', formPayload, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const newCol = res.data.data;
            setCollections(prev => [...prev, newCol]);
            notify.update(loadingToastId, { render: `Koleksi ${newCol.name} dibuat!`, type: 'success', isLoading: false, autoClose: 3000 });
            
            const remaining = missingCollections.filter(c => c !== resolvingCollection);
            setMissingCollections(remaining);
            setCollectionFormData({ name: '', description: '', year: new Date().getFullYear(), cover_image: null });

            if (remaining.length > 0) {
                setResolvingCollection(remaining[0]);
            } else {
                setResolvingCollection(null);
                if (missingCategories.length > 0) {
                    setResolvingCategory(missingCategories[0]);
                }
            }
        } catch (error) {
            notify.error("Gagal membuat koleksi: " + (error.response?.data?.message || error.message));
        }
    };

    const handleSkipCollection = () => {
        // Just clear collection name from importData matching this
        setImportData(prev => prev.map(item => item.collection_name === resolvingCollection ? { ...item, collection_name: '' } : item));
        
        const remaining = missingCollections.filter(c => c !== resolvingCollection);
        setMissingCollections(remaining);
        
        if (remaining.length > 0) {
            setResolvingCollection(remaining[0]);
        } else {
            setResolvingCollection(null);
            if (missingCategories.length > 0) {
                setResolvingCategory(missingCategories[0]);
            }
        }
    };

    const handleResolveCategory = async (confirmAdd) => {
        if (confirmAdd) {
            try {
                const loadingToastId = notify.loading('Menambahkan kategori...');
                await axios.post(import.meta.env.VITE_API_URL + '/api/categories', { name: resolvingCategory }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setCategories(prev => [...prev, resolvingCategory]);
                notify.update(loadingToastId, { render: 'Kategori berhasil ditambahkan!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                notify.error("Gagal menambah kategori: " + (error.response?.data?.message || error.message));
            }
        } else {
            // user selected NO
             setImportData(prev => prev.map(item => item.category === resolvingCategory ? { ...item, category: '' } : item));
        }
    
        const remaining = missingCategories.filter(c => c !== resolvingCategory);
        setMissingCategories(remaining);
        
        if (remaining.length > 0) {
            setResolvingCategory(remaining[0]);
        } else {
            setResolvingCategory(null);
        }
    };

    const handleImportImageSelect = (e, localId) => {
        const files = Array.from(e.target.files);
        
        setImportData(prev => prev.map(item => {
            if (item.local_id !== localId) return item;
            
            if (item.imageManager.length + files.length > 5) {
                notify.warning("Maksimal 5 gambar per produk");
                return item;
            }
    
            const newImages = files.map((file, idx) => ({
                id: `new_${Date.now()}_${idx}`,
                file: file,
                previewUrl: URL.createObjectURL(file),
                isPrimary: item.imageManager.length === 0 && idx === 0
            }));
    
            return { ...item, imageManager: [...item.imageManager, ...newImages] };
        }));
        e.target.value = '';
    };
    
    const removeImportImage = (localId, imageId) => {
        setImportData(prev => prev.map(item => {
            if(item.local_id !== localId) return item;
            
            const filtered = item.imageManager.filter(img => img.id !== imageId);
            if (item.imageManager.find(img => img.id === imageId)?.isPrimary && filtered.length > 0) {
                filtered[0].isPrimary = true;
            }
            return { ...item, imageManager: filtered };
        }));
    }
    
    const setImportImagePrimary = (localId, imageId) => {
        setImportData(prev => prev.map(item => {
            if(item.local_id !== localId) return item;
            return {
                ...item,
                imageManager: item.imageManager.map(img => ({
                    ...img,
                    isPrimary: img.id === imageId
                }))
            }
        }));
    };
    
    const handleImportSubmit = async () => {
        const token = localStorage.getItem('token');
        
        for (const item of importData) {
            if (item.imageManager.length === 0) {
                return notify.error(`Produk "${item.name}" belum memiliki gambar`);
            }
            if (!item.category) {
                 return notify.error(`Produk "${item.name}" harus memiliki kategori yang valid`);
            }
        }
    
        const loadingId = notify.loading('Sedang menyimpan produk massal...');
        let successCount = 0;
    
        for (const item of importData) {
            const formPayload = new FormData();
            formPayload.append('name', item.name);
            formPayload.append('description', item.description);
            formPayload.append('category', item.category);
            formPayload.append('sizes', Array.isArray(item.sizes) ? item.sizes.join(', ') : '');
            formPayload.append('status', item.status);
            formPayload.append('shopee_link', item.shopee_link);
            formPayload.append('tiktok_link', item.tiktok_link);
            
            if (item.collection_name) {
                const colMatch = collections.find(c => c.name.toLowerCase() === item.collection_name.toLowerCase());
                if (colMatch) formPayload.append('collection_id', colMatch.collection_id);
            }
    
            let coverIdentifier = '';
            item.imageManager.forEach((img) => {
                if (img.isPrimary) coverIdentifier = img.file.originalname;
                formPayload.append('images', img.file);
            });
    
            formPayload.append('retained_images', JSON.stringify([]));
            formPayload.append('cover_identifier', coverIdentifier);
    
            try {
                await axios.post(import.meta.env.VITE_API_URL + '/api/products', formPayload, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                successCount++;
            } catch (err) {
                console.error(`Gagal menyimpan ${item.name}`, err);
                notify.error(`Gagal menyimpan ${item.name}`);
            }
        }
    
        notify.update(loadingId, { render: `Berhasil mengimpor ${successCount} produk dari total ${importData.length}.`, type: 'success', isLoading: false, autoClose: 3000 });
        
        await fetchData();
        setImportData([]);
        setCurrentView('list');
    };

    const downloadImportTemplate = () => {
        const worksheetData = [
            ["Name", "Collection", "Category", "Description", "Status", "Sizes", "Shopee", "TikTok"],
            ["Contoh Baju Keren", "Summer 2026", "Baju Pria", "Deskripsi panjang", "Available", "S, M, L", "https://shopee.co.id/..", "https://tiktok.com/.."]
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "template_import_produk.xlsx");
    };


    const handleExport = async () => {
        try {
            const loadingToastId = notify.loading('Menyiapkan file export...');
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/products/export', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products_export.zip');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            notify.update(loadingToastId, { render: 'Berhasil mengekspor produk!', type: 'success', isLoading: false, autoClose: 3000 });
        } catch (error) {
            notify.error("Gagal mengekspor produk. Pastikan server berjalan dan library terinstall.");
        }
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
            if (img.isPrimary) coverIdentifier = img.isExisting ? img.previewUrl.replace(import.meta.env.VITE_API_URL, '') : img.file.originalname;
            if (img.isExisting) retainedImages.push(img.previewUrl.replace(import.meta.env.VITE_API_URL, ''));
            else formPayload.append('images', img.file);
        });

        formPayload.append('retained_images', JSON.stringify(retainedImages));
        formPayload.append('cover_identifier', coverIdentifier);

        const token = localStorage.getItem('token');
        try {
            const loadingToastId = notify.loading(currentView === 'create' ? 'Membuat produk...' : 'Menyimpan perubahan...');

            if (currentView === 'create') {
                await axios.post(import.meta.env.VITE_API_URL + '/api/products', formPayload, { headers: { 'Authorization': `Bearer ${token}` } });
                notify.update(loadingToastId, { render: 'Produk berhasil dibuat!', type: 'success', isLoading: false, autoClose: 3000 });
            } else {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${selectedProduct.product_id}`, formPayload, { headers: { 'Authorization': `Bearer ${token}` } });
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
            category: product.category || '', sizes: parsedSizes, status: product.status || 'Available',
            shopee_link: product.shopee_link || '', tiktok_link: product.tiktok_link || ''
        });

        if (product.images && product.images.length > 0) {
            const existingManager = product.images.map((imgUrl, idx) => ({
                id: `old_${idx}`,
                file: null,
                previewUrl: `${import.meta.env.VITE_API_URL}${imgUrl}`,
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
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                setProducts(products.filter(p => p.product_id !== id));
                notify.update(loadingToastId, { render: 'Produk berhasil dihapus!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Gagal menghapus produk";
                notify.error(errorMessage);
            }
        }
    };

    const openCreateForm = () => {
        setFormData({ name: '', collection_id: '', description: '', category: '', sizes: [], status: 'Available', shopee_link: '', tiktok_link: '' });
        setImageManager([]); setErrors({}); setCurrentView('create');
    };

    if (currentView === 'import') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentView('list')} className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><Upload className="text-emerald-500" /> Import Produk Masal</h2>
                        <p className="text-sm text-zinc-400 mt-1">Upload file Excel atau CSV, lalu lengkapi gambar untuk tiap produk.</p>
                    </div>
                </div>

                {resolvingCollection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-white mb-2">Koleksi Baru Ditemukan</h3>
                            <p className="text-sm text-zinc-400 mb-6">Koleksi <strong>"{resolvingCollection}"</strong> tidak ada di database. Silakan lengkapi data untuk membuat koleksi baru.</p>
                            
                            <form onSubmit={handleResolveCollection} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Deskripsi Koleksi</label>
                                    <textarea required rows={3} value={collectionFormData.description} onChange={e => setCollectionFormData(prev => ({...prev, description: e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded py-2 px-3 text-zinc-100" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Tahun</label>
                                    <input type="number" required value={collectionFormData.year} onChange={e => setCollectionFormData(prev => ({...prev, year: e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded py-2 px-3 text-zinc-100" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Cover Image</label>
                                    <label 
                                        className="flex items-center justify-center w-full min-h-[100px] border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-md bg-zinc-950/50 cursor-pointer text-zinc-400 hover:text-zinc-300 transition-colors"
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => {
                                            e.preventDefault();
                                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                setCollectionFormData(prev => ({...prev, cover_image: e.dataTransfer.files[0]}));
                                            }
                                        }}
                                    >
                                        <div className="text-center p-4">
                                            {collectionFormData.cover_image ? (
                                                <span className="text-emerald-500 font-medium break-all">{collectionFormData.cover_image.name}</span>
                                            ) : (
                                                <span className="text-sm">Klik atau Drag & Drop gambar di sini</span>
                                            )}
                                        </div>
                                        <input type="file" required={!collectionFormData.cover_image} accept="image/*" onChange={e => setCollectionFormData(prev => ({...prev, cover_image: e.target.files[0]}))} className="hidden" />
                                    </label>
                                </div>
                                <div className="flex gap-3 justify-end mt-6">
                                    <button type="button" onClick={handleSkipCollection} className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800">Lewati & Kosongkan</button>
                                    <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors">Buat Koleksi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {resolvingCategory && !resolvingCollection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
                            <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4"><Plus size={24} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Kategori Baru</h3>
                            <p className="text-sm text-zinc-400 mb-6">Kategori <strong>"{resolvingCategory}"</strong> belum ada di database. Ingin menambahkannya sekarang?</p>
                            
                            <div className="flex gap-3 justify-center">
                                <button type="button" onClick={() => handleResolveCategory(false)} className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800">Tidak</button>
                                <button type="button" onClick={() => handleResolveCategory(true)} className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">Ya, Tambahkan</button>
                            </div>
                        </div>
                    </div>
                )}

                {importData.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-lg p-12 text-center flex flex-col items-center">
                        <Upload size={48} className="text-zinc-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Upload Data Produk</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Format file direkomendasikan .xlsx. Kolom wajib: Name, Category. Kolom opsional: Collection, Description, Sizes, Status, Shopee, TikTok.</p>
                        
                        <div className="flex gap-4">
                            <button onClick={downloadImportTemplate} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                                <FileDown size={16} /> Download Template
                            </button>
                            <label className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
                                <Upload size={16} /> Pilih File
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFileChange} className="hidden" />
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-md flex items-start gap-3">
                            <CheckCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Data Berhasil Dibaca</h4>
                                <p className="text-sm text-emerald-400/80 mt-1">Ditemukan {importData.length} baris produk yang valid. Silakan upload gambar untuk setiap produk sebelum menyimpan ke database.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {importData.map((item, index) => (
                                <div key={item.local_id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 lg:flex gap-6 relative">
                                    <button 
                                        type="button" 
                                        onClick={() => setImportData(prev => prev.filter(i => i.local_id !== item.local_id))} 
                                        className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors p-1 bg-zinc-800/50 hover:bg-zinc-800 rounded"
                                        title="Hapus baris ini dari daftar import"
                                    >
                                        <X size={18} />
                                    </button>
                                    
                                    <div className="flex-1 space-y-4 pt-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-zinc-800 text-xs flex items-center justify-center font-mono text-zinc-400">{index + 1}</span>
                                                {item.name}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800/50">
                                                <span className="text-xs text-zinc-500 block mb-1">Kategori</span>
                                                <p className="text-sm text-zinc-200 font-medium">{item.category || <span className="text-red-500 italic">Belum diset</span>}</p>
                                            </div>
                                            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800/50">
                                                <span className="text-xs text-zinc-500 block mb-1">Koleksi</span>
                                                <p className="text-sm text-zinc-200">{item.collection_name || '-'}</p>
                                            </div>
                                            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800/50">
                                                <span className="text-xs text-zinc-500 block mb-1">Status & Ukuran</span>
                                                <p className="text-sm text-zinc-200">{item.status} &bull; {item.sizes.length > 0 ? item.sizes.join(', ') : '-'}</p>
                                            </div>
                                            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800/50">
                                                <span className="text-xs text-zinc-500 block mb-1">Links</span>
                                                <div className="flex gap-3 mt-1">
                                                    {item.shopee_link ? <a href={item.shopee_link} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline text-xs flex items-center gap-1"><ExternalLink size={10}/> Shopee</a> : <span className="text-xs text-zinc-600">-</span>}
                                                    {item.tiktok_link ? <a href={item.tiktok_link} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline text-xs flex items-center gap-1"><ExternalLink size={10}/> TikTok</a> : <span className="text-xs text-zinc-600">-</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-zinc-400 line-clamp-2 border-t border-zinc-800/50 pt-2">{item.description}</p>
                                        )}
                                    </div>

                                    <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-4 lg:pt-0 lg:pl-6 shrink-0 flex flex-col justify-center">
                                        <label className="text-xs font-medium text-zinc-400 mb-2 block">Upload Gambar Produk ({item.imageManager.length}/5) <span className="text-rose-500">*</span></label>
                                        <div className="flex flex-wrap gap-2">
                                            {item.imageManager.map((img) => (
                                                <div key={img.id} className={`relative w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${img.isPrimary ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-zinc-800'}`}>
                                                    <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-between p-1 text-[10px]">
                                                        <button type="button" onClick={() => removeImportImage(item.local_id, img.id)} className="self-end bg-red-500 text-white rounded p-0.5"><X size={12} /></button>
                                                        {!img.isPrimary && (
                                                            <button type="button" onClick={() => setImportImagePrimary(item.local_id, img.id)} className="bg-zinc-800 text-white rounded mt-auto flex items-center justify-center p-0.5" title="Jadikan Cover"><Star size={10} /></button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {item.imageManager.length < 5 && (
                                                <label 
                                                    className="w-16 h-16 rounded-md border-2 border-dashed border-zinc-600 hover:border-zinc-400 flex items-center justify-center cursor-pointer transition-colors text-zinc-500 hover:text-zinc-300"
                                                    onDragOver={e => e.preventDefault()}
                                                    onDrop={e => { e.preventDefault(); handleImportImageSelect({ target: { files: e.dataTransfer.files } }, item.local_id); }}
                                                >
                                                    <Plus size={20} />
                                                    <input type="file" multiple accept="image/*" onChange={(e) => handleImportImageSelect(e, item.local_id)} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                        {item.imageManager.length === 0 && <p className="text-xs text-rose-500 mt-2 font-medium">Harap masukkan minimal 1 gambar.</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg sticky bottom-6 shadow-2xl z-40">
                            <button onClick={() => setCurrentView('list')} className="px-6 py-2 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800 font-medium">Batal</button>
                            <button 
                                onClick={handleImportSubmit} 
                                className="px-8 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={resolvingCollection || resolvingCategory}
                            >
                                Submit Semua Data
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

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
                        <button onClick={handleExport} disabled={products.length === 0} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 ${products.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}>
                            <FileDown size={16} /><span className="hidden sm:inline">Export</span>
                        </button>
                        <button onClick={openImportView} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0">
                            <Upload size={16} /><span className="hidden sm:inline">Import</span>
                        </button>
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
                            const rawIndex = carouselIndices[product.product_id] || 0;
                            const maxIndex = product.images ? Math.max(0, product.images.length - 1) : 0;
                            const cIndex = rawIndex > maxIndex ? 0 : rawIndex;
                            const hasMultipleImages = product.images && product.images.length > 1;

                            return (
                                <div key={product.product_id} onClick={() => handleEdit(product)} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group cursor-pointer hover:border-zinc-600 transition-all hover:-translate-y-1">
                                    <div className="aspect-square bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800 group-hover:opacity-90 transition-opacity">

                                        {product.images && product.images.length > 0 ? (
                                            <img src={`${import.meta.env.VITE_API_URL}${product.images[cIndex]}`} alt={product.name} className="object-cover w-full h-full"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <ExternalLink size={14} className="text-orange-500" /> Link Shopee
                        </label>
                        <input
                            type="text"
                            name="shopee_link"
                            value={formData.shopee_link}
                            onChange={handleInputChange}
                            placeholder="https://shopee.co.id/..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <ExternalLink size={14} className="text-emerald-500" /> Link Tik Tok Shop
                        </label>
                        <input
                            type="text"
                            name="tiktok_link"
                            value={formData.tiktok_link}
                            onChange={handleInputChange}
                            placeholder="https://www.tiktok.com/..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
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
                                <label 
                                    className="aspect-square rounded-md border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-zinc-500 hover:text-zinc-300"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); handleFileSelect({ target: { files: e.dataTransfer.files } }); }}
                                >
                                    <Plus size={24} className="mb-2" />
                                    <span className="text-xs font-medium text-center px-1">Drag & Drop atau Klik</span>
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