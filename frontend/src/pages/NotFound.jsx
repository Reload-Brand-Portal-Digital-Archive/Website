import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import { ArrowRight, Home, Layers } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

const NotFound = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black overflow-hidden">
      {/* Background Noise Layer */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Large ghost 404 background text */}
      <div
        className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          className="font-black text-[30vw] leading-none text-white/[0.025] tracking-tighter"
        >
          404
        </span>
      </div>

      <Navbar />

      {/* Main content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl w-full"
        >
          {/* Label */}
          <motion.div variants={itemVariants} className="mb-10">
            <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
              [ STATUS: 404 — ROUTE NOT FOUND ]
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-sans text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-8"
          >
            LOST{' '}
            <br />
            <span className="text-zinc-600">SIGNAL.</span>
          </motion.h1>

          {/* Divider */}
          <motion.div variants={itemVariants} className="w-16 h-px bg-zinc-800 mb-10" />

          {/* Copy */}
          <motion.p
            variants={itemVariants}
            className="font-mono text-sm text-zinc-500 max-w-md leading-relaxed mb-16"
          >
            The page you're looking for has been moved, archived, or never existed in this space. Navigate back to a known coordinate.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/"
              className="group flex items-center justify-center gap-3 h-14 px-8 bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Return Home
              <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/collections"
              className="group flex items-center justify-center gap-3 h-14 px-8 bg-transparent border border-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              Collections
              <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/shop"
              className="group flex items-center justify-center gap-3 h-14 px-8 bg-transparent border border-zinc-800 text-zinc-500 font-mono text-xs uppercase tracking-widest hover:border-zinc-600 hover:text-zinc-300 transition-all"
            >
              Shop
              <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Footer note */}
          <motion.p
            variants={itemVariants}
            className="mt-16 font-mono text-[10px] text-zinc-700 uppercase tracking-widest"
          >
            RELOAD DISTRO // SYSTEM ERROR
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;
