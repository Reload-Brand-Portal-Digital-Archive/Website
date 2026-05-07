import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User, Send, Shield, Search } from 'lucide-react';
import { notify } from '../lib/toast';

const API = import.meta.env.VITE_API_URL;

export default function AdminChats() {
    const [chatSessions, setChatSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchChatSessions();
        const interval = setInterval(() => {
            fetchChatSessions(false);
            if (selectedUser) {
                fetchMessages(selectedUser.user_id, false);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredSessions(chatSessions);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            setFilteredSessions(chatSessions.filter(session => 
                session.name.toLowerCase().includes(lowerQuery) || 
                session.email.toLowerCase().includes(lowerQuery)
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
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
            if (showLoading) notify.error('Failed to load chat sessions.');
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
            
            // Mark as read
            await axios.put(`${API}/api/chats/admin/read`, { senderToMark: 'user', userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Update local unread count
            setChatSessions(prev => prev.map(session => 
                session.user_id === userId ? { ...session, unread_count: 0 } : session
            ));
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (showLoading) notify.error('Failed to load messages.');
        } finally {
            if (showLoading) setLoadingMessages(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        fetchMessages(user.user_id);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        
        const tempMsg = {
            chat_id: 'temp-' + Date.now(),
            message: messageText,
            sender: 'admin',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await axios.post(`${API}/api/chats/send`, { message: messageText, sender: 'admin', userId: selectedUser.user_id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages(selectedUser.user_id, false);
            fetchChatSessions(false); // Update last activity
        } catch (error) {
            console.error('Error sending message:', error);
            notify.error('Failed to send message.');
            setMessages(prev => prev.filter(m => m.chat_id !== tempMsg.chat_id));
            setNewMessage(messageText);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
            {/* Sidebar Users List */}
            <div className="w-80 border border-zinc-800 bg-zinc-900/40 flex flex-col overflow-hidden rounded-xl">
                <div className="p-4 border-b border-zinc-800 shrink-0">
                    <h2 className="font-bold text-lg mb-4">Conversations</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                        <div className="p-8 text-center text-zinc-500 text-sm">
                            No conversations found.
                        </div>
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
                                        <span className="font-bold text-zinc-400">
                                            {session.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-semibold text-sm truncate text-zinc-100">{session.name}</span>
                                            {session.unread_count > 0 && (
                                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                                    {session.unread_count}
                                                </span>
                                            )}
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
            <div className="flex-1 border border-zinc-800 bg-zinc-900/40 flex flex-col overflow-hidden rounded-xl">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-zinc-400">
                                        {selectedUser.name.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-zinc-100">{selectedUser.name}</h3>
                                    <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex justify-center items-center h-full text-zinc-500 text-sm">
                                    No messages yet.
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isAdmin = msg.sender === 'admin';
                                    return (
                                        <div key={msg.chat_id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-center gap-2 mb-1.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                                    {isAdmin ? <Shield className="w-3.5 h-3.5 text-amber-500" /> : <User className="w-3.5 h-3.5 text-zinc-400" />}
                                                </div>
                                                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                                                    {isAdmin ? 'Admin' : selectedUser.name}
                                                </span>
                                                <span className="font-mono text-[9px] text-zinc-700">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div 
                                                className={`max-w-[85%] md:max-w-[70%] p-4 text-sm font-sans leading-relaxed break-words ${
                                                    isAdmin 
                                                        ? 'bg-rose-600 text-white rounded-l-xl rounded-br-xl' 
                                                        : 'bg-zinc-800 text-zinc-100 rounded-r-xl rounded-bl-xl border border-zinc-700'
                                                }`}
                                            >
                                                {msg.message}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 outline-none h-12 pl-4 pr-16 text-sm text-zinc-100 rounded-md transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 hover:text-white disabled:opacity-50 flex items-center justify-center transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <Shield className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-zinc-400">Admin Chat Support</p>
                        <p className="text-sm mt-2">Select a conversation from the sidebar to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
