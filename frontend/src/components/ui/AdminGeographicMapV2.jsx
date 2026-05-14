import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Globe, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

/**
 * AdminGeographicMapV2 - Direct Leaflet Integration 
 * 
 * VERSION: Proportional Unified Layout
 * This component is designed to be placed beside 1/3 column charts in a 3-col grid.
 */
export default function AdminGeographicMapV2({ refreshTrigger }) {
    const { t } = useTranslation();
    const [hubData, setHubData] = useState(null);
    const [gpsData, setGpsData] = useState(null);
    const [wholesaleData, setWholesaleData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { settings } = useSettings();
    const isSimulationMode = settings?.simulation_mode === 'true';
    
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // ── Custom SVG DivIcons ─────────────────────────────────────────────
    const makePinIcon = (fillColor, borderColor, svgInner, size = 32) => L.divIcon({
        className: '',
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
        html: `
            <div style="
                width: ${size}px; height: ${size}px;
                position: relative;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            ">
                <svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
                    <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 28 12 28S28 21 28 12C28 5.37 22.63 0 16 0z"
                          fill="${fillColor}" stroke="${borderColor}" stroke-width="1.5"/>
                    <circle cx="16" cy="12" r="7" fill="white" opacity="0.25"/>
                    <g transform="translate(9,5)">${svgInner}</g>
                </svg>
            </div>
        `
    });

    // TikTok: hitam dengan logo TT
    const tiktokIcon = makePinIcon('#18181b', '#52525b',
        `<text x="7" y="11" text-anchor="middle" font-size="11" font-weight="bold"
              font-family="sans-serif" fill="white">TT</text>`);

    // Shopee: oranye dengan logo SP
    const shopeeIcon = makePinIcon('#ea580c', '#c2410c',
        `<text x="7" y="11" text-anchor="middle" font-size="11" font-weight="bold"
              font-family="sans-serif" fill="white">SP</text>`);

    // Wholesale Selesai: hijau dengan label WS
    const wholesaleIcon = makePinIcon('#16a34a', '#15803d',
        `<text x="7" y="11" text-anchor="middle" font-size="10" font-weight="bold"
              font-family="sans-serif" fill="white">WS</text>`);

    // GPS Visitor: cyan dengan ikon sinyal
    const gpsIcon = L.divIcon({
        className: '',
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
        html: `
            <div style="position:relative;width:24px;height:24px;">
                <div style="
                    position:absolute;inset:0;
                    background:#06b6d4;border:2px solid #0891b2;
                    border-radius:50%;
                    box-shadow:0 0 0 4px rgba(6,182,212,0.25);
                    display:flex;align-items:center;justify-content:center;
                ">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="2.5"/>
                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 0 11z" opacity="0.5"/>
                        <path d="M8 4.5A3.5 3.5 0 1 0 8 11.5 3.5 3.5 0 0 0 8 4.5zm0 5.5A2 2 0 1 1 8 6a2 2 0 0 1 0 4z" opacity="0.75"/>
                    </svg>
                </div>
            </div>
        `
    });

    useEffect(() => {
        const fetchHubData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                if (isSimulationMode) {
                    const mockOrders = [];
                    const cities = [
                        { name: 'Jakarta', coords: [-6.2088, 106.8456] },
                        { name: 'Surabaya', coords: [-7.2504, 112.7688] },
                        { name: 'Bandung', coords: [-6.9147, 107.6098] },
                        { name: 'Medan', coords: [3.5952, 98.6722] },
                        { name: 'Makassar', coords: [-5.1477, 119.4327] },
                        { name: 'Yogyakarta', coords: [-7.7956, 110.3695] },
                        { name: 'Semarang', coords: [-6.9667, 110.4167] },
                        { name: 'Denpasar', coords: [-8.6500, 115.2167] },
                    ];
                    const platforms = ['TikTok', 'Shopee'];
                    const products = ['Reload Basic Tee', 'Archive Hoodie', 'Street Cargo Pants', 'Varsity Jacket'];

                    for (let i = 0; i < 50; i++) {
                        const city = cities[Math.floor(Math.random() * cities.length)];
                        const jitterLat = (Math.random() - 0.5) * 0.05;
                        const jitterLng = (Math.random() - 0.5) * 0.05;
                        
                        mockOrders.push({
                            order_id: `SIM-${Math.floor(Math.random() * 100000)}`,
                            platform: platforms[Math.floor(Math.random() * platforms.length)],
                            product_name: products[Math.floor(Math.random() * products.length)],
                            total_amount: Math.floor(Math.random() * 500000) + 150000,
                            customer: { city: city.name },
                            coordinates: [city.coords[0] + jitterLat, city.coords[1] + jitterLng],
                        });
                    }

                    const platformBreakdown = { TikTok: 0, Shopee: 0 };
                    let totalSales = 0;
                    mockOrders.forEach(o => {
                        platformBreakdown[o.platform]++;
                        totalSales += o.total_amount;
                    });

                    setHubData({
                        total_orders: mockOrders.length,
                        total_sales: totalSales,
                        platform_breakdown: platformBreakdown,
                        orders: mockOrders
                    });
                    
                    setIsLoading(false);
                    return;
                }

                const token = localStorage.getItem('token');
                const response = await axios.get(import.meta.env.VITE_API_URL + '/api/settings/ecommerce-hub', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success && response.data.data) {
                    setHubData(response.data.data);
                } else {
                    setError("Invalid Hub data.");
                }
            } catch (error) {
                console.error("Hub Fetch Error:", error);
                setError("Failed to fetch data from API.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHubData();
    }, [refreshTrigger, isSimulationMode]);

    // Fetch GPS visitor locations
    useEffect(() => {
        const fetchGpsData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/api/track/locations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setGpsData(res.data.data);
                }
            } catch (err) {
                console.error('GPS Locations Fetch Error:', err);
            }
        };
        fetchGpsData();
    }, [refreshTrigger]);

    // Fetch completed wholesale order locations
    useEffect(() => {
        const fetchWholesaleLocations = async () => {
            if (isSimulationMode) {
                // Mock wholesale data untuk simulation mode
                const cities = [
                    { name: 'bandung', lat: -6.9147, lng: 107.6098 },
                    { name: 'jakarta', lat: -6.2088, lng: 106.8456 },
                    { name: 'surabaya', lat: -7.2504, lng: 112.7688 },
                    { name: 'yogyakarta', lat: -7.7956, lng: 110.3695 },
                    { name: 'semarang', lat: -6.9667, lng: 110.4167 },
                ];
                const mockWholesale = cities.slice(0, 3).map((c, i) => ({
                    order_id: `SIM-WS-${i + 1}`,
                    name: `Toko ${c.name.charAt(0).toUpperCase() + c.name.slice(1)}`,
                    address: `Jl. Merdeka No.${i + 1}, ${c.name}`,
                    city: c.name,
                    inquiry_type: 'Wholesale Request',
                    status: 'Pesanan selesai',
                    lat: c.lat + (Math.random() - 0.5) * 0.02,
                    lng: c.lng + (Math.random() - 0.5) * 0.02,
                    created_at: new Date().toISOString(),
                }));
                setWholesaleData({ total: mockWholesale.length, locations: mockWholesale });
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/api/track/wholesale-locations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setWholesaleData(res.data.data);
                }
            } catch (err) {
                console.error('Wholesale Locations Fetch Error:', err);
            }
        };
        fetchWholesaleLocations();
    }, [refreshTrigger, isSimulationMode]);

    // Initialize Map Instance
    useEffect(() => {
        if (!mapContainerRef.current || isLoading || error) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const initialCenter = [-2.5489, 118.0149]; // Indonesia Center

        const map = L.map(mapContainerRef.current, {
            center: initialCenter,
            zoom: 5,
            scrollWheelZoom: true,
            zoomControl: true,
            attributionControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isLoading, error]); 

    // Update Markers when Data changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !hubData?.orders) return;

        const markerLayer = L.layerGroup().addTo(map);

        // ── E-commerce (TikTok / Shopee) markers ──────────────────────
        hubData.orders.forEach(order => {
            if (!order.coordinates || !Array.isArray(order.coordinates)) return;

            const isTikTok = order.platform === 'TikTok';
            const icon = isTikTok ? tiktokIcon : shopeeIcon;

            const platformColor = isTikTok ? '#a1a1aa' : '#f97316';
            const popupContent = `
                <div style="font-family: sans-serif; min-width: 155px; padding: 4px; color: #333;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px; align-items:center;">
                        <b style="font-size: 10px; color: ${platformColor}; background:#18181b; padding:2px 6px; border-radius:3px;">${order.platform}</b>
                        <span style="font-size: 10px; color: #999;">#${order.order_id}</span>
                    </div>
                    <div style="font-size: 12px;">
                        <b style="color: #000;">${order.product_name}</b>
                        <p style="margin: 4px 0;">📍 ${order.customer?.city || 'Unknown'}</p>
                        <p style="margin: 0; color: #e11d48; font-weight: bold;">Rp ${order.total_amount.toLocaleString('en-US')}</p>
                    </div>
                </div>
            `;

            L.marker(order.coordinates, { icon })
                .bindPopup(popupContent, { minWidth: 155 })
                .addTo(markerLayer);
        });

        // ── Wholesale Selesai markers ──────────────────────────────────
        if (wholesaleData?.locations?.length > 0) {
            wholesaleData.locations.forEach(order => {
                const lat = parseFloat(order.lat);
                const lng = parseFloat(order.lng);
                if (isNaN(lat) || isNaN(lng)) return;

                const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric'
                });
                const popupContent = `
                    <div style="font-family: sans-serif; min-width: 170px; padding: 4px; color: #333;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 6px; align-items:center;">
                            <b style="font-size: 10px; color: #16a34a; background:#f0fdf4; padding:2px 6px; border-radius:3px;">✅ Wholesale Selesai</b>
                            <span style="font-size: 10px; color: #999;">#${order.order_id}</span>
                        </div>
                        <div style="font-size: 11px;">
                            <p style="margin: 2px 0; font-weight: bold; color: #111;">${order.name}</p>
                            <p style="margin: 3px 0; color: #555;">📍 ${order.city ? order.city.charAt(0).toUpperCase() + order.city.slice(1) : 'Unknown'}</p>
                            <p style="margin: 2px 0; color: #777; font-size: 10px;">${order.inquiry_type}</p>
                            <p style="margin: 4px 0 0; color: #999; font-size: 10px;">🗓 ${orderDate}</p>
                        </div>
                    </div>
                `;

                L.marker([lat, lng], { icon: wholesaleIcon })
                    .bindPopup(popupContent, { minWidth: 170 })
                    .addTo(markerLayer);
            });
        }

        // ── GPS Visitor markers ────────────────────────────────────────
        if (gpsData?.locations?.length > 0) {
            gpsData.locations.forEach(loc => {
                const lat = parseFloat(loc.latitude);
                const lng = parseFloat(loc.longitude);
                if (isNaN(lat) || isNaN(lng)) return;

                const lastSeen = new Date(loc.updated_at || loc.created_at).toLocaleString('id-ID');
                const popupContent = `
                    <div style="font-family: sans-serif; min-width: 145px; padding: 4px; color: #333;">
                        <div style="border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px;">
                            <b style="font-size: 10px; color: #0891b2; background:#ecfeff; padding:2px 6px; border-radius:3px;">📡 GPS Visitor</b>
                        </div>
                        <div style="font-size: 11px;">
                            <p style="margin: 2px 0; color: #555;">IP: ${loc.ip_address || '-'}</p>
                            <p style="margin: 2px 0; color: #888;">🕐 ${lastSeen}</p>
                        </div>
                    </div>
                `;

                L.marker([lat, lng], { icon: gpsIcon })
                    .bindPopup(popupContent, { minWidth: 145 })
                    .addTo(markerLayer);
            });
        }

        return () => {
            if (map) map.removeLayer(markerLayer);
        };
    }, [hubData, wholesaleData, gpsData, isLoading]);

    if (isLoading) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="animate-spin text-rose-500 mx-auto mb-4" size={40} />
                    <p className="text-zinc-400 font-medium">{t('admin_map.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-zinc-900 border border-zinc-500 rounded-lg p-6 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <AlertTriangle size={40} className="text-rose-500 mx-auto mb-4" />
                    <p className="text-zinc-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col relative h-full min-h-[400px] animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <Globe size={20} className="text-rose-500" />
                        {t('admin_map.title_1')} <span className="text-zinc-500 font-light">{t('admin_map.title_2')}</span>
                        {isSimulationMode && <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full tracking-widest uppercase">{t('admin_map.simulation_badge')}</span>}
                    </h3>
                    <p className="text-xs text-zinc-400">{t('admin_map.subtitle')}</p>
                </div>

                {hubData && (
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-md">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">{t('admin_map.stats_orders')}</p>
                            <span className="text-lg font-bold text-zinc-100 font-mono">{hubData.total_orders}</span>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-md">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">{t('admin_map.stats_revenue')}</p>
                            <span className="text-lg font-bold text-zinc-100 font-mono">Rp {hubData.total_sales.toLocaleString('en-US')}</span>
                        </div>
                        {wholesaleData && wholesaleData.total > 0 && (
                            <div className="bg-zinc-950/50 border border-green-900/40 px-4 py-2 rounded-md">
                                <p className="text-[10px] uppercase tracking-wider text-green-500 font-bold mb-1">✅ Wholesale Selesai</p>
                                <span className="text-lg font-bold text-green-400 font-mono">{wholesaleData.total}</span>
                            </div>
                        )}
                        {gpsData && (
                            <div className="bg-zinc-950/50 border border-blue-900/40 px-4 py-2 rounded-md">
                                <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">📡 GPS Visitors</p>
                                <span className="text-lg font-bold text-blue-400 font-mono">{gpsData.total}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex-1 w-full bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden relative z-0">
                <div 
                    ref={mapContainerRef} 
                    style={{ height: "100%", width: "100%", background: "#09090b" }} 
                    className="leaflet-container"
                />

                {/* Legend Overlays */}
                <div className="absolute bottom-4 right-4 z-[1000] bg-zinc-900/95 py-3 px-4 rounded-xl border border-zinc-800 backdrop-blur shadow-2xl min-w-[165px]">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-2.5">Map Legend</p>
                    <div className="space-y-2">
                        {/* TikTok */}
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-300 flex items-center gap-2">
                                <svg viewBox="0 0 32 40" width="10" height="13" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 28 12 28S28 21 28 12C28 5.37 22.63 0 16 0z" fill="#18181b" stroke="#52525b" strokeWidth="2"/>
                                    <text x="16" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="sans-serif">TT</text>
                                </svg>
                                TikTok
                            </span>
                            <span className="text-zinc-100 font-bold tabular-nums">{hubData?.platform_breakdown?.TikTok || 0}</span>
                        </div>
                        {/* Shopee */}
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-300 flex items-center gap-2">
                                <svg viewBox="0 0 32 40" width="10" height="13" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 28 12 28S28 21 28 12C28 5.37 22.63 0 16 0z" fill="#ea580c" stroke="#c2410c" strokeWidth="2"/>
                                    <text x="16" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="sans-serif">SP</text>
                                </svg>
                                Shopee
                            </span>
                            <span className="text-zinc-100 font-bold tabular-nums">{hubData?.platform_breakdown?.Shopee || 0}</span>
                        </div>
                        {/* Wholesale Selesai */}
                        <div className="border-t border-zinc-800 pt-2 mt-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-green-400 flex items-center gap-2">
                                    <svg viewBox="0 0 32 40" width="10" height="13" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 28 12 28S28 21 28 12C28 5.37 22.63 0 16 0z" fill="#16a34a" stroke="#15803d" strokeWidth="2"/>
                                        <text x="16" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="sans-serif">WS</text>
                                    </svg>
                                    Wholesale Selesai
                                </span>
                                <span className="text-green-400 font-bold tabular-nums">{wholesaleData?.total || 0}</span>
                            </div>
                        </div>
                        {/* GPS Visitor */}
                        <div className="border-t border-zinc-800 pt-2 mt-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-cyan-400 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-cyan-300 inline-flex items-center justify-center flex-shrink-0">
                                        <span className="w-1 h-1 rounded-full bg-white block"></span>
                                    </span>
                                    GPS Visitor
                                </span>
                                <span className="text-cyan-400 font-bold tabular-nums">{gpsData?.total || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
