import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8">
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-widest uppercase">RELOAD <span className="text-zinc-500">CMS</span></h1>
                    <p className="text-zinc-400 text-sm mt-2">Selamat datang, {user.name || 'Admin'}!</p>
                </div>

                <button
                    onClick={handleLogout}
                    className="border border-red-900/50 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-400 px-6 py-2 uppercase tracking-widest text-xs transition-colors"
                >
                    System Logout
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6">
                    <h3 className="text-zinc-400 text-sm uppercase tracking-widest mb-4">Total Products</h3>
                    <p className="text-4xl font-bold">0</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6">
                    <h3 className="text-zinc-400 text-sm uppercase tracking-widest mb-4">Total Collections</h3>
                    <p className="text-4xl font-bold">0</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6">
                    <h3 className="text-zinc-400 text-sm uppercase tracking-widest mb-4">Messages</h3>
                    <p className="text-4xl font-bold">0</p>
                </div>
            </div>
        </div>
    );
}