import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ArrowRight, Truck, MessageSquare, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
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

/* ─── Status config ────────────────────────────────────────────────────────── */
function getStatusConfig(status, t) {
    const MAP = {
        // pending states
        'pending_discussion': {
            accent:      'bg-amber-500',
            badge:       'bg-amber-500/15 text-amber-400 border-amber-500/30',
            glow:        'border-amber-500/20',
            icon:        <Clock className="w-3 h-3" />,
            label:       t('user_orders.status_pending'),
        },
        'in_discussion': {
            accent:      'bg-blue-500',
            badge:       'bg-blue-500/15 text-blue-400 border-blue-500/30',
            glow:        'border-blue-500/20',
            icon:        <Loader2 className="w-3 h-3 animate-spin" />,
            label:       'In Discussion',
        },
        // legacy string statuses
        'Belum Dibaca': {
            accent:      'bg-zinc-600',
            badge:       'bg-zinc-800 text-zinc-400 border-zinc-700',
            glow:        'border-zinc-700',
            icon:        <AlertCircle className="w-3 h-3" />,
            label:       t('user_orders.status_pending'),
        },
        'Dibaca': {
            accent:      'bg-zinc-500',
            badge:       'bg-zinc-800 text-zinc-300 border-zinc-600',
            glow:        'border-zinc-600',
            icon:        <AlertCircle className="w-3 h-3" />,
            label:       t('user_orders.status_reviewed'),
        },
        'Dalam proses penyiapan barang': {
            accent:      'bg-amber-500',
            badge:       'bg-amber-500/15 text-amber-400 border-amber-500/30',
            glow:        'border-amber-500/20',
            icon:        <Loader2 className="w-3 h-3 animate-spin" />,
            label:       t('user_orders.status_processing'),
        },
        'Barang siap untuk diambil di gudang': {
            accent:      'bg-blue-500',
            badge:       'bg-blue-500/15 text-blue-400 border-blue-500/30',
            glow:        'border-blue-500/20',
            icon:        <Truck className="w-3 h-3" />,
            label:       t('user_orders.status_ready'),
        },
        'Pesanan selesai': {
            accent:      'bg-emerald-500',
            badge:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            glow:        'border-emerald-500/20',
            icon:        <CheckCircle2 className="w-3 h-3" />,
            label:       t('user_orders.status_completed'),
        },
        // decision statuses
        'confirmed': {
            accent:      'bg-emerald-500',
            badge:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            glow:        'border-emerald-500/20',
            icon:        <CheckCircle2 className="w-3 h-3" />,
            label:       'Confirmed',
        },
        'rejected': {
            accent:      'bg-rose-600',
            badge:       'bg-rose-600/15 text-rose-400 border-rose-600/30',
            glow:        'border-rose-600/20',
            icon:        <XCircle className="w-3 h-3" />,
            label:       'Rejected',
        },
    };
    return MAP[status] || {
        accent: 'bg-zinc-600',
        badge:  'bg-zinc-800 text-zinc-400 border-zinc-700',
        glow:   'border-zinc-700',
        icon:   <AlertCircle className="w-3 h-3" />,
        label:  status,
    };
}

