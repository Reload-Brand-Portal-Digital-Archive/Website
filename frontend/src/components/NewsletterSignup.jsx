import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/newsletter/subscribe`, { email }, { headers });
            toast.success(res.data.message || 'Thanks for subscribing!');
            setEmail('');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to subscribe.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-full px-6 md:px-12 py-32 md:py-48 max-w-[1600px] mx-auto text-zinc-50 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-16"
            >
                <div className="max-w-lg">
                    <span className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase block mb-4">
                        [ NEWSLETTER ]
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black leading-none tracking-tighter uppercase mb-2">
                        Sign up for{" "}
                        <span className="text-zinc-600">updates.</span>
                    </h2>
                </div>

                <form className="w-full md:max-w-md" onSubmit={handleSubmit}>
                    <div className="bg-zinc-800 border border-zinc-700 p-4 flex items-center gap-2 focus-within:border-zinc-500 transition-colors">
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            disabled={loading}
                            required
                            className="w-full bg-transparent border-0 text-zinc-50 font-mono text-sm uppercase placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 rounded-none h-auto py-1"
                        />
                        <Button
                            type="submit"
                            variant="ghost"
                            disabled={loading}
                            className="text-xs font-mono tracking-[0.2em] text-zinc-400 hover:text-zinc-50 hover:bg-transparent uppercase px-0 h-auto whitespace-nowrap shrink-0 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                        </Button>
                    </div>
                    <p className="mt-3 font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                        Get drop updates. Unsubscribe anytime.
                    </p>
                </form>
            </motion.div>
        </section>
    );
}
