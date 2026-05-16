import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User, Send, Shield, Search, Package, CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Paperclip, Download, X, FileText, Receipt, ImageIcon, Plus, Minus } from 'lucide-react';
import { notify } from '../lib/toast';
import { useTranslation } from 'react-i18next';

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const API = import.meta.env.VITE_API_URL;

// ── File / Image bubble ─────────────────────────────────────────────────────
function FileBubble({ metadata, isAdmin }) {
    if (!metadata?.file_url) return null;
    const src     = `${import.meta.env.VITE_API_URL}${metadata.file_url}`;
    const isImage = metadata.file_mime?.startsWith('image/');
    const name    = metadata.file_name || 'File';
    if (isImage) {
        return (
            <a href={src} target="_blank" rel="noopener noreferrer"
               className={`block max-w-[220px] rounded overflow-hidden border ${isAdmin ? 'border-rose-700' : 'border-zinc-700'}`}>
                <img src={src} alt={name} className="w-full h-auto object-cover hover:opacity-90 transition-opacity" />
                <p className="text-[9px] font-mono text-zinc-500 px-2 py-1 truncate">{name}</p>
            </a>
        );
    }
    return (
        <a href={src} download={name} target="_blank" rel="noopener noreferrer"
           className={`flex items-center gap-3 p-3 border max-w-[220px] hover:opacity-80 transition-opacity ${
               isAdmin ? 'bg-rose-700/40 border-rose-700 text-zinc-100' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
           }`}>
            <div className="w-8 h-8 flex items-center justify-center rounded bg-zinc-700 shrink-0">
                <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{name}</p>
                <p className="text-[9px] font-mono opacity-60">Download</p>
            </div>
            <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </a>
    );
}

