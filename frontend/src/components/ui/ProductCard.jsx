import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, index }) => {
  const isSoldOut = product.status === 'Sold Out';

  const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/400x500/18181b/a1a1aa?text=No+Image';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;
  };

  const displayImage = product.primary_image || (product.images && product.images.length > 0 ? product.images[0] : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 * index, ease: "easeOut" }}
      className="group flex flex-col gap-4"
    >
      <Link
        to={`/shop/${product.slug || product.product_id}`}
        className="relative block w-full aspect-[3/4] overflow-hidden bg-zinc-900 border border-white/5"
      >
        <motion.img
          src={getImageUrl(displayImage)}
          alt={product.name}
          className={`object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-110 ${isSoldOut ? 'grayscale opacity-70' : ''}`}
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="font-mono text-xs tracking-widest text-white border border-white/30 px-6 py-3 uppercase bg-black/50 backdrop-blur-sm">
            {isSoldOut ? 'ARCHIVED' : 'VIEW ITEM'}
          </span>
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isSoldOut && (
            <span className="px-2 py-1 bg-red-950/80 border border-red-500/30 text-red-500 text-[10px] font-mono uppercase tracking-widest backdrop-blur-md">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-sans font-bold text-white uppercase tracking-wide text-sm leading-snug truncate pr-2">
            {product.name}
          </h3>
        </div>
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            [{product.category}]
          </span>
          {!isSoldOut && (
            <span className="font-mono text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {'>'} VIEW
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;