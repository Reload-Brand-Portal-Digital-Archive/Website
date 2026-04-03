import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

// Fetch stats with optional date range
async function fetchStats(dateRange = {}) {
    const token = localStorage.getItem('token');
    const params = {};
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    const res = await axios.get('http://localhost:5000/api/track/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
        params
    });
    return res.data.data;
}

function ChartWrapper({ title, subtitle, children, loading }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-zinc-100 mb-6">
                {title} <span className="text-zinc-500 text-sm font-normal ml-2">({subtitle})</span>
            </h3>
            <div className="h-72 w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-zinc-600" />
                    </div>
                ) : children}
            </div>
        </div>
    );
}

/** Traffic Visitors — dari page_views (sesuai date range) */
export const TrafficChart = ({ dateRange = {} }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchStats(dateRange).then(stats => {
            const formatted = (stats?.daily_visits || []).map(row => ({
                name: new Date(row.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
                visitors: Number(row.count)
            }));
            setData(formatted);
        }).catch(console.error).finally(() => setLoading(false));
    }, [dateRange.startDate, dateRange.endDate]);

    return (
        <ChartWrapper title="Traffic Visitors" subtitle="Page Views" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }} />
                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

/** User Growth — dari tabel users (per bulan, dalam date range) */
export const UserGrowthChart = ({ dateRange = {} }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchStats(dateRange).then(stats => {
            // Kumulatif
            let cum = 0;
            const formatted = (stats?.user_growth || []).map(row => {
                cum += Number(row.count);
                return { month: row.month, users: cum };
            });
            setData(formatted);
        }).catch(console.error).finally(() => setLoading(false));
    }, [dateRange.startDate, dateRange.endDate]);

    return (
        <ChartWrapper title="User Growth" subtitle="Akun Terdaftar" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }} />
                    <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

/** Subscriber Chart — placeholder */
export const SubscriberChart = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-base font-medium text-zinc-100 mb-4">Subscriber Trend</h3>
        <div className="h-48 w-full flex items-center justify-center">
            <p className="text-xs text-zinc-600 font-mono">Data newsletter belum tersedia</p>
        </div>
    </div>
);

/** External Clicks — Shopee vs TikTok per hari (sesuai date range) */
export const ExternalClicksChart = ({ dateRange = {} }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchStats(dateRange).then(stats => {
            const formatted = (stats?.daily_clicks || []).map(row => ({
                name: new Date(row.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
                Shopee: Number(row.shopee) || 0,
                TikTok: Number(row.tiktok) || 0,
            }));
            setData(formatted);
        }).catch(console.error).finally(() => setLoading(false));
    }, [dateRange.startDate, dateRange.endDate]);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-base font-medium text-zinc-100 mb-4">
                Klik Toko Eksternal <span className="text-zinc-500 text-sm font-normal ml-1">(Per Hari)</span>
            </h3>
            <div className="h-48 w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-zinc-600" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                            <Bar dataKey="Shopee" fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="TikTok" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
