import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import Navbar from '../components/ui/Navbar';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/api/products'),
          axios.get(import.meta.env.VITE_API_URL + '/api/categories')
        ]);
        
        const allProducts = productsRes.data || [];
        const adminCategories = categoriesRes.data || [];
        
        const sorted = allProducts.sort((a, b) => {
          if (a.status === 'Available' && b.status !== 'Available') return -1;
          if (a.status !== 'Available' && b.status === 'Available') return 1;
          return 0;
        });
        setProducts(sorted);

        const uniqueProductCategories = new Set(
          allProducts
            .map(p => p.category)
            .filter(Boolean)
        );

        const allCategories = ['All', ...new Set([
          ...adminCategories,
          ...Array.from(uniqueProductCategories)
        ])];
        
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching shop data:', error);
        setProducts([]);
        setCategories(['All']);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCategory = activeFilter === 'All' || p.category === activeFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = p.name?.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  }).sort((a, b) => {
    if (a.status === 'Available' && b.status !== 'Available') return -1;
    if (a.status !== 'Available' && b.status === 'Available') return 1;

    if (sortOption === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortOption === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
    } else if (sortOption === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
    } else if (sortOption === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black">
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <Navbar />

      <main className="relative z-10 pt-32 pb-24 px-6 md:px-12 max-w-[1600px] mx-auto">
        
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

        {loading && (
          <div className="text-center py-16">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
              Loading products...
            </span>
          </div>
        )}

        {!loading && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search inventory..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-500 rounded-none py-3 pl-12 pr-4 text-sm text-zinc-100 placeholder-zinc-600 transition-colors outline-none font-mono"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <SlidersHorizontal size={18} className="text-zinc-500 hidden md:block" />
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full md:w-auto bg-zinc-900/50 border border-zinc-800 focus:border-zinc-500 rounded-none py-3 px-4 text-sm text-zinc-300 outline-none cursor-pointer appearance-none font-mono"
                >
                  <option value="newest">NEWEST DROP</option>
                  <option value="oldest">OLDEST DROP</option>
                  <option value="name_asc">ALPHABETICAL (A-Z)</option>
                  <option value="name_desc">ALPHABETICAL (Z-A)</option>
                </select>
              </div>
            </div>

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
          </>
        )}

      </main>
    </div>
  );
};

export default Shop;
