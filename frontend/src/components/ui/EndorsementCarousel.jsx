import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mockEndorsements } from "../../data/mockEndorsements";

// ─── Constants ────────────────────────────────────────────────────────────────
const SUPPORTED_RATIOS = ["4:3", "9:16"];
const RATIO_PADDING = { "4:3": 75, "9:16": 177.78 }; // paddingTop% = h/w*100 → 9:16 portrait = 177.78%

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeItem(item, index) {
  const rawRatio = item.ratio_type || item.ratioType || "4:3";
  const ratio = SUPPORTED_RATIOS.includes(rawRatio) ? rawRatio : "4:3";
  const isActive =
    item.is_active === true || item.is_active === "true" ||
    item.is_active === 1 || item.is_active === "1" || item.isActive === true;
  return {
    id: item.id || `item-${index}`,
    name: item.name || item.talentName || "Talent",
    ratio,
    caption: item.caption || "",
    imagePath: item.image_path || item.imagePath || item.mediaPath || "",
    isActive,
  };
}

function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL}${path}`;
}

// ─── Carousel ─────────────────────────────────────────────────────────────────
function CarouselLayout({ items }) {
  const total = items.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef(null);

  // Touch/swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Current ratio drives the height animation
  const currentRatio = items[currentIndex]?.ratio ?? "4:3";
  const centerPaddingTop = RATIO_PADDING[currentRatio] ?? 75;

  // Navigate with debounce guard
  const go = useCallback(
    (dir) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrentIndex((i) => (i + dir + total) % total);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating, total]
  );

  const prev = useCallback(() => go(-1), [go]);
  const next = useCallback(() => go(1), [go]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setInterval(next, 4500);
    return () => clearInterval(timerRef.current);
  }, [isPaused, next, total]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // Touch swipe handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Only swipe horizontally (ignore scrolls)
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setIsPaused(false);
  };

  // Prev / current / next items
  const prevItem  = items[(currentIndex - 1 + total) % total];
  const currItem  = items[currentIndex];
  const nextItem  = items[(currentIndex + 1) % total];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Track ─────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Fade edges — decorative, pointer-events:none */}
        <div className="absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-zinc-950 via-zinc-950/60 to-transparent z-10 pointer-events-none" />

        {/* ── LEFT click zone ───────────────────────────────────────── */}
        <button
          onClick={prev}
          aria-label="Previous endorsement"
          className="absolute left-0 inset-y-0 w-[25%] z-20 flex items-center justify-start pl-3 group focus:outline-none"
          style={{ cursor: total <= 1 ? "default" : "pointer" }}
          disabled={total <= 1}
        >
          <motion.div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-zinc-950/70 border border-zinc-700 rounded-full p-2 text-zinc-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
          >
            <ChevronLeft size={18} />
          </motion.div>
        </button>

        {/* ── RIGHT click zone ──────────────────────────────────────── */}
        <button
          onClick={next}
          aria-label="Next endorsement"
          className="absolute right-0 inset-y-0 w-[25%] z-20 flex items-center justify-end pr-3 group focus:outline-none"
          style={{ cursor: total <= 1 ? "default" : "pointer" }}
          disabled={total <= 1}
        >
          <motion.div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-zinc-950/70 border border-zinc-700 rounded-full p-2 text-zinc-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
          >
            <ChevronRight size={18} />
          </motion.div>
        </button>

        {/* ── 3-card strip ──────────────────────────────────────────── */}
        <div className="flex items-start gap-2 sm:gap-3 md:gap-5 select-none">

          {/* PREV card */}
          <motion.div
            className="flex-shrink-0 w-[21%] sm:w-[20%] overflow-hidden"
            animate={{ scale: 0.88, opacity: 0.3 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.div
              className="relative w-full overflow-hidden border border-zinc-800/50 bg-zinc-900"
              animate={{ paddingTop: `${centerPaddingTop * 0.92}%` }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              style={{ paddingTop: `${centerPaddingTop * 0.92}%` }}
            >
              <div className="absolute inset-0">
                <CardImage item={prevItem} />
              </div>
            </motion.div>
          </motion.div>

          {/* CENTER card — full focus */}
          <motion.div
            className="flex-shrink-0 w-[58%] sm:w-[60%]"
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Aspect-ratio box animates height on ratio change */}
            <motion.div
              className="relative w-full overflow-hidden border border-zinc-800 bg-zinc-900"
              animate={{ paddingTop: `${centerPaddingTop}%` }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              style={{ paddingTop: `${centerPaddingTop}%` }}
            >
              <div className="absolute inset-0">
                <CardImage item={currItem} isFocused />
              </div>
            </motion.div>

            {/* Name + ratio tag below focused card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="pt-3 flex items-center justify-between gap-2"
              >
                <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-widest truncate">
                  {currItem.name}
                </span>
                <span className="font-mono text-[10px] text-zinc-700 uppercase tracking-widest shrink-0">
                  {currItem.ratio}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* NEXT card */}
          <motion.div
            className="flex-shrink-0 w-[21%] sm:w-[20%] overflow-hidden"
            animate={{ scale: 0.88, opacity: 0.3 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.div
              className="relative w-full overflow-hidden border border-zinc-800/50 bg-zinc-900"
              animate={{ paddingTop: `${centerPaddingTop * 0.92}%` }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              style={{ paddingTop: `${centerPaddingTop * 0.92}%` }}
            >
              <div className="absolute inset-0">
                <CardImage item={nextItem} />
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* ── Caption ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`caption-${currentIndex}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-5 text-sm text-zinc-600 max-w-md text-center mx-auto leading-relaxed min-h-[1.25rem]"
        >
          {currItem.caption || ""}
        </motion.p>
      </AnimatePresence>

      {/* ── Dot indicators + arrow buttons ────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={prev}
          className="p-2 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 transition-colors rounded-sm"
          aria-label="Previous"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => !isAnimating && setCurrentIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-5 h-[3px] bg-zinc-300"
                  : "w-1.5 h-[3px] bg-zinc-700 hover:bg-zinc-500"
              }`}
              aria-label={`Go to ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="p-2 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 transition-colors rounded-sm"
          aria-label="Next"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Card Image (pure display) ────────────────────────────────────────────────
function CardImage({ item, isFocused = false }) {
  const url = resolveImageUrl(item.imagePath);
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
        <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
          {item.ratio} · No image
        </span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={item.name}
      loading="lazy"
      className={`w-full h-full object-cover transition-transform duration-700 ${
        isFocused ? "hover:scale-[1.03]" : ""
      }`}
      style={{ display: "block" }}
    />
  );
}

// ─── Bento layout (≤ 3 items) ─────────────────────────────────────────────────
function BentoLayout({ items }) {
  const ASPECT = { "4:3": "aspect-[4/3]", "16:9": "aspect-video" };
  const count = items.length;

  const Card = ({ item, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className={`w-full ${ASPECT[item.ratio] ?? ASPECT["4:3"]} overflow-hidden border border-zinc-800 bg-zinc-900`}>
        {resolveImageUrl(item.imagePath) ? (
          <img
            src={resolveImageUrl(item.imagePath)}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
              {item.ratio} · No image
            </span>
          </div>
        )}
      </div>
      <div className="pt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-widest">{item.name}</span>
        <span className="font-mono text-[10px] text-zinc-700 uppercase tracking-widest">{item.ratio}</span>
      </div>
    </motion.div>
  );

  if (count === 1) return <div className="max-w-xl mx-auto"><Card item={items[0]} /></div>;
  if (count === 2) return (
    <div className="grid grid-cols-2 gap-5 lg:gap-8">
      {items.map((item, i) => <Card key={item.id} item={item} delay={i * 0.1} />)}
    </div>
  );
  if (items[0].ratio === "16:9") return (
    <div className="flex flex-col gap-5 lg:gap-8">
      <Card item={items[0]} />
      <div className="grid grid-cols-2 gap-5 lg:gap-8">
        {items.slice(1).map((item, i) => <Card key={item.id} item={item} delay={0.15 + i * 0.1} />)}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-5 lg:gap-8 items-start">
      <Card item={items[0]} />
      <div className="flex flex-col gap-5 lg:gap-8">
        {items.slice(1).map((item, i) => <Card key={item.id} item={item} delay={0.15 + i * 0.1} />)}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex gap-3 md:gap-5 items-start">
      <div className="w-[21%] animate-pulse"><div className="aspect-[4/3] bg-zinc-900 border border-zinc-800" /></div>
      <div className="w-[58%] animate-pulse"><div className="aspect-[4/3] bg-zinc-900 border border-zinc-800" /></div>
      <div className="w-[21%] animate-pulse"><div className="aspect-[4/3] bg-zinc-900 border border-zinc-800" /></div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function EndorsementSection() {
  const [apiItems, setApiItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + "/api/endorsements");
        const data = Array.isArray(res.data) ? res.data : [];
        setApiItems(data.map(normalizeItem).filter((i) => i.isActive));
      } catch {
        setApiItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayItems = useMemo(() => {
    if (apiItems.length > 0) return apiItems;
    return mockEndorsements.map(normalizeItem).filter((i) => i.isActive);
  }, [apiItems]);

  // Always use carousel for ≥ 2 items, bento for 0–1
  const useCarousel = displayItems.length >= 2;

  return (
    <section className="w-full bg-zinc-950 border-y border-zinc-800/60 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase block mb-4">
              [ WORN BY ]
            </span>
            <h2 className="text-4xl md:text-[4.5vw] font-black leading-none tracking-tighter uppercase text-zinc-50">
              Endorsement<span className="text-zinc-600"> Artists</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-zinc-500 leading-relaxed">
            Talent &amp; brand ambassadors wearing Reload pieces — editorial moments captured in the field.
          </p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : useCarousel ? (
          <CarouselLayout items={displayItems} />
        ) : (
          <BentoLayout items={displayItems} />
        )}
      </div>
    </section>
  );
}
