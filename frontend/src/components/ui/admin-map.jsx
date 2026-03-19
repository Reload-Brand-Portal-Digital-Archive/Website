import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map Regions Data
const mapRegions = {
    asean: {
        name: "ASEAN",
        scale: 600,
        center: [115, 6],
        markers: [
            { markerOffset: -15, name: "Jakarta", coordinates: [106.8456, -6.2088] },
            { markerOffset: -15, name: "Singapura", coordinates: [103.8198, 1.3521] },
            { markerOffset: 25, name: "Kuala Lumpur", coordinates: [101.6869, 3.1390] },
            { markerOffset: -15, name: "Bangkok", coordinates: [100.5018, 13.7563] },
            { markerOffset: 25, name: "Manila", coordinates: [120.9842, 14.5995] }
        ],
        stats: [
            { label: "Indonesia", value: "55%", color: "bg-rose-500" },
            { label: "Malaysia", value: "20%", color: "bg-rose-500" },
            { label: "Singapura", value: "15%", color: "bg-rose-500" },
            { label: "Lainnya", value: "10%", color: "bg-rose-500" }
        ]
    },
    indonesia: {
        name: "Indonesia",
        scale: 1000,
        center: [118, -2],
        markers: [
            { markerOffset: -15, name: "Jakarta", coordinates: [106.8456, -6.2088] },
            { markerOffset: -15, name: "Surabaya", coordinates: [112.7521, -7.2504] },
            { markerOffset: 25, name: "Medan", coordinates: [98.6722, 3.5952] },
            { markerOffset: -15, name: "Bandung", coordinates: [107.6191, -6.9175] },
            { markerOffset: 25, name: "Bali", coordinates: [115.1889, -8.4095] }
        ],
        stats: [
            { label: "Jawa", value: "65%", color: "bg-rose-500" },
            { label: "Sumatera", value: "15%", color: "bg-rose-500" },
            { label: "Kalimantan", value: "10%", color: "bg-rose-500" },
            { label: "Lainnya", value: "10%", color: "bg-rose-500" }
        ]
    },
    jawa: {
        name: "Pulau Jawa",
        scale: 4000,
        center: [110, -7.5],
        markers: [
            { markerOffset: -15, name: "Jakarta", coordinates: [106.8456, -6.2088] },
            { markerOffset: -15, name: "Bandung", coordinates: [107.6191, -6.9175] },
            { markerOffset: 25, name: "Semarang", coordinates: [110.4225, -6.9666] },
            { markerOffset: 25, name: "Yogyakarta", coordinates: [110.3695, -7.7956] },
            { markerOffset: -15, name: "Surabaya", coordinates: [112.7521, -7.2504] }
        ],
        stats: [
            { label: "Jawa Barat", value: "40%", color: "bg-rose-500" },
            { label: "Jawa Timur", value: "30%", color: "bg-rose-500" },
            { label: "Jawa Tengah", value: "20%", color: "bg-rose-500" },
            { label: "Lainnya", value: "10%", color: "bg-rose-500" }
        ]
    },
    jawabarat: {
        name: "Jawa Barat",
        scale: 9000,
        center: [107.5, -6.9],
        markers: [
            { markerOffset: -15, name: "Bandung", coordinates: [107.6191, -6.9175] },
            { markerOffset: 25, name: "Bogor", coordinates: [106.8060, -6.5971] },
            { markerOffset: -15, name: "Bekasi", coordinates: [106.9896, -6.2383] },
            { markerOffset: 25, name: "Depok", coordinates: [106.8227, -6.4025] }
        ],
        stats: [
            { label: "Bandung", value: "45%", color: "bg-rose-500" },
            { label: "Bekasi", value: "25%", color: "bg-rose-500" },
            { label: "Bogor", value: "20%", color: "bg-rose-500" },
            { label: "Lainnya", value: "10%", color: "bg-rose-500" }
        ]
    }
};

export default function AdminGeographicMap() {
    const [mapRegion, setMapRegion] = useState('asean');
    const currentRegionData = mapRegions[mapRegion];

    return (
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-medium text-zinc-100 mb-1">Distribusi Pengunjung <span className="text-zinc-500 text-sm font-normal ml-2">(Demografi)</span></h3>
                    <p className="text-sm text-zinc-400">Sebaran traffic berdasarkan wilayah {currentRegionData.name}.</p>
                </div>
                
                <select 
                    value={mapRegion}
                    onChange={(e) => setMapRegion(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded px-3 py-2 focus:outline-none focus:border-rose-500 transition-colors"
                >
                    <option value="asean">Kawasan ASEAN</option>
                    <option value="indonesia">Indonesia</option>
                    <option value="jawa">Pulau Jawa</option>
                    <option value="jawabarat">Jawa Barat</option>
                </select>
            </div>
            
            <div className="flex-1 w-full bg-zinc-950/50 rounded-md border border-zinc-800/50 overflow-hidden flex items-center justify-center relative">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: currentRegionData.scale,
                        center: currentRegionData.center
                    }}
                    width={800}
                    height={400}
                    style={{ width: "100%", height: "auto" }}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#27272a"
                            stroke="#3f3f46"
                            strokeWidth={0.5}
                            style={{
                                default: { outline: "none" },
                                hover: { fill: "#3f3f46", outline: "none" },
                                pressed: { fill: "#52525b", outline: "none" },
                            }}
                            />
                        ))
                        }
                    </Geographies>
                    {currentRegionData.markers.map(({ name, coordinates, markerOffset }) => (
                        <Marker key={name} coordinates={coordinates}>
                            <circle r={4} fill="#f43f5e" stroke="#fff" strokeWidth={1.5} />
                            <text
                                textAnchor="middle"
                                y={markerOffset}
                                style={{ fontFamily: "system-ui", fill: "#a1a1aa", fontSize: "10px", fontWeight: "bold" }}
                            >
                                {name}
                            </text>
                        </Marker>
                    ))}
                </ComposableMap>
                
                <div className="absolute bottom-4 left-4 bg-zinc-900/90 p-3 rounded border border-zinc-800 text-xs text-zinc-300 min-w-[150px]">
                    <ul className="space-y-1.5">
                        {currentRegionData.stats.map((stat, i) => (
                            <li key={i} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${stat.color}`}></span>
                                    <span>{stat.label}</span>
                                </div>
                                <span className="font-semibold text-zinc-100">{stat.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
