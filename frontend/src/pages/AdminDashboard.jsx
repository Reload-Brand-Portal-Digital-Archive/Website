import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar, { navigationItems } from '../components/ui/admin-sidebar';

import AdminProducts from './AdminProducts';
import AdminCollections from './AdminCollections';
import AdminCategories from './AdminCategories';
import AdminMaterial from './AdminMaterial';
import AdminMessages from './AdminMessages';
import AdminNewsletter from './AdminNewsletter';
import AdminSettings from './AdminSettings';

import { DashboardSummaryCards } from '../components/ui/admin-summary-cards';
import { TrafficChart, UserGrowthChart, SubscriberChart, ExternalClicksChart } from '../components/ui/admin-charts';
import AdminGeographicMap from '../components/ui/admin-map';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [timeRange, setTimeRange] = useState('7d');
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('home');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-zinc-800 gap-4">
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
                </div>
            </div>

            <DashboardSummaryCards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrafficChart />
                <UserGrowthChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <SubscriberChart />
                    <ExternalClicksChart />
                </div>
                <AdminGeographicMap />
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return renderDashboard();
            case 'products':
                return <AdminProducts />;
            case 'collections':
                return <AdminCollections />;
            case 'categories':
                return <AdminCategories />;
            case 'materials':
                return <AdminMaterial />;
            case 'messages':
                return <AdminMessages />;
            case 'newsletter':
                return <AdminNewsletter />;
            case 'settings':
                return <AdminSettings />;
            default:
                return (
                    <div className="flex items-center justify-center h-[70vh] animate-in fade-in duration-500">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-2 capitalize">Halaman Belum Tersedia</h2>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-50 font-sans flex overflow-hidden">
            
            <AdminSidebar 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen}
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                user={user}
                handleLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col h-screen min-w-0 bg-zinc-950 transition-all duration-300">
                <header className="h-16 flex items-center px-4 md:px-8 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm shrink-0">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-zinc-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800/50 mr-4"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="text-sm text-zinc-500 font-medium">
                        Administrator / <span className="text-zinc-300 capitalize">{navigationItems.find(item => item.id === activeTab)?.label}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {renderContent()}
                    </div>
                </div>
            </main>
            
        </div>
    );
}

