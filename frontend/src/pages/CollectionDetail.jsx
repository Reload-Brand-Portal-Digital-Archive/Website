import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import ProductCard from '../components/ui/ProductCard';
import Navbar from '../components/ui/Navbar';

const CollectionDetail = () => {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        window.scrollTo(0, 0);

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/collections/slug/${slug}`);

        setCollection(response.data.collection);
        setProducts(response.data.products);

      } catch (error) {
        console.error('Error fetching collection:', error);
        setCollection(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCollectionData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="font-mono text-xs tracking-[0.3em] uppercase text-zinc-500 animate-pulse">
          FETCHING ARCHIVE...
        </span>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6">
        <span className="font-mono text-xs tracking-[0.3em] uppercase text-red-500">
          DATA NOT FOUND
        </span>
        <Link to="/collections" className="px-6 py-3 border border-white/20 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors">
          RETURN TO DIRECTORY
        </Link>
      </div>
    );
  }

  const getImageUrl = (filename) => {
    if (!filename) return '';
    return filename.startsWith('http') ? filename : `${import.meta.env.VITE_API_URL}/uploads/${filename}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <Navbar />

      <main className="relative z-10 w-full">

        <section className="relative w-full h-[60vh] min-h-[500px] flex items-end pb-12 px-6 md:px-12 overflow-hidden">

          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            src={getImageUrl(collection.cover_image)}
            alt={collection.name}
            className="absolute inset-0 z-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-0" />

          <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-4">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="px-3 py-1 border border-white/20 bg-black/40 backdrop-blur-md w-fit font-mono text-xs tracking-widest text-zinc-300 uppercase"
              >
                RELEASE_ // {collection.year}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-sans text-4xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]"
              >
                {collection.name}
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="max-w-md"
            >
              <p className="font-mono text-sm text-zinc-400 leading-relaxed border-l-2 border-white/20 pl-4 whitespace-pre-line">
                {collection.description}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-6 md:px-12 max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
            <h2 className="font-sans text-2xl md:text-3xl font-bold uppercase tracking-tight text-white">
              INVENTORY LIST
            </h2>
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
              [ {products.length} Products Found ]
            </span>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
              {products.map((product, index) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="w-full py-24 flex items-center justify-center border border-dashed border-white/10">
              <span className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
                NO INVENTORY ASSIGNED YET.
              </span>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default CollectionDetail;