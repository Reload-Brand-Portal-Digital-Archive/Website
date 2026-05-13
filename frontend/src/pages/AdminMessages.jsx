import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, ChevronRight, X, Phone, Mail, MapPin, Inbox, Calendar, CalendarDays, Loader2, ShoppingBag, FolderOpen, Store, ChevronLeft, FileDown, Download, Check, Hash, Clock, TrendingUp, Truck } from 'lucide-react';
import DateRangePickerModal from '../components/ui/DateRangePickerModal';
import axios from 'axios';
import { notify } from '../lib/toast';
import { useTranslation } from 'react-i18next';

export default function AdminMessages() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [updatingStatus, setUpdatingStatus] = useState(false);
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

    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const [selectedStoreGroup, setSelectedStoreGroup] = useState(null);
    const [openedFromStore, setOpenedFromStore] = useState(false);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [exportDateRange, setExportDateRange] = useState('all');
    const [exportCustomStart, setExportCustomStart] = useState('');
    const [exportCustomEnd, setExportCustomEnd] = useState('');
    const [exportSelectedStores, setExportSelectedStores] = useState([]);
    const [exportAllStores, setExportAllStores] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportStoreSearch, setExportStoreSearch] = useState('');

    // DB status values (must match backend) → UI labels
    const STATUS_LABELS = {
        'Belum Dibaca':                       t('admin_messages.status_unread'),
        'Dibaca':                             t('admin_messages.status_read'),
        'Dalam proses penyiapan barang':      t('admin_messages.status_processing'),
        'Barang siap untuk diambil di gudang':t('admin_messages.status_ready'),
        'Pesanan selesai':                    t('admin_messages.status_completed'),
        'pending_discussion':                 t('admin_messages.status_pending_discussion'),
        'in_discussion':                      t('admin_messages.status_in_discussion'),
        'confirmed':                          t('admin_messages.status_confirmed'),
        'rejected':                           t('admin_messages.status_rejected'),
    };

    // Filter options: value = DB key, label = display
    const statuses = [
        { value: 'All',                                  label: t('admin_messages.status_all') },
        { value: 'pending_discussion',                   label: t('admin_messages.status_pending_discussion') },
        { value: 'in_discussion',                        label: t('admin_messages.status_in_discussion') },
        { value: 'confirmed',                            label: t('admin_messages.status_confirmed') },
        { value: 'rejected',                             label: t('admin_messages.status_rejected') },
        { value: 'Belum Dibaca',                         label: t('admin_messages.status_unread') },
        { value: 'Dibaca',                               label: t('admin_messages.status_read') },
        { value: 'Dalam proses penyiapan barang',        label: t('admin_messages.status_processing') },
        { value: 'Barang siap untuk diambil di gudang',  label: t('admin_messages.status_ready') },
        { value: 'Pesanan selesai',                      label: t('admin_messages.status_completed') },
    ];

    const statusGroups = [
        {
            label: "Tahap Diskusi & Keputusan",
            options: [
                { value: 'pending_discussion',                   label: t('admin_messages.status_pending_discussion') },
                { value: 'in_discussion',                        label: t('admin_messages.status_in_discussion') },
                { value: 'confirmed',                            label: t('admin_messages.status_confirmed') },
                { value: 'rejected',                             label: t('admin_messages.status_rejected') }
            ]
        },
        {
            label: "Tahap Pemenuhan (Fulfillment)",
            options: [
                { value: 'Dalam proses penyiapan barang',        label: t('admin_messages.status_processing') },
                { value: 'Barang siap untuk diambil di gudang',  label: t('admin_messages.status_ready') },
                { value: 'Pesanan selesai',                      label: t('admin_messages.status_completed') }
            ]
        }
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, preset, customStart, customEnd]);

    const uniqueStores = useMemo(() => {
        const storeMap = new Map();
        orders.forEach(o => {
            if (o.shop_name && o.shop_name.trim()) {
                const rawName = o.shop_name.trim();
                const key = rawName.toLowerCase();
                if (!storeMap.has(key)) {
                    storeMap.set(key, rawName);
                }
            }
        });
        return Array.from(storeMap.values()).sort((a, b) => a.localeCompare(b));
    }, [orders]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axios.get(import.meta.env.VITE_API_URL + '/api/wholesale', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setOrders(res.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            notify.error(t('admin_messages.failed_load_orders'));
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (orderId) => {
        try {
            setIsDetailModalOpen(true);
            setLoadingDetails(true);
            // Calling this endpoint automatically updates "Belum Dibaca" to "Dibaca" in the backend
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wholesale/${orderId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedOrder(res.data);
            
            // Silently update local state so the red badge disappears without a full refresh
            setOrders(prev => prev.map(o => o.order_id === orderId && o.status === 'Belum Dibaca' ? { ...o, status: 'Dibaca' } : o));
        } catch (error) {
            console.error('Error fetching details:', error);
            notify.error(t('admin_messages.failed_load_details'));
            setIsDetailModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedOrder) return;
        setUpdatingStatus(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/wholesale/${selectedOrder.order_id}/status`, 
                { status: newStatus },
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
            );
            setSelectedOrder({ ...selectedOrder, status: newStatus });
            setOrders(prev => prev.map(o => o.order_id === selectedOrder.order_id ? { ...o, status: newStatus } : o));
            notify.success(t('admin_messages.status_updated'));
        } catch (error) {
            console.error('Error updating status:', error);
            notify.error(t('admin_messages.failed_update_status'));
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleExport = async () => {
        if (exportDateRange === 'custom' && (!exportCustomStart || !exportCustomEnd)) {
            notify.error(t('admin_messages.export_no_data'));
            return;
        }
        setExportLoading(true);
        try {
            const loadingToastId = notify.loading(t('admin_messages.export_preparing', { format: exportFormat.toUpperCase() }));
            const queryParams = new URLSearchParams();
            queryParams.set('dateRange', exportDateRange);
            if (exportDateRange === 'custom') {
                queryParams.set('startDate', exportCustomStart);
                queryParams.set('endDate', exportCustomEnd);
            }
            if (!exportAllStores && exportSelectedStores.length > 0) {
                queryParams.set('stores', exportSelectedStores.join(','));
            } else {
                queryParams.set('stores', 'all');
            }
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/wholesale/export/${exportFormat}?${queryParams.toString()}`,
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    responseType: 'blob'
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = exportFormat === 'excel' ? 'xlsx' : exportFormat;
            link.setAttribute('download', `wholesale_export_${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            notify.update(loadingToastId, { render: t('admin_messages.export_success', { format: exportFormat.toUpperCase() }), type: 'success', isLoading: false, autoClose: 3000 });
            setIsExportModalOpen(false);
        } catch (err) {
            console.error('Export error:', err);
            notify.error(t('admin_messages.export_failed'));
        } finally {
            setExportLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (order.name && order.name.toLowerCase().includes(term)) ||
            (order.order_id && order.order_id.toString().includes(searchTerm)) ||
            (order.shop_name && order.shop_name.toLowerCase().includes(term));
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        
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

    const groupOrdersByStore = (ordersList) => {
        const groups = new Map();
        ordersList.forEach(order => {
            const rawName = order.shop_name ? order.shop_name.trim() : '';
            const key = rawName ? rawName.toLowerCase() : `__individual_${order.order_id}`;
            if (!groups.has(key)) {
                groups.set(key, {
                    storeKey: key,
                    storeName: rawName || null,
                    orders: [],
                    latestOrder: order,
                });
            }
            const group = groups.get(key);
            group.orders.push(order);
            if (new Date(order.created_at) > new Date(group.latestOrder.created_at)) {
                group.latestOrder = order;
            }
        });
        groups.forEach(g => g.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        return Array.from(groups.values()).sort(
            (a, b) => new Date(b.latestOrder.created_at) - new Date(a.latestOrder.created_at)
        );
    };

    const storeGroups = groupOrdersByStore(filteredOrders);

    const indexOfLastGroup = currentPage * ordersPerPage;
    const indexOfFirstGroup = indexOfLastGroup - ordersPerPage;
    const currentGroups = storeGroups.slice(indexOfFirstGroup, indexOfLastGroup);
    const totalPages = Math.ceil(storeGroups.length / ordersPerPage);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'pending_discussion': return 'bg-amber-500/10 text-amber-400 border border-amber-500/40';
            case 'in_discussion':     return 'bg-blue-500/10 text-blue-400 border border-blue-500/40';
            case 'confirmed':         return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold';
            case 'rejected':          return 'bg-rose-500/10 text-rose-400 border border-rose-500/40';
            case 'Belum Dibaca':      return 'bg-rose-500 text-white font-bold';
            case 'Dibaca':            return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
            case 'Dalam proses penyiapan barang':        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/40';
            case 'Barang siap untuk diambil di gudang':  return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40';
            case 'Pesanan selesai':   return 'bg-emerald-500 text-emerald-950 font-bold';
            default: return 'bg-zinc-800 text-zinc-400';
        }
    };

    const getStatusLabel = (status) => STATUS_LABELS[status] || status;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" dangerouslySetInnerHTML={{ __html: t('admin_messages.title') }}></h1>
                    <p className="text-zinc-400 text-sm mt-1">{t('admin_messages.desc')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setExportFormat('csv'); setIsExportModalOpen(true); setExportAllStores(true); setExportSelectedStores([]); setExportStoreSearch(''); }}
                        disabled={orders.length === 0}
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 uppercase tracking-wider ${orders.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}
                    >
                        <FileDown size={16} />
                        <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button
                        onClick={() => { setExportFormat('excel'); setIsExportModalOpen(true); setExportAllStores(true); setExportSelectedStores([]); setExportStoreSearch(''); }}
                        disabled={orders.length === 0}
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 uppercase tracking-wider ${orders.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}
                    >
                        <FileDown size={16} />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={() => { setExportFormat('pdf'); setIsExportModalOpen(true); setExportAllStores(true); setExportSelectedStores([]); setExportStoreSearch(''); }}
                        disabled={orders.length === 0}
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 uppercase tracking-wider ${orders.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}
                    >
                        <FileDown size={16} />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                    <div className="flex bg-zinc-950 border border-zinc-700 overflow-hidden w-full md:w-72 relative">
                        <div className="pl-3 py-2 text-zinc-500">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text"
                            list="wholesale-search-suggestions"
                            placeholder={t('admin_messages.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none text-sm text-zinc-200 px-3 py-2 w-full outline-none"
                            autoComplete="off"
                        />
                        <datalist id="wholesale-search-suggestions">
                            {Array.from(new Set(orders.flatMap(o => [
                                o.shop_name?.trim(),
                                o.name?.trim(),
                                o.order_id?.toString()
                            ]).filter(Boolean))).sort().map(suggestion => (
                                <option key={suggestion} value={suggestion} />
                            ))}
                        </datalist>
                    </div>
                    
                    <div className="bg-zinc-950 border border-zinc-700 rounded-md p-1 flex">
                        {[['all', t('admin_messages.all')], ['today', t('admin_messages.today')], ['7d', t('admin_messages.days_7')], ['30d', t('admin_messages.days_30')]].map(([key, label]) => (
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
                                : t('admin_messages.select')
                            }
                        </button>
                    </div>
                </div>
                
                <div className="w-full md:w-auto flex items-center gap-2">
                    <span className="text-sm text-zinc-400 whitespace-nowrap min-w-max">{t('admin_messages.filter_status')}</span>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 outline-none cursor-pointer"
                    >
                        {statuses.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
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

            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative">
                        <button 
                            onClick={() => setIsExportModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6 border-b border-zinc-800">
                            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                                <FileDown size={20} className="text-emerald-400" />
                                {t('admin_messages.export_title')}
                            </h2>
                            <p className="text-zinc-500 text-xs mt-1">{t('admin_messages.export_desc')}</p>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">{t('admin_messages.export_format')}</label>
                                <div className="flex">
                                    {exportFormat === 'csv' && (
                                        <div className="w-full px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border bg-blue-500/20 text-blue-400 border-blue-500/50 text-center rounded-md">
                                            CSV
                                        </div>
                                    )}
                                    {exportFormat === 'excel' && (
                                        <div className="w-full px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-center rounded-md">
                                            Excel
                                        </div>
                                    )}
                                    {exportFormat === 'pdf' && (
                                        <div className="w-full px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border bg-rose-500/20 text-rose-400 border-rose-500/50 text-center rounded-md">
                                            PDF
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">{t('admin_messages.export_date_range')}</label>
                                <select
                                    value={exportDateRange}
                                    onChange={(e) => setExportDateRange(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm px-3 py-2.5 outline-none cursor-pointer"
                                >
                                    <option value="all">{t('admin_messages.export_date_all')}</option>
                                    <option value="today">{t('admin_messages.export_date_today')}</option>
                                    <option value="last_7_days">{t('admin_messages.export_date_7d')}</option>
                                    <option value="last_30_days">{t('admin_messages.export_date_30d')}</option>
                                    <option value="last_1_year">{t('admin_messages.export_date_1y')}</option>
                                    <option value="custom">{t('admin_messages.export_date_custom')}</option>
                                </select>
                                {exportDateRange === 'custom' && (
                                    <div className="flex gap-3 mt-3">
                                        <div className="flex-1">
                                            <label className="block text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">{t('admin_messages.export_start_date')}</label>
                                            <input
                                                type="date"
                                                value={exportCustomStart}
                                                onChange={(e) => setExportCustomStart(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 outline-none"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">{t('admin_messages.export_end_date')}</label>
                                            <input
                                                type="date"
                                                value={exportCustomEnd}
                                                onChange={(e) => setExportCustomEnd(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">{t('admin_messages.export_stores')}</label>
                                <button
                                    onClick={() => { setExportAllStores(!exportAllStores); if (!exportAllStores) setExportSelectedStores([]); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm border transition-colors mb-2 ${
                                        exportAllStores
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                                    }`}
                                >
                                    <div className={`w-4 h-4 border flex items-center justify-center shrink-0 ${exportAllStores ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'}`}>
                                        {exportAllStores && <Check size={12} className="text-white" />}
                                    </div>
                                    {t('admin_messages.export_all_stores')}
                                </button>

                                {!exportAllStores && (
                                    <div className="border border-zinc-800 bg-zinc-900/50">
                                        <div className="p-2 border-b border-zinc-800">
                                            <div className="flex bg-zinc-950 border border-zinc-700 overflow-hidden">
                                                <div className="pl-2 py-1.5 text-zinc-600"><Search size={14} /></div>
                                                <input
                                                    type="text"
                                                    placeholder={t('admin_messages.export_select_stores')}
                                                    value={exportStoreSearch}
                                                    onChange={(e) => setExportStoreSearch(e.target.value)}
                                                    className="bg-transparent border-none text-xs text-zinc-200 px-2 py-1.5 w-full outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[140px] overflow-y-auto custom-scrollbar">
                                            {uniqueStores.length === 0 ? (
                                                <div className="px-3 py-4 text-center text-zinc-600 text-xs">{t('admin_messages.no_shop_name')}</div>
                                            ) : (
                                                uniqueStores
                                                    .filter(s => !exportStoreSearch || s.toLowerCase().includes(exportStoreSearch.toLowerCase()))
                                                    .map(store => {
                                                        const isSelected = exportSelectedStores.includes(store);
                                                        return (
                                                            <button
                                                                key={store}
                                                                onClick={() => {
                                                                    setExportSelectedStores(prev =>
                                                                        isSelected ? prev.filter(s => s !== store) : [...prev, store]
                                                                    );
                                                                }}
                                                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors border-b border-zinc-800/50 last:border-b-0 ${
                                                                    isSelected ? 'bg-emerald-500/5 text-emerald-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                                                }`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-700'}`}>
                                                                    {isSelected && <Check size={10} className="text-white" />}
                                                                </div>
                                                                <Store size={12} className="shrink-0 text-zinc-600" />
                                                                <span className="truncate">{store}</span>
                                                            </button>
                                                        );
                                                    })
                                            )}
                                        </div>
                                        {exportSelectedStores.length > 0 && (
                                            <div className="px-3 py-2 border-t border-zinc-800 text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest">
                                                {t('admin_messages.export_selected_count', { count: exportSelectedStores.length })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-colors"
                            >
                                {t('admin_messages.export_cancel')}
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exportLoading || (!exportAllStores && exportSelectedStores.length === 0)}
                                className={`px-5 py-2 text-sm font-semibold flex items-center gap-2 uppercase tracking-wider transition-colors ${
                                    exportLoading || (!exportAllStores && exportSelectedStores.length === 0)
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-500'
                                }`}
                            >
                                {exportLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {t('admin_messages.export_download')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <Inbox size={48} className="text-zinc-700 mb-4" />
                        <h3 className="text-lg font-medium text-zinc-300">{t('admin_messages.no_orders')}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{t('admin_messages.no_orders_desc')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider font-mono">
                                <tr>
                                    <th className="px-5 py-4 font-medium">{t('admin_messages.col_shop')}</th>
                                    <th className="px-5 py-4 font-medium">{t('admin_messages.col_order_id')}</th>
                                    <th className="px-5 py-4 font-medium">{t('admin_messages.col_date')}</th>
                                    <th className="px-5 py-4 font-medium">{t('admin_messages.col_name')}</th>
                                    <th className="px-5 py-4 font-medium">{t('admin_messages.col_status')}</th>
                                    <th className="px-5 py-4 font-medium text-center">{t('admin_messages.col_total_qty')}</th>
                                    <th className="px-5 py-4 font-medium text-right">{t('admin_messages.col_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {currentGroups.map(group => {
                                    const order = group.latestOrder;
                                    const hasMultiple = group.orders.length > 1;
                                    return (
                                        <tr 
                                            key={group.storeKey} 
                                            className={`hover:bg-zinc-800/30 transition-colors ${hasMultiple ? 'cursor-pointer' : ''}`}
                                            onClick={() => {
                                                if (hasMultiple) {
                                                    setSelectedStoreGroup(group);
                                                    setIsStoreModalOpen(true);
                                                }
                                            }}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    {hasMultiple ? (
                                                        <FolderOpen size={16} className="text-amber-400 shrink-0" />
                                                    ) : (
                                                        <Store size={16} className="text-zinc-600 shrink-0" />
                                                    )}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`truncate max-w-[140px] ${group.storeName ? 'text-zinc-100 font-medium' : 'text-zinc-500 italic'}`}>
                                                            {group.storeName || t('admin_messages.no_shop_name')}
                                                        </span>
                                                        {hasMultiple && (
                                                            <span className="text-[9px] font-mono text-amber-400/70 uppercase tracking-widest">
                                                                {t('admin_messages.orders_count', { count: group.orders.length })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-zinc-200 font-mono text-xs">#{order.order_id}</td>
                                            <td className="px-5 py-4 text-zinc-400">
                                                {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-100 font-medium">{order.name}</span>
                                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{order.inquiry_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex px-2 py-1 text-[10px] uppercase font-mono tracking-widest ${getStatusStyles(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {Number(order.total_qty) > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-mono text-zinc-200 font-semibold text-sm">{order.total_qty}</span>
                                                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{order.total_items} sku</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {hasMultiple ? (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedStoreGroup(group); setIsStoreModalOpen(true); }}
                                                        className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                                                    >
                                                        <FolderOpen size={13} />
                                                        <span>{group.orders.length}</span>
                                                        <ChevronRight size={14} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setOpenedFromStore(false); handleViewOrder(order.order_id); }}
                                                        className="inline-flex items-center gap-1 bg-white text-zinc-950 hover:bg-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                                                    >
                                                        <span>{t('admin_messages.btn_detail')}</span>
                                                        <ChevronRight size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                            {t('admin_messages.prev')}
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                        >
                            {t('admin_messages.next')}
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                                {t('admin_messages.showing')} <span className="font-bold text-zinc-200">{indexOfFirstGroup + 1}</span> – <span className="font-bold text-zinc-200">{Math.min(indexOfLastGroup, storeGroups.length)}</span> {t('admin_messages.of')} <span className="font-bold text-zinc-200">{storeGroups.length}</span> {t('admin_messages.results')}
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
                        {openedFromStore && selectedStoreGroup && (
                            <button 
                                onClick={() => { setIsDetailModalOpen(false); setIsStoreModalOpen(true); }}
                                className="absolute top-4 left-4 flex items-center gap-1.5 text-amber-400 hover:text-amber-300 bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-mono uppercase tracking-wider z-10 transition-colors"
                            >
                                <ChevronLeft size={14} />
                                {t('admin_messages.back_to_store_list')}
                            </button>
                        )}
                        <button 
                            onClick={() => { setIsDetailModalOpen(false); setOpenedFromStore(false); }}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 p-1 rounded-none z-10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        {loadingDetails || !selectedOrder ? (
                            <div className="p-16 flex flex-col items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-4"></div>
                                <span className="text-zinc-400 font-mono uppercase text-xs tracking-widest">{t('admin_messages.loading_details')}</span>
                            </div>
                        ) : (
                            <div className="p-6 md:p-8 pt-16 md:pt-16 overflow-y-auto custom-scrollbar flex-1">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">{t('admin_messages.order_number', { id: selectedOrder.order_id })}</span>
                                            {selectedOrder.shop_name && (
                                                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest">
                                                    <Store size={10} /> {selectedOrder.shop_name}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">{selectedOrder.name}</h2>
                                        <span className={`inline-flex px-3 py-1 text-[11px] uppercase font-mono tracking-widest ${getStatusStyles(selectedOrder.status)}`}>
                                            {getStatusLabel(selectedOrder.status)}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-mono uppercase tracking-wider">
                                                    {t('admin_messages.detail_created')}: {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {selectedOrder.confirmed_at && (
                                                <div className="flex items-center gap-1.5 text-emerald-500/70">
                                                    <Check size={12} />
                                                    <span className="text-[10px] font-mono uppercase tracking-wider">
                                                        {t('admin_messages.detail_confirmed_at')}: {new Date(selectedOrder.confirmed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end gap-1 shrink-0">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase">{t('admin_messages.update_status')}</label>
                                        <div className="relative">
                                            <select 
                                                value={selectedOrder.status}
                                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                                disabled={updatingStatus}
                                                className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm px-4 py-2 outline-none cursor-pointer w-full md:w-64 disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                                            >
                                                {statusGroups.map((group, idx) => (
                                                    <optgroup key={idx} label={group.label} className="bg-zinc-800 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
                                                        {group.options.map(s => {
                                                            const pastDiscussion = ['confirmed', 'rejected', 'Dalam proses penyiapan barang', 'Barang siap untuk diambil di gudang', 'Pesanan selesai'].includes(selectedOrder.status);
                                                            const isDiscussionOption = s.value === 'pending_discussion' || s.value === 'in_discussion';
                                                            return (
                                                                <option 
                                                                    key={s.value} 
                                                                    value={s.value}
                                                                    disabled={pastDiscussion && isDiscussionOption}
                                                                    className={`text-sm normal-case tracking-normal font-sans ${pastDiscussion && isDiscussionOption ? "text-zinc-600" : "text-zinc-100"}`}
                                                                >
                                                                    {s.label}
                                                                </option>
                                                            );
                                                        })}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            {updatingStatus && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 pointer-events-none">
                                                    <Loader2 size={16} className="animate-spin text-white" />
                                                    <span className="ml-2 text-xs text-zinc-300 font-mono">Saving...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-4">{t('admin_messages.client_info')}</h3>
                                        
                                        <div className="flex items-start gap-3">
                                            <Mail size={16} className="text-zinc-600 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-mono text-zinc-500">{t('admin_messages.email_address')}</p>
                                                <p className="text-sm text-zinc-200 truncate">{selectedOrder.email}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-3">
                                            <Phone size={16} className="text-zinc-600 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-mono text-zinc-500">{t('admin_messages.phone_number')}</p>
                                                <p className="text-sm text-zinc-200 truncate">{selectedOrder.phone || '-'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-3">
                                            <MapPin size={16} className="text-zinc-600 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-mono text-zinc-500">{t('admin_messages.shipping_address')}</p>
                                                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{selectedOrder.address || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-4">{t('admin_messages.detail_order_info')}</h3>
                                        <div className="bg-zinc-900 border border-zinc-800 p-4 min-h-[80px]">
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">{selectedOrder.inquiry_type}</span>
                                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {selectedOrder.message ? selectedOrder.message : <span className="italic text-zinc-600">{t('admin_messages.no_notes')}</span>}
                                            </p>
                                        </div>
                                        {/* Confirmation data */}
                                        {selectedOrder.shipping_cost != null && (
                                            <div className="bg-zinc-900 border border-emerald-500/20 p-3 flex items-center gap-3">
                                                <Truck size={16} className="text-emerald-500 shrink-0" />
                                                <div>
                                                    <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-wider block mb-0.5">{t('admin_messages.shipping_cost')}</span>
                                                    <p className="text-emerald-400 font-semibold">Rp {Number(selectedOrder.shipping_cost).toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedOrder.admin_note && (
                                            <div className="bg-zinc-900 border border-zinc-700 p-3">
                                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">{t('admin_messages.admin_note')}</span>
                                                <p className="text-zinc-300 text-sm">{selectedOrder.admin_note}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-4">{t('admin_messages.items_count', { count: selectedOrder.items?.length || 0 })}</h3>
                                
                                {(() => {
                                    const displayItems = selectedOrder.invoice_items || selectedOrder.items;
                                    const hasPricing = !!selectedOrder.invoice_items;
                                    
                                    if (!displayItems || displayItems.length === 0) {
                                        return (
                                            <div className="border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                                                <span className="text-zinc-500 text-sm">{t('admin_messages.no_items')}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                    <div className="border border-zinc-800 overflow-hidden bg-zinc-900/50">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-mono tracking-widest">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">{t('admin_messages.col_product')}</th>
                                                    <th className="px-4 py-3 font-medium">{t('admin_messages.col_size')}</th>
                                                    <th className="px-4 py-3 font-medium text-center">{t('admin_messages.col_qty')}</th>
                                                    {hasPricing && (
                                                        <>
                                                            <th className="px-4 py-3 font-medium text-right">{t('admin_messages.col_price', 'Harga')}</th>
                                                            <th className="px-4 py-3 font-medium text-right">{t('admin_messages.col_total', 'Total')}</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/50">
                                                {displayItems.map(item => (
                                                    <tr key={item.item_id || item.product_id+item.size} className="hover:bg-zinc-800/20">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {item.product_image ? (
                                                                    <img 
                                                                        src={`${import.meta.env.VITE_API_URL}${item.product_image}`} 
                                                                        alt={item.product_name_snapshot}
                                                                        className="w-10 h-10 object-cover border border-zinc-700 bg-zinc-800 shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                                                        <Package size={14} className="text-zinc-600" />
                                                                    </div>
                                                                )}
                                                                <span className="font-semibold uppercase text-zinc-200 truncate max-w-[160px] md:max-w-[300px]">
                                                                    {item.product_name_snapshot}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-zinc-400">{item.size}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-block px-2 py-0.5 bg-zinc-800 text-white text-xs font-mono">{item.quantity}</span>
                                                        </td>
                                                        {hasPricing && (
                                                            <>
                                                                <td className="px-4 py-3 text-right font-mono text-zinc-300">Rp {Number(item.unit_price || 0).toLocaleString('id-ID')}</td>
                                                                <td className="px-4 py-3 text-right font-mono text-emerald-400">Rp {Number(item.line_total || 0).toLocaleString('id-ID')}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t border-zinc-700 bg-zinc-900">
                                                <tr>
                                                    <td colSpan="2" className="px-4 py-3 text-right text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                                                        {t('admin_messages.detail_total_qty')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-block px-3 py-1 bg-zinc-800 border border-zinc-700 text-white text-sm font-mono font-bold">
                                                            {displayItems.reduce((sum, item) => sum + Number(item.quantity), 0)}
                                                        </span>
                                                    </td>
                                                    {hasPricing && <td colSpan="2"></td>}
                                                </tr>
                                                {hasPricing && (
                                                    <>
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-2 text-right text-[10px] font-mono text-zinc-400 uppercase tracking-widest border-t border-zinc-800">
                                                                {t('admin_messages.detail_subtotal', 'Subtotal')}
                                                            </td>
                                                            <td className="px-4 py-2 text-right font-mono text-zinc-300 border-t border-zinc-800">
                                                                Rp {Number(selectedOrder.subtotal || 0).toLocaleString('id-ID')}
                                                            </td>
                                                        </tr>
                                                        {selectedOrder.shipping_cost != null && (
                                                            <tr>
                                                                <td colSpan={4} className="px-4 py-2 text-right text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                                                                    {t('admin_messages.shipping_cost')}
                                                                </td>
                                                                <td className="px-4 py-2 text-right font-mono text-emerald-400">
                                                                    Rp {Number(selectedOrder.shipping_cost).toLocaleString('id-ID')}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-3 text-right text-[11px] font-mono text-zinc-300 uppercase tracking-widest font-bold">
                                                                {t('admin_messages.store_total_shipping', 'Grand Total')}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold text-base">
                                                                Rp {Number(selectedOrder.grand_total || 0).toLocaleString('id-ID')}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tfoot>
                                        </table>
                                    </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isStoreModalOpen && selectedStoreGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative">
                        <button 
                            onClick={() => setIsStoreModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 p-1 rounded-none z-10 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6 border-b border-zinc-800 shrink-0">
                            <div className="flex items-center gap-3 mb-1">
                                <FolderOpen size={20} className="text-amber-400" />
                                <h2 className="text-xl font-bold tracking-tight">
                                    {t('admin_messages.store_orders_title', { name: selectedStoreGroup.storeName || t('admin_messages.no_shop_name') })}
                                </h2>
                            </div>
                            <p className="text-zinc-500 text-sm mb-4">{t('admin_messages.store_orders_desc')}</p>

                            {(() => {
                                const storeOrders = selectedStoreGroup.orders;
                                const completedOrders = storeOrders.filter(o => o.status === 'Pesanan selesai');
                                const totalQty = storeOrders.reduce((sum, o) => sum + Number(o.total_qty || 0), 0);
                                const totalBelanja = storeOrders
                                    .filter(o => o.grand_total != null)
                                    .reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
                                return (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-zinc-900 border border-zinc-800 p-3 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                                <Check size={14} className="text-emerald-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t('admin_messages.store_completed_count')}</p>
                                                <p className="text-lg font-bold text-zinc-100 font-mono leading-tight">{completedOrders.length}<span className="text-zinc-600 text-xs font-normal ml-1">/ {storeOrders.length}</span></p>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900 border border-zinc-800 p-3 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                <Package size={14} className="text-blue-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t('admin_messages.store_total_qty')}</p>
                                                <p className="text-lg font-bold text-zinc-100 font-mono leading-tight">{totalQty}<span className="text-zinc-600 text-xs font-normal ml-1">pcs</span></p>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900 border border-zinc-800 p-3 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                <TrendingUp size={14} className="text-amber-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{t('admin_messages.store_total_shipping')}</p>
                                                <p className="text-lg font-bold text-zinc-100 font-mono leading-tight">
                                                    {totalBelanja > 0 ? `Rp ${totalBelanja.toLocaleString('id-ID')}` : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider font-mono sticky top-0">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">{t('admin_messages.col_order_id')}</th>
                                        <th className="px-5 py-3 font-medium">{t('admin_messages.col_date')}</th>
                                        <th className="px-5 py-3 font-medium">{t('admin_messages.col_name')}</th>
                                        <th className="px-5 py-3 font-medium">{t('admin_messages.col_status')}</th>
                                        <th className="px-5 py-3 font-medium text-center">{t('admin_messages.col_total_qty')}</th>
                                        <th className="px-5 py-3 font-medium text-right">{t('admin_messages.col_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {selectedStoreGroup.orders.map((storeOrder, idx) => (
                                        <tr key={storeOrder.order_id} className={`hover:bg-zinc-800/30 transition-colors ${idx === 0 ? 'bg-amber-500/5' : ''}`}>
                                            <td className="px-5 py-3 text-zinc-200 font-mono text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    #{storeOrder.order_id}
                                                    {idx === 0 && (
                                                        <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 font-mono uppercase tracking-widest border border-amber-500/30">Latest</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-zinc-400 text-xs">
                                                {new Date(storeOrder.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-zinc-200 text-xs">{storeOrder.name}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex px-2 py-0.5 text-[9px] uppercase font-mono tracking-widest ${getStatusStyles(storeOrder.status)}`}>
                                                    {getStatusLabel(storeOrder.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {Number(storeOrder.total_qty) > 0 ? (
                                                    <span className="font-mono text-zinc-300 text-xs">{storeOrder.total_qty}</span>
                                                ) : (
                                                    <span className="text-zinc-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button 
                                                    onClick={() => {
                                                        setOpenedFromStore(true);
                                                        setIsStoreModalOpen(false);
                                                        handleViewOrder(storeOrder.order_id);
                                                    }}
                                                    className="inline-flex items-center gap-1 bg-white text-zinc-950 hover:bg-zinc-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                                                >
                                                    {t('admin_messages.btn_detail')}
                                                    <ChevronRight size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
