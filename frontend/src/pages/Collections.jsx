import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import CollectionCard from '../components/ui/CollectionCard';
import Navbar from '../components/ui/Navbar';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/collections');
        setCollections(res.data || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

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
              [ OFFICIAL ARCHIVE ]
            </span>
            <h1 className="font-sans text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              COLLECTIONS <br className="hidden md:block" />
              <span className="text-zinc-600">DIRECTORY</span>
            </h1>
            <p className="font-mono text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed">
              Explore past and present drops. Each collection represents a unique study in urban decay, technical utility, and subversive aesthetics.
            </p>
          </div>
        </motion.div>

        {loading && (
          <div className="text-center py-16">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
              Loading collections...
            </span>
          </div>
        )}

        {!loading && collections.length === 0 && (
          <div className="text-center py-16">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
              No collections found
            </span>
          </div>
        )}

        {!loading && collections.length > 0 && (
          <div className="flex flex-col gap-8 md:gap-16">
            {collections.map((collection, index) => (
              <CollectionCard 
                key={collection.collection_id} 
                collection={collection} 
                index={index} 
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default Collections;
