import React from 'react';
import { 
    LayoutDashboard, ShoppingBag, ShoppingCart, Layers, 
    MessageSquare, Mail, Settings, Users, LogOut, X, Tag, Palette, Award, ExternalLink, Menu
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

export const navigationItems = [
    { id: 'home', labelKey: 'admin_sidebar.dashboard', icon: LayoutDashboard },
    { id: 'products', labelKey: 'admin_sidebar.product', icon: ShoppingBag },
    { id: 'collections', labelKey: 'admin_sidebar.collection', icon: Layers },
    { id: 'categories', labelKey: 'admin_sidebar.category', icon: Tag },
    { id: 'materials', labelKey: 'admin_sidebar.material', icon: Palette },
    { id: 'endorsements', labelKey: 'admin_sidebar.endorsement', icon: Award },
    { id: 'chats', labelKey: 'admin_sidebar.chats', icon: MessageSquare },
    { id: 'messages', labelKey: 'admin_sidebar.wholesale_order', icon: ShoppingCart },
    { id: 'newsletter', labelKey: 'admin_sidebar.newsletter', icon: Mail },
    { id: 'settings', labelKey: 'admin_sidebar.setting', icon: Settings },
];

import axios from 'axios';
const API = import.meta.env.VITE_API_URL;
import LanguageSwitcher from './LanguageSwitcher';

export default function AdminSidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    activeTab,
    setActiveTab,
    user,
    handleLogout
}) {
    const { t } = useTranslation();
    const [unreadChatsCount, setUnreadChatsCount] = React.useState(0);
    const [unreadWholesaleCount, setUnreadWholesaleCount] = React.useState(0);
    const token = localStorage.getItem('token');

    React.useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await axios.get(`${API}/api/chats/admin/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUnreadChatsCount(res.data.unreadUsers);
            } catch (error) {
                console.error('Error fetching unread chat count', error);
            }
        };
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 10000);
        return () => clearInterval(interval);
    }, [token]);

    React.useEffect(() => {
        const fetchUnreadWholesale = async () => {
            try {
                const res = await axios.get(`${API}/api/wholesale/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setUnreadWholesaleCount(res.data.count);
                }
            } catch (error) {
                console.error('Error fetching unread wholesale count', error);
            }
        };
        fetchUnreadWholesale();
        const interval = setInterval(fetchUnreadWholesale, 10000);
        return () => clearInterval(interval);
    }, [token]);

    return (
        <>
            <div 
                className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside 
                className={`fixed md:relative flex flex-col z-[70] h-screen bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ease-in-out shrink-0 ${
                    isSidebarOpen 
                        ? "w-64 translate-x-0" 
                        : "w-0 md:w-20 -translate-x-full md:translate-x-0"
                }`}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
                    <div className={`font-bold text-xl tracking-wider text-rose-500 transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:opacity-100 md:w-auto md:mx-auto md:text-sm"}`}>
                        {isSidebarOpen ? "RELOAD." : "R."}
                    </div>
                    
                    {isSidebarOpen && (
                        <button 
                            onClick={() => setIsSidebarOpen(false)} 
                            className="md:hidden p-2 text-zinc-400 hover:text-white transition-all duration-300"
                        >
                            <Menu size={20} className="rotate-0" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 flex flex-col gap-2 custom-scrollbar">
                    {/* View Site — opens landing page in new tab */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('admin_sidebar.view_site')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-200 group mb-1"
                    >
                        <ExternalLink size={20} className="shrink-0 group-hover:text-zinc-100 transition-colors" />
                        <span className={`font-medium whitespace-nowrap text-xs tracking-widest uppercase transition-all duration-300 ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden"}`}>
                            {t('admin_sidebar.view_site')}
                        </span>
                    </a>

                    {/* Divider */}
                    <div className={`border-t border-zinc-800 mb-2 ${isSidebarOpen ? "mx-0" : "mx-auto w-6"}`} />

                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative
                                    ${isActive 
                                        ? "bg-rose-500/10 text-rose-500" 
                                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                    }
                                `}
                                title={!isSidebarOpen ? t(item.labelKey) : ""}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-500 rounded-r-md" />
                                )}
                                <Icon size={20} className={`shrink-0 ${isActive ? "text-rose-500" : "group-hover:text-zinc-100 transition-colors"}`} />
                                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden"}`}>
                                    {t(item.labelKey)}
                                </span>                                
                                {!isSidebarOpen && isActive && (
                                    <div className="absolute right-2 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                )}
                                {item.id === 'chats' && unreadChatsCount > 0 && (
                                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100 md:right-1'}`}>
                                        {unreadChatsCount}
                                    </div>
                                )}
                                {item.id === 'messages' && unreadWholesaleCount > 0 && (
                                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100 md:right-1'}`}>
                                        {unreadWholesaleCount > 99 ? '99+' : unreadWholesaleCount}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-zinc-800 p-3 shrink-0 bg-zinc-900 overflow-hidden flex flex-col gap-3">
                    <LanguageSwitcher className={`${isSidebarOpen ? "w-full justify-center" : "w-full justify-center px-0 [&>span]:hidden"}`} />
                    <div className={`flex items-center gap-4 transition-all duration-300 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 overflow-hidden text-left hover:bg-zinc-800 p-1.5 -ml-1.5 rounded-lg transition-all duration-300 cursor-pointer ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"}`}
                            title={t('admin_sidebar.admin_profile')}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeTab === 'profile' ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Users size={16} />
                            </div>
                            <div className="overflow-hidden">
                                <p className={`text-sm font-medium truncate transition-colors ${activeTab === 'profile' ? 'text-rose-500' : 'text-zinc-200'}`}>{user?.name || 'Admin User'}</p>
                                <p className="text-xs text-zinc-500 truncate">{t('admin_sidebar.administrator')}</p>
                            </div>
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className={`flex items-center justify-center p-2 rounded-md transition-all duration-300 text-zinc-500 hover:text-red-500 ${
                                !isSidebarOpen && "w-full"
                            }`}
                            title={t('admin_sidebar.logout')}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

