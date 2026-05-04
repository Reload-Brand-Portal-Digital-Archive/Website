import React from 'react';
import { 
    LayoutDashboard, ShoppingBag, Layers, 
    MessageSquare, Mail, Settings, Users, LogOut, X, Tag, Palette, Award, ExternalLink
} from 'lucide-react';

export const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Product', icon: ShoppingBag },
    { id: 'collections', label: 'Collection', icon: Layers },
    { id: 'categories', label: 'Category', icon: Tag },
    { id: 'materials', label: 'Material', icon: Palette },
    { id: 'endorsements', label: 'Endorsement', icon: Award },
    { id: 'messages', label: 'Wholesale Order', icon: MessageSquare },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'settings', label: 'Setting', icon: Settings },
];

export default function AdminSidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    activeTab,
    setActiveTab,
    user,
    handleLogout
}) {
    return (
        <>
            {!isSidebarOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(true)}
                />
            )}

            <aside 
                className={`fixed md:relative flex flex-col z-50 h-screen bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ease-in-out shrink-0 ${
                    isSidebarOpen ? "w-64 translate-x-0" : "w-0 md:w-20 -translate-x-full md:translate-x-0"
                }`}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
                    <div className={`font-bold text-xl tracking-wider text-rose-500 transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:opacity-100 md:w-auto md:mx-auto md:text-sm"}`}>
                        {isSidebarOpen ? "RELOAD." : "R."}
                    </div>
                    {isSidebarOpen && (
                        <button 
                            onClick={() => setIsSidebarOpen(false)} 
                            className="md:hidden text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 flex flex-col gap-2">
                    {/* View Site — opens landing page in new tab */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View Site"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-200 group mb-1"
                    >
                        <ExternalLink size={20} className="shrink-0 group-hover:text-zinc-100 transition-colors" />
                        <span className={`font-medium whitespace-nowrap text-xs tracking-widest uppercase transition-all duration-300 ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden"}`}>
                            View Site
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
                                title={!isSidebarOpen ? item.label : ""}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-500 rounded-r-md" />
                                )}
                                <Icon size={20} className={`shrink-0 ${isActive ? "text-rose-500" : "group-hover:text-zinc-100 transition-colors"}`} />
                                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden"}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-zinc-800 p-4 shrink-0 overflow-hidden">
                    {isSidebarOpen ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                    <Users size={16} className="text-zinc-400" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-zinc-200 truncate">{user?.name || 'Admin User'}</p>
                                    <p className="text-xs text-zinc-500 truncate">Administrator</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="text-zinc-500 hover:text-red-500 transition-colors p-2 shrink-0"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleLogout}
                            className="w-full flex justify-center text-zinc-500 hover:text-red-500 transition-colors p-2"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}

