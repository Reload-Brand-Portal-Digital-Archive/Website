import React, { useState, useEffect } from 'react';
import { 
    Activity, MousePointer2, Clock, Globe, 
    BarChart3, List, RefreshCw, AlertCircle,
    ArrowUpRight, Users, ShoppingCart, MessageCircle
} from 'lucide-react';
import axios from 'axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, LineChart, Line,
    AreaChart, Area, Legend
} from 'recharts';

export default function AdminTracking() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        setRefreshing(true);
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/track/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.data);
                setError(null);
            }
        } catch (err) {
            console.error('Failed to fetch tracking stats:', err);
            setError('Failed to load tracking data. Please ensure the backend is running and the page_views & link_clicks tables are available.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <RefreshCw size={32} className="animate-spin text-rose-500" />
                <p className="text-zinc-400 animate-pulse font-mono text-xs uppercase tracking-widest">Initialising Analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-8 text-center max-w-2xl mx-auto mt-10">
                <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Access Error</h3>
                <p className="text-zinc-400 mb-6 font-mono text-sm">{error}</p>
                <button 
                    onClick={fetchStats}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2 mx-auto"
                >
                    <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                    Retry Protocol
                </button>
            </div>
        );
    }

    const shopeeClicks = stats.platform_clicks.find(p => p.platform === 'shopee')?.count || 0;
    const tiktokClicks = stats.platform_clicks.find(p => p.platform === 'tiktok')?.count || 0;
    const totalClicks = shopeeClicks + tiktokClicks;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <Activity className="text-rose-500" /> Web Analytics <span className="text-zinc-600 font-light lowercase">/ native</span>
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">Self-hosted tracking of page inventory views and shop conversion.</p>
                </div>
                <button 
                    onClick={fetchStats}
                    disabled={refreshing}
                    className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-sm transition-all"
                >
                    <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Syncing..." : "Manual Sync"}
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Page Views" 
                    value={stats.total_views} 
                    icon={Users} 
                    trend="Self-hosted" 
                    color="rose"
                />
                <StatCard 
                    title="Shopee Conversions" 
                    value={shopeeClicks} 
                    icon={ShoppingCart} 
                    trend="External Link" 
                    color="orange"
                />
                <StatCard 
                    title="TikTok Conversions" 
                    value={tiktokClicks} 
                    icon={MessageCircle} 
                    trend="External Link" 
                    color="emerald"
                />
                <StatCard 
                    title="Click-Through Rate" 
                    value={stats.total_views > 0 ? `${((totalClicks / stats.total_views) * 100).toFixed(1)}%` : '0%'} 
                    icon={MousePointer2} 
                    trend="Conversion" 
                    color="blue"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Visits Chart */}
                <div className="bg-zinc-900 border border-white/5 rounded-none p-6">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                        [ Visit Archive / 7 Days ]
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.daily_visits}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })} />
                                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0px' }}
                                    itemStyle={{ color: '#f43f5e' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" dot={{ r: 3, fill: '#f43f5e' }} />
                                <Legend verticalAlign="top" height={36}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Conversion Comparison Chart */}
                <div className="bg-zinc-900 border border-white/5 rounded-none p-6">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                        [ Link Clicks / Comparison ]
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.platform_clicks} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="platform" type="category" stroke="#a1a1aa" fontSize={10} width={80} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{ fill: '#18181b' }}
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0px' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                                    {stats.platform_clicks.map((entry, index) => (
                                        <Bar key={`cell-${index}`} fill={entry.platform === 'shopee' ? '#ea580c' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Latest Activities Table */}
            <div className="bg-zinc-900 border border-white/5 rounded-none overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
                        [ SYSTEM LOG / RECENT ]
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-600">LATEST 10 ENTITIES</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-wider font-bold">
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">Identifier</th>
                                <th className="px-6 py-4">Source IP</th>
                                <th className="px-6 py-4 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stats.latest_activities.map((activity, idx) => (
                                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group border-b border-transparent hover:border-zinc-700">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1 h-1 rounded-full ${activity.type === 'page_view' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300">
                                                {activity.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono text-zinc-200">{activity.identifier}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500 font-mono">
                                        {activity.ip_address}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-zinc-500">
                                            <Clock size={10} />
                                            {formatTime(activity.created_at)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, color }) {
    const colorMap = {
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20"
    };

    return (
        <div className="bg-zinc-900 border border-white/5 rounded-none p-5 hover:border-zinc-700 transition-all group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-2">{title}</p>
                    <h4 className="text-2xl font-black text-white tracking-tighter">{value.toLocaleString()}</h4>
                </div>
                <div className={`p-3 border ${colorMap[color] || colorMap.rose}`}>
                    <Icon size={18} />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{trend}</span>
            </div>
        </div>
    );
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
