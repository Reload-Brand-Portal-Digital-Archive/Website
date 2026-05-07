import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const CollectionCard = ({ collection, index }) => {
  const getImageUrl = (filename) => {
    if (!filename) return '';
    return filename.startsWith('http') ? filename : `${import.meta.env.VITE_API_URL}/uploads/${filename}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 * index, ease: [0.22, 1, 0.36, 1] }}
      className="group relative block w-full aspect-[4/5] md:aspect-[16/9] overflow-hidden bg-zinc-900 border border-white/5"
    >
      <Link to={`/collections/${collection.slug || collection.collection_id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {collection.name}</span>
      </Link>

      <motion.div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${getImageUrl(collection.cover_image)})` }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />

      <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="px-3 py-1 border border-white/20 bg-black/40 backdrop-blur-md font-mono text-xs tracking-widest text-zinc-300 uppercase">
            ARCHIVE // {collection.year}
          </div>
          <div className="w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <h2 className="font-sans text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-3">
            {collection.name}
          </h2>
          <p className="font-sans text-sm md:text-base text-zinc-400 max-w-xl line-clamp-2 md:line-clamp-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            {collection.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CollectionCard;