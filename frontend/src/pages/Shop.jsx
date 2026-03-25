import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { mockProducts } from '../data/mockProducts';
import ProductCard from '../components/ui/ProductCard';
import Navbar from '../components/ui/Navbar';

const Shop = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', ...new Set(mockProducts.map(p => p.category))];
  
  const filteredProducts = activeFilter === 'All' 
    ? mockProducts 
    : mockProducts.filter(p => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black">
      {/* Background Noise Layer */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Shared Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24 px-6 md:px-12 max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 md:mb-24 mt-12"
        >
          <div className="flex flex-col gap-6">
            <span className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase">
              [ OFFICIAL CATALOG ]
            </span>
            <h1 className="font-sans text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              GLOBAL <br className="hidden md:block" />
              <span className="text-zinc-600">INVENTORY</span>
            </h1>
            <p className="font-mono text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed">
              Explore the entire archive of available and iconic garments. Curated for the modern operative.
            </p>
          </div>
        </motion.div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-12 border-b border-white/10 pb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`font-mono text-xs uppercase tracking-widest transition-colors ${
                  activeFilter === category 
                    ? 'text-white border-b border-white pb-1' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {category}
              </button>
            ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.product_id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100, damping: 20 }}
              >
                <ProductCard product={product} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="col-span-full py-24 text-center border border-dashed border-white/10"
            >
              <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest">
                [ No Entities Found In This Category ]
              </p>
            </motion.div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Shop;
