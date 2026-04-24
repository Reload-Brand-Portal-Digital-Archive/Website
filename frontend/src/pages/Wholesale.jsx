import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/ui/Navbar';

export default function Wholesale() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiry_type: 'Pembelian Grosir',
    address: '',
    message: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token) {
      setIsLoggedIn(false);
    } else {
      setFormData(prev => ({
        ...prev,
        name: user.username || user.name || '',
        email: user.email || ''
      }));
    }

    const fetchProducts = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + '/api/products');
        setProducts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const handleToggleSize = (product, size) => {
    if (product.status !== 'Available') return;
    
    const existing = selectedItems.find(item => item.product.product_id === product.product_id && item.size === size);
    if (existing) {
      setSelectedItems(prev => prev.filter(item => item.id !== existing.id));
    } else {
      setSelectedItems(prev => [...prev, { id: `${product.product_id}-${size}-${Date.now()}`, product, size, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, parseInt(newQuantity) || 1) } : item));
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.warning("Please select at least one product.");
      return;
    }
    
    setIsSubmitting(true);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const payload = {
        ...formData,
        user_id: user.id || user.user_id || null,
        items: selectedItems.map(item => ({
            product_id: item.product.product_id,
            product_name_snapshot: item.product.name,
            quantity: item.quantity,
            size: item.size
        }))
    };
    
    try {
        const res = await axios.post(import.meta.env.VITE_API_URL + '/api/wholesale', payload);
        if (res.data.order_id) {
            toast.success('Wholesale order submitted successfully! We will review it soon.');
            setSelectedItems([]);
            setFormData({...formData, address: '', message: ''});
        }
    } catch (err) {
        console.error("Submit error:", err);
        toast.error('Failed to submit order. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/400x500/18181b/a1a1aa?text=No+Image';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;
  };

  const parseSizes = (sizesStr) => {
    if (!sizesStr) return [];
    if (typeof sizesStr === 'string') {
        try {
            const parsed = JSON.parse(sizesStr);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return sizesStr.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return [];
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-50 font-sans selection:bg-zinc-800 selection:text-white flex flex-col relative overflow-hidden pb-24">
      <Navbar />

      {!isLoggedIn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-medium text-white mb-3">Login Required</h2>
            <p className="text-zinc-400 text-sm mb-8">
              You have to log in first to access the Wholesale ordering page.
            </p>
            <div className="flex flex-col gap-4">
              <Link to="/login" state={{ from: location.pathname }} className="w-full inline-flex items-center justify-center bg-white text-zinc-950 hover:bg-zinc-200 transition-colors h-10 px-4 text-sm font-medium">
                Go to Login
              </Link>
              <Link to="/" className="w-full inline-flex items-center justify-center bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors h-10 px-4 text-sm font-medium">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 pt-32 px-6 md:px-12 transition-all duration-500 max-w-[1400px] w-full mx-auto ${!isLoggedIn ? 'blur-md brightness-50 pointer-events-none' : ''}`}>
        <div className="mb-12">
            <span className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase">[ B2B PORTAL ]</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mt-4 mb-4">Wholesale <span className="text-zinc-600">Orders</span></h1>
            
            <div className="bg-zinc-900/60 border border-zinc-800 text-zinc-300 p-6 mt-8">
              <h2 className="text-sm font-mono tracking-widest text-white uppercase mb-3 border-b border-zinc-800 pb-2">How to order</h2>
              <ol className="text-xs leading-relaxed space-y-2 font-sans font-medium text-zinc-400 pt-2">
                <li><strong className="text-zinc-200">1.</strong> Browse or search the catalog below.</li>
                <li><strong className="text-zinc-200">2.</strong> Click on the size badges under a product to add it to your cart. Click again to remove it.</li>
                <li><strong className="text-zinc-200">3.</strong> Adjust quantities or remove items from the Cart panel on the right.</li>
                <li><strong className="text-zinc-200">4.</strong> Fill out your shipping and contact details in the Checkout details.</li>
                <li><strong className="text-zinc-200">5.</strong> Submit your wholesale order request for our team to review.</li>
              </ol>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* LEFT COLUMN: PRODUCT SELECTION */}
            <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-2 rounded-none px-4 box-border">
                    <Search className="w-4 h-4 text-zinc-500" />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-600 w-full h-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredProducts.map(product => {
                        const sizes = parseSizes(product.sizes);
                        const isAvailable = product.status === 'Available';
                        const isProductInCart = selectedItems.some(i => i.product.product_id === product.product_id);
                        
                        return (
                            <div key={product.product_id} className={`flex flex-col border p-3 md:p-4 transition-all duration-300 ${!isAvailable ? 'border-zinc-900 bg-zinc-950/50 opacity-40 grayscale pointer-events-none' : isProductInCart ? 'border-white bg-zinc-900/50 text-white shadow-[0_0_20px_rgba(255,255,255,0.07)]' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 text-zinc-50'}`}>
                                <div className="aspect-[3/4] mb-4 bg-zinc-800 overflow-hidden relative">
                                    <img src={getImageUrl(product.primary_image || (product.images && product.images.length > 0 ? product.images[0] : null))} alt={product.name} className="w-full h-full object-cover" />
                                    {!isAvailable && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                            <span className="text-white font-mono text-xs font-bold tracking-widest rotate-[-15deg] uppercase border border-white px-2 py-1">Sold Out</span>
                                        </div>
                                    )}
                                    {isProductInCart && (
                                        <div className="absolute top-2 right-2 bg-white text-zinc-950 p-1 rounded-full shadow-lg">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider mb-3 leading-tight truncate text-white" title={product.name}>{product.name}</h3>
                                
                                <div className="flex flex-wrap gap-1 mt-auto">
                                    {sizes.length > 0 ? sizes.map(size => {
                                        const isSelected = selectedItems.some(i => i.product.product_id === product.product_id && i.size === size);
                                        return (
                                            <button 
                                                key={size}
                                                onClick={() => handleToggleSize(product, size)}
                                                className={`text-[10px] sm:text-xs px-2 py-1 flex items-center gap-1 transition-colors ${isSelected ? 'bg-white text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-600 hover:text-white'}`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    }) : (
                                        <button 
                                            onClick={() => handleToggleSize(product, 'One Size')}
                                            className={`text-[10px] sm:text-xs px-2 py-1 transition-colors ${selectedItems.some(i => i.product.product_id === product.product_id && i.size === 'One Size') ? 'bg-white text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-600 hover:text-white'}`}
                                        >
                                            One Size
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-12 text-center border border-zinc-800 border-dashed">
                            <span className="text-zinc-600 font-mono text-xs uppercase">No products found</span>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: TABLE & FORM */}
            <div className="lg:col-span-5 flex flex-col gap-8 sticky top-32">
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 flex flex-col">
                    <h2 className="text-sm font-mono tracking-widest text-zinc-400 capitalize border-b border-zinc-800 pb-4 mb-4">Cart & Quantity</h2>
                    
                    {selectedItems.length === 0 ? (
                        <div className="py-8 text-center bg-zinc-950 border border-dashed border-zinc-800">
                            <span className="text-xs text-zinc-600 font-mono">Cart is empty</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedItems.map(item => (
                                <div key={item.id} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white uppercase truncate">{item.product.name}</p>
                                        <p className="text-[10px] font-mono text-zinc-500 mt-1">Size: {item.size}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                                            className="w-16 h-8 bg-zinc-900 border border-zinc-700 text-center text-xs text-white outline-none focus:border-white transition-colors"
                                        />
                                        <button 
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-zinc-500 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="bg-zinc-900/40 border border-zinc-800 p-6 flex flex-col gap-4">
                    <h2 className="text-sm font-mono tracking-widest text-zinc-400 capitalize border-b border-zinc-800 pb-4 mb-2">Checkout Details</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase">Name</label>
                            <input required name="name" value={formData.name} onChange={handleFormChange} type="text" className="bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none h-10 px-3 text-xs text-zinc-200" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase">Phone</label>
                            <input required name="phone" value={formData.phone} onChange={handleFormChange} type="tel" className="bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none h-10 px-3 text-xs text-zinc-200" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Email</label>
                        <input required name="email" value={formData.email} onChange={handleFormChange} type="email" className="bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none h-10 px-3 text-xs text-zinc-200" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Inquiry Type</label>
                        <select required name="inquiry_type" value={formData.inquiry_type} onChange={handleFormChange} className="bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none h-10 px-3 text-xs text-zinc-200 cursor-pointer appearance-none rounded-none">
                            <option value="Pembelian Grosir">Pembelian Grosir</option>
                            <option value="Kolaborasi">Kolaborasi</option>
                            <option value="Sponsor">Sponsor</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Shipping Address</label>
                        <textarea required name="address" value={formData.address} onChange={handleFormChange} rows="3" className="bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none py-2 px-3 text-xs text-zinc-200 resize-none"></textarea>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Additional Message (Optional)</label>
                        <textarea name="message" value={formData.message} onChange={handleFormChange} rows="2" className="bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none py-2 px-3 text-xs text-zinc-200 resize-none"></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting || selectedItems.length === 0}
                        className="mt-4 flex items-center justify-between w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:hover:bg-zinc-800 font-sans tracking-wide text-xs uppercase h-12 px-6 transition-colors"
                    >
                        <span>{isSubmitting ? 'Processing...' : 'Submit Wholesale Order'}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b; 
        }
      `}} />
    </div>
  );
}
