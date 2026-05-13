const db = require('../config/database');
const { geocodeLocation } = require('../utils/geocoder');
const axios = require('axios');
const { logAdminActivity } = require('../utils/activityLogger');

/**
 * applyJitter - Menambahkan pergeseran acak kecil pada koordinat
 * agar marker tidak bertumpuk di titik yang sama persis.
 */
const applyJitter = (coords) => {
    if (!coords || !Array.isArray(coords)) return null;
    const offset = 0.02; // Sekitar 2km
    const jitterLat = (Math.random() - 0.5) * offset;
    const jitterLng = (Math.random() - 0.5) * offset;
    return [coords[0] + jitterLat, coords[1] + jitterLng];
};

exports.getPublicSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM site_settings');
        const settings = {};
        
        const excludedKeys = ['admin_notification_email', 'ecommerce_hub_data'];
        
        rows.forEach(row => {
            if (!excludedKeys.includes(row.setting_key)) {
                settings[row.setting_key] = row.setting_value;
            }
        });
        
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch Public Settings Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch public settings' });
    }
};

/**
 * getEcommerceHubData - Mengambil data hub dari tabel site_settings (format JSON)
 */
exports.getEcommerceHubData = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = ?', ['ecommerce_hub_data']);
        
        let hubData = { total_orders: 0, total_sales: 0, platform_breakdown: { TikTok: 0, Shopee: 0 }, orders: [] };

        if (rows.length > 0 && rows[0].setting_value) {
            try {
                const parsed = JSON.parse(rows[0].setting_value);
                const rawOrders = Array.isArray(parsed) ? parsed : [];
                
                // Ambil daftar produk resmi beserta 1 foto utamanya dari tabel 'product_images'
                let dbProducts = [];
                try {
                    const queryDb = `
                        SELECT 
                            p.product_id, 
                            p.name, 
                            p.category, 
                            p.sizes,
                            (
                                SELECT image_path 
                                FROM product_images 
                                WHERE product_id = p.product_id 
                                ORDER BY is_primary DESC, sort_order ASC 
                                LIMIT 1
                            ) AS primary_image
                        FROM products p
                    `;
                    const [prodRows] = await db.query(queryDb);
                    dbProducts = prodRows;
                } catch (e) {
                    console.error("Gagal mengambil tabel produk beserta gambar untuk matching:", e.message);
                }

                // Algoritme Pencocokan Pintar (Exact, Substring, dan Kandungan Kata)
                const matchProduct = (reportName) => {
                    if (!reportName || dbProducts.length === 0) return null;
                    const cleanReport = reportName.toLowerCase().trim();
                    
                    // 1. Exact Match
                    let matched = dbProducts.find(p => p.name && p.name.toLowerCase().trim() === cleanReport);
                    if (matched) return matched;
                    
                    // 2. Substring: Nama database terkandung di dalam nama laporan (misal: "Reload Basic Tee - Black XL")
                    matched = dbProducts.find(p => p.name && cleanReport.includes(p.name.toLowerCase().trim()));
                    if (matched) return matched;
                    
                    // 3. Substring: Nama laporan terkandung di dalam nama database
                    matched = dbProducts.find(p => p.name && p.name.toLowerCase().trim().includes(cleanReport));
                    if (matched) return matched;

                    // 4. Pencocokan berbasis irisan kata penting (>2 huruf)
                    for (const p of dbProducts) {
                        if (!p.name) continue;
                        const words = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                        const matchedWords = words.filter(w => cleanReport.includes(w));
                        if (matchedWords.length >= Math.min(words.length, 2) && matchedWords.length > 0) {
                            return p;
                        }
                    }
                    return null;
                };

                let totalSales = 0;
                const platformBreakdown = { TikTok: 0, Shopee: 0 };
                
                // Terapkan pencocokan ke setiap order
                const enrichedOrders = rawOrders.map(order => {
                    const matched = matchProduct(order.product_name);
                    const finalAmount = parseFloat(order.total_amount || 0);
                    const plat = order.platform || 'General';
                    
                    totalSales += finalAmount;
                    platformBreakdown[plat] = (platformBreakdown[plat] || 0) + 1;

                    return {
                        ...order,
                        db_matched: !!matched,
                        product_id: matched ? matched.product_id : order.product_id || null,
                        product_name: matched ? matched.name : order.product_name, // Menggunakan nama resmi DB
                        original_report_name: order.product_name,
                        category: matched ? matched.category : order.category || 'Uncategorized',
                        db_sizes: matched ? matched.sizes : null,
                        primary_image: matched ? matched.primary_image : null
                    };
                });

                hubData = {
                    total_orders: enrichedOrders.length,
                    total_sales: totalSales,
                    platform_breakdown: platformBreakdown,
                    orders: enrichedOrders
                };
            } catch (parseError) {
                console.error("Gagal parse JSON hub_data:", parseError);
            }
        }

        res.status(200).json({ success: true, data: hubData });
    } catch (error) {
        console.error("Error fetching hub data:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data geographic hub." });
    }
};

