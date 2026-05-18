import React, { useState, useEffect } from "react"
import { Menu, MessageSquare } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useNavigate, Link, useLocation } from "react-router-dom"
import axios from "axios"
import reloadLogoTransparent from "../../assets/reload_logo_transparent.png"
import LanguageSwitcher from "./LanguageSwitcher"
import { useTranslation } from "react-i18next"

const Navbar = () => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      const loggedInUser = localStorage.getItem('user')
      if (loggedInUser && loggedInUser !== 'undefined') {
        return JSON.parse(loggedInUser)
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e)
    }
    return null
  })
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState({ unreadChats: false, unreadOrders: false })

  const isScrolledOrNotHome = scrolled || location.pathname !== '/';

  const fetchNotifications = async () => {
    if (!user || user.role === 'admin') return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 text-zinc-50 transition-all duration-300 ${isScrolledOrNotHome ? "bg-zinc-950/80 backdrop-blur-md" : "bg-transparent mix-blend-difference"
        }`}
    >
      <Link to="/" className="pointer-events-auto hover:opacity-80 transition-opacity flex items-center">
        <img src={reloadLogoTransparent} alt="RELOAD" className="h-5 md:h-6 w-auto object-contain" />
      </Link>

      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-8 text-sm font-normal items-center">
        <Link
          to="/collections"
          className={`hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/collections') ? 'text-white border-b border-white/30 pb-1' : 'text-zinc-400'}`}
        >
          {t('nav.collections')}
        </Link>
        <Link
          to="/shop"
          className={`hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/shop') ? 'text-white border-b border-white/30 pb-1' : 'text-zinc-400'}`}
        >
          {t('nav.shop')}
        </Link>
        <Link
          to="/wholesale"
          className={`hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/wholesale') ? 'text-white border-b border-white/30 pb-1' : 'text-zinc-400'}`}
        >
          {t('nav.wholesale')}
        </Link>
        <Link
          to="/about"
          className={`hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/about') ? 'text-white border-b border-white/30 pb-1' : 'text-zinc-400'}`}
        >
          {t('nav.about')}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher className="hidden md:flex" />
        {user ? (
          <div className="hidden md:flex items-center gap-4">
            {user.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center justify-center rounded-none border border-zinc-500 text-zinc-300 bg-transparent hover:bg-zinc-800 hover:text-white transition-colors h-9 px-4 text-xs tracking-widest uppercase cursor-pointer"
              >
                {t('nav.admin_panel')}
              </Link>
            )}
            <div className="relative group py-2">
              <Link
                to="/profile"
                className={`relative text-xs tracking-widest uppercase transition-colors font-mono ${location.pathname === '/profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                [ {t('nav.profile')} ]
                {notifications.unreadOrders && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </Link>
              <div className="absolute right-0 top-full pt-4 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50 translate-y-1 group-hover:translate-y-0">
                <div 
                  className="bg-zinc-950/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                  style={{ mixBlendMode: 'normal' }}
                >
                  <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                    <p className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-1">{t('nav.profile')}</p>
                    <p className="text-[11px] font-medium text-zinc-200 truncate">{user.name}</p>
                  </div>
                  <div className="flex flex-col py-1">
                    <Link
                      to="/profile"
                      className="px-5 py-3 text-[11px] font-mono tracking-widest uppercase text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-white transition-colors"></span>
                      {t('nav.profile')}
                    </Link>
                    <Link
                      to="/orders"
                      className="px-5 py-3 text-[11px] font-mono tracking-widest uppercase text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-white transition-colors"></span>
                        {t('nav.orders')}
                      </div>
                      {notifications.unreadOrders && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
                      )}
                    </Link>
                    
                    <div className="h-px bg-white/5 my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="px-5 py-3 text-[11px] font-mono tracking-widest uppercase text-red-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-left w-full flex items-center gap-3"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-900 group-hover:bg-red-500 transition-colors"></span>
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="hidden md:inline-flex items-center justify-center rounded-full border border-white/70 bg-transparent text-zinc-100 hover:bg-white/10 transition-colors h-9 px-6 text-sm font-normal cursor-pointer"
          >
            {t('nav.login')}
          </Link>
        )}
        <Link
          to="/contact"
          className="relative hidden md:inline-flex items-center gap-2 rounded-full border border-white/70 bg-transparent text-zinc-100 hover:bg-white/10 transition-colors h-9 px-5 text-sm font-normal cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          {t('nav.chat')}
          {notifications.unreadChats && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border border-zinc-950"></span>
          )}
        </Link>

        <Sheet>
          <SheetTrigger className="relative md:hidden p-2 text-zinc-50 hover:text-zinc-300 transition-colors pointer-events-auto cursor-pointer flex items-center justify-center bg-transparent border-none">
            <Menu className="w-6 h-6" strokeWidth={1.5} />
            {(notifications.unreadChats || notifications.unreadOrders) && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-zinc-950"></span>
            )}
          </SheetTrigger>
          <SheetContent side="right" className="bg-zinc-950 border-zinc-800 text-zinc-50 p-6 z-[100] flex flex-col overflow-y-auto">
            <SheetTitle className="sr-only">{t('nav.mobile_menu')}</SheetTitle>
            <div className="mt-4 mb-8">
              <img src={reloadLogoTransparent} alt="RELOAD" className="h-6 w-auto object-contain" />
            </div>

            <div className="flex flex-col gap-6 mt-4 text-sm uppercase tracking-widest font-sans flex-1">
              <Link to="/collections" className={`text-left hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/collections') ? 'text-white' : 'text-zinc-400'}`}>
                {t('nav.collections')}
              </Link>
              <Link to="/shop" className={`text-left hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/shop') ? 'text-white' : 'text-zinc-400'}`}>
                {t('nav.shop')}
              </Link>
              <Link to="/wholesale" className={`text-left hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/wholesale') ? 'text-white' : 'text-zinc-400'}`}>
                {t('nav.wholesale')}
              </Link>
              <Link to="/about" className={`text-left hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/about') ? 'text-white' : 'text-zinc-400'}`}>
                {t('nav.about')}
              </Link>
              <Separator className="bg-zinc-800 my-2" />
              <LanguageSwitcher className="w-fit mb-2" />
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin/dashboard" className="block w-full text-left py-2 text-zinc-400 hover:text-white transition-colors">{t('nav.admin_panel')}</Link>
                  )}
                  <Link to="/profile" className={`block w-full text-left py-2 transition-colors ${location.pathname === '/profile' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>{t('nav.profile')}</Link>
                  <Link to="/orders" className={`flex items-center w-full text-left py-2 transition-colors ${location.pathname === '/orders' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                    {t('nav.orders')}
                    {notifications.unreadOrders && (
                      <span className="ml-2 w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                  </Link>
                  <Link to="/contact" className={`flex items-center w-full text-left py-2 transition-colors ${location.pathname === '/contact' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                    {t('nav.chat')}
                    {notifications.unreadChats && (
                      <span className="ml-2 w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left py-2 text-red-500 hover:text-red-400 transition-colors">{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/contact" className={`flex items-center w-full text-left py-2 transition-colors ${location.pathname === '/contact' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                    {t('nav.chat')}
                  </Link>
                  <Link to="/login" state={{ from: location.pathname }} className="block w-full text-left py-2 text-zinc-400 hover:text-white transition-colors">{t('nav.login_register')}</Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

export default Navbar;
