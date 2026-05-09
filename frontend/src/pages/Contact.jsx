import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Send, User, Shield, Package, CheckCircle2, XCircle, Clock, MessageSquare, Paperclip, Download, X, Image as ImageIcon, FileText } from 'lucide-react';
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
        return (
            <div className={`border rounded-none p-4 max-w-[85%] md:max-w-[70%] ${
                isConfirmed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
            }`}>
                <div className="flex items-center gap-2 mb-3">
                    {isConfirmed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    }
                    <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${isConfirmed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Order #{metadata.order_id} — {isConfirmed ? 'Confirmed' : 'Rejected'}
                    </span>
                </div>
                {isConfirmed && metadata.shipping_cost != null && (
                    <div className="text-sm text-zinc-200">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Shipping Cost</span>
                        <span className="font-semibold text-emerald-300">
                            Rp {Number(metadata.shipping_cost).toLocaleString('id-ID')}
                        </span>
                    </div>
                )}
                {metadata.admin_note && (
                    <div className="mt-2 text-sm text-zinc-300 leading-relaxed">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1">Note</span>
                        {metadata.admin_note}
                    </div>
                )}
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
                {metadata.items && metadata.items.length > 0 && (
                    <div>
                        <span className="text-zinc-500 uppercase tracking-widest text-[9px] block mb-1">
                            Items ({metadata.items.length})
                        </span>
                        <div className="space-y-1">
                            {metadata.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-zinc-800/60 px-2 py-1.5 border border-zinc-800">
                                    <span className="text-zinc-200 font-medium truncate max-w-[160px]">{item.product_name_snapshot}</span>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-zinc-500 font-mono">{item.size}</span>
                                        <span className="bg-zinc-700 text-white text-[10px] px-1.5 py-0.5 font-mono">×{item.quantity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

    const smartScroll = () => {}; // no-op, kept to avoid ref errors

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

                                // Wholesale system card → RIGHT (user submitted)
                                if (isSystem && isWholesale) {
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
