import React, { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Filter, Activity, RefreshCw, Eye } from 'lucide-react';
import axios from 'axios';

export default function AdminActivityLogModal({ isOpen, onClose, onSelectActivity }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async (p = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/activity-logs?page=${p}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setLogs(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs(page);
        }
    }, [isOpen, page]);

    if (!isOpen) return null;

    const filteredLogs = logs.filter(log => {
        const adminName = log.admin_name || '';
        const entityType = log.entity_type || '';
        const action = log.action || '';
        
        return adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
               action.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <Activity size={24} className="text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">Log Aktivitas Admin</h2>
                            <p className="text-sm text-zinc-500">Menampilkan riwayat perubahan sistem oleh administrator.</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari admin, entitas, atau tindakan..." 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fetchLogs(page)}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="h-8 w-px bg-zinc-800 mx-2 hidden md:block" />
                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                            <button 
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="p-1.5 text-zinc-500 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-xs font-medium text-zinc-400 px-3">
                                Halaman {page} dari {pagination.totalPages}
                            </span>
                            <button 
                                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-1.5 text-zinc-500 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-zinc-950">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Waktu</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Admin</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tindakan</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Entitas</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <RefreshCw size={32} className="animate-spin text-rose-500 mx-auto mb-4" />
                                        <p className="text-zinc-500">Memuat data log...</p>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <Activity size={48} className="text-zinc-800 mx-auto mb-4 opacity-50" />
                                        <p className="text-zinc-500">Tidak ada log aktivitas yang ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr 
                                        key={log.id} 
                                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        onClick={() => onSelectActivity(log)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-zinc-300 font-medium">
                                                {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                            </div>
                                            <div className="text-[10px] text-zinc-500">
                                                {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">
                                                    {log.admin_name?.substring(0, 2) || 'AD'}
                                                </div>
                                                <span className="text-sm text-zinc-200">{log.admin_name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                                                log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                log.action === 'UPDATE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                            {log.entity_type} <span className="text-zinc-600 ml-1">#{log.entity_id || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button 
                                                className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-between items-center text-sm text-zinc-500 bg-zinc-900/20">
                    <div>
                        Menampilkan <span className="text-zinc-300">{filteredLogs.length}</span> dari <span className="text-zinc-300">{pagination.total}</span> aktivitas
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
