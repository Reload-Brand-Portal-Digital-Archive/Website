import React, { useState } from 'react';
import { X, FileText, RefreshCw, AlertCircle, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function SyncEcommerceModal({ isOpen, onClose, onSyncComplete }) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleApiSync = async () => {
        setIsProcessing(true);
        try {
            const response = await axios.post(import.meta.env.VITE_API_URL + '/api/settings/sync-ecommerce');
            if (response.data.success) {
                toast.success(`Berhasil menyinkronkan ${response.data.processed_count} data dari API!`);
                onSyncComplete();
                onClose();
            }
        } catch (error) {
            console.error("API Sync Error:", error);
            toast.error("Gagal menyinkronkan data dari API external.");
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * mapData - Maps raw data from file to unified HUB structure
     */
    const mapData = (rawData) => {
        return rawData.map(row => {
            let targetRow = { ...row };

            // Cek jika seluruh baris "meleleh" jadi satu string di satu key
            // Ini sering terjadi jika delimiter CSV tidak terdeteksi otomatis
            const keys = Object.keys(row);
            if (keys.length === 1 || (keys.length < 5 && row[keys[0]]?.toString().includes(','))) {
                const firstKey = keys[0];
                const mashedValue = row[firstKey];
                
                if (typeof mashedValue === 'string') {
                    // Buang tanda kutip pembungkus jika ada
                    let cleaned = mashedValue;
                    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                        cleaned = cleaned.slice(1, -1);
                    }
                    
                    // Parse ulang string bagian dalam ini secara formal
                    const parsedMashed = Papa.parse(cleaned, { header: false });
                    const parts = parsedMashed.data[0] || [];
                    
                    // Jika header (keys) hanya 1, asumsikan urutan standar TikTok
                    if (keys.length === 1 && parts.length >= 50) {
                         // Mapping urutan standar TikTok
                         return {
                             order_id: parts[0]?.replace(/"/g, '').replace(/\t/g, '').trim(),
                             platform: 'TikTok',
                             status: parts[1],
                             product_name: parts[7],
                             variant: parts[8],
                             quantity: parseInt(parts[9] || 1),
                             total_amount: parseFloat(parts[28] || parts[15] || 0),
                             customer_name: parts[44] || parts[43],
                             city: parts[49] || parts[50], // Sesuai hasil test: Index 49
                             province: parts[48],          // Sesuai hasil test: Index 48
                             created_at: parts[29]?.replace(/"/g, '').replace(/\t/g, '').trim()
                         };
                    }
                }
            }

            // Clean keys & values (normal processing)
            const cleanRow = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.replace(/"/g, '').trim();
                let val = row[key];
                if (typeof val === 'string') {
                    val = val.replace(/"/g, '').replace(/\t/g, '').trim();
                }
                cleanRow[cleanKey] = val;
            });

            // Deteksi Shopee vs TikTok
            const isShopee = cleanRow['No. Pesanan'] !== undefined;
            const isTikTok = cleanRow['Order ID'] !== undefined;
            
            if (isShopee) {
                return {
                    order_id: cleanRow['No. Pesanan']?.toString().trim(),
                    platform: 'Shopee',
                    status: cleanRow['Status Pesanan'],
                    product_name: cleanRow['Nama Produk'],
                    variant: cleanRow['Nama Variasi'],
                    quantity: parseInt(cleanRow['Jumlah'] || 1),
                    total_amount: parseFloat(cleanRow['Total Pembayaran']?.toString().replace(/\./g, '').replace(/,/g, '') || 0),
                    customer_name: cleanRow['Nama Penerima'],
                    city: cleanRow['Kota/Kabupaten'],
                    province: cleanRow['Provinsi'],
                    created_at: cleanRow['Waktu Pesanan Dibuat']
                };
            } else if (isTikTok) {
                // TikTok mapping with Ultra-Fuzzy Search for headers
                const findKey = (patterns) => {
                    return Object.keys(cleanRow).find(k => {
                        const kNormal = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return patterns.some(p => {
                            const pNormal = p.toLowerCase().replace(/[^a-z0-9]/g, '');
                            return kNormal.includes(pNormal);
                        });
                    });
                };

                const cityKey = findKey(['Regency and City', 'City', 'Kota', 'Kabupaten']);
                const provinceKey = findKey(['Province', 'Provinsi']);
                const orderIdKey = findKey(['Order ID', 'No. Pesanan']);
                const amountKey = findKey(['Order Amount', 'Total Pembayaran', 'Total Amount']);
                const recipientKey = findKey(['Recipient', 'Nama Penerima', 'Nama']);

                // Fallback jika header benar-benar tidak terbaca (menggunakan urutan kolom)
                const values = Object.values(cleanRow);
                
                return {
                    order_id: (cleanRow[orderIdKey] || values[0])?.toString().replace(/"/g, '').trim(),
                    platform: 'TikTok',
                    status: cleanRow[findKey(['Status'])] || 'Completed',
                    product_name: cleanRow[findKey(['Product Name', 'Nama Produk'])] || values[7],
                    variant: cleanRow[findKey(['Variation', 'Variasi'])] || values[8],
                    quantity: parseInt(cleanRow[findKey(['Quantity', 'Jumlah'])] || 1),
                    total_amount: parseFloat(cleanRow[amountKey]?.toString().replace(/"/g, '').replace(/\./g, '') || values[28] || 0),
                    customer_name: cleanRow[recipientKey] || values[43],
                    city: cleanRow[cityKey] || values[49] || values[50], // TikTok biasanya di kolom 49-50
                    province: cleanRow[provinceKey] || values[48],
                    created_at: (cleanRow[findKey(['Created Time', 'Waktu Pesanan'])] || values[29])?.toString().replace(/"/g, '').trim()
                };
            }
            return null;
        }).filter(item => item && item.order_id);
    };

    const processFile = async (data) => {
        try {
            const mapped = mapData(data);
            if (mapped.length === 0) {
                toast.error("Format data tidak dikenali atau file kosong.");
                return;
            }

            const response = await axios.post(import.meta.env.VITE_API_URL + '/api/settings/upload-report', {
                orders: mapped
            });

            if (response.data.success) {
                toast.success(`Berhasil mengimpor ${response.data.processed_count} data pesanan!`);
                onSyncComplete();
                onClose();
            }
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error("Gagal mengirim data ke server.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                dynamicTyping: true,
                delimiter: "", // Auto-detect delimiter (tab, comma, semicolon)
                transformHeader: (header) => header.replace(/"/g, '').trim(),
                complete: (results) => {
                    processFile(results.data);
                },
                error: (err) => {
                    toast.error("Gagal membaca file CSV.");
                    setIsProcessing(false);
                }
            });
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                processFile(data);
            };
            reader.onerror = () => {
                toast.error("Gagal membaca file Excel.");
                setIsProcessing(false);
            };
            reader.readAsBinaryString(file);
        } else {
            toast.error("Format file tidak didukung. Gunakan .csv atau .xlsx");
            setIsProcessing(false);
        }
    };

    const handleResetData = async () => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus seluruh data e-commerce yang tersimpan?")) return;
        
        setIsProcessing(true);
        try {
            const response = await axios.delete(import.meta.env.VITE_API_URL + '/api/settings/clear-ecommerce');
            if (response.data.success) {
                toast.success("Data berhasil direset!");
                onSyncComplete();
            }
        } catch (error) {
            console.error("Reset Error:", error);
            toast.error("Gagal meriset data.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">Sinkronisasi Data E-Commerce</h2>
                        <p className="text-zinc-500 text-sm mt-1">Pilih metode untuk memperbarui data distribusi.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-30"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Option 1: Upload */}
                    <div className={`group relative overflow-hidden bg-zinc-950 border ${isProcessing ? 'border-rose-500/50' : 'border-zinc-800 hover:border-rose-500/50'} rounded-xl p-5 transition-all duration-300`}>
                        {isProcessing && (
                            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-rose-500" size={32} />
                                <span className="text-sm font-medium text-zinc-300">Memproses Data...</span>
                            </div>
                        )}
                        
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-zinc-100 group-hover:text-rose-400 transition-colors">Upload Dokumen Laporan</h3>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                    Unggah file CSV atau Excel (.xlsx) hasil ekspor dari Shopee atau TikTok. Mapping kolom dilakukan otomatis.
                                </p>
                                
                                <label className="mt-4 inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 text-xs font-medium rounded-lg cursor-pointer transition-all active:scale-95">
                                    <Upload size={14} />
                                    <span>Pilih File Laporan</span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept=".csv, .xlsx, .xls"
                                        onChange={handleFileUpload}
                                        disabled={isProcessing}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Option 2: API Sync */}
                    <button 
                        onClick={handleApiSync}
                        disabled={isProcessing}
                        className="w-full group text-left bg-zinc-950 border border-zinc-800 hover:border-green-500/50 hover:bg-green-500/5 rounded-xl p-5 transition-all duration-300 disabled:opacity-50 relative overflow-hidden"
                    >
                        <div className="flex items-start gap-4 opacity-90 group-hover:opacity-100 transition-opacity relative z-10">
                            <div className="p-3 rounded-lg bg-zinc-900 text-zinc-400 group-hover:text-green-400 group-hover:bg-green-500/10 transition-colors duration-300">
                                <RefreshCw size={24} className="group-hover:animate-spin-slow" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-zinc-100 group-hover:text-green-400 transition-colors">Sinkronisasi API Langsung</h3>
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter border border-green-500/30">Active</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                    Menghubungkan langsung ke API Dummy (Python) untuk mensimulasikan penarikan data e-commerce secara otomatis.
                                </p>
                                <div className="mt-3 flex items-center gap-1.5 text-green-500/80 text-[10px] font-medium uppercase tracking-wider">
                                    <CheckCircle2 size={12} />
                                    <span>Siap digunakan</span>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Debug Option: Reset Data */}
                    <button 
                        onClick={handleResetData}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-950/50 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-600 hover:text-red-400 rounded-xl transition-all duration-300 text-xs font-medium uppercase tracking-wider group"
                    >
                        <AlertCircle size={14} className="group-hover:animate-pulse" />
                        <span>Hapus Seluruh Data (Debug Mode)</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-30"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
}
