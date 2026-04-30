import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '../components/ui/Navbar';

// ─────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.85, ease: 'easeOut' } },
};

// ─────────────────────────────────────────
// Noise texture (matches site-wide pattern)
// ─────────────────────────────────────────
const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ─────────────────────────────────────────
// Section 1 — Hero About
// ─────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative w-full min-h-[100dvh] bg-zinc-950 overflow-hidden flex items-end pb-24 pt-40">
      {/* Noise overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.035] mix-blend-screen"
        style={{ backgroundImage: noiseBg }}
      />

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-white/10 z-10" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/10 z-10" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-white/10 z-10" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-white/10 z-10" />

      {/* Decorative vertical rule */}
      <div className="absolute right-1/3 inset-y-0 w-px bg-zinc-800/40 hidden md:block z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-8 max-w-4xl"
        >
          <motion.span variants={fadeUp} className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
            [ ABOUT RELOAD ]
          </motion.span>

          <motion.div variants={fadeUp} className="flex items-start gap-4 flex-wrap">
            <Badge
              variant="outline"
              className="border-zinc-700 text-zinc-400 rounded-none font-mono text-[10px] tracking-widest uppercase px-3 py-1"
            >
              About Subtitle Placeholder
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-sans text-[15vw] md:text-[8vw] text-zinc-50 font-black leading-[0.85] tracking-tighter uppercase"
          >
            About Us<br />
            <span className="text-zinc-600">Placeholder.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-sans text-base md:text-lg text-zinc-400 max-w-[52ch] leading-relaxed"
          >
            About page short description placeholder. This text will be replaced with the brand&apos;s
            actual story — who we are, what we stand for, and why we make what we make.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center gap-4 mt-2">
            <div className="h-px bg-zinc-800 w-8" />
            <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
              Est. Year Placeholder
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Section 2 — Brand Story
// ─────────────────────────────────────────
function BrandStorySection() {
  const paragraphs = [
    'Brand story paragraph one placeholder. This is where the origin of the brand will be described — the founding moment, the original vision, and the people behind the first drop.',
    'Brand story paragraph two placeholder. This section elaborates on how the brand evolved — what problems it set out to solve, the aesthetic direction it chose, and the community it sought to serve.',
    'Brand story paragraph three placeholder. The closing paragraph reflects on where the brand stands today — its mission, its values, and its vision for the future of streetwear.',
  ];

  return (
    <section className="w-full bg-zinc-900 border-y border-zinc-800 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-start">
          {/* Left: label + heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-5 flex flex-col gap-6 md:sticky md:top-36"
          >
            <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
              [ BRAND STORY ]
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-zinc-50">
              Brand Story<br />
              <span className="text-zinc-600">Title Placeholder.</span>
            </h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="h-px bg-zinc-800 flex-1 max-w-[60px]" />
              <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                Since Year Placeholder
              </span>
            </div>
          </motion.div>

          {/* Right: paragraphs */}
          <div className="md:col-span-7 flex flex-col gap-8">
            {paragraphs.map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.75, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-zinc-400 text-base leading-relaxed"
              >
                {text}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Section 3 — Values / Principles
// ─────────────────────────────────────────
const VALUES = [
  {
    index: '01',
    title: 'Value Title Placeholder',
    description:
      'Value description placeholder. A short explanation of what this principle means to the brand and how it is expressed in every product.',
  },
  {
    index: '02',
    title: 'Value Title Placeholder',
    description:
      'Value description placeholder. Describe the second core belief that shapes the brand identity, the creative process, and the community.',
  },
  {
    index: '03',
    title: 'Value Title Placeholder',
    description:
      'Value description placeholder. The third principle that connects the brand to its audience and distinguishes it in the market.',
  },
];

function ValuesSection() {
  return (
    <section className="w-full bg-zinc-950 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
            [ VALUES &amp; PRINCIPLES ]
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-zinc-50">
            What We<br />
            <span className="text-zinc-600">Stand For.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-zinc-800">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`${i > 0 ? 'md:border-l border-t md:border-t-0 border-zinc-800' : ''}`}
            >
              <Card className="h-full border-0 bg-transparent rounded-none">
                <CardContent className="p-8 md:p-10 flex flex-col gap-6 h-full">
                  <span className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase">
                    {v.index}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-zinc-50 leading-tight">
                    {v.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed flex-1">{v.description}</p>
                  <div className="h-px bg-zinc-800 w-12 mt-auto" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Section 4 — Timeline / Milestones
// ─────────────────────────────────────────
const MILESTONES = [
  {
    year: 'YEAR 01',
    title: 'Milestone Title Placeholder',
    description: 'Milestone description placeholder — the first key event in the brand\'s journey.',
  },
  {
    year: 'YEAR 02',
    title: 'Milestone Title Placeholder',
    description: 'Milestone description placeholder — a significant expansion or product launch that shaped the brand.',
  },
  {
    year: 'YEAR 03',
    title: 'Milestone Title Placeholder',
    description: 'Milestone description placeholder — recognition, community growth, or a defining collaboration.',
  },
  {
    year: 'YEAR 04',
    title: 'Milestone Title Placeholder',
    description: 'Milestone description placeholder — the most recent landmark that represents where the brand stands today.',
  },
];

function TimelineSection() {
  return (
    <section className="w-full bg-zinc-900 border-y border-zinc-800 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
            [ MILESTONES ]
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-zinc-50">
            Our <span className="text-zinc-600">Journey.</span>
          </h2>
        </motion.div>

        <div className="relative flex flex-col gap-0">
          {/* Vertical line */}
          <div className="absolute left-[22px] md:left-[30px] top-3 bottom-3 w-px bg-zinc-800 hidden md:block" />

          {MILESTONES.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 border-b border-zinc-800 py-10 md:py-12"
            >
              {/* Year node */}
              <div className="md:col-span-2 flex md:flex-col items-center md:items-start gap-4 md:gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 rounded-full border-2 border-zinc-500 bg-zinc-900 relative z-10 md:ml-[18px]" />
                </div>
                <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase md:ml-8">
                  {m.year}
                </span>
              </div>

              {/* Content */}
              <div className="md:col-span-10 flex flex-col gap-3 md:pl-8">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-zinc-50">
                  {m.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-[60ch]">
                  {m.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Section 5 — Team / Studio
// ─────────────────────────────────────────
const TEAM = [
  { name: 'Team Member Name', title: 'Role / Title Placeholder' },
  { name: 'Team Member Name', title: 'Role / Title Placeholder' },
  { name: 'Team Member Name', title: 'Role / Title Placeholder' },
];

function TeamSection() {
  return (
    <section className="w-full bg-zinc-950 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
            [ TEAM &amp; STUDIO ]
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-zinc-50">
            The People<br />
            <span className="text-zinc-600">Behind It.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {TEAM.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 group"
            >
              {/* Avatar placeholder */}
              <div className="aspect-square bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 transition-colors overflow-hidden relative flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="font-mono text-[9px] text-zinc-700 uppercase tracking-widest">
                    Team Photo
                  </span>
                  <span className="font-mono text-[8px] text-zinc-800 uppercase tracking-wider">
                    1 : 1
                  </span>
                </div>
                {/* Corner accents */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-zinc-700" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-zinc-700" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-zinc-700" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-zinc-700" />
              </div>

              <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-100">
                    {member.name}
                  </h3>
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                  {member.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Section 6 — CTA
// ─────────────────────────────────────────
function CTASection() {
  return (
    <section className="w-full bg-zinc-900 border-t border-zinc-800 font-sans overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-32 md:py-48 flex flex-col gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase block mb-6">
            [ CTA PLACEHOLDER ]
          </span>
          <h2 className="text-5xl md:text-[6vw] font-black leading-[0.85] tracking-tighter uppercase text-zinc-50">
            CTA Heading<br />
            <span className="text-zinc-600">Placeholder.</span>
          </h2>
          <p className="mt-6 text-zinc-400 text-base max-w-[48ch] leading-relaxed">
            CTA supporting text placeholder. A short sentence inviting the user to explore the shop or latest collections.
          </p>
        </motion.div>

        <Separator className="bg-zinc-800" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/shop"
            className="group inline-flex items-center gap-3 h-14 px-8 bg-zinc-50 text-zinc-950 font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Shop Now
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/collections"
            className="group inline-flex items-center gap-3 h-14 px-8 bg-transparent border border-zinc-700 text-zinc-300 font-mono text-xs uppercase tracking-widest hover:border-zinc-400 hover:text-white transition-all"
          >
            Collections
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Page Export
// ─────────────────────────────────────────
export default function About() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans cursor-default selection:bg-white selection:text-black">
      {/* Site-wide noise texture */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
        style={{ backgroundImage: noiseBg }}
      />

      <Navbar />

      <main className="relative z-10">
        <HeroSection />
        <BrandStorySection />
        <ValuesSection />
        <TimelineSection />
        <TeamSection />
        <CTASection />
      </main>
    </div>
  );
}
