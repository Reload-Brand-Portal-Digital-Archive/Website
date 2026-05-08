import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Save, Upload, Eye, EyeOff, Shield, Link as LinkIcon, Settings2, Smartphone, Mail, Globe, Image as ImageIcon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        hero_headline: '',
        hero_subheadline: '',
        shopee_shop_url: '',
        tiktok_shop_url: '',
        whatsapp_number: '',
        contact_email: '',
        admin_notification_email: '',
        simulation_mode: 'false',
        maintenance_mode: 'false',
        hero_banner_image: ''
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const { refreshSettings } = useSettings();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [heroImagePreview, setHeroImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/admin/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSettings(prev => ({ ...prev, ...response.data.data }));
                if (response.data.data.hero_banner_image) {
                    setHeroImagePreview(import.meta.env.VITE_API_URL + '/' + response.data.data.hero_banner_image);
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Gagal mengambil pengaturan sistem');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                setHeroImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            
            if (fileInputRef.current.files && fileInputRef.current.files[0]) {
                const formData = new FormData();
                formData.append('hero_banner_image', fileInputRef.current.files[0]);
                
                await axios.post(import.meta.env.VITE_API_URL + '/api/admin/settings/hero-image', formData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            const settingsToSave = { ...settings };
            delete settingsToSave.hero_banner_image;

            const response = await axios.put(import.meta.env.VITE_API_URL + '/api/admin/settings', settingsToSave, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Pengaturan sistem berhasil disimpan!');
                fetchSettings();
                if (refreshSettings) refreshSettings();
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Gagal menyimpan pengaturan sistem');
        } finally {
            setIsSaving(false);
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <Settings2 className="text-rose-500" /> Pengaturan Sistem
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Konfigurasi global untuk website RELOAD dan platform e-commerce.</p>
                </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <ImageIcon className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">Hero Banner & Branding</h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Hero Headline</label>
                                <input
                                    type="text"
                                    name="hero_headline"
                                    value={settings.hero_headline || ''}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                    placeholder="Welcome to RELOAD"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Hero Sub-headline</label>
                                <input
                                    type="text"
                                    name="hero_subheadline"
                                    value={settings.hero_subheadline || ''}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                    placeholder="Streetwear made for everyone."
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-zinc-300">Hero Banner Image</label>
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div 
                                    className="w-full sm:w-64 h-36 bg-zinc-950 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {heroImagePreview ? (
                                        <>
                                            <img src={heroImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Upload className="text-white" size={24} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                            <Upload className="mx-auto mb-2" size={24} />
                                            <span className="text-xs">Klik untuk upload</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-xs text-zinc-400">
                                        Upload gambar banner utama yang akan ditampilkan di halaman depan.
                                        Format disarankan: JPG, WEBP (1920x1080). Maksimal ukuran 5MB.
                                    </p>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="hidden" 
                                        accept="image/jpeg,image/png,image/webp"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-white rounded-md transition-colors"
                                    >
                                        Pilih File
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <LinkIcon className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">E-Commerce Integration</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Shopee Shop URL</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                                    <Globe size={16} />
                                </span>
                                <input
                                    type="url"
                                    name="shopee_shop_url"
                                    value={settings.shopee_shop_url || ''}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                    placeholder="https://shopee.co.id/..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">TikTok Shop URL</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                                    <Smartphone size={16} />
                                </span>
                                <input
                                    type="url"
                                    name="tiktok_shop_url"
                                    value={settings.tiktok_shop_url || ''}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                    placeholder="https://www.tiktok.com/@..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <Mail className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">Contact & Communication</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Public WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsapp_number"
                                value={settings.whatsapp_number || ''}
                                onChange={handleChange}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                placeholder="+628123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Public Contact Email</label>
                            <input
                                type="email"
                                name="contact_email"
                                value={settings.contact_email || ''}
                                onChange={handleChange}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                                placeholder="hello@reload.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Admin Notification Email</label>
                            <input
                                type="email"
                                name="admin_notification_email"
                                value={settings.admin_notification_email || ''}
                                onChange={handleChange}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors border-l-4 border-l-indigo-500"
                                placeholder="admin@reload.com"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <Settings2 className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">System Control (Enterprise)</h3>
                    </div>
                    <div className="p-6 flex flex-col sm:flex-row gap-8">
                        <label className="flex items-center cursor-pointer group">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    name="simulation_mode"
                                    checked={settings.simulation_mode === 'true'}
                                    onChange={handleChange}
                                    className="sr-only" 
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${settings.simulation_mode === 'true' ? 'bg-indigo-600' : 'bg-zinc-700'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.simulation_mode === 'true' ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Simulation Mode</div>
                                <div className="text-xs text-zinc-500">Dashboard map akan menggunakan mock data</div>
                            </div>
                        </label>

                        <label className="flex items-center cursor-pointer group">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    name="maintenance_mode"
                                    checked={settings.maintenance_mode === 'true'}
                                    onChange={handleChange}
                                    className="sr-only" 
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${settings.maintenance_mode === 'true' ? 'bg-rose-600' : 'bg-zinc-700'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.maintenance_mode === 'true' ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Maintenance Mode</div>
                                <div className="text-xs text-zinc-500">Frontend publik akan menampilkan layar maintenance</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-rose-900/20"
                    >
                        {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isSaving ? 'Menyimpan...' : 'Save Configuration'}</span>
                    </button>
                </div>
            </form>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm mt-8">
                <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                    <Shield className="text-rose-500" size={20} />
                    <h3 className="font-semibold text-lg text-white">Security</h3>
                </div>
                <div className="p-6">
                    <form onSubmit={handleUpdatePassword} className="max-w-md space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Old Password</label>
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
                            <label className="text-sm font-medium text-zinc-300">New Password</label>
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
                            <label className="text-sm font-medium text-zinc-300">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                            />
                        </div>

                        <div className="pt-2">
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
                                <span>{isSavingPassword ? 'Updating...' : 'Update Password'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
        </div>
    );
}
