import React from 'react';
import { 
    LayoutDashboard, ShoppingBag, Layers, 
    MessageSquare, Mail, Settings, Users, LogOut, Tag, Palette, Award, Menu
} from 'lucide-react';

export const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produk', icon: ShoppingBag },
    { id: 'collections', label: 'Koleksi', icon: Layers },
    { id: 'categories', label: 'Kategori', icon: Tag },
    { id: 'materials', label: 'Material', icon: Palette },
    { id: 'endorsements', label: 'Endorsement', icon: Award },
    { id: 'messages', label: 'Pesanan Grosir', icon: MessageSquare },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
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
                                
                                {!isSidebarOpen && isActive && (
                                    <div className="absolute right-2 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-zinc-800 p-4 shrink-0 bg-zinc-900 overflow-hidden">
                    <div className={`flex items-center gap-4 transition-all duration-300 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 overflow-hidden text-left hover:bg-zinc-800 p-1.5 -ml-1.5 rounded-lg transition-all duration-300 cursor-pointer ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"}`}
                            title="Profil Admin"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeTab === 'profile' ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Users size={16} />
                            </div>
                            <div className="overflow-hidden">
                                <p className={`text-sm font-medium truncate transition-colors ${activeTab === 'profile' ? 'text-rose-500' : 'text-zinc-200'}`}>{user?.name || 'Admin User'}</p>
                                <p className="text-xs text-zinc-500 truncate">Administrator</p>
                            </div>
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className={`flex items-center justify-center p-2 rounded-md transition-all duration-300 text-zinc-500 hover:text-red-500 ${
                                !isSidebarOpen && "w-full"
                            }`}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
