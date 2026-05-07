import React from 'react';
import { X, Info, Calendar, User, Activity, Database } from 'lucide-react';

export default function AdminActivityDetailModal({ isOpen, onClose, activity }) {
    if (!isOpen || !activity) return null;

    let details = {};
    try {
        details = typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details;
    } catch (e) {
        details = { error: 'Failed to parse details', raw: activity.details };
    }

    const formatKey = (key) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <Activity size={20} className="text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-100">Detail Aktivitas</h3>
                            <p className="text-xs text-zinc-500">ID Aktivitas: #{activity.id}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-950 border border-zinc-800/50 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                <User size={14} className="text-zinc-500" />
                                Admin
                            </div>
                            <p className="text-zinc-100 font-medium">{activity.admin_name || 'System'}</p>
                        </div>
                        <div className="p-4 bg-zinc-950 border border-zinc-800/50 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                <Calendar size={14} className="text-zinc-500" />
                                Waktu
                            </div>
                            <p className="text-zinc-100 font-medium">
                                {new Date(activity.created_at).toLocaleString('id-ID', {
                                    day: '2-digit', month: 'long', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                                })}
                            </p>
                        </div>
                        <div className="p-4 bg-zinc-950 border border-zinc-800/50 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                <Activity size={14} className="text-zinc-500" />
                                Tindakan
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    activity.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                    activity.action === 'UPDATE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}>
                                    {activity.action}
                                </span>
                                <span className="text-zinc-300 font-medium">{activity.entity_type}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-950 border border-zinc-800/50 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                <Database size={14} className="text-zinc-500" />
                                ID Entitas
                            </div>
                            <p className="text-zinc-100 font-mono">{activity.entity_id || '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold px-1">
                            <Info size={14} className="text-zinc-500" />
                            Data Perubahan / Payload
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                            <div className="p-4 overflow-x-auto">
                                {Object.keys(details).length > 0 ? (
                                    <div className="space-y-4">
                                        {Object.entries(details).map(([key, value]) => (
                                            <div key={key} className="border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{formatKey(key)}</p>
                                                <div className="text-sm text-zinc-200 break-words">
                                                    {typeof value === 'object' ? (
                                                        <pre className="mt-1 p-2 bg-zinc-900 rounded text-xs font-mono text-rose-400 overflow-x-auto">
                                                            {JSON.stringify(value, null, 2)}
                                                        </pre>
                                                    ) : (
                                                        <span>{String(value)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-zinc-500 text-sm italic">Tidak ada detail data tambahan.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
