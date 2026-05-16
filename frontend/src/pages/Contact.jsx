import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Send, User, Shield, Package, CheckCircle2, XCircle, Clock, MessageSquare, Paperclip, Download, X, Image as ImageIcon, FileText, ArrowRight } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { notify } from '../lib/toast';

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

// ── File / Image bubble renderer ─────────────────────────────────────────────
function FileBubble({ metadata, isUser }) {
    if (!metadata?.file_url) return null;
    const src      = `${API}${metadata.file_url}`;
    const isImage  = metadata.file_mime?.startsWith('image/');
    const fileName = metadata.file_name || 'File';

    if (isImage) {
        return (
            <a href={src} target="_blank" rel="noopener noreferrer"
               className={`block max-w-[260px] rounded overflow-hidden border ${isUser ? 'border-zinc-300' : 'border-zinc-700'}`}>
                <img src={src} alt={fileName}
                     className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                     onError={e => { e.target.style.display='none'; }}
                />
                <p className="text-[9px] font-mono text-zinc-500 px-2 py-1 truncate">{fileName}</p>
            </a>
        );
    }

    return (
        <a href={src} download={fileName} target="_blank" rel="noopener noreferrer"
           className={`flex items-center gap-3 p-3 border max-w-[260px] hover:opacity-80 transition-opacity ${
               isUser ? 'bg-zinc-200 border-zinc-300 text-zinc-800' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
           }`}>
            <div className={`w-8 h-8 flex items-center justify-center rounded shrink-0 ${isUser ? 'bg-zinc-300' : 'bg-zinc-700'}`}>
                <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{fileName}</p>
                <p className="text-[9px] font-mono opacity-60">Download</p>
            </div>
            <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </a>
    );
}

