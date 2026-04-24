import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowRight, ShoppingBag, Instagram, Twitter, Music } from "lucide-react"
import axios from "axios"
import heroModel from "../assets/hero_model.png"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import Navbar from "../components/ui/Navbar"
import SplashScreen from "../components/ui/SplashScreen"
import EndorsementCarousel from "../components/ui/EndorsementCarousel"
import NewsletterSignup from "../components/NewsletterSignup"

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
}
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } }
}
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: "easeOut" } }
}

function HeroSection() {
  return (
    <header className="relative w-full min-h-[100dvh] bg-zinc-950 overflow-hidden pt-21">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.035] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-[100dvh]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="order-2 md:order-1 col-span-1 md:col-span-5 flex flex-col justify-end gap-8 px-6 md:px-12 pb-16 pt-36 md:pt-24"
        >
          <motion.span variants={fadeUp} className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
            [ RELOAD STREETWEAR ]
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="font-sans text-[13vw] md:text-[7vw] text-zinc-50 font-black leading-[0.85] tracking-tighter uppercase"
          >
            New{"\n"}
            <span className="text-zinc-600">Arrivals.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-sans text-base text-zinc-400 max-w-[38ch] leading-relaxed"
          >
            Everyday streetwear built for comfort, movement, and style.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link to="/collections">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-3 h-14 px-8 bg-zinc-50 text-zinc-950 font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Collections
                <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
            <Link to="/shop">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-3 h-14 px-8 bg-transparent border border-zinc-700 text-zinc-300 font-mono text-xs uppercase tracking-widest hover:border-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Shop
                <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-4 mt-4">
            <div className="h-px bg-zinc-800 w-8" />
            <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
              Shop on Shopee &amp; TikTok
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="order-1 md:order-2 col-span-1 md:col-span-7 h-[55vw] md:h-full relative bg-zinc-900 overflow-hidden"
        >
          <img
            src={heroModel}
            alt="Reload Distro - New Arrivals"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-zinc-950/60" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950/40 to-transparent" />
          <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-white/20 z-10" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/20 z-10" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-white/20 z-10" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-white/20 z-10" />
        </motion.div>
      </div>
    </header>
  )
}

