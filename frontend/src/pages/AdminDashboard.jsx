import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, RefreshCw, CalendarDays } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminSidebar, { navigationItems } from '../components/ui/admin-sidebar';
import DateRangePickerModal from '../components/ui/DateRangePickerModal';

import AdminProducts from './AdminProducts';
import AdminCollections from './AdminCollections';
import AdminCategories from './AdminCategories';
import AdminMaterial from './AdminMaterial';
import AdminMessages from './AdminMessages';
import AdminChats from './AdminChats';
import AdminNewsletter from './AdminNewsletter';
import SystemSettings from './SystemSettings';
import AdminEndorsements from './AdminEndorsements';
import AdminProfile from './AdminProfile';

import { DashboardSummaryCards } from '../components/ui/admin-summary-cards';
import { TrafficChart, UserGrowthChart, SubscriberChart, ExternalClicksChart } from '../components/ui/admin-charts';
import AdminGeographicMap from '../components/ui/AdminGeographicMapV2';
import AdminActivityLog from '../components/ui/AdminActivityLog';
import TopProductsTable from '../components/ui/TopProductsTable';
import SyncEcommerceModal from '../components/ui/SyncEcommerceModal';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

    useEffect(() => {
        const handleUserUpdate = () => {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'));
        };
        window.addEventListener('userProfileUpdated', handleUserUpdate);
        return () => window.removeEventListener('userProfileUpdated', handleUserUpdate);
    }, []);
    const [preset, setPreset] = useState('7d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Calculate dateRange based on preset or custom range
    const getDateRange = () => {
        const today = new Date();
        const fmt = (d) => d.toISOString().split('T')[0];
        if (preset === 'today') {
            return { startDate: fmt(today), endDate: fmt(today) };
        } else if (preset === '7d') {
            const s = new Date(today); s.setDate(s.getDate() - 6);
            return { startDate: fmt(s), endDate: fmt(today) };
        } else if (preset === '30d') {
            const s = new Date(today); s.setDate(s.getDate() - 29);
            return { startDate: fmt(s), endDate: fmt(today) };
        } else if (preset === 'custom' && customStart && customEnd) {
            return { startDate: customStart, endDate: customEnd };
        }
        return {};
    };
    const dateRange = getDateRange();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    
    useEffect(() => {
        const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [activeTab, setActiveTab] = useState('home');
    

    // Sinkronisasi E-Commerce state
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);
    
    // Auto-open sync modal on mount
    useEffect(() => {
        setIsSyncModalOpen(true);
    }, []);

    const handleSyncEcommerce = async () => {
        setIsSyncing(true);
        toast.info(t('admin_dashboard.sync_starting'));
        try {
            const response = await axios.post(import.meta.env.VITE_API_URL + '/api/settings/sync-ecommerce');
            if (response.data.success) {
                toast.success(t('admin_dashboard.sync_success'));
                setMapRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error(error);
            toast.error(t('admin_dashboard.sync_error'));
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-zinc-800 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" dangerouslySetInnerHTML={{ __html: t('admin_dashboard.title') }}></h1>
                    <p className="text-zinc-400 text-sm mt-1">{t('admin_dashboard.desc')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setIsSyncModalOpen(true)} 
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs rounded-md transition-colors disabled:opacity-50 shadow-lg shadow-rose-900/20"
                    >
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                        <span>{isSyncing ? t('admin_dashboard.syncing') : t('admin_dashboard.sync_ecommerce')}</span>
                    </button>

                    <SyncEcommerceModal 
                        isOpen={isSyncModalOpen} 
                        onClose={() => setIsSyncModalOpen(false)}
                        onSyncComplete={() => setMapRefreshTrigger(prev => prev + 1)}
                    />
                    
                    {/* Preset buttons */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-1 flex">
                        {[['today', t('admin_dashboard.today')], ['7d', t('admin_dashboard.days_7')], ['30d', t('admin_dashboard.days_30')]].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => { setPreset(key); setIsPickerOpen(false); }}
                                className={`px-3 py-1 text-xs rounded-sm transition-colors ${
                                    preset === key && !isPickerOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            onClick={() => setIsPickerOpen(true)}
                            className={`px-3 py-1 text-xs rounded-sm transition-all flex items-center gap-1.5 ${
                                preset === 'custom' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <CalendarDays size={12} />
                            {preset === 'custom' && customStart && customEnd
                                ? `${customStart} — ${customEnd}`
                                : t('admin_dashboard.select_date')
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Date Range Modal */}
            {isPickerOpen && (
                <DateRangePickerModal
                    initialStart={customStart}
                    initialEnd={customEnd}
                    onApply={({ startDate, endDate }) => {
                        setCustomStart(startDate);
                        setCustomEnd(endDate);
                        setPreset('custom');
                    }}
                    onClose={() => setIsPickerOpen(false)}
                />
            )}

            <DashboardSummaryCards dateRange={dateRange} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrafficChart dateRange={dateRange} />
                <UserGrowthChart dateRange={dateRange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <SubscriberChart dateRange={dateRange} />
                    <ExternalClicksChart dateRange={dateRange} />
                </div>
                <div className="lg:col-span-2">
                    <AdminGeographicMap refreshTrigger={mapRefreshTrigger} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="w-full">
                    <AdminActivityLog />
                </div>
                <div className="w-full">
                    <TopProductsTable refreshTrigger={mapRefreshTrigger} />
                </div>
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
            case 'endorsements':
                return <AdminEndorsements />;
            case 'chats':
                return <AdminChats />;
            case 'messages':
                return <AdminMessages />;
            case 'newsletter':
                return <AdminNewsletter />;
            case 'settings':
                return <SystemSettings />;
            case 'profile':
                return <AdminProfile />;
            default:
                return (
                    <div className="flex items-center justify-center h-[70vh] animate-in fade-in duration-500">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-2 capitalize">{t('admin_dashboard.page_not_available')}</h2>
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
                        className="text-zinc-400 hover:text-white transition-all duration-300 p-2 rounded-md hover:bg-zinc-800/50 mr-4"
                    >
                        <Menu size={24} className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-90' : 'rotate-0'}`} />
                    </button>
                    <div className="text-sm text-zinc-500 font-medium">
                        {t('admin_sidebar.administrator')} / <span className="text-zinc-300 capitalize">{activeTab === 'profile' ? t('admin_sidebar.admin_profile') : t(navigationItems.find(item => item.id === activeTab)?.labelKey)}</span>
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
