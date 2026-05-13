import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { notify } from '../lib/toast';
import { useTranslation } from 'react-i18next';

export default function Login() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [requireOtp, setRequireOtp] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        let timer;
        if (requireOtp && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [requireOtp, timeLeft]);
    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = location.state?.from || '/';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/login', formData);

            if (response.data.requireOtp) {
                setRequireOtp(true);
                setTimeLeft(60);
                setTempToken(response.data.tempToken);
                notify.success(response.data.message);
                return;
            }

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            notify.success('Login successful! Redirecting...');

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Invalid credentials';
            setError(errorMessage);
            notify.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/verify-otp', {
                tempToken,
                otp
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            notify.success('Login successful! Redirecting...');

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'OTP Verification failed';
            setError(errorMessage);
            notify.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/google', {
                token: credentialResponse.credential
            });

            if (response.data.requireOtp) {
                setRequireOtp(true);
                setTimeLeft(60);
                setTempToken(response.data.tempToken);
                notify.success(response.data.message);
                return;
            }

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            notify.success('Google sign-in successful! Redirecting...');

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Google sign-in failed';
            setError(errorMessage);
            notify.error(errorMessage);
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
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"></div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 w-full max-w-[420px] pt-12 pb-16 px-8 md:px-12 bg-zinc-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
                {/* Close Button */}
                <Link to={fromPath} className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-50 transition-colors">
                    <X className="w-5 h-5 stroke-[1.5]" />
                    <span className="sr-only">Close</span>
                </Link>

                <motion.div variants={itemVariants} className="mb-12">
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-zinc-50 font-sans font-bold text-xl tracking-widest leading-none">RELOAD</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 tracking-tighter uppercase leading-none mt-8" dangerouslySetInnerHTML={{ __html: t('login.welcome_back') }}></h2>
                    <p className="text-sm text-zinc-400 mt-4 leading-relaxed max-w-[30ch]">
                        {t('login.sign_in_desc')}
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

                {requireOtp ? (
                    <motion.form variants={itemVariants} onSubmit={handleOtpSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="block text-zinc-400 text-xs font-mono uppercase tracking-[0.1em]">{t('login.otp_label')}</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                disabled={timeLeft === 0}
                                className="w-full bg-transparent border-0 border-b border-zinc-700 py-3 text-zinc-50 font-mono text-center tracking-[1em] text-xl placeholder:text-zinc-600 focus:outline-none focus:border-zinc-50 focus:ring-0 px-0 rounded-none transition-colors disabled:opacity-50"
                                placeholder={t('login.otp_placeholder')}
                                maxLength={6}
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs font-mono uppercase tracking-widest">
                                <span className="text-zinc-500">{t('login.expires_in')}</span>
                                <span className={timeLeft <= 10 ? 'text-red-500 font-bold' : 'text-zinc-300'}>{timeLeft}s</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-900 rounded-none overflow-hidden">
                                <motion.div 
                                    className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-zinc-50'}`}
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${(timeLeft / 60) * 100}%` }}
                                    transition={{ duration: 1, ease: 'linear' }}
                                />
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: timeLeft === 0 ? 1 : 0.98 }}
                            whileTap={{ scale: timeLeft === 0 ? 1 : 0.95 }}
                            type="submit"
                            disabled={loading || timeLeft === 0}
                            className="w-full bg-zinc-50 text-zinc-950 font-bold uppercase text-sm tracking-widest hover:bg-zinc-200 transition-colors rounded-none h-14 px-8 flex items-center justify-center disabled:opacity-50 disabled:hover:bg-zinc-50"
                        >
                            {timeLeft === 0 ? t('login.otp_expired') : (loading ? t('login.verifying_btn') : t('login.verify_otp_btn'))}
                        </motion.button>
                        
                        <div className="text-center mt-6">
                            <button 
                                type="button" 
                                onClick={() => setRequireOtp(false)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-widest transition-colors"
                            >
                                {t('login.back_to_login')}
                            </button>
                        </div>
                    </motion.form>
                ) : (
                    <>
                        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="block text-zinc-400 text-xs font-mono uppercase tracking-[0.1em]">{t('login.email_label')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    onChange={handleChange}
                                    required
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    className="w-full bg-transparent border-0 border-b border-zinc-700 py-3 text-zinc-50 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-50 focus:ring-0 px-0 rounded-none transition-colors"
                                    placeholder={t('login.email_placeholder')}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="block text-zinc-400 text-xs font-mono uppercase tracking-[0.1em]">{t('login.password_label')}</label>
                                    <Link to="/forgot-password" className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-widest transition-colors">
                                        {t('login.forgot_password')}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        onChange={handleChange} 
                                        required
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        className="w-full bg-transparent border-0 border-b border-zinc-700 py-3 pr-10 text-zinc-50 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-50 focus:ring-0 px-0 rounded-none transition-colors"
                                        placeholder={t('login.password_placeholder')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-2"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 0.98 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-50 text-zinc-950 font-bold uppercase text-sm tracking-widest hover:bg-zinc-200 transition-colors rounded-none h-14 px-8 mt-4 flex items-center justify-center"
                            >
                                {loading ? t('login.continuing_btn') : t('login.sign_in_btn')}
                            </motion.button>
                        </motion.form>

                        <motion.div variants={itemVariants} className="my-10 flex items-center justify-center gap-4">
                            <span className="flex-1 border-b border-zinc-800"></span>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{t('login.or_continue_with')}</span>
                            <span className="flex-1 border-b border-zinc-800"></span>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex justify-center w-full [&>div]:w-full">
                            <div className="flex justify-center w-full">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => {
                                        const errorMsg = 'Google sign-in verification failed';
                                        setError(errorMsg);
                                        notify.error(errorMsg);
                                    }}
                                    theme="filled_black"
                                    shape="rectangular"
                                    text="signin_with"
                                    width="100%"
                                />
                            </div>
                        </motion.div>

                        <motion.p variants={itemVariants} className="text-center text-zinc-500 mt-10 text-xs font-mono uppercase tracking-widest">
                            {t('login.no_account')}{' '}
                            <Link to="/register" className="text-zinc-300 hover:text-zinc-50 transition-colors">
                                {t('login.register')}
                            </Link>
                        </motion.p>
                    </>
                )}
            </motion.div>
        </main>
    );
}