// ── Wholesale Invoice Card (confirmed / rejected) ─────────────────────────────
function WholesaleInvoiceCard({ metadata, isConfirmed }) {
    const hasItems = Array.isArray(metadata.invoice_items) && metadata.invoice_items.length > 0;
    return (
        <div className={`border w-full max-w-lg text-xs font-mono ${
            isConfirmed ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-rose-500/5 border-rose-500/25'
        }`}>
            {/* Header */}
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${isConfirmed ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                {isConfirmed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span className={`uppercase tracking-widest font-bold text-[10px] ${isConfirmed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Order #{metadata.order_id} — {isConfirmed ? 'Confirmed' : 'Rejected'}
                </span>
                <Receipt className="w-3 h-3 ml-auto opacity-40" />
            </div>

            {isConfirmed && hasItems && (
                <>
                    {/* Items table */}
                    <div className="px-4 pt-3 pb-1">
                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Items</p>
                        <div className="space-y-1.5">
                            {metadata.invoice_items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-zinc-800/40 border border-zinc-800 px-2 py-1.5">
                                    {item.product_image ? (
                                        <img
                                            src={`${API}${item.product_image}`}
                                            alt={item.product_name_snapshot}
                                            className="w-8 h-8 object-cover border border-zinc-700 shrink-0"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                            <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-200 font-medium truncate">{item.product_name_snapshot}</p>
                                        <p className="text-zinc-500 text-[9px]">{item.size} · ×{item.quantity}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-zinc-300">{fmt(item.unit_price)}</p>
                                        <p className="text-zinc-500 text-[9px]">= {fmt(item.line_total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Totals */}
                    <div className="px-4 py-3 border-t border-zinc-800 space-y-1">
                        <div className="flex justify-between text-zinc-400">
                            <span>Subtotal</span><span>{fmt(metadata.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Shipping</span><span>{fmt(metadata.shipping_cost)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-300 font-bold border-t border-zinc-700 pt-1 mt-1">
                            <span className="uppercase tracking-wider text-[10px]">Grand Total</span>
                            <span className="text-sm">{fmt(metadata.grand_total)}</span>
                        </div>
                    </div>
                </>
            )}

            {/* Fallback: just shipping for old data */}
            {isConfirmed && !hasItems && metadata.shipping_cost != null && (
                <div className="px-4 py-3">
                    <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Shipping Cost</span>
                    <span className="text-emerald-300 font-semibold">{fmt(metadata.shipping_cost)}</span>
                </div>
            )}

            {metadata.admin_note && (
                <div className={`px-4 py-2 border-t ${isConfirmed ? 'border-emerald-500/15' : 'border-rose-500/15'}`}>
                    <span className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-0.5">Note</span>
                    <p className="text-zinc-300 leading-relaxed">{metadata.admin_note}</p>
                </div>
            )}
        </div>
    );
}

// ── Wholesale Order Card ──────────────────────────────────────────────────────
function WholesaleOrderCard({ metadata, messageType }) {
    if (!metadata) return null;
    const isConfirmed = messageType === 'wholesale_confirmed';
    const isRejected  = messageType === 'wholesale_rejected';

    if (isConfirmed || isRejected) {
        return <WholesaleInvoiceCard metadata={metadata} isConfirmed={isConfirmed} />;
    }

    const statusConfig = {
        pending_discussion: { label: 'Pending Discussion', cls: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
        in_discussion:      { label: 'In Discussion',      cls: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
        confirmed:          { label: 'Confirmed',          cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
        rejected:           { label: 'Rejected',           cls: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
    };
    const s = statusConfig[metadata.status] || statusConfig.pending_discussion;

    return (
        <div className="border border-zinc-700 bg-zinc-900/70 p-4 w-full max-w-lg">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">Wholesale Order #{metadata.order_id}</span>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border ${s.cls}`}>{s.label}</span>
            </div>
            <div className="space-y-1.5 text-xs">
                {metadata.shop_name && <div><span className="text-zinc-500 text-[9px] uppercase tracking-wider">Shop</span><p className="text-zinc-200 font-medium">{metadata.shop_name}</p></div>}
                <div><span className="text-zinc-500 text-[9px] uppercase tracking-wider">Name</span><p className="text-zinc-200">{metadata.name}</p></div>
                <div><span className="text-zinc-500 text-[9px] uppercase tracking-wider">Inquiry</span><p className="text-zinc-200">{metadata.inquiry_type}</p></div>
                {metadata.phone && <div><span className="text-zinc-500 text-[9px] uppercase tracking-wider">Phone</span><p className="text-zinc-200">{metadata.phone}</p></div>}
                {metadata.address && <div><span className="text-zinc-500 text-[9px] uppercase tracking-wider">Address</span><p className="text-zinc-200 leading-relaxed">{metadata.address}</p></div>}
                {metadata.message && <div><span className="text-zinc-500 text-[9px] uppercase tracking-wider">Notes</span><p className="text-zinc-400 italic">{metadata.message}</p></div>}
                {metadata.items && metadata.items.length > 0 && (() => {
                    const grouped = {};
                    metadata.items.forEach(item => {
                        const pid = item.product_id || item.product_name_snapshot;
                        if (!grouped[pid]) grouped[pid] = { name: item.product_name_snapshot, sizes: [] };
                        if (item.size && !grouped[pid].sizes.includes(item.size)) {
                            grouped[pid].sizes.push(item.size);
                        }
                    });
                    const groups = Object.values(grouped);
                    return (
                        <div className="pt-1">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">
                                Items ({groups.length} product{groups.length !== 1 ? 's' : ''})
                            </span>
                            <div className="space-y-1">
                                {groups.map((g, idx) => (
                                    <div key={idx} className="bg-zinc-800/60 px-2 py-1.5 border border-zinc-800">
                                        <p className="text-zinc-200 font-medium truncate text-[11px] mb-1">{g.name}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {g.sizes.map(size => (
                                                <span key={size} className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-700/60 border border-zinc-700 text-zinc-400">
                                                    {size}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}


// ── Admin Confirmation Panel ──────────────────────────────────────────────────
function ConfirmationPanel({ session, token, onDone, t }) {
    const [expanded, setExpanded]     = useState(false);
    const [orderItems, setOrderItems] = useState([]);   // [{...item, unit_price:''}]
    const [shippingCost, setShipping] = useState('');
    const [adminNote, setAdminNote]   = useState('');
    const [submitting, setSubmitting] = useState(null); // 'confirm'|'reject'|null
    const [loadingItems, setLoading]  = useState(false);

    const orderId = session?.pending_order_id;

    // Fetch order items when panel is expanded
    useEffect(() => {
        if (!expanded || !orderId) return;
        setLoading(true);
        axios.get(`${API}/api/wholesale/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                const items = (res.data.items || []).map(it => ({ ...it, unit_price: '' }));
                setOrderItems(items);
            })
            .catch(err => { console.error(err); notify.error('Failed to load order items.'); })
            .finally(() => setLoading(false));
    }, [expanded, orderId, token]);

    if (!orderId) return null;

    // Derived totals
    const subtotal   = orderItems.reduce((s, it) => s + (parseFloat(it.unit_price) || 0) * (it.quantity || 1), 0);
    const grandTotal = subtotal + (parseFloat(shippingCost) || 0);

    // Sizes M/L/XL share one price per product; XXL is priced separately
    const SIZE_GROUP_STD = ['M', 'L', 'XL'];

    const setItemPrice = (idx, val) => {
        const item = orderItems[idx];
        const isStdSize = SIZE_GROUP_STD.includes(item.size);
        setOrderItems(prev => prev.map((it, i) => {
            if (i === idx) return { ...it, unit_price: val };
            // Auto-sync M/L/XL of the same product
            if (isStdSize && it.product_id === item.product_id && SIZE_GROUP_STD.includes(it.size)) {
                return { ...it, unit_price: val };
            }
            return it;
        }));
    };

    const setItemQty = (idx, delta) =>
        setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, (it.quantity || 1) + delta) } : it));

    const setItemQtyDirect = (idx, val) => {
        const n = parseInt(val);
        if (!isNaN(n)) setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, n) } : it));
    };

    const handleDecision = async (decision) => {
        if (decision === 'confirm') {
            const missing = orderItems.some(it => it.unit_price === '' || parseFloat(it.unit_price) < 0);
            if (missing) { notify.warning('Please enter a valid price for every item.'); return; }
            if (shippingCost === '' || parseFloat(shippingCost) < 0) {
                notify.warning('Please enter a valid shipping cost.'); return;
            }
        }
        if (decision === 'reject' && !window.confirm(t('admin_chats.reject_confirm_msg'))) return;

        setSubmitting(decision);
        try {
            const invoiceItems = orderItems.map(it => ({
                product_id:            it.product_id,
                product_name_snapshot: it.product_name_snapshot,
                product_image:         it.product_image || null,
                size:                  it.size,
                quantity:              it.quantity,
                unit_price:            parseFloat(it.unit_price) || 0,
                line_total:            (parseFloat(it.unit_price) || 0) * (it.quantity || 1),
            }));

            await axios.put(
                `${API}/api/wholesale/${orderId}/confirm`,
                {
                    decision,
                    shipping_cost: decision === 'confirm' ? parseFloat(shippingCost) : null,
                    admin_note:    adminNote || null,
                    invoice_items: decision === 'confirm' ? invoiceItems : null,
                    subtotal:      decision === 'confirm' ? subtotal : null,
                    grand_total:   decision === 'confirm' ? grandTotal : null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            notify.success(decision === 'confirm' ? t('admin_chats.confirm_success') : t('admin_chats.reject_success'));
            onDone();
        } catch (err) {
            console.error(err);
            notify.error(t('admin_chats.failed_confirm'));
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="border-t-2 border-amber-500/30 bg-zinc-950 shrink-0">
            {/* Toggle header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-amber-400 hover:bg-zinc-900/60 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-mono text-xs uppercase tracking-widest">
                        {t('admin_chats.confirmation_panel_title')} — Order #{orderId}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 border border-amber-500/40 bg-amber-500/10 text-amber-400 uppercase">
                        {session.pending_order_status === 'pending_discussion' ? t('admin_chats.status_pending') : t('admin_chats.status_in_discussion')}
                    </span>
                </div>
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {expanded && (
                <div className="px-4 pb-5 space-y-4 animate-in slide-in-from-bottom-2 duration-200 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-zinc-500">{t('admin_chats.confirmation_panel_desc')}</p>

                    {/* Items list */}
                    {loadingItems ? (
                        <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
                        </div>
                    ) : orderItems.length > 0 && (
                        <div>
                            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                                Items — set price per unit
                            </p>
                            {/* Pricing rule hint */}
                            <div className="flex flex-wrap gap-3 mb-3 text-[9px] font-mono uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                                    M / L / XL — harga otomatis sama (sync)
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                                    XXL — harga terpisah
                                </span>
                            </div>
                            {/* Column headers */}
                            <div className="hidden md:grid grid-cols-[2rem_1fr_4rem_8rem_7rem_6rem] gap-2 px-2 mb-1">
                                {['', 'Product', 'Size', 'Qty', 'Price (M/L/XL synced)', 'Total'].map(h => (
                                    <span key={h} className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider text-right first:text-left">{h}</span>
                                ))}
                            </div>
                            <div className="space-y-1.5">
                                {orderItems.map((item, idx) => {
                                    const lineTotal = (parseFloat(item.unit_price) || 0) * (item.quantity || 1);
                                    return (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[2rem_1fr_4rem_8rem_7rem_6rem] gap-2 items-center bg-zinc-900/60 border border-zinc-800 px-2 py-2">
                                            {/* Thumbnail */}
                                            {item.product_image ? (
                                                <img src={`${API}${item.product_image}`} alt="" className="w-8 h-8 object-cover border border-zinc-700 shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                                            ) : (
                                                <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                    <Package className="w-3.5 h-3.5 text-zinc-600" />
                                                </div>
                                            )}
                                            {/* Name */}
                                            <span className="text-zinc-200 text-xs font-medium truncate">{item.product_name_snapshot}</span>
                                            {/* Size + badge */}
                                            <div className="text-right">
                                                <span className="text-zinc-500 text-xs font-mono">{item.size}</span>
                                                {item.size === 'XXL' ? (
                                                    <span className="ml-1 text-[8px] font-bold uppercase px-1 bg-purple-500/20 border border-purple-500/40 text-purple-400">+price</span>
                                                ) : SIZE_GROUP_STD.includes(item.size) ? (
                                                    <span className="ml-1 text-[8px] font-bold uppercase px-1 bg-sky-500/20 border border-sky-500/40 text-sky-400">sync</span>
                                                ) : null}
                                            </div>
                                            {/* Qty stepper */}
                                            <div className="flex items-center justify-end border border-zinc-700">
                                                <button type="button" onClick={() => setItemQty(idx, -1)} className="w-6 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                                                    <Minus className="w-2.5 h-2.5" />
                                                </button>
                                                <input
                                                    type="number" min="1"
                                                    value={item.quantity}
                                                    onChange={e => setItemQtyDirect(idx, e.target.value)}
                                                    className="w-9 h-7 bg-zinc-900 text-center text-xs text-white font-mono border-x border-zinc-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button type="button" onClick={() => setItemQty(idx, 1)} className="w-6 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                                                    <Plus className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                            {/* Unit price input */}
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={e => setItemPrice(idx, e.target.value)}
                                                placeholder="0"
                                                title={SIZE_GROUP_STD.includes(item.size) ? 'Price synced across M/L/XL for this product' : 'Independent price for XXL'}
                                                className={`w-full bg-zinc-950 border text-right text-xs text-zinc-100 font-mono h-7 px-2 outline-none transition-colors ${
                                                    item.unit_price === ''
                                                        ? item.size === 'XXL'
                                                            ? 'border-purple-500/50'
                                                            : 'border-amber-500/50'
                                                        : item.size === 'XXL'
                                                            ? 'border-purple-600/40 focus:border-purple-500/60'
                                                            : 'border-zinc-700 focus:border-amber-500/50'
                                                }`}
                                            />
                                            {/* Line total */}
                                            <span className="text-zinc-300 text-xs font-mono text-right">{fmt(lineTotal)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Shipping + Note */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                                {t('admin_chats.shipping_cost_label')} <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="number" min="0"
                                value={shippingCost}
                                onChange={e => setShipping(e.target.value)}
                                placeholder={t('admin_chats.shipping_cost_placeholder')}
                                className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500/50 outline-none h-9 px-3 text-sm text-zinc-100 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                                {t('admin_chats.admin_note_label')}
                            </label>
                            <input
                                type="text"
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                                placeholder={t('admin_chats.admin_note_placeholder')}
                                className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 outline-none h-9 px-3 text-sm text-zinc-100 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Invoice summary preview */}
                    <div className="border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-1 text-xs font-mono">
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Invoice Preview</p>
                        <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                        <div className="flex justify-between text-zinc-400"><span>Shipping</span><span>{fmt(shippingCost || 0)}</span></div>
                        <div className="flex justify-between text-emerald-300 font-bold border-t border-zinc-700 pt-1 mt-1 text-sm">
                            <span className="uppercase tracking-wider text-[10px] self-center">Grand Total</span>
                            <span>{fmt(grandTotal)}</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={() => handleDecision('confirm')}
                            disabled={!!submitting}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-colors"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {submitting === 'confirm' ? t('admin_chats.confirming') : t('admin_chats.confirm_btn')}
                        </button>
                        <button
                            onClick={() => handleDecision('reject')}
                            disabled={!!submitting}
                            className="flex items-center gap-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            {submitting === 'reject' ? t('admin_chats.rejecting') : t('admin_chats.reject_btn')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminChats() {
    const { t } = useTranslation();
    const [chatSessions, setChatSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [filePreview, setFilePreview] = useState(null);
    const [uploading, setUploading]     = useState(false);
    const fileInputRef = useRef(null);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showScrollBtn, setShowScrollBtn]     = useState(false);
    const messagesEndRef = useRef(null);
    const chatBoxRef     = useRef(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchChatSessions();
        const interval = setInterval(() => {
            fetchChatSessions(false);
            if (selectedUser) fetchMessages(selectedUser.user_id, false);
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedUser]);

    // Scroll only on initial message load for a new user selection
    useEffect(() => {
        if (loadingMessages === false && messages.length > 0) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingMessages]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredSessions(chatSessions);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredSessions(chatSessions.filter(s =>
                s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
            ));
        }
    }, [searchQuery, chatSessions]);

    const fetchChatSessions = async (showLoading = true) => {
        if (showLoading) setLoadingSessions(true);
        try {
            const res = await axios.get(`${API}/api/chats/admin/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChatSessions(res.data.chats);
        } catch (err) {
            console.error(err);
            if (showLoading) notify.error(t('admin_chats.failed_load_sessions'));
        } finally {
            if (showLoading) setLoadingSessions(false);
        }
    };

    const fetchMessages = async (userId, showLoading = true) => {
        if (showLoading) setLoadingMessages(true);
        try {
            const res = await axios.get(`${API}/api/chats/admin/messages/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.messages);
            await axios.put(`${API}/api/chats/admin/read`, { senderToMark: 'user', userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChatSessions(prev => prev.map(s =>
                s.user_id === userId ? { ...s, unread_count: 0 } : s
            ));
        } catch (err) {
            console.error(err);
            if (showLoading) notify.error(t('admin_chats.failed_load_messages'));
        } finally {
            if (showLoading) setLoadingMessages(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        fetchMessages(user.user_id);
    };

    const scrollToBottom = () =>
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleChatScroll = () => {
        const box = chatBoxRef.current;
        if (!box) return;
        const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100;
        setShowScrollBtn(!nearBottom);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        setFilePreview({ file, url: isImage ? URL.createObjectURL(file) : null, isImage, name: file.name });
        e.target.value = '';
    };

    const clearFilePreview = () => {
        if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
        setFilePreview(null);
    };

    const sendFile = async () => {
        if (!filePreview || !selectedUser) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', filePreview.file);
            const { data } = await axios.post(`${API}/api/chats/admin/upload`, form, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            await axios.post(`${API}/api/chats/send`, {
                message: filePreview.name, sender: 'admin',
                userId: selectedUser.user_id,
                file_url: data.url, file_name: data.originalName,
                file_mime: data.mimeType,
                message_type: data.isImage ? 'image' : 'file'
            }, { headers: { Authorization: `Bearer ${token}` } });
            clearFilePreview();
            fetchMessages(selectedUser.user_id, false);
            fetchChatSessions(false);
        } catch (err) {
            console.error(err);
            notify.error(t('admin_chats.failed_send'));
        } finally {
            setUploading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (filePreview) { sendFile(); return; }
        if (!newMessage.trim() || !selectedUser) return;
        const messageText = newMessage.trim();
        setNewMessage('');
        const tempMsg = {
            chat_id: 'temp-' + Date.now(), message: messageText,
            sender: 'admin', message_type: 'text', created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        try {
            await axios.post(`${API}/api/chats/send`,
                { message: messageText, sender: 'admin', userId: selectedUser.user_id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchMessages(selectedUser.user_id, false);
            fetchChatSessions(false);
        } catch (err) {
            console.error(err);
            notify.error(t('admin_chats.failed_send'));
            setMessages(prev => prev.filter(m => m.chat_id !== tempMsg.chat_id));
            setNewMessage(messageText);
        }
    };

    const handleConfirmationDone = () => {
        fetchChatSessions(false);
        if (selectedUser) {
            fetchMessages(selectedUser.user_id, false);
            // Update selected user's pending status locally
            setSelectedUser(prev => ({ ...prev, pending_order_id: null, pending_order_status: null }));
        }
    };

    const isWholesaleMsg = (msg) =>
        msg.message_type === 'wholesale_order' ||
        msg.message_type === 'wholesale_confirmed' ||
        msg.message_type === 'wholesale_rejected';

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
            {/* Sidebar */}
            <div className="w-80 border border-zinc-800 bg-zinc-900/40 flex flex-col overflow-hidden rounded-xl">
                <div className="p-4 border-b border-zinc-800 shrink-0">
                    <h2 className="font-bold text-lg mb-4">{t('admin_chats.conversations')}</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder={t('admin_chats.search_users')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 outline-none h-10 pl-9 pr-4 text-sm text-zinc-100 rounded-md transition-colors"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingSessions ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">{t('admin_chats.no_conversations')}</div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {filteredSessions.map(session => (
                                <button
                                    key={session.user_id}
                                    onClick={() => handleSelectUser(session)}
                                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                                        selectedUser?.user_id === session.user_id
                                            ? 'bg-zinc-800/80 border-l-2 border-rose-500'
                                            : 'hover:bg-zinc-800/40 border-l-2 border-transparent'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                        <span className="font-bold text-zinc-400">{session.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-semibold text-sm truncate text-zinc-100">{session.name}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {session.pending_order_id && (
                                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider">
                                                        {t('admin_chats.wholesale_badge')}
                                                    </span>
                                                )}
                                                {session.unread_count > 0 && (
                                                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                        {session.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">{session.email}</p>
                                        <p className="text-[10px] text-zinc-600 mt-1">
                                            {new Date(session.last_activity).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 border border-zinc-800 bg-zinc-900/40 flex flex-col overflow-hidden rounded-xl relative">
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-zinc-400">{selectedUser.name.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-zinc-100">{selectedUser.name}</h3>
                                    <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                                </div>
                            </div>
                            {selectedUser.pending_order_id && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                                        Wholesale Order #{selectedUser.pending_order_id}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div
                            ref={chatBoxRef}
                            onScroll={handleChatScroll}
                            className="flex-1 overflow-y-auto p-6 space-y-6"
                        >
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex justify-center items-center h-full text-zinc-500 text-sm">
                                    {t('admin_chats.no_messages')}
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isAdmin = msg.sender === 'admin';
                                    const isSystem = msg.sender === 'system';
                                    const isWholesale = isWholesaleMsg(msg);

                                    if ((isSystem || !isAdmin) && msg.message_type === 'wholesale_order') {
                                        return (
                                            <div key={msg.chat_id} className="flex flex-col items-start">
                                                <WholesaleOrderCard metadata={msg.metadata} messageType={msg.message_type} />
                                                <span className="font-mono text-[9px] text-zinc-700 mt-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (isAdmin && isWholesale) {
                                        return (
                                            <div key={msg.chat_id} className="flex flex-col items-end">
                                                <div className="flex items-center gap-2 mb-1.5 flex-row-reverse">
                                                    <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                                                    </div>
                                                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">{t('admin_chats.admin')}</span>
                                                    <span className="font-mono text-[9px] text-zinc-700">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <WholesaleOrderCard metadata={msg.metadata} messageType={msg.message_type} />
                                            </div>
                                        );
                                    }

                                    const isFileMsg = msg.message_type === 'image' || msg.message_type === 'file';
                                    return (
                                        <div key={msg.chat_id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-center gap-2 mb-1.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                                    {isAdmin ? <Shield className="w-3.5 h-3.5 text-amber-500" /> : <User className="w-3.5 h-3.5 text-zinc-400" />}
                                                </div>
                                                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                                                    {isAdmin ? t('admin_chats.admin') : selectedUser.name}
                                                </span>
                                                <span className="font-mono text-[9px] text-zinc-700">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {isFileMsg ? (
                                                <FileBubble metadata={msg.metadata} isAdmin={isAdmin} />
                                            ) : (
                                                <div className={`max-w-[85%] md:max-w-[70%] p-4 text-sm font-sans leading-relaxed break-words ${
                                                    isAdmin
                                                        ? 'bg-rose-600 text-white rounded-l-xl rounded-br-xl'
                                                        : 'bg-zinc-800 text-zinc-100 rounded-r-xl rounded-bl-xl border border-zinc-700'
                                                }`}>
                                                    {msg.message}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Scroll to bottom button */}
                        {showScrollBtn && (
                            <button
                                onClick={scrollToBottom}
                                className="absolute bottom-36 right-6 z-20 w-9 h-9 bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
                                title="Jump to latest"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12l7 7 7-7"/>
                                </svg>
                            </button>
                        )}

                        {/* Admin Confirmation Panel */}
                        <ConfirmationPanel
                            session={selectedUser}
                            token={token}
                            onDone={handleConfirmationDone}
                            t={t}
                        />

                        {/* File Preview Strip */}
                        {filePreview && (
                            <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center gap-3">
                                {filePreview.isImage
                                    ? <img src={filePreview.url} alt="" className="h-12 w-12 object-cover rounded border border-zinc-700" />
                                    : <div className="h-12 w-12 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center"><FileText className="w-5 h-5 text-zinc-400" /></div>
                                }
                                <p className="text-xs font-mono text-zinc-300 truncate flex-1">{filePreview.name}</p>
                                <button onClick={clearFilePreview} className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 shrink-0">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {/* Chat Input */}
                        <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
                            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.docx,.xlsx,.txt" className="hidden" onChange={handleFileSelect} />
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="w-9 h-12 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors shrink-0">
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder={filePreview ? 'Press send to upload...' : t('admin_chats.type_message')}
                                    disabled={!!filePreview}
                                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-500 outline-none h-12 px-4 text-sm text-zinc-100 rounded-md transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !filePreview) || uploading}
                                    className="w-10 h-12 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                                >
                                    {uploading
                                        ? <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                                        : <Send className="w-4 h-4" />
                                    }
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <Shield className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-zinc-400">{t('admin_chats.support_title')}</p>
                        <p className="text-sm mt-2">{t('admin_chats.support_desc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
