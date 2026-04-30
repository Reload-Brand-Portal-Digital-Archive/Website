import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, ChevronDown, Eye, EyeOff, Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { notify } from '../lib/toast';
import Navbar from '../components/ui/Navbar';

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

const STATUS_STYLES = {
    'Belum Dibaca':                       { bg: 'bg-zinc-800',        text: 'text-zinc-400',    border: 'border-zinc-700',       accent: 'bg-zinc-600',    label: 'Pending' },
    'Dibaca':                             { bg: 'bg-zinc-800',        text: 'text-zinc-300',    border: 'border-zinc-600',       accent: 'bg-zinc-500',    label: 'Reviewed' },
    'Dalam proses penyiapan barang':      { bg: 'bg-amber-500/10',    text: 'text-amber-400',   border: 'border-amber-500/40',   accent: 'bg-amber-500',   label: 'Processing' },
    'Barang siap untuk diambil di gudang':{ bg: 'bg-blue-500/10',     text: 'text-blue-400',    border: 'border-blue-500/40',    accent: 'bg-blue-500',    label: 'Ready for Pickup' },
    'Pesanan selesai':                    { bg: 'bg-emerald-500/10',  text: 'text-emerald-400', border: 'border-emerald-500/40', accent: 'bg-emerald-500', label: 'Completed' },
};

