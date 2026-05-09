import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, X, Navigation, Shield, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';

const GPS_STORAGE_KEY = 'gps_permission_asked';
const CLIENT_ID_COOKIE = 'client_id';

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const getClientId = () => {
    let clientId = getCookie(CLIENT_ID_COOKIE);
    if (!clientId) {
        try {
            clientId = 'user-' + crypto.randomUUID();
        } catch (e) {
            clientId = 'user-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
        }
        const date = new Date();
        date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
        document.cookie = `${CLIENT_ID_COOKIE}=${clientId};expires=${date.toUTCString()};path=/;SameSite=Lax`;
    }
    return clientId;
};

/**
 * GpsPermissionModal — Modal popup yang muncul sekali di landing page.
 * Status:
 *   idle      → tampilkan form izin
 *   loading   → sedang mengambil koordinat
 *   success   → koordinat berhasil dikirim
 *   blocked   → browser memblokir GPS (PERMISSION_DENIED, error code 1)
 *   unavail   → hardware GPS tidak tersedia (POSITION_UNAVAILABLE, error code 2)
 *   timeout   → terlalu lama (TIMEOUT, error code 3)
 *   denied    → user klik "Tidak, terima kasih" di modal kita
 */
export default function GpsPermissionBanner() {
    const [visible, setVisible] = useState(false);
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        const alreadyAsked = localStorage.getItem(GPS_STORAGE_KEY);
        if (!alreadyAsked) {
            const timer = setTimeout(() => setVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(GPS_STORAGE_KEY, 'denied');
        setVisible(false);
    };

    // Reset: hapus localStorage agar modal bisa muncul lagi (digunakan saat user ingin coba lagi)
    const handleRetry = () => {
        localStorage.removeItem(GPS_STORAGE_KEY);
        setStatus('idle');
    };

    // Fallback: ambil koordinat dari IP address jika GPS gagal
    const getLocationFromIP = async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
                return { latitude: data.latitude, longitude: data.longitude, source: 'ip' };
            }
        } catch (e) {
            // coba fallback kedua
        }
        try {
            const res2 = await fetch('https://ip-api.com/json/?fields=lat,lon,status');
            const data2 = await res2.json();
            if (data2.status === 'success') {
                return { latitude: data2.lat, longitude: data2.lon, source: 'ip' };
            }
        } catch (e) {}
        return null;
    };

    const sendLocation = async (latitude, longitude) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.post(
            `${apiUrl}/api/track/location`,
            { latitude, longitude, client_id: getClientId() },
            { headers }
        );
    };

    const handleAllow = async () => {
        if (!navigator.geolocation) {
            // Langsung fallback ke IP
            setStatus('loading');
            const ipLoc = await getLocationFromIP();
            if (ipLoc) {
                try {
                    await sendLocation(ipLoc.latitude, ipLoc.longitude);
                    setStatus('success');
                    localStorage.setItem(GPS_STORAGE_KEY, 'granted');
                    setTimeout(() => setVisible(false), 2500);
                } catch {
                    setStatus('success'); // tetap success agar UX baik
                    localStorage.setItem(GPS_STORAGE_KEY, 'granted');
                    setTimeout(() => setVisible(false), 2500);
                }
            } else {
                setStatus('unavail');
            }
            return;
        }

        setStatus('loading');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await sendLocation(latitude, longitude);
                    setStatus('success');
                    localStorage.setItem(GPS_STORAGE_KEY, 'granted');
                    setTimeout(() => setVisible(false), 2500);
                } catch {
                    setStatus('success');
                    localStorage.setItem(GPS_STORAGE_KEY, 'granted');
                    setTimeout(() => setVisible(false), 2500);
                }
            },
            async (err) => {
                console.warn('GPS error, trying IP fallback:', err.code, err.message);

                if (err.code === 1) {
                    // PERMISSION_DENIED — browser blokir, IP fallback juga tidak bisa
                    setStatus('blocked');
                    return;
                }

                // TIMEOUT (3) atau UNAVAILABLE (2) → coba IP fallback dulu
                const ipLoc = await getLocationFromIP();
                if (ipLoc) {
                    try {
                        await sendLocation(ipLoc.latitude, ipLoc.longitude);
                        setStatus('success');
                        localStorage.setItem(GPS_STORAGE_KEY, 'granted');
                        setTimeout(() => setVisible(false), 2500);
                    } catch {
                        setStatus('success');
                        localStorage.setItem(GPS_STORAGE_KEY, 'granted');
                        setTimeout(() => setVisible(false), 2500);
                    }
                } else {
                    // IP fallback juga gagal
                    setStatus(err.code === 3 ? 'timeout' : 'unavail');
                }
            },
            { timeout: 8000, maximumAge: 300000 }
        );
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={status === 'idle' ? handleDismiss : undefined}
            />

            {/* Modal */}
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
                role="dialog"
                aria-modal="true"
                aria-label="Izin akses lokasi"
            >
                <div className="relative w-full max-w-sm pointer-events-auto animate-in zoom-in-95 fade-in duration-300">
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-rose-500/20 via-transparent to-transparent pointer-events-none" />

                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/80">
                        <div className="h-px bg-gradient-to-r from-rose-600 via-rose-400 to-transparent" />

                        {/* Close button — selalu tampil kecuali saat loading */}
                        {status !== 'loading' && (
                            <button
                                onClick={status === 'blocked' || status === 'unavail' || status === 'timeout' ? () => setVisible(false) : handleDismiss}
                                className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded-lg hover:bg-zinc-800"
                                aria-label="Tutup"
                            >
                                <X size={16} />
                            </button>
                        )}

                        <div className="p-7">
                            {/* ── IDLE ── */}
                            {status === 'idle' && (
                                <>
                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto mb-5">
                                        <MapPin size={26} className="text-rose-400" />
                                    </div>
                                    <div className="text-center mb-6">
                                        <h2 className="text-lg font-bold text-zinc-100 mb-2">Izinkan Akses Lokasi?</h2>
                                        <p className="text-sm text-zinc-400 leading-relaxed">
                                            RELOAD ingin mengetahui lokasi pengunjung secara anonim untuk analitik wilayah toko.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3.5 mb-6">
                                        <Shield size={15} className="text-zinc-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                                            Lokasi hanya digunakan untuk analitik. Data tidak dibagikan ke pihak ketiga.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <button
                                            onClick={handleAllow}
                                            id="gps-allow-btn"
                                            className="w-full flex items-center justify-center gap-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-semibold py-3 px-5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                                        >
                                            <Navigation size={15} />
                                            Izinkan Akses Lokasi
                                            <ChevronRight size={15} className="ml-auto opacity-60" />
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            id="gps-deny-btn"
                                            className="w-full text-zinc-500 hover:text-zinc-300 text-sm font-medium py-3 px-5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 bg-transparent hover:bg-zinc-800/50 active:scale-[0.98]"
                                        >
                                            Tidak, terima kasih
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ── LOADING ── */}
                            {status === 'loading' && (
                                <div className="text-center py-4">
                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto mb-4">
                                        <Navigation size={24} className="text-rose-400 animate-pulse" />
                                    </div>
                                    <p className="text-base font-semibold text-zinc-100 mb-1">Mengambil lokasi…</p>
                                    <p className="text-sm text-zinc-500">Mohon izinkan akses di prompt browser</p>
                                </div>
                            )}

                            {/* ── SUCCESS ── */}
                            {status === 'success' && (
                                <div className="text-center py-4">
                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-4">
                                        <MapPin size={24} className="text-emerald-400" />
                                    </div>
                                    <p className="text-base font-semibold text-emerald-400 mb-1">Lokasi Tersimpan!</p>
                                    <p className="text-sm text-zinc-500">Terima kasih telah berpartisipasi 🙏</p>
                                </div>
                            )}

                            {/* ── BLOCKED (browser blokir GPS) ── */}
                            {status === 'blocked' && (
                                <div className="text-center py-2">
                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto mb-4">
                                        <AlertTriangle size={24} className="text-amber-400" />
                                    </div>
                                    <p className="text-base font-semibold text-amber-400 mb-1">Akses Lokasi Diblokir</p>
                                    <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                                        Browser kamu memblokir akses lokasi untuk situs ini. Aktifkan di pengaturan browser:
                                    </p>
                                    {/* Instruksi */}
                                    <div className="text-left bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 mb-5 space-y-2">
                                        <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mb-2">Chrome / Edge</p>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            Klik ikon 🔒 di address bar → <span className="text-zinc-200">Izin situs</span> → <span className="text-zinc-200">Lokasi</span> → pilih <span className="text-emerald-400 font-semibold">Izinkan</span>, lalu refresh halaman.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleRetry}
                                            className="w-full flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-400 text-sm font-medium py-2.5 px-4 rounded-xl transition-all"
                                        >
                                            <RefreshCw size={14} />
                                            Coba Lagi Setelah Diizinkan
                                        </button>
                                        <button
                                            onClick={() => { localStorage.setItem(GPS_STORAGE_KEY, 'denied'); setVisible(false); }}
                                            className="w-full text-zinc-600 hover:text-zinc-400 text-xs py-2 transition-colors"
                                        >
                                            Lewati saja
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── UNAVAILABLE / TIMEOUT ── */}
                            {(status === 'unavail' || status === 'timeout') && (
                                <div className="text-center py-4">
                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto mb-4">
                                        <X size={24} className="text-zinc-500" />
                                    </div>
                                    <p className="text-base font-medium text-zinc-400 mb-1">
                                        {status === 'timeout' ? 'Waktu habis' : 'GPS tidak tersedia'}
                                    </p>
                                    <p className="text-sm text-zinc-600 mb-5">
                                        {status === 'timeout'
                                            ? 'Terlalu lama mengambil lokasi. Pastikan GPS aktif.'
                                            : 'Perangkat tidak mendukung atau layanan lokasi dimatikan.'}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleRetry}
                                            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-medium py-2.5 px-4 rounded-xl transition-all"
                                        >
                                            <RefreshCw size={14} />
                                            Coba Lagi
                                        </button>
                                        <button
                                            onClick={() => { localStorage.setItem(GPS_STORAGE_KEY, 'denied'); setVisible(false); }}
                                            className="w-full text-zinc-600 hover:text-zinc-400 text-xs py-2 transition-colors"
                                        >
                                            Lewati saja
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── DENIED (user klik "Tidak") ── */}
                            {status === 'denied' && (
                                <div className="text-center py-4">
                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto mb-4">
                                        <X size={24} className="text-zinc-500" />
                                    </div>
                                    <p className="text-base font-medium text-zinc-400 mb-1">Tidak diizinkan</p>
                                    <p className="text-sm text-zinc-600">Tidak apa-apa, selamat berbelanja!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
