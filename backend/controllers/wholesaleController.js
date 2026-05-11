const db = require('../config/database');
const nodemailer = require('nodemailer');
const { logAdminActivity } = require('../utils/activityLogger');

// ─── helpers ──────────────────────────────────────────────────────────────────

const getMailTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

// ─── Create Wholesale Order ────────────────────────────────────────────────────

exports.createWholesaleOrder = async (req, res) => {
    const { user_id, shop_name, name, email, phone, inquiry_type, message, address, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Items array is empty.' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const type = inquiry_type || 'Wholesale Request';
        const orderStatus = 'pending_discussion';
        const userId = user_id || null;

        // 0. Block if user already has an active (pending/in-discussion) order
        if (userId) {
            const [active] = await connection.query(
                `SELECT order_id FROM wholesale_orders
                 WHERE user_id = ? AND status IN ('pending_discussion','in_discussion')
                 LIMIT 1`,
                [userId]
            );
            if (active.length > 0) {
                await connection.release();
                return res.status(409).json({
                    error: 'active_order_exists',
                    message: 'You already have an active wholesale order. Please wait for admin to review it.',
                    order_id: active[0].order_id
                });
            }
        }

        // 1. Insert wholesale order (including shop_name fix)
        const [result] = await connection.query(
            `INSERT INTO wholesale_orders
                (user_id, shop_name, name, email, phone, inquiry_type, message, address, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, shop_name || null, name, email, phone, type, message, address, orderStatus]
        );
        const order_id = result.insertId;

        // 2. Insert order_items
        if (items.length > 0) {
            const itemsValues = items.map(item => [
                item.product_id,
                order_id,
                item.product_name_snapshot,
                item.quantity,
                item.size
            ]);
            await connection.query(
                `INSERT INTO order_items (product_id, order_id, product_name_snapshot, quantity, size) VALUES ?`,
                [itemsValues]
            );
        }

        // 3. Auto-inject a system chat message if user is logged in
        if (userId) {
            const itemsSummary = items
                .map(i => `${i.product_name_snapshot} (${i.size}) x${i.quantity}`)
                .join(', ');

            const metadata = JSON.stringify({
                order_id,
                shop_name: shop_name || null,
                name,
                email,
                phone,
                inquiry_type: type,
                address,
                message: message || null,
                status: orderStatus,
                items: items.map(i => ({
                    product_name_snapshot: i.product_name_snapshot,
                    size: i.size,
                    quantity: i.quantity
                }))
            });

            await connection.query(
                `INSERT INTO chats (user_id, message, sender, message_type, metadata)
                 VALUES (?, ?, 'system', 'wholesale_order', ?)`,
                [
                    userId,
                    `Wholesale Order #${order_id} — ${name} submitted ${items.length} item(s): ${itemsSummary}`,
                    metadata
                ]
            );
        }

        await connection.commit();

        // 4. Send admin notification email (non-blocking)
        try {
            const [settings] = await db.query(
                'SELECT setting_value FROM site_settings WHERE setting_key = ?',
                ['admin_notification_email']
            );
            if (settings.length > 0 && settings[0].setting_value) {
                const adminEmail = settings[0].setting_value;
                const transporter = getMailTransporter();
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: adminEmail,
                    subject: `[NEW INQUIRY] Wholesale Order #${order_id}`,
                    html: `
                        <div style="background-color:#000;padding:40px 20px;font-family:'Courier New',monospace;color:white;">
                            <h2>New Wholesale Inquiry Received</h2>
                            <p><strong>Order ID:</strong> #${order_id}</p>
                            <p><strong>Shop Name:</strong> ${shop_name || '-'}</p>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Phone:</strong> ${phone}</p>
                            <p><strong>Inquiry Type:</strong> ${type}</p>
                            <p><strong>Message:</strong> ${message || '-'}</p>
                            <p>Please check the admin panel for full details.</p>
                        </div>
                    `
                });
            }
        } catch (emailErr) {
            console.error('Failed to send admin notification email:', emailErr);
        }

        res.status(201).json({ message: 'Wholesale order submitted successfully', order_id });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating wholesale order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release();
    }
};

// ─── Get All Orders (Admin) ───────────────────────────────────────────────────

