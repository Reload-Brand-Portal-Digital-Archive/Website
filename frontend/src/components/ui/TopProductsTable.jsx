import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, ShoppingBag, Layers, Package, TrendingUp, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import TopProductsModal from './TopProductsModal';

export default function TopProductsTable({ refreshTrigger }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTopProducts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Kita ambil dari data ecommerce hub yang menyimpan seluruh akumulasi order
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/ecommerce-hub`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success && response.data.data?.orders) {
                const orders = response.data.data.orders;
                const productMap = {};

                // Kelompokkan berdasarkan Nama Produk Resmi + Varian (Ukuran Model)
                orders.forEach(order => {
                    const name = order.product_name || 'Produk Tanpa Nama';
                    const variant = order.variant || 'All Size';
                    const key = `${name}___${variant}`;

                    if (!productMap[key]) {
                        productMap[key] = {
                            product_name: name,
                            original_name: order.original_report_name || order.original_name || name,
                            product_id: order.product_id,
                            db_matched: order.db_matched,
                            category: order.category,
                            primary_image: order.primary_image,
                            variant: variant,
                            quantity: 0,
                            transactions: 0,
                            total_amount: 0,
                            platforms: {}
                        };
                    }

                    productMap[key].quantity += parseInt(order.quantity || 1);
                    productMap[key].transactions += 1;
                    productMap[key].total_amount += parseFloat(order.total_amount || 0);
                    const plat = order.platform || 'General';
                    productMap[key].platforms[plat] = (productMap[key].platforms[plat] || 0) + 1;
                });

                // Urutkan dari kuantitas/transaksi terbanyak
                const sorted = Object.values(productMap).sort((a, b) => b.quantity - a.quantity || b.transactions - a.transactions);
                setProducts(sorted);
            }
        } catch (error) {
            console.error('Failed to fetch top products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopProducts();
    }, [refreshTrigger]);

    const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'tiktok', 'shopee', 'wholesale'

    // Filter & Sorting Dinamis berdasarkan tab aktif
    const filteredProducts = products.filter(item => {
        if (selectedTab === 'all') return true;
        
        const plats = Object.keys(item.platforms).map(p => p.toLowerCase());
        if (selectedTab === 'tiktok') return plats.some(p => p.includes('tiktok'));
        if (selectedTab === 'shopee') return plats.some(p => p.includes('shopee'));
        if (selectedTab === 'wholesale') return plats.some(p => p.includes('wholesale') || p.includes('laporan') || p.includes('manual') || p.includes('general'));
        
        return false;
    }).sort((a, b) => {
        if (selectedTab === 'all') return b.quantity - a.quantity;
        return b.quantity - a.quantity; // tetap urutkan dari kuantitas item terbanyak
    });

    // Ambil Top 5 untuk ditampilkan di tabel ringkas
    const topDisplayProducts = filteredProducts.slice(0, 5);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg shadow-black/20">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <ShoppingBag size={18} className="text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Produk Paling Sering Dibeli</h3>
                        <p className="text-[10px] text-zinc-500">Peringkat akumulasi pesanan</p>
                    </div>
                </div>
                <button 
                    onClick={fetchTopProducts}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                    title="Refresh Data"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Platform Filter Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 bg-zinc-950/80 border-b border-zinc-800/80 text-xs overflow-x-auto shrink-0">
                <button 
                    onClick={() => setSelectedTab('all')}
                    className={`px-3 py-1 rounded-md font-medium transition-all shrink-0 ${selectedTab === 'all' ? 'bg-rose-500 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Semua Platform
                </button>
                <button 
                    onClick={() => setSelectedTab('tiktok')}
                    className={`px-3 py-1 rounded-md font-medium transition-all shrink-0 flex items-center gap-1.5 ${selectedTab === 'tiktok' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    TikTok Top
                </button>
                <button 
                    onClick={() => setSelectedTab('shopee')}
                    className={`px-3 py-1 rounded-md font-medium transition-all shrink-0 flex items-center gap-1.5 ${selectedTab === 'shopee' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    Shopee Top
                </button>
                <button 
                    onClick={() => setSelectedTab('wholesale')}
                    className={`px-3 py-1 rounded-md font-medium transition-all shrink-0 flex items-center gap-1.5 ${selectedTab === 'wholesale' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Wholesale Top
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 min-h-[300px]">
                {loading && products.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-12">
                        <RefreshCw size={24} className="animate-spin text-zinc-700" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                        <Package size={40} className="text-zinc-800 mb-3 opacity-50" />
                        <p className="text-sm text-zinc-500">Belum ada data produk yang tercatat dari laporan.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {topDisplayProducts.map((item, index) => {
                            const rank = index + 1;
                            return (
                                <div key={index} className="p-4 hover:bg-white/[0.02] transition-all relative group">
                                    <div className="flex items-center gap-3">
                                        {/* Rank Indicator */}
                                        <div className="shrink-0 w-7 text-center font-bold">
                                            {rank === 1 ? <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">#1</span> :
                                             rank === 2 ? <span className="text-xs text-zinc-300 bg-zinc-300/10 px-1.5 py-0.5 rounded border border-zinc-300/20">#2</span> :
                                             rank === 3 ? <span className="text-xs text-amber-600 bg-amber-600/10 px-1.5 py-0.5 rounded border border-amber-600/20">#3</span> :
                                             <span className="text-xs text-zinc-600">#{rank}</span>}
                                        </div>

                                        {/* Product Thumbnail */}
                                        <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative group-hover:border-zinc-700 transition-colors">
                                            {item.primary_image ? (
                                                <img 
                                                    src={`${import.meta.env.VITE_API_URL || ''}${item.primary_image}`} 
                                                    alt={item.product_name} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-zinc-100 group-hover:text-rose-400 transition-colors truncate">
                                                    {item.product_name}
                                                </p>
                                                {item.db_matched && (
                                                    <span 
                                                        className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-400/10 px-1 py-0.2 rounded border border-emerald-400/20 font-medium tracking-tight shrink-0"
                                                        title="Otomatis cocok dengan Master Produk Database"
                                                    >
                                                        <CheckCircle2 size={9} />
                                                        Terverifikasi
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                                                    <Layers size={10} className="text-rose-500" />
                                                    Ukuran: <strong className="text-zinc-300">{item.variant}</strong>
                                                </span>
                                                {item.category && item.category !== 'Uncategorized' && (
                                                    <span className="text-[9px] text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                                                        {item.category}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-zinc-500">
                                                    ({item.transactions} trx)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Purchased Quantity Indicator */}
                                        <div className="shrink-0 text-right">
                                            <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                                                {item.quantity} terbeli
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    disabled={products.length === 0}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group disabled:opacity-30"
                >
                    Lihat Semua
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <TopProductsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                products={filteredProducts} 
                currentTab={selectedTab}
            />
        </div>
    );
}