function CurrentDropSection() {
  const [currentDrop, setCurrentDrop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentDrop = async () => {
      try {
        const [productsRes, collectionsRes] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/api/products'),
          axios.get(import.meta.env.VITE_API_URL + '/api/collections')
        ]);

        const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
        const products = productsData.map(p => ({
          ...p,
          type: 'product',
          display_name: p.name,
          spec: p.category || 'Product',
          slug: p.slug,
          created_at: p.created_at
        }));

        const collectionsData = Array.isArray(collectionsRes.data) ? collectionsRes.data : [];
        const collections = collectionsData.map(c => ({
          ...c,
          type: 'collection',
          display_name: c.name,
          spec: `Collection · ${c.year || 'Archive'}`,
          slug: c.slug,
          created_at: c.created_at
        }));

        const merged = [...products, ...collections].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return a.type === 'product' ? -1 : 1;
        });

        setCurrentDrop(merged.slice(0, 3));
      } catch (error) {
        console.error('Error fetching current drop:', error);
        setCurrentDrop([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentDrop();
  }, []);

  return (
    <section className="w-full bg-zinc-950 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-32 md:py-48">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16"
        >
          <div>
            <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4 block">
              [ CURRENT DROP ]
            </span>
            <h2 className="text-4xl md:text-[5vw] font-black leading-none tracking-tighter uppercase text-zinc-50">
              Current Drop
            </h2>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-white uppercase tracking-widest transition-colors self-start md:self-auto"
          >
            Shop
            <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {loading && (
          <div className="text-center py-16">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
              Loading...
            </span>
          </div>
        )}

        {!loading && currentDrop.length === 0 && (
          <div className="text-center py-16">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
              No items available
            </span>
          </div>
        )}

        {!loading && currentDrop.length > 0 && (
          <div className="flex flex-col gap-0 border-t border-zinc-800">
            {currentDrop.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.id || item.collection_id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-zinc-800"
              >
                <Link
                  to={item.type === 'product' ? `/shop/${item.slug}` : `/collections/${item.slug}`}
                  className="group grid grid-cols-1 md:grid-cols-2 gap-0 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="w-full aspect-[4/3] bg-zinc-800 border border-dashed border-zinc-700 border-r-0 md:border-r md:border-solid md:border-zinc-800 flex flex-col items-center justify-center gap-2 overflow-hidden">
                    {item.type === 'product' && item.primary_image ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${item.primary_image}`}
                        alt={item.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : item.type === 'collection' && item.cover_image ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/${item.cover_image}`}
                        alt={item.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                          {item.type} Image
                        </span>
                        <span className="font-mono text-[9px] text-zinc-700 uppercase tracking-wider">
                          4 : 3
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col justify-between p-8 md:p-12">
                    <div className="flex flex-col gap-4">
                      <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                        {String(i + 1).padStart(2, '0')} — {item.spec}
                      </span>
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none text-zinc-50 group-hover:text-white transition-colors">
                        {item.display_name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mt-10">
                      <Badge
                        variant="outline"
                        className={`border rounded-none font-mono text-[10px] tracking-widest uppercase ${item.type === 'collection'
                          ? 'border-purple-700/50 text-purple-400'
                          : item.status === 'Available'
                            ? 'border-zinc-700 text-zinc-400'
                            : 'border-amber-700/50 text-amber-500'
                          }`}
                      >
                        {item.type === 'collection' ? 'Collection' : (item.status || 'Available')}
                      </Badge>
                      <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-white transition-colors uppercase tracking-widest">
                        View {item.type === 'collection' ? 'Collection' : 'Product'}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function MaterialIntegritySection() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + '/api/materials');
        const data = Array.isArray(res.data) ? res.data : [];
        setMaterials(data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching materials:', error);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const displayMaterials = materials.length > 0
    ? materials
    : loading
      ? []
      : [
        {
          id: "default-1",
          title: "Premium\nMaterials",
          description: "Selected fabrics that feel good and hold their shape."
        },
        {
          id: "default-2",
          title: "Comfortable\nFit",
          description: "Built for daily movement with a clean streetwear silhouette."
        },
        {
          id: "default-3",
          title: "Made To\nLast",
          description: "Strong construction designed for repeated wear."
        }
      ];

  return (
    <section className="w-full bg-zinc-900 border-y border-zinc-800 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
            [ MATERIALS ]
          </span>
        </motion.div>

        <div className="-mx-4 md:-mx-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {displayMaterials.map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`py-8 md:py-0 flex flex-col gap-8 px-4 md:px-8 ${
                  i > 0 ? "md:border-l border-t md:border-t-0 border-zinc-800" : ""
                }`}
              >
              <div className="w-full aspect-[4/3] bg-zinc-800 border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 overflow-hidden">
                {item.image_path ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${item.image_path}`}
                    alt={item.title || item.description}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                      Material Image
                    </span>
                    <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-wider">
                      4 : 3
                    </span>
                  </>
                )}
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight text-zinc-50 mb-6 whitespace-pre-line">
                  {item.title || item.description}
                </h3>
                {item.description && (
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-[36ch]">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ShopCTASection() {
  return (
    <section className="w-full bg-zinc-950 border-b border-zinc-900 font-sans overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-32 md:py-48 flex flex-col justify-between gap-24 min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase block mb-6">
            [ SHOP ]
          </span>
          <h2 className="text-5xl md:text-[6vw] font-black leading-[0.85] tracking-tighter uppercase text-zinc-50">
            Shop Now
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.a
            whileTap={{ scale: 0.97 }}
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-3 h-14 px-8 bg-transparent border border-emerald-600/60 text-emerald-400 font-mono text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop on TikTok
          </motion.a>
          <motion.a
            whileTap={{ scale: 0.97 }}
            href="https://shopee.co.id"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-3 h-14 px-8 bg-transparent border border-orange-600/60 text-orange-400 font-mono text-xs uppercase tracking-widest hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop on Shopee
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}



function FooterSection() {
  return (
    <footer className="w-full bg-zinc-950 text-zinc-50 px-6 md:px-12 pt-24 pb-8 border-t border-zinc-900 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-24">
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase font-mono text-zinc-500 mb-2">[ SHOP ]</span>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Shop on TikTok</a>
            <a href="https://shopee.co.id" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Shop on Shopee</a>
            <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Shipping &amp; Returns</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase font-mono text-zinc-500 mb-2">[ COLLECTIONS ]</span>
            <Link to="/collections" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">All Collections</Link>
            <Link to="/shop" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Shop</Link>
            <Link to="/collections" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">New Arrivals</Link>
            <Link to="/collections" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Collections</Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase font-mono text-zinc-500 mb-2">[ SUPPORT ]</span>
            <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Shipping &amp; Returns</a>
            <a href="#" className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">Contact</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase font-mono text-zinc-500 mb-2">[ CONTACT ]</span>
            <a href="mailto:hello@reload.xyz" className="text-sm font-mono text-zinc-400 hover:text-zinc-50 transition-colors uppercase tracking-widest">
              HELLO@RELOAD.XYZ
            </a>
            <div className="flex items-center gap-4 mt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-50 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-50 transition-colors" aria-label="X / Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-50 transition-colors" aria-label="TikTok">
                <Music className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed mt-2 max-w-[28ch] font-mono uppercase tracking-wide">
              Everyday streetwear made for the city.
            </p>
          </div>
        </div>

        <Separator className="bg-zinc-900 mb-8" />

        <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2 pb-2">
          <span className="text-xs text-zinc-600 font-mono uppercase tracking-widest">
            (c) {new Date().getFullYear()} RELOAD Distro - All rights reserved
          </span>
          <span className="text-xs text-zinc-700 font-mono uppercase tracking-widest">
            Reload Official Store
          </span>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black">
      <SplashScreen />
      <Navbar />
      <HeroSection />
      <CurrentDropSection />
      <MaterialIntegritySection />
      <EndorsementCarousel />
      <ShopCTASection />
      <NewsletterSignup />
      <FooterSection />
    </div>
  )
}