/* ─── Format rupiah ─────────────────────────────────────────────────────────── */
const rupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function UserOrders() {
    const { t } = useTranslation();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const token = localStorage.getItem('token');

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
        markAsRead();
    }, []);

    const markAsRead = async () => {
        try {
            await axios.put(`${API}/api/profile/wholesale/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            console.error('Error marking orders as read:', error);
        }
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const res = await axios.get(`${API}/api/profile/wholesale`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (err) {
            console.error('Error fetching wholesale orders:', err);
            notify.error(t('user_orders.err_load'));
        } finally {
            setLoadingOrders(false);
        }
    };

    return (
        <div className="bg-zinc-950 min-h-screen text-zinc-50 font-sans selection:bg-zinc-800 selection:text-white flex flex-col relative overflow-hidden">
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <Navbar />

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 md:px-12 max-w-[1100px] w-full mx-auto">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="mb-12 mt-8"
                >
                    <motion.span variants={itemVariants} className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase block mb-4">
                        {t('user_orders.archive_badge')}
                    </motion.span>
                    <motion.h1 variants={itemVariants} className="font-sans text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
                        {t('user_orders.title_1')} <br className="hidden md:block" />
                        <span className="text-zinc-600">{t('user_orders.title_2')}</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="font-mono text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed mt-5">
                        {t('user_orders.subtitle')}
                    </motion.p>
                </motion.div>

                <motion.div key="orders" variants={containerVariants} initial="hidden" animate="show">
                    {loadingOrders ? (
                        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-24 border border-zinc-800 bg-zinc-900/40">
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-5" />
                            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{t('user_orders.loading')}</span>
                        </motion.div>
                    ) : orders.length === 0 ? (
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col items-center justify-center py-20 md:py-28 border border-dashed border-zinc-800 bg-zinc-900/20"
                        >
                            <Package className="w-10 h-10 text-zinc-700 mb-6" />
                            <div className="text-center font-mono space-y-3">
                                <p className="text-zinc-400 text-sm tracking-wider">
                                    <span className="text-emerald-500">$</span> {t('user_orders.query_cmd')}{user.name || 'you'}
                                </p>
                                <p className="text-zinc-600 text-xs tracking-widest uppercase">
                                    {t('user_orders.no_transactions')}
                                </p>
                            </div>
                            <Link
                                to="/wholesale"
                                className="mt-8 inline-flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-mono text-xs uppercase tracking-widest h-11 px-8 transition-colors"
                            >
                                {t('user_orders.start_order')}
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => {
                                const cfg = getStatusConfig(order.status, t);
                                const isExpanded = expandedOrder === order.order_id;
                                const hasShipping = order.shipping_cost != null && order.shipping_cost > 0;
                                const hasNote    = order.admin_note && order.admin_note.trim() !== '';
                                const isConfirmed = order.status === 'confirmed' || order.status === 'Pesanan selesai';
                                const isRejected  = order.status === 'rejected';

                                return (
                                    <motion.div
                                        key={order.order_id}
                                        variants={itemVariants}
                                        className={`border bg-zinc-900/40 overflow-hidden transition-colors flex ${cfg.glow} hover:border-opacity-60`}
                                    >
                                        {/* Status accent bar */}
                                        <div className={`w-1 shrink-0 ${cfg.accent}`} />

                                        <div className="flex-1 min-w-0">
                                            {/* Header row */}
                                            <button
                                                onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                                                className="w-full flex items-center justify-between p-4 md:p-5 text-left cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="font-mono text-xs text-zinc-500">#{order.order_id}</span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest border rounded-sm ${cfg.badge}`}>
                                                                {cfg.icon}
                                                                {cfg.label}
                                                            </span>
                                                            {/* Shipping cost pill — visible on header when confirmed */}
                                                            {hasShipping && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-sm">
                                                                    <Truck className="w-2.5 h-2.5" />
                                                                    {rupiah(order.shipping_cost)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="text-sm text-zinc-200 font-medium uppercase truncate max-w-[200px] md:max-w-none">
                                                                {order.inquiry_type || t('user_orders.wholesale_label')}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-zinc-600">
                                                                {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0 ml-4">
                                                    <span className="font-mono text-[10px] uppercase tracking-wider hidden md:inline">
                                                        {t('user_orders.items_count', { count: order.items?.length || 0 })}
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>

                                            {/* Admin note preview strip (always visible if exists) */}
                                            {hasNote && !isExpanded && (
                                                <div className="px-4 md:px-5 pb-3 -mt-1">
                                                    <div className="flex items-start gap-2 px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-sm">
                                                        <MessageSquare className="w-3 h-3 text-zinc-500 mt-0.5 shrink-0" />
                                                        <p className="text-[11px] text-zinc-400 italic line-clamp-1">{order.admin_note}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expanded panel */}
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

                                                            {/* ── Admin decision banner ── */}
                                                            {(isConfirmed || isRejected) && (
                                                                <div className={`flex items-start gap-3 px-5 py-4 border-b ${
                                                                    isRejected
                                                                        ? 'bg-rose-950/30 border-rose-900/40'
                                                                        : 'bg-emerald-950/30 border-emerald-900/40'
                                                                }`}>
                                                                    {isRejected
                                                                        ? <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                                                        : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                                                    }
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-xs font-mono font-semibold uppercase tracking-widest mb-1 ${isRejected ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                            {isRejected ? 'Order Rejected by Admin' : 'Order Confirmed by Admin'}
                                                                        </p>
                                                                        {hasNote && (
                                                                            <p className="text-xs text-zinc-300 italic leading-relaxed">"{order.admin_note}"</p>
                                                                        )}
                                                                    </div>
                                                                    {/* Shipping cost block */}
                                                                    {hasShipping && !isRejected && (
                                                                        <div className="shrink-0 text-right">
                                                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Shipping Cost</span>
                                                                            <span className="text-lg font-black text-emerald-400 font-mono">{rupiah(order.shipping_cost)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* ── Info grid ── */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-5 border-b border-zinc-800/50">
                                                                {[
                                                                    { label: t('user_orders.col_name'),    value: order.name },
                                                                    { label: t('user_orders.col_phone'),   value: order.phone || '—' },
                                                                    { label: t('user_orders.col_address'), value: order.address || '—' },
                                                                    { label: t('user_orders.col_message'), value: order.message || t('user_orders.no_message'), italic: true },
                                                                ].map(({ label, value, italic }) => (
                                                                    <div key={label}>
                                                                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">{label}</span>
                                                                        <span className={`text-xs text-zinc-300 line-clamp-2 ${italic ? 'italic text-zinc-400' : ''}`}>{value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* ── Admin note standalone (for non-decided statuses) ── */}
                                                            {hasNote && !isConfirmed && !isRejected && (
                                                                <div className="px-4 md:px-5 py-3 border-b border-zinc-800/50 bg-zinc-900/40">
                                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Admin Note</span>
                                                                    <div className="flex items-start gap-2">
                                                                        <MessageSquare className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                                                                        <p className="text-xs text-zinc-300 italic leading-relaxed">{order.admin_note}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* ── Items table ── */}
                                                            {order.items && order.items.length > 0 ? (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                                                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-mono tracking-widest">
                                                                            <tr>
                                                                                <th className="px-3 md:px-4 py-3 w-10"></th>
                                                                                <th className="px-3 md:px-5 py-3 font-medium">{t('user_orders.th_product')}</th>
                                                                                <th className="px-3 md:px-5 py-3 font-medium">{t('user_orders.th_size')}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-zinc-800/50">
                                                                            {order.items.map((item, i) => (
                                                                                <tr key={item.item_id || `${item.product_id}-${item.size}-${i}`} className="hover:bg-zinc-800/20 transition-colors">
                                                                                    {/* Product image */}
                                                                                    <td className="px-3 md:px-4 py-2.5 w-10">
                                                                                        {item.product_image ? (
                                                                                            <img
                                                                                                src={`${API}${item.product_image}`}
                                                                                                alt={item.product_name_snapshot}
                                                                                                className="w-9 h-9 object-cover border border-zinc-800"
                                                                                                onError={e => { e.target.style.display = 'none'; }}
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                                                                <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    {/* Product name */}
                                                                                    <td className="px-3 md:px-5 py-2.5 text-zinc-200">
                                                                                        <span className="font-medium uppercase text-xs truncate inline-block max-w-[140px] md:max-w-[320px]">
                                                                                            {item.product_name_snapshot}
                                                                                        </span>
                                                                                    </td>
                                                                                    {/* Size */}
                                                                                    <td className="px-3 md:px-5 py-2.5 font-mono text-zinc-400 text-xs">{item.size}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <div className="p-6 text-center">
                                                                    <span className="text-zinc-600 font-mono text-xs uppercase tracking-wider">{t('user_orders.no_items_recorded')}</span>
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
            </main>
        </div>
    );
}
