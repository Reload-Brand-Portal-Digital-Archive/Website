import React, { useState, useEffect } from 'react';
import { Activity, Clock, ChevronRight, RefreshCw, Eye } from 'lucide-react';
import axios from 'axios';
import AdminActivityLogModal from './AdminActivityLogModal';
import AdminActivityDetailModal from './AdminActivityDetailModal';

export default function AdminActivityLog() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);

    const fetchLatestActivities = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/activity-logs?limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setActivities(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch latest activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestActivities();
    }, []);

    const handleViewDetail = (activity) => {
        setSelectedActivity(activity);
        setIsDetailModalOpen(true);
    };

    const handleViewAll = () => {
        setIsLogModalOpen(true);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg shadow-black/20">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <Activity size={18} className="text-rose-500" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Log Aktivitas Admin</h3>
                </div>
                <button 
                    onClick={fetchLatestActivities}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                    title="Refresh"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 min-h-[300px]">
                {loading && activities.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-12">
                        <RefreshCw size={24} className="animate-spin text-zinc-700" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                        <Activity size={40} className="text-zinc-800 mb-3 opacity-50" />
                        <p className="text-sm text-zinc-500">Belum ada aktivitas admin yang tercatat.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {activities.map((activity) => (
                            <div 
                                key={activity.id}
                                className="group p-4 hover:bg-white/[0.02] transition-all cursor-pointer relative"
                                onClick={() => handleViewDetail(activity)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                        activity.action === 'CREATE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                        activity.action === 'UPDATE' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                        'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">
                                                {activity.admin_name || 'System'}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                                <Clock size={10} />
                                                {new Date(activity.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-200 line-clamp-1">
                                            <span className="font-semibold text-zinc-100">{activity.action}</span> {activity.entity_type}
                                            <span className="text-zinc-500 ml-1">#{activity.entity_id || '-'}</span>
                                        </p>
                                    </div>
                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye size={16} className="text-rose-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                <button 
                    onClick={handleViewAll}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                >
                    Lihat Semua
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <AdminActivityLogModal 
                isOpen={isLogModalOpen} 
                onClose={() => setIsLogModalOpen(false)} 
                onSelectActivity={(activity) => {
                    setSelectedActivity(activity);
                    setIsDetailModalOpen(true);
                }}
            />
            <AdminActivityDetailModal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                activity={selectedActivity} 
            />
        </div>
    );
}