exports.getAllOrders = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT wo.*,
                    COALESCE(oi.total_qty, 0)    AS total_qty,
                    COALESCE(oi.total_items, 0)  AS total_items
             FROM wholesale_orders wo
             LEFT JOIN (
                 SELECT order_id,
                        SUM(quantity)  AS total_qty,
                        COUNT(*)       AS total_items
                 FROM order_items
                 GROUP BY order_id
             ) oi ON oi.order_id = wo.order_id
             ORDER BY wo.created_at DESC`
        );
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching wholesale orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ─── Get Order By ID (Admin) ──────────────────────────────────────────────────

exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query(
            'SELECT * FROM wholesale_orders WHERE order_id = ?',
            [id]
        );
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        // Auto-mark as in_discussion if it is pending_discussion
        if (order.status === 'pending_discussion') {
            await connection.query(
                'UPDATE wholesale_orders SET status = ? WHERE order_id = ?',
                ['in_discussion', id]
            );
            order.status = 'in_discussion';
        }

        // Legacy: keep auto-marking Belum Dibaca → Dibaca for backward compat
        if (order.status === 'Belum Dibaca') {
            await connection.query(
                'UPDATE wholesale_orders SET status = ? WHERE order_id = ?',
                ['Dibaca', id]
            );
            order.status = 'Dibaca';
        }

        const [items] = await connection.query(
            `SELECT oi.*,
                    (
                        SELECT pi.image_path
                        FROM product_images pi
                        WHERE pi.product_id = oi.product_id
                        ORDER BY pi.is_primary DESC, pi.sort_order ASC
                        LIMIT 1
                    ) AS product_image
             FROM order_items oi
             WHERE oi.order_id = ?`,
            [id]
        );
        order.items = items;

        await connection.commit();
        res.status(200).json(order);
    } catch (error) {
        await connection.rollback();
        console.error('Error fetching order by id:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release();
    }
};

// ─── Confirm or Reject Order (Admin) ─────────────────────────────────────────

exports.confirmOrder = async (req, res) => {
    const { id } = req.params;
    const { decision, shipping_cost, admin_note, invoice_items, subtotal, grand_total } = req.body;

    if (!decision || !['confirm', 'reject'].includes(decision)) {
        return res.status(400).json({ error: 'Decision must be "confirm" or "reject".' });
    }
    if (decision === 'confirm' && (shipping_cost === undefined || shipping_cost === null || isNaN(Number(shipping_cost)))) {
        return res.status(400).json({ error: 'Shipping cost is required to confirm the order.' });
    }

    const newStatus = decision === 'confirm' ? 'confirmed' : 'rejected';
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query(
            'SELECT * FROM wholesale_orders WHERE order_id = ?',
            [id]
        );
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        // Prevent double-confirming / double-rejecting
        if (['confirmed', 'rejected'].includes(order.status)) {
            await connection.rollback();
            return res.status(409).json({ error: `Order is already ${order.status}.` });
        }

        // Update the wholesale order
        await connection.query(
            `UPDATE wholesale_orders
             SET status = ?, shipping_cost = ?, admin_note = ?, confirmed_at = NOW(),
                 has_unread_updates = TRUE
             WHERE order_id = ?`,
            [newStatus, decision === 'confirm' ? Number(shipping_cost) : null, admin_note || null, id]
        );

        // Inject a system chat message for the buyer (if user_id exists)
        if (order.user_id) {
            let chatMsg, msgType;
            if (decision === 'confirm') {
                chatMsg = `✅ Your wholesale order #${id} has been CONFIRMED. Shipping cost: Rp ${Number(shipping_cost).toLocaleString('id-ID')}.${admin_note ? ` Note: ${admin_note}` : ''}`;
                msgType = 'wholesale_confirmed';
            } else {
                chatMsg = `❌ Your wholesale order #${id} has been REJECTED.${admin_note ? ` Reason: ${admin_note}` : ''}`;
                msgType = 'wholesale_rejected';
            }

            const metadata = JSON.stringify({
                order_id: Number(id),
                decision,
                status: newStatus,
                shipping_cost: decision === 'confirm' ? Number(shipping_cost) : null,
                admin_note: admin_note || null,
                // Full invoice data (only on confirm)
                invoice_items: decision === 'confirm' && Array.isArray(invoice_items) ? invoice_items : null,
                subtotal: decision === 'confirm' && subtotal != null ? Number(subtotal) : null,
                grand_total: decision === 'confirm' && grand_total != null ? Number(grand_total) : null,
            });

            await connection.query(
                `INSERT INTO chats (user_id, message, sender, message_type, metadata)
                 VALUES (?, ?, 'admin', ?, ?)`,
                [order.user_id, chatMsg, msgType, metadata]
            );
        }

        await connection.commit();

        // Send buyer email notification
        if (order.email) {
            try {
                const transporter = getMailTransporter();
                const statusColor = decision === 'confirm' ? '#22c55e' : '#ef4444';
                const statusLabel = decision === 'confirm' ? 'CONFIRMED' : 'REJECTED';
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: order.email,
                    subject: `[RELOAD DISTRO] Wholesale Order #${id} — ${statusLabel}`,
                    html: `
                        <div style="background:#000;padding:40px 20px;font-family:'Courier New',monospace;color:white;">
                          <div style="max-width:520px;margin:0 auto;border:1px solid #1a1a1a;">
                            <div style="background:#0a0a0a;border-bottom:1px solid #1a1a1a;padding:20px 24px;">
                              <span style="color:#ef4444;font-size:11px;letter-spacing:.25em;text-transform:uppercase;">[ RELOAD DISTRO // ORDER SYSTEM ]</span>
                            </div>
                            <div style="padding:32px 24px;">
                              <h1 style="color:#fafafa;font-size:20px;margin:0 0 16px;text-transform:uppercase;">Order #${id} — <span style="color:${statusColor}">${statusLabel}</span></h1>
                              <p style="color:#71717a;font-size:12px;line-height:1.6;margin:0 0 16px;">
                                Halo, <span style="color:#d4d4d8;">${order.name || 'Customer'}</span>.
                                Pesanan wholesale Anda telah <strong style="color:${statusColor}">${statusLabel}</strong>.
                              </p>
                              ${decision === 'confirm' ? `
                              <div style="background:#0a0a0a;border:1px solid #27272a;padding:16px;margin-bottom:16px;">
                                <span style="color:#52525b;font-size:10px;letter-spacing:.2em;text-transform:uppercase;display:block;margin-bottom:8px;">BIAYA ONGKIR:</span>
                                <span style="color:#22c55e;font-size:16px;font-weight:bold;">Rp ${Number(shipping_cost).toLocaleString('id-ID')}</span>
                              </div>` : ''}
                              ${admin_note ? `
                              <div style="background:#0a0a0a;border:1px solid #27272a;padding:16px;margin-bottom:16px;">
                                <span style="color:#52525b;font-size:10px;letter-spacing:.2em;text-transform:uppercase;display:block;margin-bottom:8px;">CATATAN ADMIN:</span>
                                <p style="color:#a1a1aa;font-size:12px;margin:0;">${admin_note}</p>
                              </div>` : ''}
                              <p style="color:#3f3f46;font-size:11px;line-height:1.5;margin:0;">
                                Silakan login dan cek halaman chat untuk detail lebih lanjut.
                              </p>
                            </div>
                            <div style="background:#0a0a0a;border-top:1px solid #1a1a1a;padding:16px 24px;text-align:center;">
                              <span style="color:#27272a;font-size:9px;letter-spacing:.2em;text-transform:uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO</span>
                            </div>
                          </div>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }
        }

        await logAdminActivity(req, 'UPDATE', 'Wholesale Order', id, { status: newStatus, decision, shipping_cost });
        res.status(200).json({ message: `Order ${newStatus} successfully`, status: newStatus });
    } catch (error) {
        await connection.rollback();
        console.error('Error confirming order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release();
    }
};

// ─── Update Order Status (Admin) ──────────────────────────────────────────────

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const [orders] = await db.query(
            'SELECT * FROM wholesale_orders WHERE order_id = ?',
            [id]
        );
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        const [result] = await db.query(
            'UPDATE wholesale_orders SET status = ?, has_unread_updates = TRUE WHERE order_id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.email) {
            try {
                const transporter = getMailTransporter();
                const getStatusColor = (s) => {
                    switch (s) {
                        case 'Dibaca': return '#a1a1aa';
                        case 'Dalam proses penyiapan barang': return '#f59e0b';
                        case 'Barang siap untuk diambil di gudang': return '#3b82f6';
                        case 'Pesanan selesai': return '#22c55e';
                        case 'confirmed': return '#22c55e';
                        case 'rejected': return '#ef4444';
                        default: return '#ef4444';
                    }
                };
                const statusColor = getStatusColor(status);
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: order.email,
                    subject: `[RELOAD DISTRO] Status Update — Order #${id}`,
                    html: `
                        <div style="background-color:#000;padding:40px 20px;font-family:'Courier New',Consolas,monospace;">
                          <div style="max-width:520px;margin:0 auto;border:1px solid #1a1a1a;padding:0;">
                            <div style="background-color:#0a0a0a;border-bottom:1px solid #1a1a1a;padding:20px 24px;">
                              <span style="color:#ef4444;font-size:11px;letter-spacing:.25em;text-transform:uppercase;">[ RELOAD DISTRO // ORDER SYSTEM ]</span>
                            </div>
                            <div style="padding:32px 24px;">
                              <h1 style="color:#fafafa;font-size:20px;margin:0 0 16px;text-transform:uppercase;">Order #${id}</h1>
                              <div style="background:#0a0a0a;border:1px solid #27272a;padding:20px;margin-bottom:24px;">
                                <span style="color:#52525b;font-size:10px;letter-spacing:.2em;text-transform:uppercase;display:block;margin-bottom:10px;">CURRENT STATUS:</span>
                                <div style="display:inline-block;border:1px solid ${statusColor};padding:8px 16px;">
                                  <span style="color:${statusColor};font-size:13px;letter-spacing:.15em;text-transform:uppercase;font-weight:bold;">[ ${status} ]</span>
                                </div>
                              </div>
                              <p style="color:#3f3f46;font-size:11px;line-height:1.5;margin:0;">
                                Jika ada pertanyaan, silakan hubungi tim RELOAD.
                              </p>
                            </div>
                            <div style="background:#0a0a0a;border-top:1px solid #1a1a1a;padding:16px 24px;text-align:center;">
                              <span style="color:#27272a;font-size:9px;letter-spacing:.2em;text-transform:uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO // ALL RIGHTS RESERVED</span>
                            </div>
                          </div>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send status update email:', emailError);
            }
        }

        await logAdminActivity(req, 'UPDATE', 'Wholesale Order', id, { status });
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ─── Get Pending Wholesale Order for a User (Admin helper) ────────────────────
exports.getUserWholesaleOrder = async (req, res) => {
    const { userId } = req.params;
    try {
        const [orders] = await db.query(
            `SELECT wo.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'item_id', oi.item_id,
                            'product_name_snapshot', oi.product_name_snapshot,
                            'size', oi.size,
                            'quantity', oi.quantity
                        )
                    ) as items_json
             FROM wholesale_orders wo
             LEFT JOIN order_items oi ON wo.order_id = oi.order_id
             WHERE wo.user_id = ?
               AND wo.status IN ('pending_discussion','in_discussion')
             GROUP BY wo.order_id
             ORDER BY wo.created_at DESC
             LIMIT 1`,
            [userId]
        );

        if (orders.length === 0) {
            return res.json({ order: null });
        }

        const order = orders[0];
        try {
            order.items = order.items_json
                ? JSON.parse(`[${order.items_json}]`)
                : [];
        } catch {
            order.items = [];
        }
        delete order.items_json;

        res.json({ order });
    } catch (error) {
        console.error('Error fetching user wholesale order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ─── Get Unread Orders Count (Admin) ─────────────────────────────────────────

exports.getUnreadOrdersCount = async (req, res) => {
    try {
        const [result] = await db.query(
            "SELECT COUNT(*) as count FROM wholesale_orders WHERE status = 'Belum Dibaca'"
        );
        res.status(200).json({ success: true, count: result[0].count });
    } catch (error) {
        console.error('Error fetching unread orders count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
