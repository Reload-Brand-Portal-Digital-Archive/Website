import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Shield, User, Eye, EyeOff, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminProfile() {
    const { t } = useTranslation();
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
    const [requireOtp, setRequireOtp] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        let timer;
        if (requireOtp && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [requireOtp, timeLeft]);

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
            toast.error(t('admin_profile.name_required'));
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
                toast.success(t('admin_profile.profile_updated'));
                const updatedUser = { ...user, name: profileData.name };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                
                window.dispatchEvent(new Event('userProfileUpdated'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || t('admin_profile.failed_update_profile'));
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error(t('admin_profile.password_mismatch'));
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error(t('admin_profile.password_min_length'));
            return;
        }

        setIsSavingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(import.meta.env.VITE_API_URL + '/api/admin/password/request-otp', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.requireOtp) {
                setRequireOtp(true);
                setTimeLeft(60);
                setTempToken(response.data.tempToken);
                toast.success(response.data.message);
            }
        } catch (error) {
            console.error('Error requesting OTP for password:', error);
            toast.error(error.response?.data?.message || t('admin_profile.failed_request_otp'));
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setIsSavingPassword(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(import.meta.env.VITE_API_URL + '/api/admin/password/verify-otp', {
                tempToken,
                otp
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success(t('admin_profile.password_updated'));
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setRequireOtp(false);
                setOtp('');
                setTempToken('');
            }
        } catch (error) {
            console.error('Error verifying OTP for password:', error);
            toast.error(error.response?.data?.message || t('admin_profile.failed_verify_otp'));
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
                        <User className="text-rose-500" /> {t('admin_profile.title')}
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">{t('admin_profile.desc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <User className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">{t('admin_profile.profile_info')}</h3>
                    </div>
                    <div className="p-6 flex-1">
                        <form onSubmit={handleUpdateProfile} className="space-y-5 h-full flex flex-col">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">{t('admin_profile.full_name')}</label>
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
                                <label className="text-sm font-medium text-zinc-500">{t('admin_profile.email_read_only')}</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed"
                                />
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t('admin_profile.email_cannot_change')}</p>
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
                                    <span>{isSavingProfile ? t('common.saving') : t('admin_profile.save_profile')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <Shield className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-lg text-white">{t('admin_profile.password_security')}</h3>
                    </div>
                    <div className="p-6 flex-1">
                        {user?.google_id ? (
                            <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                                <Shield size={24} className="text-zinc-600" />
                                <div className="text-sm">
                                    <p className="text-zinc-300 font-medium mb-1">{t('admin_profile.google_sso_title')}</p>
                                    <p>{t('admin_profile.google_sso_desc')}</p>
                                </div>
                            </div>
                        ) : requireOtp ? (
                            <form onSubmit={handleOtpSubmit} className="space-y-5 h-full flex flex-col justify-center">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300 text-center block">{t('admin_profile.otp_label')}</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        disabled={timeLeft === 0}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 text-zinc-50 font-mono text-center tracking-[1em] text-xl placeholder:text-zinc-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors disabled:opacity-50"
                                        placeholder="------"
                                        maxLength={6}
                                    />
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs font-mono uppercase tracking-widest">
                                        <span className="text-zinc-500">{t('admin_profile.expires_in')}</span>
                                        <span className={timeLeft <= 10 ? 'text-rose-500 font-bold' : 'text-zinc-300'}>{timeLeft}s</span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-800 rounded-lg overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-rose-500' : 'bg-rose-600'}`}
                                            style={{ width: `${(timeLeft / 60) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col gap-3 mt-auto">
                                    <button
                                        type="submit"
                                        disabled={isSavingPassword || timeLeft === 0}
                                        className="flex items-center justify-center w-full gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                                    >
                                        {isSavingPassword ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                        ) : (
                                            <Shield size={16} className="text-zinc-400" />
                                        )}
                                        <span>{timeLeft === 0 ? t('admin_profile.otp_expired') : (isSavingPassword ? t('admin_profile.verifying') : t('admin_profile.verify_otp'))}</span>
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => setRequireOtp(false)}
                                        className="text-xs text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-widest transition-colors text-center py-2"
                                    >
                                        {t('admin_profile.cancel_btn')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleUpdatePassword} className="space-y-5 h-full flex flex-col">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">{t('admin_profile.old_password')}</label>
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
                                    <label className="text-sm font-medium text-zinc-300">{t('admin_profile.new_password')}</label>
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
                                    <label className="text-sm font-medium text-zinc-300">{t('admin_profile.confirm_new_password')}</label>
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
                                        <span>{isSavingPassword ? t('admin_profile.updating') : t('admin_profile.update_password')}</span>
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
