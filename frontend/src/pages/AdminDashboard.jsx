import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, UserPlus, Mail, MousePointerClick, TrendingUp } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Mock Data for Charts
const trafficData = [
  { name: 'Mon', visitors: 4000 },
  { name: 'Tue', visitors: 3000 },
  { name: 'Wed', visitors: 5000 },
  { name: 'Thu', visitors: 2780 },
  { name: 'Fri', visitors: 6890 },
  { name: 'Sat', visitors: 8390 },
  { name: 'Sun', visitors: 9490 },
];

const userGrowthData = [
  { month: 'Jan', users: 120 },
  { month: 'Feb', users: 250 },
  { month: 'Mar', users: 400 },
  { month: 'Apr', users: 550 },
  { month: 'May', users: 800 },
  { month: 'Jun', users: 1100 },
];

const subscriberData = [
  { name: 'Week 1', subscribers: 100 },
  { name: 'Week 2', subscribers: 150 },
  { name: 'Week 3', subscribers: 130 },
  { name: 'Week 4', subscribers: 210 },
];

const externalClicksData = [
  { platform: 'Shopee', clicks: 4500 },
  { platform: 'TikTok Shop', clicks: 3200 },
  { platform: 'Tokopedia', clicks: 1200 },
  { platform: 'Instagram', clicks: 2800 },
];

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map Markers (Indonesia focus as example)
const markers = [
  { markerOffset: -15, name: "Jakarta", coordinates: [106.8456, -6.2088] },
  { markerOffset: -15, name: "Surabaya", coordinates: [112.7521, -7.2504] },
  { markerOffset: 25, name: "Medan", coordinates: [98.6722, 3.5952] },
  { markerOffset: -15, name: "Bandung", coordinates: [107.6191, -6.9175] },
  { markerOffset: 25, name: "Bali", coordinates: [115.1889, -8.4095] }
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [timeRange, setTimeRange] = useState('7d');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Summary Card Component
    const SummaryCard = ({ title, value, icon: Icon, trend, trendValue }) => (
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

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-zinc-800 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin <span className="text-zinc-500 font-light">Dashboard</span></h1>
                    <p className="text-zinc-400 text-sm mt-1">Ringkasan statistik performa website RELOAD.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-1 flex">
                        <button onClick={() => setTimeRange('today')} className={`px-3 py-1 text-xs rounded-sm transition-colors ${timeRange === 'today' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>Hari ini</button>
                        <button onClick={() => setTimeRange('7d')} className={`px-3 py-1 text-xs rounded-sm transition-colors ${timeRange === '7d' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>7 Hari</button>
                        <button onClick={() => setTimeRange('30d')} className={`px-3 py-1 text-xs rounded-sm transition-colors ${timeRange === '30d' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>30 Hari</button>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <SummaryCard 
                        title="Total Pengunjung" 
                        value="39,450" 
                        icon={Users} 
                        trend={true} 
                        trendValue="+12.5%" 
                    />
                    <SummaryCard 
                        title="Akun Terdaftar" 
                        value="2,650" 
                        icon={UserPlus} 
                        trend={true} 
                        trendValue="+5.2%" 
                    />
                    <SummaryCard 
                        title="Subscriber Newsletter" 
                        value="845" 
                        icon={Mail} 
                        trend={true} 
                        trendValue="+18.1%" 
                    />
                    <SummaryCard 
                        title="Klik Link Eksternal" 
                        value="11,700" 
                        icon={MousePointerClick} 
                        trend={true} 
                        trendValue="+24.8%" 
                    />
                </div>

                {/* 2. Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Traffic chart */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-zinc-100 mb-6">Traffic Visitors <span className="text-zinc-500 text-sm font-normal ml-2">(Page Views)</span></h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trafficData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* User Growth Chart */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-zinc-100 mb-6">User Growth <span className="text-zinc-500 text-sm font-normal ml-2">(Akun Terdaftar)</span></h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={userGrowthData}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                    <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }}
                                    />
                                    <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* 3. Secondary Charts & Geographic Map */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Newsletter and External Clicks (Stacked/Bar) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Subscriber Trend */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="text-base font-medium text-zinc-100 mb-4">Subscriber Trend</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subscriberData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                        <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: '#27272a' }}
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }}
                                        />
                                        <Bar dataKey="subscribers" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* External Clicks */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="text-base font-medium text-zinc-100 mb-4">External Link Clicks</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={externalClicksData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
                                        <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} hide/>
                                        <YAxis dataKey="platform" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: '#27272a' }}
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }}
                                        />
                                        <Bar dataKey="clicks" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Geographic Map Distribution */}
                    <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col">
                        <h3 className="text-lg font-medium text-zinc-100 mb-2">Distribusi Pengunjung <span className="text-zinc-500 text-sm font-normal ml-2">(Demografi)</span></h3>
                        <p className="text-sm text-zinc-400 mb-6">Sebaran traffic berdasarkan wilayah/negara.</p>
                        
                        <div className="flex-1 w-full bg-zinc-950/50 rounded-md border border-zinc-800/50 overflow-hidden flex items-center justify-center relative">
                            {/* To run this map properly, ensure you have internet access to fetch the JSON topology */}
                            <ComposableMap
                                projectionConfig={{ scale: 140 }}
                                width={800}
                                height={400}
                                style={{ width: "100%", height: "auto" }}
                            >
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                    geographies.map((geo) => (
                                        <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#27272a"
                                        stroke="#3f3f46"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#3f3f46", outline: "none" },
                                            pressed: { fill: "#52525b", outline: "none" },
                                        }}
                                        />
                                    ))
                                    }
                                </Geographies>
                                {markers.map(({ name, coordinates, markerOffset }) => (
                                    <Marker key={name} coordinates={coordinates}>
                                        <circle r={4} fill="#f43f5e" stroke="#fff" strokeWidth={1.5} />
                                        <text
                                            textAnchor="middle"
                                            y={markerOffset}
                                            style={{ fontFamily: "system-ui", fill: "#a1a1aa", fontSize: "10px", fontWeight: "bold" }}
                                        >
                                            {name}
                                        </text>
                                    </Marker>
                                ))}
                            </ComposableMap>
                            
                            <div className="absolute bottom-4 left-4 bg-zinc-900/90 p-3 rounded border border-zinc-800 text-xs text-zinc-300">
                                <ul>
                                    <li className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Jakarta (45%)</li>
                                    <li className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Surabaya (20%)</li>
                                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Lainnya (35%)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}