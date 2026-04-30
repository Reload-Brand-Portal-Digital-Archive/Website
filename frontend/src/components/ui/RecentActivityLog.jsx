import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Clock, RefreshCw } from 'lucide-react';
import axios from 'axios';

const PLATFORM_STYLE = {
    shopee: { label: 'Shopee', color: 'text-orange-400 bg-orange-500/10' },
    tiktok: { label: 'TikTok Shop', color: 'text-pink-400 bg-pink-500/10' },
};

export default function RecentActivityLog() {
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/track/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                // Only show link_click events (clicks to Shopee/TikTok)
                const linkClicks = response.data.data.latest_activities
                    .filter(a => a.type === 'link_click');
                setClicks(linkClicks);
            }
        } catch (err) {
            console.error('Failed to fetch clicks:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-rose-500" />
                    Recent Store Clicks
                </h3>
                <button onClick={fetchData} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Refresh">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="p-8 flex justify-center">
                    <RefreshCw size={20} className="animate-spin text-zinc-600" />
                </div>
            ) : clicks.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-sm">
                    No store clicks recorded yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                                <th className="px-5 py-3 text-left font-medium">Platform</th>
                                <th className="px-5 py-3 text-left font-medium">IP Address</th>
                                <th className="px-5 py-3 text-right font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {clicks.map((click, idx) => {
                                const style = PLATFORM_STYLE[click.identifier] || { label: click.identifier, color: 'text-zinc-400 bg-zinc-700/20' };
                                return (
                                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${style.color}`}>
                                                <ShoppingBag size={10} />
                                                {style.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-zinc-500 font-mono text-xs">
                                            {click.ip_address}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="flex items-center justify-end gap-1.5 text-xs text-zinc-500">
                                                <Clock size={11} />
                                                {formatTime(click.created_at)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function formatTime(ts) {
    return new Date(ts).toLocaleString('en-US', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}
