import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";

export default function EndorsementCarousel() {
    const [endorsements, setEndorsements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const isFewItems = endorsements.length < 5;
    const extendedItems = isFewItems 
        ? endorsements 
        : [...endorsements, ...endorsements, ...endorsements];

    useEffect(() => {
        const fetchEndorsements = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/endorsements");
                const data = Array.isArray(res.data) ? res.data : [];
                const active = data.filter(
                    (item) => item.is_active === true || item.is_active === "true"
                );
                
                if (active.length >= 5) {
                    setCurrentIndex(active.length);
                } else {
                    setCurrentIndex(0);
                }
                
                setEndorsements(active);
            } catch (error) {
                console.error("Error fetching endorsements:", error);
                setEndorsements([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEndorsements();
    }, []);

    const nextSlide = useCallback(() => {
        if (endorsements.length === 0) return;
        if (isFewItems) {
            setCurrentIndex((prev) => (prev + 1) % endorsements.length);
        } else {
            setIsAnimating(true);
            setCurrentIndex((prev) => prev + 1);
        }
    }, [endorsements.length, isFewItems]);

    useEffect(() => {
        if (endorsements.length <= 1 || isPaused) return;
        const timer = setInterval(nextSlide, 3500);
        return () => clearInterval(timer);
    }, [endorsements.length, isPaused, nextSlide]);

    useEffect(() => {
        if (isFewItems) return;
        
        if (currentIndex === endorsements.length * 2) {
            const timeout = setTimeout(() => {
                setIsAnimating(false);
                setCurrentIndex(endorsements.length);
            }, 750);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, endorsements.length, isFewItems]);

    if (loading) {
        return (
            <section className="w-full bg-zinc-950 font-sans">
                <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 text-center">
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
                        Loading...
                    </span>
                </div>
            </section>
        );
    }

    if (endorsements.length === 0) return null;

    return (
        <section className="w-full bg-zinc-950 border-y border-zinc-800/60 font-sans overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-20 md:py-28">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-14"
                >
                    <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase">
                        [ ENDORSED BY ]
                    </span>
                </motion.div>

                <div
                    className={`relative overflow-hidden w-full py-4 -my-4 ${isFewItems ? 'flex justify-center' : ''}`}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <motion.div
                        className="flex"
                        style={{
                            gap: '24px',
                            width: isFewItems ? '100%' : 'max-content',
                            justifyContent: isFewItems ? 'center' : 'flex-start',
                            paddingLeft: isFewItems ? 0 : 'calc(50% - 88px)',
                            paddingRight: isFewItems ? 0 : 'calc(50% - 88px)'
                        }}
                        animate={{
                            x: isFewItems ? 0 : `-${currentIndex * 200}px`,
                        }}
                        initial={false}
                        transition={{
                            duration: isAnimating ? 0.7 : 0,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        {extendedItems.map((item, i) => {
                            const isCenter =
                                i % endorsements.length ===
                                currentIndex % endorsements.length;
                            return (
                                <motion.div
                                    key={`${item.id}-${i}`}
                                    className="shrink-0 flex flex-col items-center gap-4 group cursor-default"
                                    style={{ width: "176px" }}
                                    animate={{
                                        scale: isCenter ? 1.05 : 0.95,
                                        opacity: isCenter ? 1 : 0.5,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeOut",
                                    }}
                                >
                                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-zinc-600 transition-colors">
                                        <img
                                            src={`http://localhost:5000${item.image_path}`}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
                                    </div>
                                    <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-widest text-center leading-normal max-w-full group-hover:text-zinc-200 transition-colors pb-1">
                                        {item.name}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    <div className="absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none z-10" />
                </div>

                {endorsements.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-10 relative z-20">
                        {endorsements.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setIsAnimating(true);
                                    setCurrentIndex(isFewItems ? i : endorsements.length + i);
                                }}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    i === currentIndex % endorsements.length
                                        ? "w-6 bg-zinc-400"
                                        : "w-1.5 bg-zinc-700 hover:bg-zinc-600"
                                }`}
                                aria-label={`Go to endorsement ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
