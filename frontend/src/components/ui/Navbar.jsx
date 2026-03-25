import React, { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useNavigate, Link, useLocation } from "react-router-dom"
import reloadLogoTransparent from "../../assets/reload_logo_transparent.png"

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState(() => {
    const loggedInUser = localStorage.getItem('user')
    return loggedInUser ? JSON.parse(loggedInUser) : null
  })
  const navigate = useNavigate()
  const location = useLocation()

  // Always force translucent background on pages that aren't the landing page 
  // or if explicitly scrolled down
  const isScrolledOrNotHome = scrolled || location.pathname !== '/';

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
      className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 text-zinc-50 transition-all duration-300 ${
        isScrolledOrNotHome ? "bg-zinc-950/80 backdrop-blur-md" : "bg-transparent mix-blend-difference"
      }`}
    >
      <Link to="/" className="pointer-events-auto hover:opacity-80 transition-opacity flex items-center">
        <img src={reloadLogoTransparent} alt="RELOAD" className="h-5 md:h-6 w-auto object-contain" />
      </Link>

      {/* Desktop Centered Links */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-8 text-sm font-normal items-center">
        <Link 
          to="/collections" 
          className={`hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/collections') ? 'text-white border-b border-white/30 pb-1' : 'text-zinc-400'}`}
        >
          Collections
        </Link>
        <Link 
          to="/shop" 
          className={`hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/shop') ? 'text-white border-b border-white/30 pb-1' : 'text-zinc-400'}`}
        >
          Shop
        </Link>
        <button className="text-zinc-400 hover:text-zinc-300 transition-colors">Contact</button>
        <button className="text-zinc-400 hover:text-zinc-300 transition-colors">About</button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="hidden md:flex items-center gap-4">
            {user.role === 'admin' && (
              <Link 
                to="/admin/dashboard" 
                className="inline-flex items-center justify-center rounded-none border border-zinc-500 text-zinc-300 bg-transparent hover:bg-zinc-800 hover:text-white transition-colors h-9 px-4 text-xs tracking-widest uppercase cursor-pointer"
              >
                Admin Panel
              </Link>
            )}
            <Button onClick={handleLogout} variant="ghost" className="text-zinc-400 hover:text-red-500 hover:bg-transparent transition-colors uppercase tracking-widest text-xs">
              [ Logout ]
            </Button>
          </div>
        ) : (
          <Link 
            to="/login"
            state={{ from: location.pathname }}
            className="hidden md:inline-flex items-center justify-center rounded-full border border-white/70 bg-transparent text-zinc-100 hover:bg-white/10 transition-colors h-9 px-6 text-sm font-normal cursor-pointer"
          >
            Login
          </Link>
        )}
        <Button variant="outline" className="hidden md:inline-flex rounded-full border-white/70 bg-transparent text-zinc-100 hover:bg-white/10 transition-colors h-9 px-6 text-sm font-normal">
          Shop Now
        </Button>

        {/* Mobile Nav Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 text-zinc-50 hover:text-zinc-300 transition-colors pointer-events-auto">
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-zinc-950 border-zinc-800 text-zinc-50 p-6 z-[100]">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="mt-4 mb-12">
              <img src={reloadLogoTransparent} alt="RELOAD" className="h-6 w-auto object-contain" />
            </div>
            
            <div className="flex flex-col gap-8 mt-12 text-sm uppercase tracking-widest font-sans">
              <Link to="/collections" className={`text-left hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/collections') ? 'text-white' : 'text-zinc-400'}`}>
                Collections
              </Link>
              <Link to="/shop" className={`text-left hover:text-zinc-300 transition-colors ${location.pathname.startsWith('/shop') ? 'text-white' : 'text-zinc-400'}`}>
                Shop
              </Link>
              <button className="text-left text-zinc-400 hover:text-zinc-300 transition-colors">Contact</button>
              <button className="text-left text-zinc-400 hover:text-zinc-300 transition-colors">About</button>
              <Separator className="bg-zinc-800 my-4" />
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin/dashboard" className="block w-full text-left py-2 text-zinc-400 hover:text-white transition-colors">Admin Panel</Link>
                  )}
                  <button onClick={handleLogout} className="block w-full text-left py-2 text-red-500 hover:text-red-400 transition-colors">Logout</button>
                </>
              ) : (
                <Link to="/login" state={{ from: location.pathname }} className="block w-full text-left py-2 text-zinc-400 hover:text-white transition-colors">Login / Register</Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

export default Navbar;