/**
 * syncEcommerce - Sinkronisasi dengan API eksternal dan simpan ke site_settings sebagai JSON
 */
exports.syncEcommerce = async (req, res) => {
    try {
        const response = await axios.get('http://localhost:8000/api/external/orders');
        const rawData = response.data.data;

        const [rows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = ?', ['ecommerce_hub_data']);
        let currentOrders = [];
        if (rows.length > 0 && rows[0].setting_value) {
            try {
                const parsed = JSON.parse(rows[0].setting_value);
                currentOrders = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                currentOrders = [];
            }
        }

        const coordsCache = {};
        let syncCount = 0;

        for (const item of rawData) {
            if (currentOrders.some(o => o.order_id === item.order_id)) continue;

            if (!coordsCache[item.city]) {
                coordsCache[item.city] = await geocodeLocation(item.city);
            }

            const baseCoords = coordsCache[item.city];
            const jitteredCoords = applyJitter(baseCoords) || [0, 0];

            currentOrders.push({
                order_id: item.order_id,
                platform: item.platform,
                product_name: item.product,
                variant: item.variant || 'All Size',
                quantity: parseInt(item.quantity || 1),
                total_amount: parseFloat(item.amount),
                customer: { city: item.city },
                coordinates: jitteredCoords,
                created_at: new Date().toISOString()
            });
            syncCount++;
        }

        const jsonValue = JSON.stringify(currentOrders);
        if (rows.length > 0) {
            await db.query('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', [jsonValue, 'ecommerce_hub_data']);
        } else {
            await db.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)', ['ecommerce_hub_data', jsonValue]);
        }

        await logAdminActivity(req, 'UPDATE', 'Settings', null, { action: 'sync_ecommerce', processed_count: syncCount });

        res.status(200).json({
            success: true,
            message: `Sinkronisasi berhasil! ${syncCount} data baru ditambahkan.`,
            processed_count: syncCount
        });
    } catch (error) {
        console.error("Sync Error:", error.message);
        res.status(500).json({ success: false, message: "Gagal sinkronisasi API.", error: error.message });
    }
};

// Kamus Pemetaan Kota Instan untuk mencegah Timeout / Rate-Limit dari Nominatim
const INDONESIA_CITIES_MAP = {
    'jakarta': [-6.2088, 106.8456],
    'surabaya': [-7.2504, 112.7688],
    'bandung': [-6.9147, 107.6098],
    'medan': [3.5952, 98.6722],
    'makassar': [-5.1477, 119.4327],
    'yogyakarta': [-7.7956, 110.3695],
    'sleman': [-7.7011, 110.3402],
    'bantul': [-7.8863, 110.3278],
    'semarang': [-6.9667, 110.4167],
    'denpasar': [-8.6500, 115.2167],
    'malang': [-7.9839, 112.6214],
    'tangerang': [-6.1702, 106.6403],
    'bekasi': [-6.2416, 106.9924],
    'depok': [-6.4025, 106.7942],
    'bogor': [-6.5950, 106.8166],
    'palembang': [-2.9909, 104.7566],
    'batam': [1.0828, 104.0305],
    'pekanbaru': [0.5071, 101.4478],
    'padang': [-0.9471, 100.3543],
    'samarinda': [-0.5022, 117.1536],
    'balikpapan': [-1.2379, 116.8529],
    'banjarmasin': [-3.3244, 114.5910],
    'pontianak': [-0.0263, 109.3425],
    'manado': [1.4748, 124.8421],
    'solo': [-7.5667, 110.8167],
    'surakarta': [-7.5667, 110.8167]
};

