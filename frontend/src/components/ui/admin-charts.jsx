import React from 'react';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Mock Data
export const trafficData = [
  { name: 'Mon', visitors: 4000 },
  { name: 'Tue', visitors: 3000 },
  { name: 'Wed', visitors: 5000 },
  { name: 'Thu', visitors: 2780 },
  { name: 'Fri', visitors: 6890 },
  { name: 'Sat', visitors: 8390 },
  { name: 'Sun', visitors: 9490 },
];

export const userGrowthData = [
  { month: 'Jan', users: 120 },
  { month: 'Feb', users: 250 },
  { month: 'Mar', users: 400 },
  { month: 'Apr', users: 550 },
  { month: 'May', users: 800 },
  { month: 'Jun', users: 1100 },
];

export const subscriberData = [
  { name: 'Week 1', subscribers: 100 },
  { name: 'Week 2', subscribers: 150 },
  { name: 'Week 3', subscribers: 130 },
  { name: 'Week 4', subscribers: 210 },
];

export const externalClicksData = [
  { platform: 'Shopee', clicks: 4500 },
  { platform: 'TikTok Shop', clicks: 3200 },
  { platform: 'Tokopedia', clicks: 1200 },
  { platform: 'Instagram', clicks: 2800 },
];

export const TrafficChart = () => (
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
);

export const UserGrowthChart = () => (
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
);

export const SubscriberChart = () => (
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
);

export const ExternalClicksChart = () => (
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
);
