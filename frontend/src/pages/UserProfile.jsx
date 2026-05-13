import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Eye, EyeOff, Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { notify } from '../lib/toast';
import Navbar from '../components/ui/Navbar';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_URL;

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 22 } }
};



function AvatarInitials({ name }) {
    const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="w-16 h-16 shrink-0 bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-xl font-black text-zinc-100 tracking-tight">{initials}</span>
        </div>
    );
}

function PasswordField({ id, label, value, onChange, show, onToggle, placeholder = '••••••••' }) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="bg-zinc-950 border border-zinc-800 focus:border-zinc-400 outline-none h-11 px-4 pr-12 text-sm text-zinc-100 font-mono w-full transition-colors"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                    aria-label="Toggle password visibility"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

export default function UserProfile() {
    const { t } = useTranslation();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const token = localStorage.getItem('token');
    const [name, setName] = useState(user.name || '');
    const [email] = useState(user.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loadingNewsletter, setLoadingNewsletter] = useState(true);

    const isGoogleUser = !!user.google_id;

    useEffect(() => {
        fetchNewsletterStatus();
    }, []);

    const fetchNewsletterStatus = async () => {
        setLoadingNewsletter(true);
        try {
            const res = await axios.get(`${API}/api/newsletter/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsSubscribed(res.data.isSubscribed);
        } catch (err) {
            console.error('Error fetching newsletter status:', err);
        } finally {
            setLoadingNewsletter(false);
        }
    };

    const handleNewsletterToggle = async () => {
        if (loadingNewsletter) return;
        setLoadingNewsletter(true);
        try {
            if (isSubscribed) {
                await axios.delete(`${API}/api/newsletter/unsubscribe-auth`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsSubscribed(false);
                notify.success(t('user_profile.unsubscribed_success'));
            } else {
                await axios.post(`${API}/api/newsletter/subscribe`, { email }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsSubscribed(true);
                notify.success(t('user_profile.subscribed_success'));
            }
        } catch {
            notify.error(t('user_profile.newsletter_error'));
        } finally {
            setLoadingNewsletter(false);
        }
    };



    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        if (newPassword || confirmPassword || currentPassword) {
            if (!currentPassword) return notify.warning(t('user_profile.err_current_pass'));
            if (!newPassword) return notify.warning(t('user_profile.err_new_pass'));
            if (newPassword.length < 6) return notify.warning(t('user_profile.err_pass_length'));
            if (newPassword !== confirmPassword) return notify.error(t('user_profile.err_pass_match'));
        }

        setSavingProfile(true);
        try {
            const payload = { name };
            if (newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            const res = await axios.put(`${API}/api/profile/update`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedUser = res.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            notify.success(res.data.message);
        } catch (err) {
            const msg = err.response?.data?.message || t('user_profile.err_update_profile');
            notify.error(msg);
        } finally {
            setSavingProfile(false);
        }
    };



    return (
        <div className="bg-zinc-950 min-h-screen text-zinc-50 font-sans selection:bg-zinc-800 selection:text-white flex flex-col relative overflow-hidden">

            {/* Film grain noise texture — matches Collections/Shop */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <Navbar />

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 md:px-12 max-w-[1100px] w-full mx-auto">

                {/* ── Hero Header ── */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="mb-12 mt-8"
                >
                    <motion.span variants={itemVariants} className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase block mb-4">
                        {t('user_profile.account_badge')}
                    </motion.span>
                    <motion.h1 variants={itemVariants} className="font-sans text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
                        {t('user_profile.title_1')} <br className="hidden md:block" />
                        <span className="text-zinc-600">{t('user_profile.title_2')}</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="font-mono text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed mt-5">
                        {t('user_profile.subtitle')}
                    </motion.p>
                </motion.div>

                {/* ── User Identity Block ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10 p-5 border border-zinc-800 bg-zinc-900/40"
                >
                    <AvatarInitials name={user.name} />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-50 truncate">
                                {user.name || t('user_profile.unknown_user')}
                            </h2>
                            <span className="font-mono text-[10px] tracking-widest uppercase border border-zinc-700 text-zinc-400 px-2 py-0.5">
                                {user.role === 'user' ? t('user_profile.role_user') : (user.role || t('user_profile.role_user'))}
                            </span>
                            {isGoogleUser && (
                                <span className="font-mono text-[10px] tracking-widest uppercase border border-emerald-500/40 text-emerald-400 px-2 py-0.5">
                                    Google SSO
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-mono text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <div className="hidden md:flex shrink-0 border-l border-zinc-800 pl-5 flex-col gap-1 text-right">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{t('user_profile.member_since')}</span>
                        <span className="text-xs font-mono text-zinc-400">
                            {user.created_at
                                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                : '—'}
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    key="account"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                        <form onSubmit={handleProfileSubmit} className="space-y-6">

                            {/* Personal Information */}
                            <motion.div
                                variants={itemVariants}
                                className="border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-center gap-2.5 px-6 md:px-8 py-4 border-b border-zinc-800">
                                    <User className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">{t('user_profile.personal_info')}</h2>
                                </div>
                                <div className="p-6 md:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="profile-name" className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">{t('user_profile.display_name')}</label>
                                            <input
                                                id="profile-name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="bg-zinc-950 border border-zinc-800 focus:border-zinc-400 outline-none h-11 px-4 text-sm text-zinc-100 font-mono transition-colors"
                                                placeholder={t('user_profile.your_name')}
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="profile-email" className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
                                                {t('user_profile.email_address')} <span className="text-zinc-700">{t('user_profile.read_only')}</span>
                                            </label>
                                            <input
                                                id="profile-email"
                                                type="email"
                                                value={email}
                                                disabled
                                                className="bg-zinc-950/50 border border-zinc-800/50 h-11 px-4 text-sm text-zinc-500 font-mono cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Newsletter Preferences */}
                            <motion.div
                                variants={itemVariants}
                                className="border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-center gap-2.5 px-6 md:px-8 py-4 border-b border-zinc-800">
                                    <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                                    <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">{t('user_profile.newsletter_prefs')}</h2>
                                </div>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <h3 className="font-mono text-[11px] uppercase tracking-widest text-zinc-200 mb-1.5">{t('user_profile.underground_intel')}</h3>
                                            <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                                                {t('user_profile.newsletter_desc')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleNewsletterToggle}
                                                disabled={loadingNewsletter}
                                                aria-pressed={isSubscribed}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    isSubscribed ? 'bg-emerald-500' : 'bg-zinc-700'
                                                }`}
                                            >
                                                <span className="sr-only">Toggle newsletter</span>
                                                <span
                                                    aria-hidden="true"
                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        isSubscribed ? 'translate-x-2.5' : '-translate-x-2.5'
                                                    }`}
                                                />
                                            </button>
                                            <span className={`font-mono text-[9px] uppercase tracking-widest ${isSubscribed ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                                {loadingNewsletter ? '...' : isSubscribed ? t('user_profile.active') : t('user_profile.off')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Change Password */}
                            {!isGoogleUser && (
                                <motion.div
                                    variants={itemVariants}
                                    className="border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors border-l-2 border-l-amber-500/50"
                                >
                                    <div className="flex items-center gap-2.5 px-6 md:px-8 py-4 border-b border-zinc-800">
                                        <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                                        <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">{t('user_profile.change_password')}</h2>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-5">
                                        <PasswordField
                                            id="profile-current-password"
                                            label={t('user_profile.current_password')}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            show={showCurrentPass}
                                            onToggle={() => setShowCurrentPass(!showCurrentPass)}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <PasswordField
                                                id="profile-new-password"
                                                label={t('user_profile.new_password')}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                show={showNewPass}
                                                onToggle={() => setShowNewPass(!showNewPass)}
                                            />
                                            <PasswordField
                                                id="profile-confirm-password"
                                                label={t('user_profile.confirm_new_password')}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                show={showConfirmPass}
                                                onToggle={() => setShowConfirmPass(!showConfirmPass)}
                                            />
                                        </div>

                                        <div className="flex items-start gap-2 pt-1">
                                            <Lock className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
                                            <p className="text-[10px] font-mono text-zinc-600 tracking-wider leading-relaxed">
                                                {t('user_profile.password_hint')}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Save CTA */}
                            <motion.div variants={itemVariants} className="flex items-center gap-4 pt-2">
                                <motion.button
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={savingProfile}
                                    className="inline-flex items-center gap-3 bg-zinc-50 text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 font-mono text-xs uppercase tracking-widest h-12 px-10 transition-colors cursor-pointer"
                                >
                                    {savingProfile ? (
                                        <>
                                            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 border-t-zinc-900 animate-spin" />
                                            {t('user_profile.saving')}
                                        </>
                                    ) : (
                                        <>
                                            {t('user_profile.save_changes')}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </motion.button>
                                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest hidden md:block">
                                    {t('user_profile.save_hint')}
                                </span>
                            </motion.div>
                        </form>
                    </motion.div>
            </main>
        </div>
    );
}
