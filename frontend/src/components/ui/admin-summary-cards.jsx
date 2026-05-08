import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, MousePointerClick, TrendingUp, Loader2 } from 'lucide-react';
import axios from 'axios';

export const SummaryCard = ({ title, value, icon: Icon, trend, trendValue, loading }) => (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-zinc-400 text-sm font-medium mb-1">{title}</h3>
                {loading ? (
                    <Loader2 size={24} className="animate-spin text-zinc-600 mt-1" />
                ) : (
                    <p className="text-3xl font-bold text-zinc-50">{value}</p>
                )}
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-md text-zinc-300 group-hover:text-white group-hover:bg-zinc-800 transition-colors">
                <Icon size={24} />
            </div>
        </div>
        {trend && !loading && (
            <div className="flex items-center text-xs mt-4">
                <TrendingUp size={14} className="text-emerald-500 mr-1" />
                <span className="text-emerald-500 font-medium">{trendValue}</span>
                <span className="text-zinc-500 ml-2">vs previous period</span>
            </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-800 to-zinc-900 group-hover:from-zinc-600 transition-colors" />
    </div>
);

export const DashboardSummaryCards = ({ dateRange = {} }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            try {
                const params = {};
                if (dateRange.startDate) params.startDate = dateRange.startDate;
                if (dateRange.endDate) params.endDate = dateRange.endDate;
                const response = await axios.get(import.meta.env.VITE_API_URL + '/api/track/stats', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params
                });
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch tracking stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dateRange.startDate, dateRange.endDate]);

    const shopeeClicks = stats?.platform_clicks?.find(p => p.platform === 'shopee')?.count || 0;
    const tiktokClicks = stats?.platform_clicks?.find(p => p.platform === 'tiktok')?.count || 0;
    const totalClicks = shopeeClicks + tiktokClicks;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <SummaryCard
                title="Total Page Views"
                value={loading ? '-' : Number(stats?.total_views || 0).toLocaleString('en-US')}
                icon={Users}
                trend={false}
                loading={loading}
            />
            <SummaryCard
                title="Shopee Clicks"
                value={loading ? '-' : Number(shopeeClicks).toLocaleString('en-US')}
                icon={MousePointerClick}
                trend={false}
                loading={loading}
            />
            <SummaryCard
                title="TikTok Shop Clicks"
                value={loading ? '-' : Number(tiktokClicks).toLocaleString('en-US')}
                icon={MousePointerClick}
                trend={false}
                loading={loading}
            />
            <SummaryCard
                title="Total External Clicks"
                value={loading ? '-' : Number(totalClicks).toLocaleString('en-US')}
                icon={MousePointerClick}
                trend={false}
                loading={loading}
            />
        </div>
    );
};
