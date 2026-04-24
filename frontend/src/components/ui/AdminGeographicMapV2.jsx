import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Globe, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

/**
 * AdminGeographicMapV2 - Direct Leaflet Integration 
 * 
 * VERSION: Proportional Unified Layout
 * This component is designed to be placed beside 1/3 column charts in a 3-col grid.
 */
export default function AdminGeographicMapV2({ refreshTrigger }) {
    const [hubData, setHubData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Leaflet fixes for default icon issues 
    const markerIconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const markerIconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const markerShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

    const defaultIcon = L.icon({
        iconUrl: markerIconUrl,
        iconRetinaUrl: markerIconRetinaUrl,
        shadowUrl: markerShadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Fetch E-Commerce Hub Data
    useEffect(() => {
        const fetchHubData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await axios.get(import.meta.env.VITE_API_URL + '/api/settings/ecommerce-hub');
                if (response.data.success && response.data.data) {
                    setHubData(response.data.data);
                } else {
                    setError("Data Hub tidak valid.");
                }
            } catch (error) {
                console.error("Hub Fetch Error:", error);
                setError("Gagal mengambil data dari API.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHubData();
    }, [refreshTrigger]);

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

        hubData.orders.forEach(order => {
            if (!order.coordinates || !Array.isArray(order.coordinates)) return;

            const popupContent = `
                <div style="font-family: sans-serif; min-width: 150px; padding: 4px; color: #333;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px;">
                        <b style="font-size: 10px;">${order.platform}</b>
                        <span style="font-size: 10px; color: #999;">#${order.order_id}</span>
                    </div>
                    <div style="font-size: 12px;">
                        <b style="color: #000;">${order.product_name}</b>
                        <p style="margin: 4px 0;">📍 ${order.customer?.city || 'Unknown'}</p>
                        <p style="margin: 0; color: #e11d48; font-weight: bold;">Rp ${order.total_amount.toLocaleString('id-ID')}</p>
                    </div>
                </div>
            `;

            L.marker(order.coordinates, { icon: defaultIcon })
                .bindPopup(popupContent, { minWidth: 150 })
                .addTo(markerLayer);
        });

        return () => {
            if (map) map.removeLayer(markerLayer);
        };
    }, [hubData, isLoading]);

    if (isLoading) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="animate-spin text-rose-500 mx-auto mb-4" size={40} />
                    <p className="text-zinc-400 font-medium">Loading Map Data...</p>
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
                        E-Commerce <span className="text-zinc-500 font-light">Distribution Map</span>
                    </h3>
                    <p className="text-xs text-zinc-400">Peta distribusi penjualan TikTok & Shopee.</p>
                </div>

                {hubData && (
                    <div className="flex gap-4">
                        <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-md">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Orders</p>
                            <span className="text-lg font-bold text-zinc-100 font-mono">{hubData.total_orders}</span>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-md">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Revenue</p>
                            <span className="text-lg font-bold text-zinc-100 font-mono">Rp {hubData.total_sales.toLocaleString('id-ID')}</span>
                        </div>
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
                <div className="absolute bottom-4 right-4 z-[1000] bg-zinc-900/90 p-4 rounded-lg border border-zinc-800 backdrop-blur shadow-2xl min-w-[150px]">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-100"></span> TikTok
                            </span>
                            <span className="text-zinc-100 font-bold">{hubData?.platform_breakdown?.TikTok || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Shopee
                            </span>
                            <span className="text-zinc-100 font-bold">{hubData?.platform_breakdown?.Shopee || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
