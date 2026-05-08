import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ArrowRight } from 'lucide-react';
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

function getStatusStyle(status, t) {
    const STATUS_STYLES = {
        'Belum Dibaca':                       { bg: 'bg-zinc-800',        text: 'text-zinc-400',    border: 'border-zinc-700',       accent: 'bg-zinc-600',    label: t('user_orders.status_pending') },
        'Dibaca':                             { bg: 'bg-zinc-800',        text: 'text-zinc-300',    border: 'border-zinc-600',       accent: 'bg-zinc-500',    label: t('user_orders.status_reviewed') },
        'Dalam proses penyiapan barang':      { bg: 'bg-amber-500/10',    text: 'text-amber-400',   border: 'border-amber-500/40',   accent: 'bg-amber-500',   label: t('user_orders.status_processing') },
        'Barang siap untuk diambil di gudang':{ bg: 'bg-blue-500/10',     text: 'text-blue-400',    border: 'border-blue-500/40',    accent: 'bg-blue-500',    label: t('user_orders.status_ready') },
        'Pesanan selesai':                    { bg: 'bg-emerald-500/10',  text: 'text-emerald-400', border: 'border-emerald-500/40', accent: 'bg-emerald-500', label: t('user_orders.status_completed') },
    };
    return STATUS_STYLES[status] || { bg: 'bg-zinc-800', text: 'text-zinc-500', border: 'border-zinc-700', accent: 'bg-zinc-600', label: status };
}

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

                <motion.div
                    key="orders"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
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
                                const style = getStatusStyle(order.status, t);
                                const isExpanded = expandedOrder === order.order_id;

                                return (
                                    <motion.div
                                        key={order.order_id}
                                        variants={itemVariants}
                                        className="border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-700 transition-colors flex"
                                    >
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
                                                                    { label: t('user_orders.col_name'), value: order.name },
                                                                    { label: t('user_orders.col_phone'), value: order.phone || '—' },
                                                                    { label: t('user_orders.col_address'), value: order.address || '—' },
                                                                    { label: t('user_orders.col_message'), value: order.message || t('user_orders.no_message'), italic: true },
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
                                                                                <th className="px-4 md:px-5 py-3 font-medium">{t('user_orders.th_product')}</th>
                                                                                <th className="px-4 md:px-5 py-3 font-medium">{t('user_orders.th_size')}</th>
                                                                                <th className="px-4 md:px-5 py-3 font-medium">{t('user_orders.th_qty')}</th>
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
