import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, X, Navigation, Shield, ChevronRight } from 'lucide-react';

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

export default function GpsPermissionBanner() {
    const [visible, setVisible] = useState(false);

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

    const handleAllow = () => {
        localStorage.setItem(GPS_STORAGE_KEY, 'granted');
        setVisible(false);

        if (!navigator.geolocation) {
            console.warn('Geolocation tidak tersedia di perangkat ini.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await sendLocation(latitude, longitude);
                    console.log('GPS location berhasil dikirim (background).');
                } catch (err) {
                    console.warn('Gagal mengirim GPS location:', err);
                }
            },
            (err) => {
                console.warn('GPS error (background):', err.code, err.message);
                if (err.code === 1) {
                    localStorage.setItem(GPS_STORAGE_KEY, 'blocked');
                }
            },
            { timeout: 15000, maximumAge: 300000 }
        );
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleDismiss}
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

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded-lg hover:bg-zinc-800"
                            aria-label="Tutup"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-7">
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
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
