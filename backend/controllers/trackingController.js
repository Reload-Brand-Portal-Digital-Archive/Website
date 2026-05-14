const db = require('../config/database');

/**
 * recordPageView - Records a user visit to a specific page
 */
exports.recordPageView = async (req, res) => {
    const { url, client_id } = req.body;
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];
    const user_id = req.user ? req.user.id : null;

    const trackerId = client_id || ip_address; // Fallback ke IP jika browser blokir client_id

    try {
        // Pengecekan: Apakah Client ID ini sudah tercatat dalam 24 jam terakhir?
        const [existing] = await db.query(
            'SELECT 1 FROM page_views WHERE client_id = ? AND created_at >= NOW() - INTERVAL 1 DAY LIMIT 1',
            [trackerId]
        );

        // Jika data ada (belum 24 jam), abaikan penyimpanan baru dan anggap valid
        if (existing.length > 0) {
            return res.status(200).json({ success: true, message: 'View already recorded within 24 hours' });
        }

        // Jika tidak ada data atau sudah melewati 24 jam, simpan ke database
        await db.query(
            'INSERT INTO page_views (user_id, url, client_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [user_id, url, trackerId, ip_address, user_agent]
        );
        res.status(200).json({ success: true, message: 'Page view recorded' });
    } catch (error) {
        console.error('Page View Tracking Error:', error);
        res.status(500).json({ success: false, message: 'Failed to record page view' });
    }
};

/**
 * recordLinkClick - Records a click on an external shop link and returns the target URL
 */
exports.recordLinkClick = async (req, res) => {
    const { platform } = req.params; // shopee or tiktok
    const { client_id } = req.body;
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_id = req.user ? req.user.id : null;

    const trackerId = client_id || ip_address; // Fallback ke IP jika cookie terblokir

    try {
        // 1. Record the click
        await db.query(
            'INSERT INTO link_clicks (user_id, platform, client_id, ip_address) VALUES (?, ?, ?, ?)',
            [user_id, platform, trackerId, ip_address]
        );

        // 2. Fetch the target URL from site_settings
        const [settings] = await db.query(
            'SELECT value FROM site_settings WHERE `key` = ?',
            [`${platform}_url`]
        );

        const targetUrl = settings.length > 0 ? settings[0].value : (platform === 'shopee' ? 'https://shopee.co.id' : 'https://tiktok.com');

        res.status(200).json({ 
            success: true, 
            message: 'Link click recorded',
            url: targetUrl
        });
    } catch (error) {
        console.error('Link Click Tracking Error:', error);
        res.status(500).json({ success: false, message: 'Failed to record link click' });
    }
};

/**
 * getTrackingStats - Aggregates tracking data from both tables
 * Supports optional startDate and endDate query parameters for date filtering
 */
exports.getTrackingStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date condition — default to last 7 days if no params given
        let dateCondition;
        let dateParams;
        if (startDate && endDate) {
            dateCondition = 'DATE(created_at) BETWEEN ? AND ?';
            dateParams = [startDate, endDate];
        } else {
            dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
            dateParams = [];
        }

        const [totalViews] = await db.query(`SELECT COUNT(*) as count FROM page_views WHERE ${dateCondition}`, dateParams);
        
        const [platformClicks] = await db.query(`
            SELECT platform, COUNT(*) as count 
            FROM link_clicks 
            WHERE ${dateCondition}
            GROUP BY platform
        `, dateParams);

        // Traffic visitors per day (filtered by date range)
        const [dailyVisits] = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM page_views 
            WHERE ${dateCondition}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, dateParams);

        // Clicks per day (filtered by date range) - Chart ready format
        const [dailyClicks] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN platform = 'shopee' THEN 1 ELSE 0 END) as shopee,
                SUM(CASE WHEN platform = 'tiktok' THEN 1 ELSE 0 END) as tiktok
            FROM link_clicks 
            WHERE ${dateCondition}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, dateParams);

        // User Growth (Daily registrations - excluding admin, within date range)
        const [userGrowth] = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM users 
            WHERE ${dateCondition} AND role != 'admin'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, dateParams);

        const [subscriberGrowth] = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM newsletter_subscribers 
            WHERE ${dateCondition}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, dateParams);

        // Orders per day (filtered by date range)
        const [dailyOrders] = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM wholesale_orders 
            WHERE ${dateCondition}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, dateParams);

        const [latestViews] = await db.query(`
            SELECT 'page_view' as type, url as identifier, client_id as ip_address, created_at 
            FROM page_views 
            WHERE ${dateCondition}
            ORDER BY created_at DESC 
            LIMIT 5
        `, dateParams);

        const [latestClicks] = await db.query(`
            SELECT 'link_click' as type, platform as identifier, client_id as ip_address, created_at 
            FROM link_clicks 
            WHERE ${dateCondition}
            ORDER BY created_at DESC 
            LIMIT 5
        `, dateParams);

        res.status(200).json({
            success: true,
            data: {
                total_views: totalViews[0].count,
                platform_clicks: platformClicks,
                daily_visits: dailyVisits,
                daily_orders: dailyOrders,
                daily_clicks: dailyClicks,
                user_growth: userGrowth,
                subscriber_growth: subscriberGrowth,
                latest_activities: [...latestViews, ...latestClicks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            }
        });
    } catch (error) {
        console.error('Fetch Stats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tracking stats' });
    }
};

