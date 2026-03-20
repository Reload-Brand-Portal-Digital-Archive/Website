import React from 'react';
import { Users, UserPlus, Mail, MousePointerClick, TrendingUp } from 'lucide-react';

export const SummaryCard = ({ title, value, icon: Icon, trend, trendValue }) => (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-zinc-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-bold text-zinc-50">{value}</p>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-md text-zinc-300 group-hover:text-white group-hover:bg-zinc-800 transition-colors">
                <Icon size={24} />
            </div>
        </div>
        {trend && (
            <div className="flex items-center text-xs mt-4">
                <TrendingUp size={14} className="text-emerald-500 mr-1" />
                <span className="text-emerald-500 font-medium">{trendValue}</span>
                <span className="text-zinc-500 ml-2">vs periode sebelumnya</span>
            </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-800 to-zinc-900 group-hover:from-zinc-600 transition-colors" />
    </div>
);

export const DashboardSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <SummaryCard title="Total Pengunjung" value="39,450" icon={Users} trend={true} trendValue="+12.5%" />
        <SummaryCard title="Akun Terdaftar" value="2,650" icon={UserPlus} trend={true} trendValue="+5.2%" />
        <SummaryCard title="Subscriber Newsletter" value="845" icon={Mail} trend={true} trendValue="+18.1%" />
        <SummaryCard title="Klik Link Eksternal" value="11,700" icon={MousePointerClick} trend={true} trendValue="+24.8%" />
    </div>
);
