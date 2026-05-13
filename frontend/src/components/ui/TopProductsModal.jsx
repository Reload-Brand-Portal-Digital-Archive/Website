import React, { useState } from 'react';
import { X, Search, ShoppingBag, Package, TrendingUp, Layers } from 'lucide-react';

export default function TopProductsModal({ isOpen, onClose, products, currentTab = 'all' }) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredProducts = products.filter(item => {
        const name = item.product_name || '';
        const variant = item.variant || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               variant.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getTabTitle = () => {
        if (currentTab === 'tiktok') return ' - TikTok Top';
        if (currentTab === 'shopee') return ' - Shopee Top';
        if (currentTab === 'wholesale') return ' - Wholesale Top';
        return '';
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 rounded-xl shrink-0">
                            <ShoppingBag size={24} className="text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">
                                Peringkat Produk Terlaris<span className="text-rose-500">{getTabTitle()}</span>
                            </h2>
                            <p className="text-sm text-zinc-500">Daftar lengkap akumulasi produk paling sering dibeli berdasarkan dokumen laporan.</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari nama produk atau ukuran model..." 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto bg-zinc-950">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-16 text-center">Peringkat</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produk</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ukuran / Varian</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Platform</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Total Terbeli</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Estimasi Sales</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <Package size={48} className="text-zinc-800 mx-auto mb-4 opacity-50" />
                                        <p className="text-zinc-500">Tidak ada data produk yang sesuai dengan pencarian.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((item, index) => {
                                    const rank = index + 1;
                                    return (
                                        <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold">
                                                {rank === 1 ? <span className="text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">#1</span> :
                                                 rank === 2 ? <span className="text-zinc-300 bg-zinc-300/10 px-2.5 py-1 rounded-md border border-zinc-300/20">#2</span> :
                                                 rank === 3 ? <span className="text-amber-600 bg-amber-600/10 px-2.5 py-1 rounded-md border border-amber-600/20">#3</span> :
                                                 <span className="text-zinc-600">#{rank}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Foto Produk Mini */}
                                                    <div className="shrink-0 w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden relative group-hover:border-zinc-700 transition-colors">
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
                                                            <Package size={18} className="text-zinc-700" />
                                                        )}
                                                    </div>

                                                    {/* Nama & Status */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="text-sm font-bold text-zinc-100 group-hover:text-rose-400 transition-colors line-clamp-1">
                                                                {item.product_name}
                                                            </div>
                                                            {item.db_matched && (
                                                                <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-400/10 px-1 py-0.2 rounded border border-emerald-400/20 font-medium shrink-0">
                                                                    Terverifikasi
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
                                                            {item.category && item.category !== 'Uncategorized' && (
                                                                <span className="text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                                                                    {item.category}
                                                                </span>
                                                            )}
                                                            <span>{item.transactions}x Transaksi</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-300">
                                                    <Layers size={12} className="text-rose-500" />
                                                    {item.variant}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {Object.entries(item.platforms).map(([plat, count]) => (
                                                        <span key={plat} className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                                            plat === 'TikTok' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                        }`} title={`${plat}: ${count} orders`}>
                                                            {plat[0]}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                                    {item.quantity} pcs
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-xs text-zinc-400">
                                                Rp {item.total_amount.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 flex justify-between items-center text-sm text-zinc-500 bg-zinc-900/20 shrink-0">
                    <div>
                        Menampilkan <span className="text-zinc-300">{filteredProducts.length}</span> dari <span className="text-zinc-300">{products.length}</span> variasi produk
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
