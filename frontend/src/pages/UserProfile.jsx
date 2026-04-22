import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Package, ChevronDown, ChevronRight, Eye, EyeOff, Terminal, ArrowRight } from 'lucide-react';
import { notify } from '../lib/toast';
import Navbar from '../components/ui/Navbar';

const API = 'http://localhost:5000';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};
const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 22 } }
};

const STATUS_STYLES = {
    'Belum Dibaca': { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700', label: 'Menunggu' },
    'Dibaca': { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-600', label: 'Dibaca' },
    'Dalam proses penyiapan barang': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/40', label: 'Dalam proses penyiapan barang' },
    'Barang siap untuk diambil di gudang': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/40', label: 'Barang siap untuk diambil di gudang' },
    'Pesanan selesai': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Pesanan selesai' },
};

function getStatusStyle(status) {
    return STATUS_STYLES[status] || { bg: 'bg-zinc-800', text: 'text-zinc-500', border: 'border-zinc-700', label: status };
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

    const isGoogleUser = !!user.google_id;

    useEffect(() => {
        if (activeTab === 'orders' && !ordersLoaded) {
            fetchOrders();
        }
    }, [activeTab]);

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
            if (!currentPassword) {
                return notify.warning('Please enter your current password.');
            }
            if (!newPassword) {
                return notify.warning('Please enter a new password.');
            }
            if (newPassword.length < 6) {
                return notify.warning('New password must be at least 6 characters.');
            }
            if (newPassword !== confirmPassword) {
                return notify.error('New password and confirmation do not match!');
            }
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
            <Navbar />

            <main className="flex-1 pt-28 md:pt-32 px-4 md:px-12 pb-24 max-w-[960px] w-full mx-auto">

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="mb-10"
                >
                    <motion.span variants={itemVariants} className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase block mb-3">
                        [ USER TERMINAL ]
                    </motion.span>
                    <motion.h1 variants={itemVariants} className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                        Profile <span className="text-zinc-600">Dashboard</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-sm text-zinc-500 mt-3 font-mono">
                        Logged in as <span className="text-zinc-300">{user.email}</span>
                        {isGoogleUser && <span className="ml-2 text-emerald-400 text-[10px] tracking-widest uppercase border border-emerald-500/30 px-2 py-0.5">Google SSO</span>}
                    </motion.p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-0 border-b border-zinc-800 mb-8"
                >
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3 font-mono text-[11px] md:text-xs tracking-widest uppercase transition-all border-b-2 -mb-[2px] cursor-pointer ${
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

                {activeTab === 'account' && (
                    <motion.div
                        key="account"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        <form onSubmit={handleProfileSubmit} className="space-y-8">
                            <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8">
                                <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                                    <Terminal className="w-4 h-4 text-emerald-400" />
                                    <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">Personal Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Display Name</label>
                                        <input
                                            id="profile-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-zinc-950 border border-zinc-800 focus:border-zinc-500 outline-none h-11 px-4 text-sm text-zinc-100 font-mono transition-colors"
                                            placeholder="YOUR NAME"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Email Address <span className="text-zinc-700">(read-only)</span></label>
                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={email}
                                            disabled
                                            className="bg-zinc-950/50 border border-zinc-800/50 h-11 px-4 text-sm text-zinc-500 font-mono cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {!isGoogleUser && (
                                <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8">
                                    <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                                        <Terminal className="w-4 h-4 text-amber-400" />
                                        <h2 className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase">Change Password</h2>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    id="profile-current-password"
                                                    type={showCurrentPass ? 'text' : 'password'}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="bg-zinc-950 border border-zinc-800 focus:border-zinc-500 outline-none h-11 px-4 pr-12 text-sm text-zinc-100 font-mono w-full transition-colors"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                                                >
                                                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        id="profile-new-password"
                                                        type={showNewPass ? 'text' : 'password'}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="bg-zinc-950 border border-zinc-800 focus:border-zinc-500 outline-none h-11 px-4 pr-12 text-sm text-zinc-100 font-mono w-full transition-colors"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPass(!showNewPass)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                                                    >
                                                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Confirm New Password</label>
                                                <div className="relative">
                                                    <input
                                                        id="profile-confirm-password"
                                                        type={showConfirmPass ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="bg-zinc-950 border border-zinc-800 focus:border-zinc-500 outline-none h-11 px-4 pr-12 text-sm text-zinc-100 font-mono w-full transition-colors"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                                                    >
                                                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[10px] font-mono text-zinc-600 tracking-wider">
                                            * Leave all password fields empty if you only want to update your name.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants}>
                                <motion.button
                                    whileHover={{ scale: 0.99 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="submit"
                                    disabled={savingProfile}
                                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 font-mono text-xs uppercase tracking-widest h-12 px-10 transition-colors cursor-pointer"
                                >
                                    {savingProfile ? (
                                        <>
                                            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 border-t-zinc-900 animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div
                        key="orders"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        {loadingOrders ? (
                            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20">
                                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-4"></div>
                                <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Loading orders...</span>
                            </motion.div>
                        ) : orders.length === 0 ? (
                            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16 md:py-24 border border-dashed border-zinc-800 bg-zinc-900/30">
                                <Terminal className="w-10 h-10 text-zinc-700 mb-6" />
                                <div className="text-center font-mono">
                                    <p className="text-zinc-400 text-sm tracking-wider mb-1">
                                        <span className="text-emerald-500">$</span> query --orders --user={user.name || 'you'}
                                    </p>
                                    <p className="text-zinc-600 text-xs tracking-widest uppercase mt-4 mb-6">
                                        NO TRANSACTIONS FOUND IN ARCHIVE.
                                    </p>
                                    <Link
                                        to="/wholesale"
                                        className="inline-flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-mono text-xs uppercase tracking-widest h-10 px-6 transition-colors"
                                    >
                                        [ START WHOLESALE ORDER ]
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order, idx) => {
                                    const style = getStatusStyle(order.status);
                                    const isExpanded = expandedOrder === order.order_id;

                                    return (
                                        <motion.div
                                            key={order.order_id}
                                            variants={itemVariants}
                                            className="bg-zinc-900/50 border border-zinc-800 overflow-hidden transition-colors hover:border-zinc-700"
                                        >
                                            <button
                                                onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                                                className="w-full flex items-center justify-between p-4 md:p-5 text-left cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="font-mono text-xs text-zinc-400">
                                                                #{order.order_id}
                                                            </span>
                                                            <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
                                                                {style.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                            <span className="text-sm text-zinc-200 font-medium uppercase truncate max-w-[200px] md:max-w-none">
                                                                {order.inquiry_type || 'Wholesale'}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-zinc-600">
                                                                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0 ml-4">
                                                    <span className="font-mono text-[10px] uppercase tracking-wider hidden md:inline">
                                                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-zinc-800 bg-zinc-950/50">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-5 border-b border-zinc-800/50">
                                                        <div>
                                                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">Name</span>
                                                            <span className="text-xs text-zinc-300">{order.name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">Phone</span>
                                                            <span className="text-xs text-zinc-300">{order.phone || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">Address</span>
                                                            <span className="text-xs text-zinc-300 line-clamp-2">{order.address || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">Message</span>
                                                            <span className="text-xs text-zinc-400 italic line-clamp-2">{order.message || 'No message'}</span>
                                                        </div>
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
                                                                                <span className="font-medium uppercase text-xs truncate inline-block max-w-[160px] md:max-w-[300px]">
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
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #18181b; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
            `}} />
        </div>
    );
}
