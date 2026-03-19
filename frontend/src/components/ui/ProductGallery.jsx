import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ProductGallery = ({ images, isSoldOut, productName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If there are no images, provide a fallback box
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-900 border border-white/5 flex items-center justify-center">
        <span className="font-mono text-xs text-zinc-600 uppercase tracking-widest">[ NO ASSET ]</span>
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full flex flex-col group">
      {/* Main Image Viewer */}
      <div className="relative flex-grow overflow-hidden bg-zinc-900 border border-white/5">
         <AnimatePresence mode="wait">
            <motion.img
               key={currentIndex}
               src={images[currentIndex]}
               alt={`${productName} - View ${currentIndex + 1}`}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.4, ease: "easeOut" }}
               className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-70' : ''}`}
            />
         </AnimatePresence>

         {/* Navigation Overlay (only show if multiple images) */}
         {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <button 
                  onClick={handlePrev}
                  className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  aria-label="Previous view"
               >
                  <ChevronLeft className="w-4 h-4" />
               </button>
               <button 
                  onClick={handleNext}
                  className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  aria-label="Next view"
               >
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
         )}

         {/* Badges */}
         {isSoldOut && (
            <div className="absolute top-6 right-6 px-4 py-2 bg-red-950/90 border border-red-500/30 text-red-500 text-[10px] font-mono uppercase tracking-widest backdrop-blur-md">
               Sold Out
            </div>
         )}
      </div>

      {/* Numerical Fractional Indicator & Thumbnail Strip (If multiple) */}
      {images.length > 1 && (
         <div className="flex items-center justify-between mt-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
               {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </div>
            <div className="flex gap-2">
               {images.map((img, idx) => (
                  <button
                     key={idx}
                     onClick={() => setCurrentIndex(idx)}
                     className={`w-10 h-10 border transition-all ${
                        currentIndex === idx 
                           ? 'border-white opacity-100' 
                           : 'border-white/10 opacity-40 hover:opacity-100 scale-95'
                     }`}
                  >
                     <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className={`w-full h-full object-cover ${isSoldOut ? 'grayscale' : ''}`} 
                     />
                  </button>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

export default ProductGallery;
