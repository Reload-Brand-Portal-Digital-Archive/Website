const db = require('../config/database');

/**
 * recordPageView - Records a user visit to a specific page
 */
exports.recordPageView = async (req, res) => {
    const { url } = req.body;
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];
    const user_id = req.user ? req.user.id : null;

    try {
        await db.query(
            'INSERT INTO page_views (user_id, url, ip_address, user_agent) VALUES (?, ?, ?, ?)',
            [user_id, url, ip_address, user_agent]
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
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_id = req.user ? req.user.id : null;

    try {
        // 1. Record the click
        await db.query(
            'INSERT INTO link_clicks (user_id, platform, ip_address) VALUES (?, ?, ?)',
            [user_id, platform, ip_address]
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

        // Total Page Views (full, ignores date range — shows all-time totals)
        const [totalViews] = await db.query('SELECT COUNT(*) as count FROM page_views');
        
        // Total Link Clicks (split by platform — all-time)
        const [platformClicks] = await db.query(`
            SELECT platform, COUNT(*) as count 
            FROM link_clicks 
            GROUP BY platform
        `);

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

        // User Growth (Monthly registrations - within date range)
        const [userGrowth] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count 
            FROM users 
            WHERE ${dateCondition}
            GROUP BY month 
            ORDER BY month ASC
        `, dateParams);

        // Latest Activities (Combined)
        const [latestViews] = await db.query(`
            SELECT 'page_view' as type, url as identifier, ip_address, created_at 
            FROM page_views 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        const [latestClicks] = await db.query(`
            SELECT 'link_click' as type, platform as identifier, ip_address, created_at 
            FROM link_clicks 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        res.status(200).json({
            success: true,
            data: {
                total_views: totalViews[0].count,
                platform_clicks: platformClicks,
                daily_visits: dailyVisits,
                daily_clicks: dailyClicks,
                user_growth: userGrowth,
                latest_activities: [...latestViews, ...latestClicks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            }
        });
    } catch (error) {
        console.error('Fetch Stats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tracking stats' });
    }
};
