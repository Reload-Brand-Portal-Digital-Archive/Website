import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, ShoppingBag, Layers, Package, TrendingUp, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import TopProductsModal from './TopProductsModal';

const parseVariant = (variantStr) => {
    let jenis = '-';
    let warna = '-';
    let ukuran = '-';

    if (!variantStr) return { jenis, warna, ukuran };
    const str = variantStr.trim();

    if (str.includes('-') && str.includes(',')) {
        const parts = str.split('-');
        jenis = parts[0].trim();
        const subParts = parts[1].split(',');
        warna = subParts[0].trim();
        ukuran = subParts[1].trim();
    } else if (str.split('-').length >= 3) {
        const parts = str.split('-');
        jenis = parts.slice(0, 2).join('-');
        warna = parts[2].trim();
        ukuran = 'All Size';
    } else if (str.includes('-')) {
        const parts = str.split('-');
        jenis = parts[0].trim();
        warna = parts[1].trim();
        ukuran = 'All Size';
    } else if (str.includes(',')) {
        const parts = str.split(',');
        warna = parts[0].trim();
        ukuran = parts[1].trim();
    } else {
        ukuran = str;
    }

    return { jenis, warna, ukuran };
};

export default function TopProductsTable({ refreshTrigger }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'tiktok', 'shopee', 'wholesale'
    const [filterJenis, setFilterJenis] = useState('all');
    const [filterWarna, setFilterWarna] = useState('all');
    const [filterUkuran, setFilterUkuran] = useState('all');
    const [sortBy, setSortBy] = useState('quantity'); // 'quantity', 'transactions', 'total_amount'

    const fetchTopProducts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/ecommerce-hub`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success && response.data.data?.orders) {
                const orders = response.data.data.orders;
                const productMap = {};

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

                const sorted = Object.values(productMap).sort((a, b) => {
                    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
                    if (b.transactions !== a.transactions) return b.transactions - a.transactions;
                    return b.total_amount - a.total_amount;
                });

                const enrichedSorted = sorted.map(item => {
                    const parsed = parseVariant(item.variant);
                    return {
                        ...item,
                        jenis: parsed.jenis,
                        warna: parsed.warna,
                        ukuran: parsed.ukuran
                    };
                });

                setProducts(enrichedSorted);
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

    const hasActiveFilters = filterJenis !== 'all' || filterWarna !== 'all' || filterUkuran !== 'all' || sortBy !== 'quantity';
    const resetFilters = () => {
        setFilterJenis('all');
        setFilterWarna('all');
        setFilterUkuran('all');
        setSortBy('quantity');
    };

    const uniqueJenis = Array.from(new Set(products.map(p => p.jenis).filter(x => x && x !== '-'))).sort();
    const uniqueWarna = Array.from(new Set(products.map(p => p.warna).filter(x => x && x !== '-'))).sort();
    const uniqueUkuran = Array.from(new Set(products.map(p => p.ukuran).filter(x => x && x !== '-'))).sort();

    const filteredProducts = products
        .filter(item => {
            if (selectedTab !== 'all') {
                const plats = Object.keys(item.platforms).map(p => p.toLowerCase());
                if (selectedTab === 'tiktok' && !plats.some(p => p.includes('tiktok'))) return false;
                if (selectedTab === 'shopee' && !plats.some(p => p.includes('shopee'))) return false;
                if (selectedTab === 'wholesale' && !plats.some(p => p.includes('wholesale') || p.includes('laporan') || p.includes('manual') || p.includes('general'))) return false;
            }
            
            if (filterJenis !== 'all' && item.jenis !== filterJenis) return false;
            if (filterWarna !== 'all' && item.warna !== filterWarna) return false;
            if (filterUkuran !== 'all' && item.ukuran !== filterUkuran) return false;
            
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'transactions') {
                if (b.transactions !== a.transactions) return b.transactions - a.transactions;
                return b.quantity - a.quantity;
            }
            if (sortBy === 'total_amount') {
                if (b.total_amount !== a.total_amount) return b.total_amount - a.total_amount;
                return b.quantity - a.quantity;
            }
            if (b.quantity !== a.quantity) return b.quantity - a.quantity;
            if (b.transactions !== a.transactions) return b.transactions - a.transactions;
            return b.total_amount - a.total_amount;
        });

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
                <div className="flex items-center">
                    {hasActiveFilters && (
                        <button 
                            onClick={resetFilters}
                            className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors font-bold border border-rose-500/20 bg-rose-500/5 px-2 py-0.5 rounded mr-3 uppercase tracking-wider"
                        >
                            Reset Filter
                        </button>
                    )}
                    <button 
                        onClick={fetchTopProducts}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                        title="Refresh Data"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
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

            {/* Sleek Custom Filters */}
            <div className="bg-zinc-900/60 p-3 border-b border-zinc-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 shrink-0">
                {/* Filter Jenis/Design */}
                <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 font-semibold tracking-wide uppercase text-[9px]">Model/Design</label>
                    <select 
                        value={filterJenis}
                        onChange={(e) => setFilterJenis(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-1.5 py-1 focus:outline-none focus:border-rose-500 transition-colors w-full cursor-pointer"
                    >
                        <option value="all">Semua Model</option>
                        {uniqueJenis.map(j => (
                            <option key={j} value={j}>{j}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Warna */}
                <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 font-semibold tracking-wide uppercase text-[9px]">Warna</label>
                    <select 
                        value={filterWarna}
                        onChange={(e) => setFilterWarna(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-1.5 py-1 focus:outline-none focus:border-rose-500 transition-colors w-full cursor-pointer"
                    >
                        <option value="all">Semua Warna</option>
                        {uniqueWarna.map(w => (
                            <option key={w} value={w}>{w}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Ukuran */}
                <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 font-semibold tracking-wide uppercase text-[9px]">Ukuran</label>
                    <select 
                        value={filterUkuran}
                        onChange={(e) => setFilterUkuran(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-1.5 py-1 focus:outline-none focus:border-rose-500 transition-colors w-full cursor-pointer"
                    >
                        <option value="all">Semua Ukuran</option>
                        {uniqueUkuran.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                {/* Urutkan Berdasarkan */}
                <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 md:col-span-2">
                    <label className="text-zinc-500 font-semibold tracking-wide uppercase text-[9px]">Urutkan Berdasarkan</label>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-1.5 py-1 focus:outline-none focus:border-rose-500 transition-colors w-full cursor-pointer font-medium"
                    >
                        <option value="quantity">Kuantitas Terbanyak</option>
                        <option value="transactions">Transaksi Terbanyak</option>
                        <option value="total_amount">Nilai Penjualan (Rupiah)</option>
                    </select>
                </div>
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
                                                {(() => {
                                                    const parseVariant = (variantStr) => {
                                                        let jenis = '-';
                                                        let warna = '-';
                                                        let ukuran = '-';

                                                        if (!variantStr) return { jenis, warna, ukuran };
                                                        const str = variantStr.trim();

                                                        if (str.includes('-') && str.includes(',')) {
                                                            const parts = str.split('-');
                                                            jenis = parts[0].trim();
                                                            const subParts = parts[1].split(',');
                                                            warna = subParts[0].trim();
                                                            ukuran = subParts[1].trim();
                                                        } else if (str.split('-').length >= 3) {
                                                            const parts = str.split('-');
                                                            jenis = parts.slice(0, 2).join('-');
                                                            warna = parts[2].trim();
                                                            ukuran = 'All Size';
                                                        } else if (str.includes('-')) {
                                                            const parts = str.split('-');
                                                            jenis = parts[0].trim();
                                                            warna = parts[1].trim();
                                                            ukuran = 'All Size';
                                                        } else if (str.includes(',')) {
                                                            const parts = str.split(',');
                                                            warna = parts[0].trim();
                                                            ukuran = parts[1].trim();
                                                        } else {
                                                            ukuran = str;
                                                        }

                                                        return { jenis, warna, ukuran };
                                                    };

                                                    const { jenis, warna, ukuran } = parseVariant(item.variant);
                                                    return (
                                                        <>
                                                            {jenis && jenis !== '-' && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded" title="Jenis/Model">
                                                                    <span className="text-zinc-500">Jenis:</span>
                                                                    <strong className="text-zinc-300">{jenis}</strong>
                                                                </span>
                                                            )}
                                                            {warna && warna !== '-' && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded" title="Warna">
                                                                    <span className="text-zinc-500">Warna:</span>
                                                                    <strong className="text-zinc-300">{warna}</strong>
                                                                </span>
                                                            )}
                                                            {ukuran && ukuran !== '-' && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded" title="Ukuran">
                                                                    <span className="text-zinc-500">Ukuran:</span>
                                                                    <strong className="text-zinc-300">{ukuran}</strong>
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
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
