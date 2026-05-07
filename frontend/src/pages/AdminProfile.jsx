import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Shield, User, Eye, EyeOff, Save } from 'lucide-react';

export default function AdminProfile() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    
    const [profileData, setProfileData] = useState({
        name: user.name || '',
        email: user.email || ''
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!profileData.name.trim()) {
            toast.error('Nama tidak boleh kosong');
            return;
        }

        setIsSavingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(import.meta.env.VITE_API_URL + '/api/profile/update', {
                name: profileData.name
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                toast.success('Profil berhasil diperbarui!');
                const updatedUser = { ...user, name: profileData.name };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                
                window.dispatchEvent(new Event('userProfileUpdated'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Konfirmasi password tidak cocok!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password baru minimal 6 karakter!');
            return;
        }

        setIsSavingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(import.meta.env.VITE_API_URL + '/api/admin/password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Password berhasil diperbarui!');
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.response?.data?.message || 'Gagal memperbarui password');
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <User className="text-rose-500" /> Profil Administrator
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Kelola data diri dan keamanan akun Anda.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <User className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">Informasi Profil</h3>
                    </div>
                    <div className="p-6 flex-1">
                        <form onSubmit={handleUpdateProfile} className="space-y-5 h-full flex flex-col">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Nama Lengkap</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profileData.name}
                                    onChange={handleProfileChange}
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-500">Email Address (Read-only)</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed"
                                />
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Email tidak dapat diubah</p>
                            </div>

                            <div className="pt-2 mt-auto">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 border border-transparent disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-rose-900/20"
                                >
                                    {isSavingProfile ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <Shield className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">Keamanan Kata Sandi</h3>
                    </div>
                    <div className="p-6 flex-1">
                        {user?.google_id ? (
                            <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                                <Shield size={24} className="text-zinc-600" />
                                <div className="text-sm">
                                    <p className="text-zinc-300 font-medium mb-1">Login dengan Google SSO</p>
                                    <p>Akun Anda terhubung dengan Google. Pengubahan password dinonaktifkan.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdatePassword} className="space-y-5 h-full flex flex-col">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Password Lama</label>
                                    <div className="relative">
                                        <input
                                            type={showOldPassword ? "text" : "password"}
                                            name="oldPassword"
                                            value={passwordData.oldPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Password Baru</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Konfirmasi Password Baru</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                    />
                                </div>

                                <div className="pt-2 mt-auto">
                                    <button
                                        type="submit"
                                        disabled={isSavingPassword}
                                        className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                                    >
                                        {isSavingPassword ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                        ) : (
                                            <Shield size={16} className="text-zinc-400" />
                                        )}
                                        <span>{isSavingPassword ? 'Memperbarui...' : 'Update Password'}</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
