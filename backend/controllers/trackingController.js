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