// ── Wholesale Order Card ──────────────────────────────────────────────────────
function WholesaleOrderCard({ metadata, messageType }) {
    if (!metadata) return null;

    const statusConfig = {
        'pending_discussion': { label: 'Pending Discussion', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
        'in_discussion':      { label: 'In Discussion',      color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
        'confirmed':          { label: 'Confirmed',          color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
        'rejected':           { label: 'Rejected',           color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
    };

    const isConfirmed = messageType === 'wholesale_confirmed';
    const isRejected  = messageType === 'wholesale_rejected';

    if (isConfirmed || isRejected) {
        const hasItems = Array.isArray(metadata.invoice_items) && metadata.invoice_items.length > 0;
        return (
            <div className={`border w-full max-w-[85%] md:max-w-[480px] text-xs font-mono ${
                isConfirmed ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-rose-500/5 border-rose-500/25'
            }`}>
                {/* Header */}
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isConfirmed ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                    {isConfirmed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    }
                    <span className={`uppercase tracking-widest font-bold text-[10px] ${isConfirmed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Order #{metadata.order_id} — {isConfirmed ? 'Confirmed' : 'Rejected'}
                    </span>
                </div>

                {/* Full invoice items (new format) */}
                {isConfirmed && hasItems && (
                    <>
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
                                                <Package className="w-3.5 h-3.5 text-zinc-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-zinc-200 font-medium truncate">{item.product_name_snapshot}</p>
                                            <p className="text-zinc-500 text-[9px]">{item.size}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-zinc-300">Rp {Number(item.unit_price || 0).toLocaleString('id-ID')}</p>
                                            <p className="text-zinc-500 text-[9px]">= Rp {Number(item.line_total || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Totals */}
                        <div className="px-4 py-3 border-t border-zinc-800 space-y-1">
                            <div className="flex justify-between text-zinc-400">
                                <span>Subtotal</span>
                                <span>Rp {Number(metadata.subtotal || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>Shipping</span>
                                <span>Rp {Number(metadata.shipping_cost || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-emerald-300 font-bold border-t border-zinc-700 pt-1 mt-1">
                                <span className="uppercase tracking-wider text-[10px] self-center">Grand Total</span>
                                <span className="text-sm">Rp {Number(metadata.grand_total || 0).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Fallback for old confirmed messages (shipping_cost only) */}
                {isConfirmed && !hasItems && metadata.shipping_cost != null && (
                    <div className="px-4 py-3">
                        <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Shipping Cost</span>
                        <span className="text-emerald-300 font-semibold">
                            Rp {Number(metadata.shipping_cost).toLocaleString('id-ID')}
                        </span>
                    </div>
                )}

                {/* Admin note */}
                {metadata.admin_note && (
                    <div className={`px-4 py-2 border-t ${isConfirmed ? 'border-emerald-500/15' : 'border-rose-500/15'}`}>
                        <span className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-0.5">Note</span>
                        <p className="text-zinc-300 leading-relaxed">{metadata.admin_note}</p>
                    </div>
                )}

                {/* CTA → redirect to orders page */}
                <div className={`px-4 py-3 border-t ${isConfirmed ? 'border-emerald-500/15' : 'border-rose-500/15'}`}>
                    <Link
                        to="/orders"
                        className={`inline-flex items-center gap-2 w-full justify-center py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                            isConfirmed
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20'
                        }`}
                    >
                        View My Orders
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        );
    }

    const statusInfo = statusConfig[metadata.status] || statusConfig['pending_discussion'];
    return (
        <div className="border border-zinc-700 bg-zinc-900/60 p-4 w-full max-w-[85%] md:max-w-[420px]">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                        Wholesale Order #{metadata.order_id}
                    </span>
                </div>
                <span className={`inline-flex px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border ${statusInfo.color}`}>
                    {statusInfo.label}
                </span>
            </div>

            <div className="space-y-2 text-xs">
                {metadata.shop_name && (
                    <div>
                        <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Shop</span>
                        <p className="text-zinc-200 font-medium">{metadata.shop_name}</p>
                    </div>
                )}
                <div>
                    <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Inquiry Type</span>
                    <p className="text-zinc-200">{metadata.inquiry_type}</p>
                </div>
                {metadata.address && (
                    <div>
                        <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Address</span>
                        <p className="text-zinc-200 leading-relaxed">{metadata.address}</p>
                    </div>
                )}
                {metadata.message && (
                    <div>
                        <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Notes</span>
                        <p className="text-zinc-300 italic">{metadata.message}</p>
                    </div>
                )}
                {metadata.items && metadata.items.length > 0 && (() => {
                    // Group items by product_id so same product shows sizes inline
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
                        <div>
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] block mb-1">
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

            <div className="mt-3 pt-2 border-t border-zinc-800">
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Our admin will review and respond soon.
                </p>
            </div>
        </div>
    );
}


export default function Contact() {
    const { t } = useTranslation();
    const [messages, setMessages]         = useState([]);
    const [newMessage, setNewMessage]     = useState('');
    const [loading, setLoading]           = useState(true);
    const [uploading, setUploading]       = useState(false);
    const [filePreview, setFilePreview]   = useState(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const messagesEndRef = useRef(null);
    const chatBoxRef     = useRef(null);
    const fileInputRef   = useRef(null);
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchMessages();
        markAsRead();
        const interval = setInterval(() => { fetchMessages(false); }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Scroll only on initial load
    useEffect(() => {
        if (loading === false && messages.length > 0) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const scrollToBottom = () =>
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });


    const handleChatScroll = () => {
        const box = chatBoxRef.current;
        if (!box) return;
        const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100;
        setShowScrollBtn(!nearBottom);
    };

    const fetchMessages = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await axios.get(`${API}/api/chats/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (showLoading) notify.error(t('contact.error_load'));
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await axios.put(`${API}/api/chats/read`, { senderToMark: 'admin' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    // ── File selection handler ──────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        const url     = isImage ? URL.createObjectURL(file) : null;
        setFilePreview({ file, url, isImage, name: file.name });
        e.target.value = '';
    };

    const clearFilePreview = () => {
        if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
        setFilePreview(null);
    };

    // ── Send file ──────────────────────────────────────────────────────────
    const sendFile = async () => {
        if (!filePreview) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', filePreview.file);
            const { data } = await axios.post(`${API}/api/chats/upload`, form, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            // Now record it as a chat message
            await axios.post(`${API}/api/chats/send`, {
                message:      filePreview.name,
                sender:       'user',
                file_url:     data.url,
                file_name:    data.originalName,
                file_mime:    data.mimeType,
                message_type: data.isImage ? 'image' : 'file'
            }, { headers: { Authorization: `Bearer ${token}` } });
            clearFilePreview();
            fetchMessages(false);
        } catch (err) {
            console.error('Upload error:', err);
            notify.error(t('contact.error_send'));
        } finally {
            setUploading(false);
        }
    };

    // ── Send text ──────────────────────────────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (filePreview) { sendFile(); return; }
        if (!newMessage.trim()) return;

        const messageText = newMessage.trim();
        setNewMessage('');

        const tempMsg = {
            chat_id: 'temp-' + Date.now(),
            message: messageText,
            sender: 'user',
            message_type: 'text',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await axios.post(`${API}/api/chats/send`, { message: messageText, sender: 'user' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages(false);
        } catch (error) {
            console.error('Error sending message:', error);
            notify.error(t('contact.error_send'));
            setMessages(prev => prev.filter(m => m.chat_id !== tempMsg.chat_id));
            setNewMessage(messageText);
        }
    };

    const isWholesaleMsg = (msg) =>
        msg.message_type === 'wholesale_order' ||
        msg.message_type === 'wholesale_confirmed' ||
        msg.message_type === 'wholesale_rejected';

    return (
        <div className="bg-zinc-950 h-screen text-zinc-50 font-sans selection:bg-zinc-800 selection:text-white flex flex-col relative overflow-hidden">
            {/* Film grain */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen z-0"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            <Navbar />

            <main className="relative z-10 flex-1 min-h-0 pt-24 pb-6 px-6 md:px-12 max-w-[900px] w-full mx-auto flex flex-col">

                {/* Header */}
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-8 shrink-0">
                    <motion.span variants={itemVariants} className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase block mb-2">
                        {t('contact.support_badge')}
                    </motion.span>
                    <motion.h1 variants={itemVariants} className="font-sans text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                        {t('contact.title_1')} <span className="text-zinc-600">{t('contact.title_2')}</span>
                    </motion.h1>
                </motion.div>

                {/* Chat Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1 min-h-0 border border-zinc-800 bg-zinc-900/40 flex flex-col overflow-hidden relative"
                >
                    {/* Messages */}
                    <div
                        ref={chatBoxRef}
                        onScroll={handleChatScroll}
                        className="flex-1 overflow-y-auto p-6 space-y-6 relative"
                    >
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 font-mono text-sm uppercase tracking-widest text-center px-4">
                                <Shield className="w-10 h-10 mb-4 opacity-50" />
                                <p>{t('contact.empty_msg_1')}</p>
                                <p className="text-[10px] mt-2 opacity-60">{t('contact.empty_msg_2')}</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isUser    = msg.sender === 'user';
                                const isSystem  = msg.sender === 'system';
                                const isWholesale = isWholesaleMsg(msg);
                                const isFileMsg = msg.message_type === 'image' || msg.message_type === 'file';

                                // Wholesale order card → RIGHT (user submitted)
                                if ((isSystem || isUser) && msg.message_type === 'wholesale_order') {
                                    return (
                                        <div key={msg.chat_id} className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-1.5 flex-row-reverse">
                                                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                                    <User className="w-3.5 h-3.5 text-zinc-400" />
                                                </div>
                                                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                                                    {user.name || t('contact.you')}
                                                </span>
                                                <span className="font-mono text-[9px] text-zinc-700">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <WholesaleOrderCard metadata={msg.metadata} messageType={msg.message_type} />
                                        </div>
                                    );
                                }

                                // Admin wholesale confirm/reject → LEFT
                                if (!isUser && !isSystem && isWholesale) {
                                    return (
                                        <div key={msg.chat_id} className="flex flex-col items-start">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                                                </div>
                                                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                                                    {t('contact.admin')}
                                                </span>
                                                <span className="font-mono text-[9px] text-zinc-700">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <WholesaleOrderCard metadata={msg.metadata} messageType={msg.message_type} />
                                        </div>
                                    );
                                }

                                // Regular / file message
                                return (
                                    <div key={msg.chat_id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                                {isUser ? <User className="w-3.5 h-3.5 text-zinc-400" /> : <Shield className="w-3.5 h-3.5 text-amber-500" />}
                                            </div>
                                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                                                {isUser ? user.name || t('contact.you') : t('contact.admin')}
                                            </span>
                                            <span className="font-mono text-[9px] text-zinc-700">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {isFileMsg ? (
                                            <FileBubble metadata={msg.metadata} isUser={isUser} />
                                        ) : (
                                            <div className={`max-w-[85%] md:max-w-[70%] p-4 text-sm font-sans leading-relaxed break-words ${
                                                isUser
                                                    ? 'bg-zinc-100 text-zinc-950 rounded-l-xl rounded-br-xl'
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
                            className="absolute bottom-28 right-6 z-20 w-9 h-9 bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
                            title="Jump to latest"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12l7 7 7-7"/>
                            </svg>
                        </button>
                    )}

                    {/* File Preview Strip */}
                    {filePreview && (
                        <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-3">
                            {filePreview.isImage ? (
                                <img src={filePreview.url} alt="" className="h-16 w-16 object-cover rounded border border-zinc-700" />
                            ) : (
                                <div className="h-16 w-16 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-zinc-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono text-zinc-300 truncate">{filePreview.name}</p>
                                <p className="text-[10px] text-zinc-600 mt-0.5">Ready to send</p>
                            </div>
                            <button onClick={clearFilePreview}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Chat Input */}
                    <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf,.docx,.xlsx,.txt"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            {/* Attach button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-10 h-14 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
                                title="Attach file"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={filePreview ? 'Press send to upload file...' : t('contact.placeholder')}
                                disabled={!!filePreview}
                                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-500 outline-none h-14 pl-6 pr-4 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={(!newMessage.trim() && !filePreview) || uploading}
                                className="w-12 h-14 bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors cursor-pointer shrink-0"
                            >
                                {uploading
                                    ? <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                                    : <Send className="w-4 h-4" />
                                }
                            </button>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