/**
 * recordGpsLocation - Saves GPS coordinates to site_settings as JSON array
 */
exports.recordGpsLocation = async (req, res) => {
    const { latitude, longitude, client_id } = req.body;

    if (latitude == null || longitude == null) {
        return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const trackerId = client_id || ('anon-' + Date.now().toString(36));

    try {
        // Ambil data GPS yang sudah tersimpan di site_settings
        const [rows] = await db.query(
            "SELECT setting_value FROM site_settings WHERE setting_key = 'visitor_gps_locations' LIMIT 1"
        );

        let locations = [];
        if (rows.length > 0 && rows[0].setting_value) {
            try {
                locations = JSON.parse(rows[0].setting_value);
                if (!Array.isArray(locations)) locations = [];
            } catch (e) { locations = []; }
        }

        const now = new Date().toISOString();
        const existingIndex = locations.findIndex(loc => loc.client_id === trackerId);

        if (existingIndex >= 0) {
            // Update koordinat visitor yang sudah ada
            locations[existingIndex].latitude = latitude;
            locations[existingIndex].longitude = longitude;
            locations[existingIndex].updated_at = now;
        } else {
            // Tambah visitor baru
            locations.push({ client_id: trackerId, latitude, longitude, created_at: now, updated_at: now });
        }

        // Simpan kembali ke site_settings
        await db.query(
            `INSERT INTO site_settings (setting_key, setting_value)
             VALUES ('visitor_gps_locations', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [JSON.stringify(locations)]
        );

        res.status(200).json({ success: true, message: 'GPS location recorded' });
    } catch (error) {
        console.error('GPS Location Error:', error);
        res.status(500).json({ success: false, message: 'Failed to record GPS location' });
    }
};

/**
 * getGpsLocations - Returns all GPS visitor coordinates from site_settings JSON
 */
exports.getGpsLocations = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT setting_value FROM site_settings WHERE setting_key = 'visitor_gps_locations' LIMIT 1"
        );

        let locations = [];
        if (rows.length > 0 && rows[0].setting_value) {
            try {
                locations = JSON.parse(rows[0].setting_value);
                if (!Array.isArray(locations)) locations = [];
            } catch (e) { locations = []; }
        }

        // Sort terbaru dulu
        locations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        res.status(200).json({
            success: true,
            data: { total: locations.length, locations }
        });
    } catch (error) {
        console.error('Fetch GPS Locations Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch GPS locations' });
    }
};

/**
 * getCompletedWholesaleLocations - Returns wholesale orders with status 'Pesanan selesai'
 * with geocoded coordinates based on city name extracted from the address field
 */
exports.getCompletedWholesaleLocations = async (req, res) => {
    // Kamus kota Indonesia → koordinat [lat, lng]
    const CITY_COORDS = {
        'jakarta': [-6.2088, 106.8456],
        'jakarta pusat': [-6.1865, 106.8354],
        'jakarta barat': [-6.1683, 106.7635],
        'jakarta timur': [-6.2250, 106.9004],
        'jakarta selatan': [-6.2668, 106.8139],
        'jakarta utara': [-6.1219, 106.8972],
        'bandung': [-6.9147, 107.6098],
        'surabaya': [-7.2504, 112.7688],
        'medan': [3.5952, 98.6722],
        'makassar': [-5.1477, 119.4327],
        'yogyakarta': [-7.7956, 110.3695],
        'jogja': [-7.7956, 110.3695],
        'semarang': [-6.9667, 110.4167],
        'denpasar': [-8.6500, 115.2167],
        'bali': [-8.3405, 115.0920],
        'palembang': [-2.9761, 104.7754],
        'tangerang': [-6.1783, 106.6319],
        'depok': [-6.4025, 106.7942],
        'bekasi': [-6.2383, 106.9756],
        'bogor': [-6.5971, 106.8060],
        'batam': [1.1301, 104.0529],
        'pekanbaru': [0.5071, 101.4478],
        'balikpapan': [-1.2675, 116.8289],
        'banjarmasin': [-3.3186, 114.5944],
        'padang': [-0.9471, 100.4172],
        'manado': [1.4748, 124.8421],
        'pontianak': [-0.0263, 109.3425],
        'samarinda': [-0.5016, 117.1537],
        'malang': [-7.9666, 112.6326],
        'solo': [-7.5755, 110.8243],
        'surakarta': [-7.5755, 110.8243],
        'cirebon': [-6.7063, 108.5570],
        'tasikmalaya': [-7.3270, 108.2132],
        'serang': [-6.1201, 106.1503],
        'cilegon': [-6.0023, 106.0141],
        'sukabumi': [-6.9275, 106.9300],
        'garut': [-7.2167, 107.9000],
        'purwokerto': [-7.4286, 109.2330],
        'tegal': [-6.8694, 109.1402],
        'palu': [-0.8917, 119.8707],
        'ambon': [-3.6554, 128.1900],
        'sorong': [-0.8761, 131.2501],
        'jayapura': [-2.5337, 140.7181],
        'kupang': [-10.1772, 123.6070],
        'mataram': [-8.5833, 116.1167],
        'kendari': [-3.9985, 122.5127],
        'gorontalo': [0.5435, 123.0596],
        'ternate': [0.7833, 127.3667],
        'bengkulu': [-3.7928, 102.2608],
        'jambi': [-1.6101, 103.6131],
        'lampung': [-5.4500, 105.2667],
        'bandar lampung': [-5.4500, 105.2667],
        'pangkal pinang': [-2.1333, 106.1167],
        'pangkalpinang': [-2.1333, 106.1167],
        'tanjung pinang': [0.9167, 104.4500],
        'cimahi': [-6.8714, 107.5431],
        'tangerang selatan': [-6.3000, 106.7167],
        'south tangerang': [-6.3000, 106.7167],
    };

    /**
     * Ekstrak nama kota dari string alamat:
     * Coba cocokkan kata-kata dalam alamat dengan kamus kota
     */
    const geocodeAddress = (address) => {
        if (!address) return null;
        const lower = address.toLowerCase();

        // Coba exact match panjang dulu (misal 'jakarta selatan')
        const sortedCities = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
        for (const city of sortedCities) {
            if (lower.includes(city)) {
                const [lat, lng] = CITY_COORDS[city];
                // Tambahkan sedikit jitter agar marker tidak tumpang tindih persis
                const jitterLat = (Math.random() - 0.5) * 0.02;
                const jitterLng = (Math.random() - 0.5) * 0.02;
                return { lat: lat + jitterLat, lng: lng + jitterLng, city };
            }
        }
        return null;
    };

    try {
        const [orders] = await db.query(
            `SELECT order_id, name, email, phone, address, inquiry_type, created_at, status
             FROM wholesale_orders
             WHERE status = 'Pesanan selesai'
             ORDER BY created_at DESC`
        );

        const locations = [];
        for (const order of orders) {
            const geo = geocodeAddress(order.address);
            if (!geo) continue; // Lewati jika tidak bisa di-geocode

            locations.push({
                order_id: order.order_id,
                name: order.name,
                address: order.address,
                city: geo.city,
                inquiry_type: order.inquiry_type || 'Wholesale',
                created_at: order.created_at,
                status: order.status,
                lat: geo.lat,
                lng: geo.lng,
            });
        }

        res.status(200).json({
            success: true,
            data: {
                total: locations.length,
                locations,
            }
        });
    } catch (error) {
        console.error('Fetch Completed Wholesale Locations Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wholesale locations' });
    }
};
