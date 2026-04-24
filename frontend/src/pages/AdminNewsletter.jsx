import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Users, RefreshCw, FileDown, Trash2 } from 'lucide-react';
import { useConfirm } from '../lib/confirm-dialog';
import { notify } from '../lib/toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminNewsletter() {
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({ total: 0, monthlyStats: [] });
    const [loading, setLoading] = useState(true);
    const confirm = useConfirm();

    const fetchNewsletterData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [subsRes, statsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/newsletter`, { headers }),
                axios.get(`${import.meta.env.VITE_API_URL}/api/newsletter/stats`, { headers })
            ]);

            setSubscribers(subsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching newsletter data:', error);
            notify.error('Gagal memuat data newsletter.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewsletterData();
    }, []);

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Hapus Subscriber',
            message: 'Yakin ingin menghapus subscriber ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal'
        });

        if (isConfirmed) {
            try {
                const loadingToastId = notify.loading('Menghapus subscriber...');
                const token = localStorage.getItem('token');
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/newsletter/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                notify.update(loadingToastId, { render: 'Subscriber berhasil dihapus.', type: 'success', isLoading: false, autoClose: 3000 });
                fetchNewsletterData();
            } catch (error) {
                notify.error('Gagal menghapus subscriber.');
            }
        }
    };

    const handleExport = async (format) => {
        try {
            const loadingToastId = notify.loading(`Menyiapkan file export ${format.toUpperCase()}...`);
            const response = await axios.get(import.meta.env.VITE_API_URL + `/api/newsletter/export/${format}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = format === 'excel' ? 'xlsx' : format;
            link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            notify.update(loadingToastId, { render: `Berhasil mengekspor data ke ${format.toUpperCase()}!`, type: 'success', isLoading: false, autoClose: 3000 });
        } catch (error) {
            notify.error("Gagal mengekspor data. Pastikan server berjalan dengan baik.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <Mail className="text-rose-500" />
                        Manajemen Newsletter
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Kelola daftar email pelanggan dan pantau pertumbuhan.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <button 
                        onClick={() => handleExport('csv')} 
                        disabled={subscribers.length === 0} 
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 ${subscribers.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20'}`}
                    >
                        <FileDown size={16} /><span>CSV</span>
                    </button>
                    <button 
                        onClick={() => handleExport('excel')} 
                        disabled={subscribers.length === 0} 
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 ${subscribers.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}
                    >
                        <FileDown size={16} /><span>Excel</span>
                    </button>
                    <button 
                        onClick={() => handleExport('pdf')} 
                        disabled={subscribers.length === 0} 
                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shrink-0 ${subscribers.length === 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20'}`}
                    >
                        <FileDown size={16} /><span>PDF</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-zinc-400 mb-2">
                        <Users className="w-5 h-5 text-rose-500" />
                        <span className="font-medium text-sm uppercase tracking-wider">Total Subscriber</span>
                    </div>
                    <div className="text-4xl font-bold text-white">
                        {stats.total.toLocaleString('id-ID')}
                    </div>
                </div>

                <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6 h-[200px] flex flex-col">
                    <span className="text-zinc-400 font-medium text-sm uppercase tracking-wider mb-4 block">Pertumbuhan Bulanan</span>
                    <div className="flex-1 w-full min-h-0">
                        {stats.monthlyStats && stats.monthlyStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.monthlyStats}>
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#52525b" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="#52525b" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        allowDecimals={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px' }}
                                        itemStyle={{ color: '#f43f5e' }}
                                    />
                                    <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                                Data belum cukup untuk grafik
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium">Alamat Email</th>
                                <th className="p-4 font-medium">Status Pengguna</th>
                                <th className="p-4 font-medium">Tanggal Berlangganan</th>
                                <th className="p-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {subscribers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-zinc-500">
                                        Tidak ada subscriber ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((sub) => (
                                    <tr key={sub.newsletter_id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4 text-zinc-200">
                                            {sub.email}
                                        </td>
                                        <td className="p-4">
                                            {sub.user_name ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    Terdaftar
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                                    Tamu
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-zinc-400 text-sm">
                                            {new Date(sub.created_at).toLocaleDateString('id-ID', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(sub.newsletter_id)}
                                                className="text-zinc-500 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-zinc-800"
                                                title="Hapus Subscriber"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