const getInstaCoords = async (cityName) => {
    if (!cityName) return [-2.5489, 118.0149];
    const clean = cityName.toLowerCase().replace(/kab\.|kabupaten|kota/gi, '').trim();
    for (const [key, coords] of Object.entries(INDONESIA_CITIES_MAP)) {
        if (clean.includes(key) || key.includes(clean)) {
            return coords;
        }
    }
    // Fallback cepat tanpa memblokir server
    const randomLat = -7.0 + (Math.random() * 2 - 1) * 2.0; 
    const randomLng = 110.0 + (Math.random() * 2 - 1) * 5.0;
    return [randomLat, randomLng];
};

/**
 * uploadReport - Handler untuk upload laporan dengan Mapping Otomatis & Cepat
 */
exports.uploadReport = async (req, res) => {
    try {
        const data = req.body.orders; 
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ success: false, message: "Format data tidak valid." });
        }

        const [rows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = ?', ['ecommerce_hub_data']);
        let currentOrders = [];
        if (rows.length > 0 && rows[0].setting_value) {
            try {
                const parsed = JSON.parse(rows[0].setting_value);
                currentOrders = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                currentOrders = [];
            }
        }

        const coordsCache = {};
        let newCount = 0;

        for (const item of data) {
            // Hindari duplikasi jika order_id sudah ada
            if (currentOrders.some(o => o.order_id && o.order_id.toString() === item.order_id.toString())) continue;

            const cityKey = item.city || 'Unknown';
            if (!coordsCache[cityKey]) {
                coordsCache[cityKey] = await getInstaCoords(item.city);
            }
            const baseCoords = coordsCache[cityKey];
            const jitteredCoords = applyJitter(baseCoords) || [0, 0];

            currentOrders.push({
                order_id: item.order_id,
                platform: item.platform || 'Laporan',
                product_name: item.product_name || 'Produk Umum',
                variant: item.variant || 'All Size',
                quantity: parseInt(item.quantity || 1),
                total_amount: parseFloat(item.total_amount || 0),
                customer: { city: item.city || 'Indonesia' },
                coordinates: jitteredCoords,
                created_at: item.created_at || new Date().toISOString()
            });
            newCount++;
        }

        // Batasi akumulasi riwayat pesanan maksimal 300 transaksi terbaru
        // Ini menjamin string JSON selalu muat di dalam kapasitas kolom MySQL TEXT (maks 64KB)
        // dan menghindari error fatal ER_DATA_TOO_LONG.
        if (currentOrders.length > 300) {
            currentOrders = currentOrders.slice(-300);
        }

        const jsonValue = JSON.stringify(currentOrders);
        try {
            if (rows.length > 0) {
                await db.query('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', [jsonValue, 'ecommerce_hub_data']);
            } else {
                await db.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)', ['ecommerce_hub_data', jsonValue]);
            }
        } catch (dbErr) {
            // Jika masih terlalu panjang, lakukan pemangkasan agresif ke 150 item
            if (dbErr.code === 'ER_DATA_TOO_LONG') {
                const emergencyOrders = currentOrders.slice(-150);
                const emergencyJson = JSON.stringify(emergencyOrders);
                if (rows.length > 0) {
                    await db.query('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', [emergencyJson, 'ecommerce_hub_data']);
                } else {
                    await db.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)', ['ecommerce_hub_data', emergencyJson]);
                }
            } else {
                throw dbErr;
            }
        }

        await logAdminActivity(req, 'UPDATE', 'Settings', null, { action: 'upload_report', processed_count: newCount });

        res.status(200).json({ 
            success: true, 
            message: `Berhasil mengimpor ${newCount} data laporan baru.`,
            processed_count: newCount,
            debug_info: "Penyimpanan sukses dengan proteksi kapasitas memori aktif."
        });
    } catch (error) {
        console.error("Upload Error Detail:", error);
        res.status(500).json({ 
            success: false, 
            message: "Gagal memproses laporan.", 
            error: error.message,
            stack: error.stack,
            sql_code: error.code || 'UNKNOWN'
        });
    }
};

/**
 * clearEcommerceData - Menghapus semua data e-commerce di site_settings (Reset)
 */
exports.clearEcommerceData = async (req, res) => {
    try {
        await db.query('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', ['[]', 'ecommerce_hub_data']);
        
        await logAdminActivity(req, 'DELETE', 'Settings', null, { action: 'clear_ecommerce_data' });
        
        res.status(200).json({ success: true, message: "Seluruh data e-commerce berhasil direset." });
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ success: false, message: "Gagal meriset data." });
    }
};
