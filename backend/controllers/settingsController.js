const db = require('../config/database');
const { geocodeLocation } = require('../utils/geocoder');
const axios = require('axios');

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
                const orders = Array.isArray(parsed) ? parsed : [];
                
                let totalSales = 0;
                const platformBreakdown = { TikTok: 0, Shopee: 0 };
                
                orders.forEach(order => {
                    totalSales += parseFloat(order.total_amount || 0);
                    platformBreakdown[order.platform] = (platformBreakdown[order.platform] || 0) + 1;
                });

                hubData = {
                    total_orders: orders.length,
                    total_sales: totalSales,
                    platform_breakdown: platformBreakdown,
                    orders: orders
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

/**
 * uploadReport - Handler untuk upload laporan dengan Mapping Otomatis
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

            if (!coordsCache[item.city]) {
                const fullLocation = item.province ? `${item.city}, ${item.province}` : item.city;
                coordsCache[item.city] = await geocodeLocation(fullLocation);
            }
            const baseCoords = coordsCache[item.city];
            const jitteredCoords = applyJitter(baseCoords) || [0, 0];

            currentOrders.push({
                order_id: item.order_id,
                platform: item.platform,
                product_name: item.product_name,
                total_amount: parseFloat(item.total_amount),
                customer: { city: item.city },
                coordinates: jitteredCoords,
                created_at: item.created_at || new Date().toISOString()
            });
            newCount++;
        }

        const jsonValue = JSON.stringify(currentOrders);
        if (rows.length > 0) {
            await db.query('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', [jsonValue, 'ecommerce_hub_data']);
        } else {
            await db.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)', ['ecommerce_hub_data', jsonValue]);
        }

        res.status(200).json({ 
            success: true, 
            message: `Berhasil mengimpor ${newCount} data laporan baru.`,
            processed_count: newCount
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: "Gagal memproses laporan." });
    }
};

/**
 * clearEcommerceData - Menghapus semua data e-commerce di site_settings (Reset)
 */
exports.clearEcommerceData = async (req, res) => {
    try {
        await db.query('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', ['[]', 'ecommerce_hub_data']);
        res.status(200).json({ success: true, message: "Seluruh data e-commerce berhasil direset." });
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ success: false, message: "Gagal meriset data." });
    }
};
