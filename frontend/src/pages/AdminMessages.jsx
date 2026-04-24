import React, { useState, useEffect } from 'react';
import { Package, Search, ChevronRight, X, Phone, Mail, MapPin, Inbox, Calendar, User, CalendarDays } from 'lucide-react';
import DateRangePickerModal from '../components/ui/DateRangePickerModal';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AdminMessages() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [preset, setPreset] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const getDateRange = () => {
        const today = new Date();
        const fmt = (d) => d.toISOString().split('T')[0];
        if (preset === 'today') {
            return { startDate: fmt(today), endDate: fmt(today) };
        } else if (preset === '7d') {
            const s = new Date(today); s.setDate(s.getDate() - 6);
            return { startDate: fmt(s), endDate: fmt(today) };
        } else if (preset === '30d') {
            const s = new Date(today); s.setDate(s.getDate() - 29);
            return { startDate: fmt(s), endDate: fmt(today) };
        } else if (preset === 'custom' && customStart && customEnd) {
            return { startDate: customStart, endDate: customEnd };
        }
        return { startDate: '', endDate: '' };
    };
    const dateRange = getDateRange();
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;
    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const statuses = [
        "Semua",
        "Belum Dibaca",
        "Dibaca",
        "Dalam proses penyiapan barang",
        "Barang siap untuk diambil di gudang",
        "Pesanan selesai"
    ];

    const updatableStatuses = [
        "Dibaca",
        "Dalam proses penyiapan barang",
        "Barang siap untuk diambil di gudang",
        "Pesanan selesai"
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, preset, customStart, customEnd]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axios.get(import.meta.env.VITE_API_URL + '/api/wholesale');
            setOrders(res.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Gagal mengambil data pesanan.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (orderId) => {
        try {
            setIsDetailModalOpen(true);
            setLoadingDetails(true);
            // Calling this endpoint automatically updates "Belum Dibaca" to "Dibaca" in the backend
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wholesale/${orderId}`);
            setSelectedOrder(res.data);
            
            // Silently update local state so the red badge disappears without a full refresh
            setOrders(prev => prev.map(o => o.order_id === orderId && o.status === 'Belum Dibaca' ? { ...o, status: 'Dibaca' } : o));
        } catch (error) {
            console.error('Error fetching details:', error);
            toast.error('Gagal memuat detail pesanan.');
            setIsDetailModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedOrder) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/wholesale/${selectedOrder.order_id}/status`, { status: newStatus });
            setSelectedOrder({ ...selectedOrder, status: newStatus });
            setOrders(prev => prev.map(o => o.order_id === selectedOrder.order_id ? { ...o, status: newStatus } : o));
            toast.success('Status berhasil diperbarui!');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Gagal memperbarui status.');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            (order.name && order.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.order_id && order.order_id.toString().includes(searchTerm));
        const matchesStatus = statusFilter === 'Semua' || order.status === statusFilter;
        
        let matchesDate = true;
        const { startDate, endDate } = dateRange;
        if (startDate || endDate) {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            
            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (orderDate < sDate) matchesDate = false;
            }
            if (endDate && matchesDate) {
                const eDate = new Date(endDate);
                eDate.setHours(0, 0, 0, 0);
                if (orderDate > eDate) matchesDate = false;
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination calculations
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Belum Dibaca': return 'bg-rose-500 text-white font-bold';
            case 'Dibaca': return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
            case 'Dalam proses penyiapan barang': return 'bg-amber-500/10 text-amber-500 border border-amber-500/50';
            case 'Barang siap untuk diambil di gudang': return 'bg-blue-500/10 text-blue-500 border border-blue-500/50';
            case 'Pesanan selesai': return 'bg-emerald-500 text-black font-bold';
            default: return 'bg-zinc-800 text-zinc-400';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pesanan <span className="text-zinc-500 font-light">Grosir</span></h1>
                    <p className="text-zinc-400 text-sm mt-1">Kelola data pemesanan grosir & B2B portal.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                    <div className="flex bg-zinc-950 border border-zinc-700 overflow-hidden w-full md:w-72">
                        <div className="pl-3 py-2 text-zinc-500">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Cari nama pemesan atau ID pesanan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none text-sm text-zinc-200 px-3 py-2 w-full outline-none"
                        />
                    </div>
                    
                    <div className="bg-zinc-950 border border-zinc-700 rounded-md p-1 flex">
                        {[['all', 'Semua'], ['today', 'Hari ini'], ['7d', '7 Hari'], ['30d', '30 Hari']].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => { setPreset(key); setIsPickerOpen(false); }}
                                className={`px-3 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-sm transition-colors ${
                                    preset === key && !isPickerOpen ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            onClick={() => setIsPickerOpen(true)}
                            className={`px-3 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-sm transition-all flex items-center gap-1.5 ${
                                preset === 'custom' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <CalendarDays size={12} />
                            {preset === 'custom' && customStart && customEnd
                                ? `${customStart} — ${customEnd}`
                                : 'Pilih'
                            }
                        </button>
                    </div>
                </div>
                
                <div className="w-full md:w-auto flex items-center gap-3">
                    <span className="text-sm text-zinc-400 whitespace-nowrap min-w-max">Filter Status:</span>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 outline-none w-full cursor-pointer"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            {/* Date Range Modal */}
            {isPickerOpen && (
                <DateRangePickerModal
                    initialStart={customStart}
                    initialEnd={customEnd}
                    onApply={({ startDate, endDate }) => {
                        setCustomStart(startDate);
                        setCustomEnd(endDate);
                        setPreset('custom');
                    }}
                    onClose={() => setIsPickerOpen(false)}
                />
            )}

            <div className="bg-zinc-900 border border-zinc-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <Inbox size={48} className="text-zinc-700 mb-4" />
                        <h3 className="text-lg font-medium text-zinc-300">Belum Ada Pesanan</h3>
                        <p className="text-sm text-zinc-500 mt-1">Data pesanan grosir tidak ditemukan berdasarkan pencarian Anda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider font-mono">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Order ID</th>
                                    <th className="px-5 py-4 font-medium">Tanggal</th>
                                    <th className="px-5 py-4 font-medium">Nama / Tipe Konten</th>
                                    <th className="px-5 py-4 font-medium">Status</th>
                                    <th className="px-5 py-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {currentOrders.map(order => (
                                    <tr key={order.order_id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-5 py-4 text-zinc-200 font-mono text-xs">#{order.order_id}</td>
                                        <td className="px-5 py-4 text-zinc-400">
                                            {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-zinc-100 font-medium">{order.name}</span>
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{order.inquiry_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex px-2 py-1 text-[10px] uppercase font-mono tracking-widest ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button 
                                                onClick={() => handleViewOrder(order.order_id)}
                                                className="inline-flex items-center gap-1 bg-white text-zinc-950 hover:bg-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                                            >
                                                <span>Detail</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                                Menampilkan <span className="font-bold text-zinc-200">{indexOfFirstOrder + 1}</span> - <span className="font-bold text-zinc-200">{Math.min(indexOfLastOrder, filteredOrders.length)}</span> dari <span className="font-bold text-zinc-200">{filteredOrders.length}</span> data
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 text-zinc-500 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-800 hover:text-white focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`relative inline-flex items-center px-3 py-2 text-xs font-semibold focus:z-20 focus:outline-offset-0 transition-colors ${
                                            currentPage === i + 1 
                                            ? 'bg-rose-600 text-white z-10' 
                                            : 'text-zinc-400 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-800 hover:text-white'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 text-zinc-500 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-800 hover:text-white focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
                        <button 
                            onClick={() => setIsDetailModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 p-1 rounded-none z-10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        {loadingDetails || !selectedOrder ? (
                            <div className="p-16 flex flex-col items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-4"></div>
                                <span className="text-zinc-400 font-mono uppercase text-xs tracking-widest">Loading Details...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 md:p-8 border-b border-zinc-800 overflow-y-auto">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                                        <div>
                                            <span className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">Order #{selectedOrder.order_id}</span>
                                            <h2 className="text-2xl font-bold uppercase tracking-tight mt-1 mb-2">{selectedOrder.name}</h2>
                                            <span className={`inline-flex px-3 py-1 text-[11px] uppercase font-mono tracking-widest ${getStatusStyles(selectedOrder.status)}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col md:items-end gap-1">
                                            <label className="text-[10px] font-mono text-zinc-500 uppercase">Update Status Pesanan Saat Ini:</label>
                                            <select 
                                                value={selectedOrder.status}
                                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                                className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm px-4 py-2 outline-none cursor-pointer w-full md:w-64"
                                            >
                                                {updatableStatuses.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-4">Informasi Klien</h3>
                                            
                                            <div className="flex items-start gap-3">
                                                <Mail size={16} className="text-zinc-600 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-mono text-zinc-500">Email Address</p>
                                                    <p className="text-sm text-zinc-200 truncate">{selectedOrder.email}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-3">
                                                <Phone size={16} className="text-zinc-600 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-mono text-zinc-500">Phone Number</p>
                                                    <p className="text-sm text-zinc-200 truncate">{selectedOrder.phone || '-'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-3">
                                                <MapPin size={16} className="text-zinc-600 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-mono text-zinc-500">Alamat Pengiriman</p>
                                                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{selectedOrder.address || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-4">Deskripsi/Tambahan</h3>
                                            <div className="bg-zinc-900 border border-zinc-800 p-4 h-full min-h-[120px]">
                                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">{selectedOrder.inquiry_type}</span>
                                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                    {selectedOrder.message ? selectedOrder.message : <span className="italic text-zinc-600">Tidak ada pesan tambahan.</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-4">Daftar Barang ({selectedOrder.items?.length || 0})</h3>
                                    
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        <div className="border border-zinc-800 overflow-hidden bg-zinc-900/50">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-mono tracking-widest">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">Nama Produk</th>
                                                        <th className="px-4 py-3 font-medium">Size</th>
                                                        <th className="px-4 py-3 font-medium">Quantity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-800/50">
                                                    {selectedOrder.items.map(item => (
                                                        <tr key={item.item_id || item.product_id+item.size} className="hover:bg-zinc-800/20">
                                                            <td className="px-4 py-3 text-zinc-200">
                                                                <span className="font-semibold uppercase truncate inline-block max-w-[200px] md:max-w-[400px]">
                                                                    {item.product_name_snapshot}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-zinc-400">{item.size}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-block px-2 py-0.5 bg-zinc-800 text-white text-xs font-mono">{item.quantity}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                                            <span className="text-zinc-500 text-sm">Tidak ada items yang tersimpan.</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
