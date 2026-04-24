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
    const res = await axios.get(import.meta.env.VITE_API_URL + '/api/track/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
        params
    });
    return res.data.data;
}

// Convert date to local YYYY-MM-DD string to avoid timezone bugs
function toLocalDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Helper to generate a range of dates
function getDatesInRange(startDate, endDate) {
    const dateArray = [];
    let currentDate = new Date(startDate);
    // Jika start dan end adalah hari yang sama, reset waktu agar akurat ke tengah malam
    currentDate.setHours(0, 0, 0, 0); 
    const stopDate = new Date(endDate);
    stopDate.setHours(23, 59, 59, 999);

    while (currentDate <= stopDate) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}

function resolveDateRangeObj(dateRange) {
    const today = new Date();
    // Kalau startDate berbentuk string (misal YYYY-MM-DD), akan di-parse ke local date 00:00 jika formatnya 'yyyy/mm/dd'
    // Gunakan 'T00:00:00' atau manual parse agar akurat di Local timezone
    const parseLocalDate = (ds) => {
        const [y, m, d] = ds.split('-');
        return new Date(Number(y), Number(m)-1, Number(d));
    };

    const start = dateRange.startDate ? parseLocalDate(dateRange.startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const end = dateRange.endDate ? parseLocalDate(dateRange.endDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return getDatesInRange(start, end);
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
            const allDates = resolveDateRangeObj(dateRange);
            const dailyMap = {};
            (stats?.daily_visits || []).forEach(row => {
                const d = new Date(row.date);
                dailyMap[toLocalDateStr(d)] = Number(row.count);
            });

            const formatted = allDates.map(dateObj => {
                const dateKey = toLocalDateStr(dateObj);
                return {
                    name: dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
                    visitors: dailyMap[dateKey] || 0
                };
            });
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

/** User Growth — jumlah registrasi dari tabel users per hari (sesuai date range) */
export const UserGrowthChart = ({ dateRange = {} }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchStats(dateRange).then(stats => {
            const allDates = resolveDateRangeObj(dateRange);
            const dailyMap = {};
            (stats?.user_growth || []).forEach(row => {
                const d = new Date(row.date);
                dailyMap[toLocalDateStr(d)] = Number(row.count);
            });

            const formatted = allDates.map(dateObj => {
                const dateKey = toLocalDateStr(dateObj);
                return {
                    name: dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
                    registrations: dailyMap[dateKey] || 0
                };
            });
            setData(formatted);
        }).catch(console.error).finally(() => setLoading(false));
    }, [dateRange.startDate, dateRange.endDate]);

    return (
        <ChartWrapper title="User Growth" subtitle="Resgistrasi Harian" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }} />
                    <Line type="monotone" dataKey="registrations" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
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
            const allDates = resolveDateRangeObj(dateRange);
            const dailyMap = {};
            
            (stats?.daily_clicks || []).forEach(row => {
                const d = new Date(row.date);
                dailyMap[toLocalDateStr(d)] = {
                    Shopee: Number(row.shopee) || 0,
                    TikTok: Number(row.tiktok) || 0
                };
            });

            const formatted = allDates.map(dateObj => {
                const dateKey = toLocalDateStr(dateObj);
                const dayData = dailyMap[dateKey] || { Shopee: 0, TikTok: 0 };
                return {
                    name: dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
                    Shopee: dayData.Shopee,
                    TikTok: dayData.TikTok,
                };
            });
            
            setData(formatted);
        }).catch(console.error).finally(() => setLoading(false));
    }, [dateRange.startDate, dateRange.endDate]);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col pb-3">
            <h3 className="text-base font-medium text-zinc-100 mb-4">
                Klik Toko Eksternal <span className="text-zinc-500 text-sm font-normal ml-1">(Per Hari)</span>
            </h3>
            <div className="h-[280px] w-full ">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-zinc-600" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', paddingTop: '10px' }} />
                            <Bar dataKey="Shopee" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} />
                            <Bar dataKey="TikTok" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

