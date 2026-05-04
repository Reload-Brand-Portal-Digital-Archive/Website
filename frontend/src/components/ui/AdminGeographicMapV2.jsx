import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Globe, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
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
    const { settings } = useSettings();
    const isSimulationMode = settings?.simulation_mode === 'true';
    
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

                const response = await axios.get(import.meta.env.VITE_API_URL + '/api/settings/ecommerce-hub');
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
                        <p style="margin: 0; color: #e11d48; font-weight: bold;">Rp ${order.total_amount.toLocaleString('en-US')}</p>
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
                        {isSimulationMode && <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full tracking-widest uppercase">Simulation Mode</span>}
                    </h3>
                    <p className="text-xs text-zinc-400">Sales distribution map for TikTok &amp; Shopee.</p>
                </div>

                {hubData && (
                    <div className="flex gap-4">
                        <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-md">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Orders</p>
                            <span className="text-lg font-bold text-zinc-100 font-mono">{hubData.total_orders}</span>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-md">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Revenue</p>
                            <span className="text-lg font-bold text-zinc-100 font-mono">Rp {hubData.total_sales.toLocaleString('en-US')}</span>
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
