import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { notify } from '../lib/toast';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { id, token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            const errorMsg = 'Credentials do not match';
            setError(errorMsg);
            notify.error(errorMsg);
            return;
        }

        setLoading(true);

        try {
            const loadingToastId = notify.loading('Memperbarui password...');
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${id}/${token}`, {
                newPassword: password
            });
            setMessage(response.data.message);
            notify.update(loadingToastId, { render: 'Password berhasil diperbarui! Mengarahkan ke login...', type: 'success', isLoading: false, autoClose: 2000 });
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Invalid or expired payload link';
            setError(errorMessage);
            notify.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Staggered animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <main className="relative min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 font-sans overflow-hidden">
            {/* Background Texture */}
            <div 
                className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Glowing ambient background element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-900/30 rounded-full blur-[120px] pointer-events-none z-0" />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-zinc-950/40 backdrop-blur-2xl p-8 md:p-12 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
                    
                    {/* Header with Close Action */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <motion.h1 variants={itemVariants} className="text-xl font-bold tracking-widest uppercase text-zinc-50 font-sans">
                                RELOAD
                            </motion.h1>
                            <motion.span variants={itemVariants} className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mt-1 block">
                                [ NEW CREDENTIALS ]
                            </motion.span>
                        </div>
                        <motion.div variants={itemVariants}>
                            <Link to="/login" className="text-zinc-500 hover:text-zinc-50 transition-colors">
                                <X className="w-5 h-5" />
                            </Link>
                        </motion.div>
                    </div>

                    <motion.div variants={itemVariants} className="mb-10">
                        <h2 className="text-3xl font-bold text-white tracking-tight uppercase leading-none mb-4">ESTABLISH<br/>SECURE KEY.</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-[30ch]">
                            Initiate a new password sequence for your account authorization.
                        </p>
                    </motion.div>

                    <AnimatePresence>
                        {message && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-green-950/30 border-l-2 border-green-500 text-green-400 p-4 mb-6 text-xs uppercase tracking-widest font-mono"
                            >
                                {message}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-950/30 border-l-2 border-red-500 text-red-400 p-4 mb-6 text-xs uppercase tracking-widest font-mono"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <motion.div variants={itemVariants} className="space-y-6">
                            <div className="relative group">
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="peer w-full bg-transparent border-b border-zinc-800 py-4 text-zinc-50 font-mono text-sm placeholder:text-transparent focus:border-zinc-50 focus:outline-none transition-colors"
                                    placeholder="Password"
                                />
                                <label 
                                    htmlFor="password" 
                                    className="absolute left-0 top-4 text-xs font-mono uppercase tracking-widest text-zinc-600 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-zinc-400 peer-valid:-top-3 peer-valid:text-[10px] peer-valid:text-zinc-400 pointer-events-none"
                                >
                                    NEW KEY_
                                </label>
                            </div>

                            <div className="relative group">
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="peer w-full bg-transparent border-b border-zinc-800 py-4 text-zinc-50 font-mono text-sm placeholder:text-transparent focus:border-zinc-50 focus:outline-none transition-colors"
                                    placeholder="Confirm Password"
                                />
                                <label 
                                    htmlFor="confirmPassword" 
                                    className="absolute left-0 top-4 text-xs font-mono uppercase tracking-widest text-zinc-600 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-zinc-400 peer-valid:-top-3 peer-valid:text-[10px] peer-valid:text-zinc-400 pointer-events-none"
                                >
                                    CONFIRM RE-ENTRY_
                                </label>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-4">
                            <motion.button
                                whileHover={{ scale: 0.98 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={loading}
                                className="w-full relative group bg-zinc-50 text-zinc-950 font-bold h-14 rounded-none flex items-center justify-center overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                            >
                                <span className="relative z-10 flex items-center gap-2 group-hover:gap-4 transition-all">
                                    {loading ? 'PROCESSING...' : 'SECURE CREDENTIALS'}
                                    {!loading && <Lock className="w-4 h-4" />}
                                </span>
                                <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                            </motion.button>
                        </motion.div>
                    </form>

                    <motion.div variants={itemVariants} className="mt-10 flex flex-col gap-4 text-center">
                        <Link to="/login" className="text-xs uppercase font-mono tracking-widest text-zinc-500 hover:text-zinc-50 transition-colors">
                            REVERT TO LOGIN
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </main>
    );
}