function getStatusStyle(status) {
    return STATUS_STYLES[status] || { bg: 'bg-zinc-800', text: 'text-zinc-500', border: 'border-zinc-700', accent: 'bg-zinc-600', label: status };
}

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
    const [activeTab, setActiveTab] = useState('account');
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
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersLoaded, setOrdersLoaded] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loadingNewsletter, setLoadingNewsletter] = useState(true);

    const isGoogleUser = !!user.google_id;

    useEffect(() => {
        if (activeTab === 'orders' && !ordersLoaded) {
            fetchOrders();
        }
        if (activeTab === 'account') {
            fetchNewsletterStatus();
        }
    }, [activeTab]);

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
                notify.success('Unsubscribed from newsletter');
            } else {
                await axios.post(`${API}/api/newsletter/subscribe`, { email }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsSubscribed(true);
                notify.success('Subscribed to newsletter');
            }
        } catch {
            notify.error('Failed to update newsletter preferences');
        } finally {
            setLoadingNewsletter(false);
        }
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const res = await axios.get(`${API}/api/profile/wholesale`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
            setOrdersLoaded(true);
        } catch (err) {
            console.error('Error fetching wholesale orders:', err);
            notify.error('Failed to load wholesale orders.');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        if (newPassword || confirmPassword || currentPassword) {
            if (!currentPassword) return notify.warning('Please enter your current password.');
            if (!newPassword) return notify.warning('Please enter a new password.');
            if (newPassword.length < 6) return notify.warning('New password must be at least 6 characters.');
            if (newPassword !== confirmPassword) return notify.error('New password and confirmation do not match!');
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
            const msg = err.response?.data?.message || 'Failed to update profile.';
            notify.error(msg);
        } finally {
            setSavingProfile(false);
        }
    };

    const tabs = [
        { key: 'account', label: '[ ACCOUNT INFO ]', icon: User },
        { key: 'orders', label: '[ WHOLESALE ORDERS ]', icon: Package },
    ];

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
                        [ ACCOUNT ]
                    </motion.span>
                    <motion.h1 variants={itemVariants} className="font-sans text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
                        PROFILE <br className="hidden md:block" />
                        <span className="text-zinc-600">DASHBOARD</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="font-mono text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed mt-5">
                        Manage your identity, credentials, and wholesale order history.
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
                                {user.name || 'Unknown User'}
                            </h2>
                            <span className="font-mono text-[10px] tracking-widest uppercase border border-zinc-700 text-zinc-400 px-2 py-0.5">
                                {user.role || 'User'}
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
                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Member Since</span>
                        <span className="text-xs font-mono text-zinc-400">
                            {user.created_at
                                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                : '—'}
                        </span>
                    </div>
                </motion.div>

                {/* ── Tab Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-0 border-b border-zinc-800 mb-8"
                >
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-3.5 font-mono text-[11px] md:text-xs tracking-widest uppercase transition-all border-b-2 -mb-[2px] cursor-pointer ${
                                    isActive
                                        ? 'border-white text-white'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </motion.div>

                {/* ── Account Tab ── */}
                {activeTab === 'account' && (
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
                                    <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">Personal Information</h2>
                                </div>
                                <div className="p-6 md:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="profile-name" className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Display Name</label>
                                            <input
                                                id="profile-name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="bg-zinc-950 border border-zinc-800 focus:border-zinc-400 outline-none h-11 px-4 text-sm text-zinc-100 font-mono transition-colors"
                                                placeholder="YOUR NAME"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="profile-email" className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
                                                Email Address <span className="text-zinc-700">(read-only)</span>
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
                                    <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">Newsletter Preferences</h2>
                                </div>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <h3 className="font-mono text-[11px] uppercase tracking-widest text-zinc-200 mb-1.5">Underground Intelligence</h3>
                                            <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                                                Receive exclusive drops and secret access codes directly to your inbox.
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
                                                {loadingNewsletter ? '...' : isSubscribed ? 'Active' : 'Off'}
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
                                        <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">Change Password</h2>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-5">
                                        <PasswordField
                                            id="profile-current-password"
                                            label="Current Password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            show={showCurrentPass}
                                            onToggle={() => setShowCurrentPass(!showCurrentPass)}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <PasswordField
                                                id="profile-new-password"
                                                label="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                show={showNewPass}
                                                onToggle={() => setShowNewPass(!showNewPass)}
                                            />
                                            <PasswordField
                                                id="profile-confirm-password"
                                                label="Confirm New Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                show={showConfirmPass}
                                                onToggle={() => setShowConfirmPass(!showConfirmPass)}
                                            />
                                        </div>

                                        <div className="flex items-start gap-2 pt-1">
                                            <Lock className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
                                            <p className="text-[10px] font-mono text-zinc-600 tracking-wider leading-relaxed">
                                                Leave all password fields empty if you only want to update your display name. Minimum 6 characters required.
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
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Save Changes
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </motion.button>
                                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest hidden md:block">
                                    Updates name and/or password
                                </span>
                            </motion.div>
                        </form>
                    </motion.div>
                )}

                {/* ── Orders Tab ── */}
                {activeTab === 'orders' && (
                    <motion.div
                        key="orders"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        {loadingOrders ? (
                            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-24">
                                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-5" />
                                <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Loading orders...</span>
                            </motion.div>
                        ) : orders.length === 0 ? (
                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col items-center justify-center py-20 md:py-28 border border-dashed border-zinc-800 bg-zinc-900/20"
                            >
                                <Package className="w-10 h-10 text-zinc-700 mb-6" />
                                <div className="text-center font-mono space-y-3">
                                    <p className="text-zinc-400 text-sm tracking-wider">
                                        <span className="text-emerald-500">$</span> query --orders --user={user.name || 'you'}
                                    </p>
                                    <p className="text-zinc-600 text-xs tracking-widest uppercase">
                                        No transactions found in archive.
                                    </p>
                                </div>
                                <Link
                                    to="/wholesale"
                                    className="mt-8 inline-flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-mono text-xs uppercase tracking-widest h-11 px-8 transition-colors"
                                >
                                    [ Start Wholesale Order ]
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => {
                                    const style = getStatusStyle(order.status);
                                    const isExpanded = expandedOrder === order.order_id;

                                    return (
                                        <motion.div
                                            key={order.order_id}
                                            variants={itemVariants}
                                            className="border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-700 transition-colors flex"
                                        >
                                            {/* Status accent strip */}
                                            <div className={`w-1 shrink-0 ${style.accent}`} />

                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                                                    className="w-full flex items-center justify-between p-4 md:p-5 text-left cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <span className="font-mono text-xs text-zinc-500">#{order.order_id}</span>
                                                                <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
                                                                    {style.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <span className="text-sm text-zinc-200 font-medium uppercase truncate max-w-[200px] md:max-w-none">
                                                                    {order.inquiry_type || 'Wholesale'}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-zinc-600">
                                                                    {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0 ml-4">
                                                        <span className="font-mono text-[10px] uppercase tracking-wider hidden md:inline">
                                                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                                                        </span>
                                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </button>

                                                <AnimatePresence initial={false}>
                                                    {isExpanded && (
                                                        <motion.div
                                                            key="expand"
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="border-t border-zinc-800 bg-zinc-950/50">
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-5 border-b border-zinc-800/50">
                                                                    {[
                                                                        { label: 'Name', value: order.name },
                                                                        { label: 'Phone', value: order.phone || '—' },
                                                                        { label: 'Address', value: order.address || '—' },
                                                                        { label: 'Message', value: order.message || 'No message', italic: true },
                                                                    ].map(({ label, value, italic }) => (
                                                                        <div key={label}>
                                                                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">{label}</span>
                                                                            <span className={`text-xs text-zinc-300 line-clamp-2 ${italic ? 'italic text-zinc-400' : ''}`}>{value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {order.items && order.items.length > 0 ? (
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                                                            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-mono tracking-widest">
                                                                                <tr>
                                                                                    <th className="px-4 md:px-5 py-3 font-medium">Product</th>
                                                                                    <th className="px-4 md:px-5 py-3 font-medium">Size</th>
                                                                                    <th className="px-4 md:px-5 py-3 font-medium">Qty</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-zinc-800/50">
                                                                                {order.items.map((item, i) => (
                                                                                    <tr key={item.item_id || `${item.product_id}-${item.size}-${i}`} className="hover:bg-zinc-800/20 transition-colors">
                                                                                        <td className="px-4 md:px-5 py-3 text-zinc-200">
                                                                                            <span className="font-medium uppercase text-xs truncate inline-block max-w-[160px] md:max-w-[360px]">
                                                                                                {item.product_name_snapshot}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="px-4 md:px-5 py-3 font-mono text-zinc-400 text-xs">{item.size}</td>
                                                                                        <td className="px-4 md:px-5 py-3">
                                                                                            <span className="inline-block px-2 py-0.5 bg-zinc-800 text-white text-xs font-mono">{item.quantity}</span>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-6 text-center">
                                                                        <span className="text-zinc-600 font-mono text-xs uppercase tracking-wider">No items recorded</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
