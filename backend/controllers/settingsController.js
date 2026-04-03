/**
 * settingsController - Managed store and dashboard settings
 * 
 * This controller provides geographic hub data (orders and coordinates) 
 * for the admin dashboard map visualization.
 */

exports.getEcommerceHubData = async (req, res) => {
    try {
        // Mock data representing e-commerce statistics
        // In production, this would be aggregated from the database (Shopee/TikTok integrations)
        const hubData = {
            total_orders: 50,
            total_sales: 8765608,
            platform_breakdown: {
                TikTok: 26,
                Shopee: 24
            },
            orders: [
                { order_id: "TK-001", platform: "TikTok", customer: { city: "Jakarta" }, coordinates: [-6.2088, 106.8456], product_name: "Reload Oversized Tee", total_amount: 159000 },
                { order_id: "SH-002", platform: "Shopee", customer: { city: "Surabaya" }, coordinates: [-7.2575, 112.7521], product_name: "Graphic Hoodie", total_amount: 349000 },
                { order_id: "TK-003", platform: "TikTok", customer: { city: "Bandung" }, coordinates: [-6.9175, 107.6191], product_name: "Denim Jacket", total_amount: 459000 },
                { order_id: "SH-004", platform: "Shopee", customer: { city: "Medan" }, coordinates: [3.5952, 98.6722], product_name: "Vintage Shorts", total_amount: 129000 },
                { order_id: "TK-005", platform: "TikTok", customer: { city: "Makassar" }, coordinates: [-5.1476, 119.4327], product_name: "Reload Crewneck", total_amount: 249000 },
                { order_id: "SH-006", platform: "Shopee", customer: { city: "Denpasar" }, coordinates: [-8.6705, 115.2126], product_name: "Beach Shirt", total_amount: 189000 },
                { order_id: "SH-007", platform: "Shopee", customer: { city: "Yogyakarta" }, coordinates: [-7.7956, 110.3695], product_name: "Batik Modern Tee", total_amount: 149000 },
                { order_id: "TK-008", platform: "TikTok", customer: { city: "Semarang" }, coordinates: [-6.9667, 110.4167], product_name: "Canvas Bag", total_amount: 89000 },
                { order_id: "TK-009", platform: "TikTok", customer: { city: "Palembang" }, coordinates: [-2.9761, 104.7754], product_name: "Reload Cap", total_amount: 99000 },
                { order_id: "SH-010", platform: "Shopee", customer: { city: "Banjarmasin" }, coordinates: [-3.3167, 114.5917], product_name: "Cargo Pants", total_amount: 299000 }
            ]
        };

        res.status(200).json({
            success: true,
            data: hubData
        });
    } catch (error) {
        console.error("Error fetching hub data:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data geographic hub."
        });
    }
};

exports.syncEcommerce = async (req, res) => {
    try {
        // Mock sync logic
        res.status(200).json({
            success: true,
            message: "Sinkronisasi data berhasil!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal sinkronisasi."
        });
    }
};
