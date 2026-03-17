import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/google', {
                token: credentialResponse.credential
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed');
        }
    };

    // Stagger container for the motion reveal
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20
            }
        }
    };

    return (
        <main className="relative flex items-center justify-center min-h-[100dvh] bg-zinc-950 px-4 py-8 font-sans selection:bg-zinc-50 selection:text-zinc-950 overflow-hidden">
            {/* Minimal background noise/grain */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 w-full max-w-[420px] pt-12 pb-16 px-8 md:px-12 bg-zinc-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
                {/* Close Button */}
                <Link to="/" className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-50 transition-colors">
                    <X className="w-5 h-5 stroke-[1.5]" />
                    <span className="sr-only">Close</span>
                </Link>

                <motion.div variants={itemVariants} className="mb-12">
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-zinc-50 font-sans font-bold text-xl tracking-widest leading-none">RELOAD</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 tracking-tighter uppercase leading-none mt-8">
                        Welcome <br className="hidden sm:block" />Back
                    </h2>
                    <p className="text-sm text-zinc-400 mt-4 leading-relaxed max-w-[30ch]">
                        Sign in to continue to Reload.
                    </p>
                </motion.div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        className="bg-red-950/30 border border-red-900/50 text-red-500 p-4 rounded-none mb-8 text-xs font-mono uppercase tracking-widest text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="block text-zinc-400 text-xs font-mono uppercase tracking-[0.1em]">Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            onChange={handleChange} 
                            required
                            className="w-full bg-transparent border-0 border-b border-zinc-700 py-3 text-zinc-50 font-mono text-sm uppercase placeholder:text-zinc-600 focus:outline-none focus:border-zinc-50 focus:ring-0 px-0 rounded-none transition-colors"
                            placeholder="YOUR@EMAIL.COM" 
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-[0.1em]">Password</label>
                            <Link to="/forgot-password" className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-widest transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <input 
                            type="password" 
                            name="password" 
                            onChange={handleChange} 
                            required
                            className="w-full bg-transparent border-0 border-b border-zinc-700 py-3 text-zinc-50 font-mono text-sm uppercase placeholder:text-zinc-600 focus:outline-none focus:border-zinc-50 focus:ring-0 px-0 rounded-none transition-colors"
                            placeholder="••••••••" 
                        />
                    </div>

                    <motion.button 
                        whileHover={{ scale: 0.98 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-zinc-50 text-zinc-950 font-bold uppercase text-sm tracking-widest hover:bg-zinc-200 transition-colors rounded-none h-14 px-8 mt-4 flex items-center justify-center"
                    >
                        {loading ? 'Continuing...' : 'Sign in'}
                    </motion.button>
                </motion.form>

                <motion.div variants={itemVariants} className="my-10 flex items-center justify-center gap-4">
                    <span className="flex-1 border-b border-zinc-800"></span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Or continue with</span>
                    <span className="flex-1 border-b border-zinc-800"></span>
                </motion.div>

                <motion.div variants={itemVariants} className="flex justify-center w-full [&>div]:w-full">
                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-in verification failed.')}
                            theme="filled_black"
                            shape="rectangular"
                            text="signin_with"
                            width="100%"
                        />
                    </div>
                </motion.div>

                <motion.p variants={itemVariants} className="text-center text-zinc-500 mt-10 text-xs font-mono uppercase tracking-widest">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-zinc-300 hover:text-zinc-50 transition-colors">
                        Register
                    </Link>
                </motion.p>
            </motion.div>
        </main>
    );
}