import React, { useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { mockProducts } from '../data/mockProducts';
import Navbar from '../components/ui/Navbar';
import ProductGallery from '../components/ui/ProductGallery';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button"

const ShopDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from || '/shop';

  const product = mockProducts.find(p => p.slug === slug);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center font-mono">
        <h1 className="text-2xl mb-4 text-red-500 uppercase tracking-widest">[ ERROR 404 ]</h1>
        <p className="text-zinc-500 mb-8 uppercase tracking-widest">Entity not found in the archive.</p>
        <Link to="/shop" className="text-white border-b border-white pb-1 hover:text-zinc-400 hover:border-zinc-400 transition-all uppercase tracking-widest text-xs">
          Return to Global Inventory
        </Link>
      </div>
    );
  }

  const isSoldOut = product.status === 'sold_out';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black">
      {/* Background Noise Component */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <Navbar />

      <main className="relative z-10 pt-24 px-4 sm:px-6 md:px-0 mx-auto max-w-[1400px]">
        
        {/* Navigation Bar */}
        <div className="md:px-12 py-6 mb-4 md:mb-0">
          <button 
            onClick={() => navigate(fromPath)}
            className="group flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-zinc-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Inventory
          </button>
        </div>

        {/* Asymmetrical Split Screen Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0 lg:min-h-[85vh]">
          
          {/* Left Column: Edge-to-Edge Sticky Image */}
          <div className="relative w-full aspect-[4/5] md:aspect-auto md:h-[calc(100vh-140px)] md:sticky md:top-[120px] md:pl-12 md:pr-6 overflow-hidden">
             <ProductGallery 
               images={product.images} 
               isSoldOut={isSoldOut} 
               productName={product.name} 
             />
          </div>

          {/* Right Column: Scrolling Product Details */}
          <div className="md:pr-12 md:pl-6 pb-24 md:py-12 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="max-w-xl mx-auto md:mx-0 w-full"
            >
              {/* Meta information */}
              <div className="flex items-center gap-4 mb-8">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                  [{product.category}]
                </span>
                <div className="h-px bg-zinc-800 grow"></div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                  ID: {String(product.product_id).padStart(4, '0')}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-black uppercase tracking-tighter leading-[0.9] text-zinc-50 mb-10">
                {product.name}
              </h1>

              {/* Description */}
              <div className="mb-12">
                <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4 border-b border-white/10 pb-2">
                  [ Operator Notes ]
                </h3>
                <p className="font-sans text-base lg:text-lg text-zinc-400 leading-relaxed max-w-[55ch]">
                  {product.description}
                </p>
              </div>

              {/* Sizing Information */}
              {product.sizes && product.sizes.length > 0 && (
                 <div className="mb-16">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-6 border-b border-white/10 pb-2">
                      [ Available Configurations ]
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map((size) => (
                        <div 
                          key={size}
                          className="w-12 h-12 flex items-center justify-center font-mono text-sm border border-zinc-800 text-zinc-300 bg-zinc-900/50 cursor-default"
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {/* Market Place Actions */}
              <div>
                 <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-4">
                  Transmission Protocol // Secure Checkout via:
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button 
                      disabled={isSoldOut}
                      onClick={() => window.open(product.shopee_url || '#', '_blank')}
                      className="bg-transparent border border-orange-600/50 text-orange-500 hover:bg-orange-600 hover:text-white hover:border-orange-600 rounded-none h-14 font-mono text-xs uppercase tracking-widest transition-all w-full flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Shopee
                    </Button>
                    <Button 
                      disabled={isSoldOut}
                      onClick={() => window.open(product.tiktok_url || '#', '_blank')}
                      className="bg-transparent border border-emerald-600/50 text-emerald-500 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-none h-14 font-mono text-xs uppercase tracking-widest transition-all w-full flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      TikTok Shop
                    </Button>
                 </div>
                 {isSoldOut && (
                   <p className="mt-4 font-mono text-xs text-red-500 uppercase tracking-widest text-center">
                     [ Out of Stock — Transmission Disabled ]
                   </p>
                 )}
                 <p className="mt-6 font-mono text-[10px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                   * Reload Distro exclusively uses external processing. No direct payments are processed on this terminal.
                 </p>
              </div>

            </motion.div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ShopDetail;
