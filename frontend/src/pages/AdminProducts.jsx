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
            const errorMsg = "Maximum of 5 images allowed";
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
        notify.success(`${files.length} image(s) added successfully`);
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
            notify.error("Unsupported file type. Please use .xlsx or .csv");
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
    
        if (processed.length === 0) return notify.error('No valid data found in this file.');
    
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
            return notify.error("A cover image is required for new collections!");
        }
        
        const slug = collectionFormData.name.toLowerCase().replace(/\s+/g, '-');
        const formPayload = new FormData();
        formPayload.append('name', collectionFormData.name);
        formPayload.append('slug', slug);
        formPayload.append('description', collectionFormData.description);
        formPayload.append('year', collectionFormData.year);
        formPayload.append('cover_image', collectionFormData.cover_image);

        try {
            const loadingToastId = notify.loading('Creating collection...');
            const res = await axios.post(import.meta.env.VITE_API_URL + '/api/collections', formPayload, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const newCol = res.data.data;
            setCollections(prev => [...prev, newCol]);
            notify.update(loadingToastId, { render: `Collection "${newCol.name}" created!`, type: 'success', isLoading: false, autoClose: 3000 });
            
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
            notify.error("Failed to create collection: " + (error.response?.data?.message || error.message));
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
                const loadingToastId = notify.loading('Adding category...');
                await axios.post(import.meta.env.VITE_API_URL + '/api/categories', { name: resolvingCategory }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setCategories(prev => [...prev, resolvingCategory]);
                notify.update(loadingToastId, { render: 'Category added successfully!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                notify.error("Failed to add category: " + (error.response?.data?.message || error.message));
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
                notify.warning("Maximum 5 images per product");
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
                return notify.error(`Product "${item.name}" has no images`);
            }
            if (!item.category) {
                 return notify.error(`Product "${item.name}" must have a valid category`);
            }
        }
    
        const loadingId = notify.loading('Saving products in bulk...');
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
                notify.error(`Failed to save ${item.name}`);
            }
        }
    
        notify.update(loadingId, { render: `Successfully imported ${successCount} of ${importData.length} products.`, type: 'success', isLoading: false, autoClose: 3000 });
        
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


    const handleExport = async (format) => {
        try {
            const loadingToastId = notify.loading(`Preparing ${format.toUpperCase()} export...`);
            const response = await axios.get(import.meta.env.VITE_API_URL + `/api/products/export/${format}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = format === 'excel' ? 'zip' : format;
            link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            notify.update(loadingToastId, { render: `Products exported to ${format.toUpperCase()} successfully!`, type: 'success', isLoading: false, autoClose: 3000 });
        } catch {
            notify.error("Failed to export products. Make sure the server is running.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            notify.error("Product name is required");
            return setErrors({ name: "Product name is required" });
        }
        if (!formData.category) {
            notify.error("Category is required");
            return setErrors({ category: "Category is required" });
        }
        if (imageManager.length === 0) {
            notify.error("At least 1 image is required");
            return setErrors({ images: "At least 1 image is required" });
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
            const loadingToastId = notify.loading(currentView === 'create' ? 'Creating product...' : 'Saving changes...');

            if (currentView === 'create') {
                await axios.post(import.meta.env.VITE_API_URL + '/api/products', formPayload, { headers: { 'Authorization': `Bearer ${token}` } });
                notify.update(loadingToastId, { render: 'Product created successfully!', type: 'success', isLoading: false, autoClose: 3000 });
            } else {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${selectedProduct.product_id}`, formPayload, { headers: { 'Authorization': `Bearer ${token}` } });
                notify.update(loadingToastId, { render: 'Product updated successfully!', type: 'success', isLoading: false, autoClose: 3000 });
            }
            await fetchData();
            setCurrentView('list');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to save product';
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
            title: 'Delete Product',
            description: 'Are you sure you want to delete this product? All associated image files will be permanently removed.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            try {
                const loadingToastId = notify.loading('Deleting product...');
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                setProducts(products.filter(p => p.product_id !== id));
                notify.update(loadingToastId, { render: 'Product deleted successfully!', type: 'success', isLoading: false, autoClose: 3000 });
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Failed to delete product";
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
                        <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><Upload className="text-emerald-500" /> Bulk Product Import</h2>
                        <p className="text-sm text-zinc-400 mt-1">Upload an Excel or CSV file, then add images for each product.</p>
                    </div>
                </div>

                {resolvingCollection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-white mb-2">New Collection Found</h3>
                            <p className="text-sm text-zinc-400 mb-6">Collection <strong>"{resolvingCollection}"</strong> does not exist in the database. Please fill in the details to create a new collection.</p>
                            
                            <form onSubmit={handleResolveCollection} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Collection Description</label>
                                    <textarea required rows={3} value={collectionFormData.description} onChange={e => setCollectionFormData(prev => ({...prev, description: e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded py-2 px-3 text-zinc-100" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Year</label>
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
                                                <span className="text-sm">Click or Drag & Drop image here</span>
                                            )}
                                        </div>
                                        <input type="file" required={!collectionFormData.cover_image} accept="image/*" onChange={e => setCollectionFormData(prev => ({...prev, cover_image: e.target.files[0]}))} className="hidden" />
                                    </label>
                                </div>
                                <div className="flex gap-3 justify-end mt-6">
                                    <button type="button" onClick={handleSkipCollection} className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800">Skip & Empty</button>
                                    <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors">Create Collection</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {resolvingCategory && !resolvingCollection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
                            <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4"><Plus size={24} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">New Category</h3>
                            <p className="text-sm text-zinc-400 mb-6">Category <strong>"{resolvingCategory}"</strong> does not exist in the database. Would you like to add it now?</p>
                            
                            <div className="flex gap-3 justify-center">
                                <button type="button" onClick={() => handleResolveCategory(false)} className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800">No</button>
                                <button type="button" onClick={() => handleResolveCategory(true)} className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">Yes, Add It</button>
                            </div>
                        </div>
                    </div>
                )}

                {importData.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-lg p-12 text-center flex flex-col items-center">
                        <Upload size={48} className="text-zinc-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Upload Product Data</h3>
                        <p className="text-sm text-zinc-400 mb-6 max-w-md">Recommended format: .xlsx. Required columns: Name, Category. Optional: Collection, Description, Sizes, Status, Shopee, TikTok.</p>
                        
                        <div className="flex gap-4">
                            <button onClick={downloadImportTemplate} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                                <FileDown size={16} /> Download Template
                            </button>
                            <label className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
                                <Upload size={16} /> Select File
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFileChange} className="hidden" />
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-md flex items-start gap-3">
                            <CheckCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Data Loaded Successfully</h4>
                                <p className="text-sm text-emerald-400/80 mt-1">Found {importData.length} valid product rows. Please upload images for each product before saving to the database.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {importData.map((item, index) => (
                                <div key={item.local_id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 lg:flex gap-6 relative">
                                    <button 
                                        type="button" 
                                        onClick={() => setImportData(prev => prev.filter(i => i.local_id !== item.local_id))} 
                                        className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors p-1 bg-zinc-800/50 hover:bg-zinc-800 rounded"
                                        title="Remove this row from the import list"
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
                                                <span className="text-xs text-zinc-500 block mb-1">Category</span>
                                                <p className="text-sm text-zinc-200 font-medium">{item.category || <span className="text-red-500 italic">Not set</span>}</p>
                                            </div>
                                            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800/50">
                                                <span className="text-xs text-zinc-500 block mb-1">Collection</span>
                                                <p className="text-sm text-zinc-200">{item.collection_name || '-'}</p>
                                            </div>
                                            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800/50">
                                                <span className="text-xs text-zinc-500 block mb-1">Status & Size</span>
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
                                        <label className="text-xs font-medium text-zinc-400 mb-2 block">Upload Product Image ({item.imageManager.length}/5) <span className="text-rose-500">*</span></label>
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
                                        {item.imageManager.length === 0 && <p className="text-xs text-rose-500 mt-2 font-medium">Please add at least 1 image.</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg sticky bottom-6 shadow-2xl z-40">
                            <button onClick={() => setCurrentView('list')} className="px-6 py-2 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800 font-medium">Cancel</button>
                            <button 
                                onClick={handleImportSubmit} 
                                className="px-8 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={resolvingCollection || resolvingCategory}
                            >
                                Submit All Data
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
                        <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><ShoppingBag className="text-rose-500" /> Product Management</h2>
                        <p className="text-sm text-zinc-400 mt-1">Manage product catalog, categories, and stock.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 pl-9 pr-4 text-sm text-zinc-100 focus:border-rose-500 transition-colors" />
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleExport('csv')} disabled={products.length === 0} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 ${products.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20'}`}>
                                <FileDown size={16} /><span className="hidden sm:inline">CSV</span>
                            </button>
                            <button onClick={() => handleExport('excel')} disabled={products.length === 0} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 ${products.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}>
                                <FileDown size={16} /><span className="hidden sm:inline">Excel</span>
                            </button>
                            <button onClick={() => handleExport('pdf')} disabled={products.length === 0} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 ${products.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20'}`}>
                                <FileDown size={16} /><span className="hidden sm:inline">PDF</span>
                            </button>
                        </div>
                        <button onClick={openImportView} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0">
                            <Upload size={16} /><span className="hidden sm:inline">Import</span>
                        </button>
                        <button onClick={openCreateForm} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0">
                            <Plus size={16} /><span className="hidden sm:inline">Add New</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-500" size={32} /></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                        <ShoppingBag size={48} className="text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-300">No products found</h3>
                        <p className="text-zinc-500 mt-1">Try a different search term or add a new product.</p>
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
                                            <button onClick={(e) => handleDelete(product.product_id, e)} className="p-1.5 bg-red-500/90 text-white rounded hover:bg-red-600" title="Delete"><Trash2 size={14} /></button>
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
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2"><ShoppingBag className="text-rose-500" /> {currentView === 'create' ? 'Add New Product' : 'Edit Product Data'}</h2>
                    <p className="text-sm text-zinc-400 mt-1">Set photos, make covers, and complete the details.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Product Name <span className="text-rose-500">*</span></label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 focus:border-rose-500" />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Collection</label>
                        <select name="collection_id" value={formData.collection_id} onChange={handleInputChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100">
                            <option value="">-- No Collection --</option>
                            {collections.map(c => <option key={c.collection_id} value={c.collection_id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Category <span className="text-rose-500">*</span></label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className={`w-full bg-zinc-950 border rounded-md py-2 px-4 text-zinc-100 ${errors.category ? 'border-red-500' : 'border-zinc-800'}`}
                        >
                            <option value="">-- Select Category --</option>
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
                                <option value="" disabled>No Category</option>
                            )}
                        </select>
                        {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Size (Can choose more than 1)</label>
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

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-300">Product Status</label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Available' ? 'Sold Out' : 'Available' }))}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${formData.status === 'Available' ? 'bg-zinc-100' : 'bg-red-500'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-zinc-900 transition duration-200 ease-in-out ${formData.status === 'Available' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-sm font-bold tracking-wider uppercase ${formData.status === 'Available' ? 'text-zinc-100' : 'text-red-500'}`}>
                                {formData.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium text-zinc-300">Detail Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                        placeholder="Write detailed description of materials, cutting, size guide, etc..."
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
                        <label className="text-sm font-medium text-zinc-300">Gallery Photos ({imageManager.length}/5) <span className="text-rose-500">*</span></label>
                        <p className="text-xs text-zinc-500 mb-4">Add photos, click the star button to make it the cover photo.</p>

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
                                    <span className="text-xs font-medium text-center px-1">Drag & Drop or Click</span>
                                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                </label>
                            )}
                        </div>
                        {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                    <button type="button" onClick={() => setCurrentView('list')} className="px-4 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-md hover:bg-zinc-700">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-rose-500 text-white font-medium rounded-md hover:bg-rose-600">Save Product</button>
                </div>
            </form>
        </div>
    );
}