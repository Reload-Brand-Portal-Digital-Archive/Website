const db = require('../config/database');
const nodemailer = require('nodemailer');
const { logAdminActivity } = require('../utils/activityLogger');

exports.createWholesaleOrder = async (req, res) => {
    const { user_id, name, email, phone, inquiry_type, message, address, items } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Items array is empty.' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const query = `
            INSERT INTO wholesale_orders (user_id, name, email, phone, inquiry_type, message, address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const type = inquiry_type || 'Wholesale Request';
        const orderStatus = 'Belum Dibaca'; // Adjust as needed
        const userId = user_id || null;

        const [result] = await connection.query(query, [
            userId, name, email, phone, type, message, address, orderStatus
        ]);

        const order_id = result.insertId;

        // Insert order_items
        const insertItemsQuery = `
            INSERT INTO order_items (product_id, order_id, product_name_snapshot, quantity, size)
            VALUES ?
        `;
        
        const itemsValues = items.map(item => [
            item.product_id,
            order_id,
            item.product_name_snapshot,
            item.quantity,
            item.size
        ]);
        
        if (itemsValues.length > 0) {
            await connection.query(insertItemsQuery, [itemsValues]);
        }

        await connection.commit();

        try {
            const [settings] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = ?', ['admin_notification_email']);
            if (settings.length > 0 && settings[0].setting_value) {
                const adminEmail = settings[0].setting_value;
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: adminEmail,
                    subject: `[NEW INQUIRY] Wholesale Order #${order_id}`,
                    html: `
                        <div style="background-color: #000000; padding: 40px 20px; font-family: 'Courier New', Consolas, monospace; color: white;">
                            <h2>New Wholesale Inquiry Received</h2>
                            <p><strong>Order ID:</strong> #${order_id}</p>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Phone:</strong> ${phone}</p>
                            <p><strong>Inquiry Type:</strong> ${type}</p>
                            <p><strong>Message:</strong> ${message || '-'}</p>
                            <p>Please check the admin panel for full details.</p>
                        </div>
                    `
                };
                await transporter.sendMail(mailOptions);
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

exports.getAllOrders = async (req, res) => {
    try {
        const query = 'SELECT * FROM wholesale_orders ORDER BY created_at DESC';
        const [orders] = await db.query(query);
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching wholesale orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Fetch order details
        const [orders] = await connection.query('SELECT * FROM wholesale_orders WHERE order_id = ?', [id]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = orders[0];
        
        // If status is 'Belum Dibaca', update it to 'Dibaca'
        if (order.status === 'Belum Dibaca') {
            await connection.query('UPDATE wholesale_orders SET status = ? WHERE order_id = ?', ['Dibaca', id]);
            order.status = 'Dibaca';
        }
        
        // Fetch order items
        const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
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

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const [orders] = await db.query('SELECT * FROM wholesale_orders WHERE order_id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        const query = 'UPDATE wholesale_orders SET status = ? WHERE order_id = ?';
        const [result] = await db.query(query, [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.email) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const getStatusColor = (s) => {
                    switch (s) {
                        case 'Dibaca': return '#a1a1aa';
                        case 'Dalam proses penyiapan barang': return '#f59e0b';
                        case 'Barang siap untuk diambil di gudang': return '#3b82f6';
                        case 'Pesanan selesai': return '#22c55e';
                        default: return '#ef4444';
                    }
                };

                const statusColor = getStatusColor(status);

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: order.email,
                    subject: `[RELOAD DISTRO] Status Update — Order #${id}`,
                    html: `
                        <div style="background-color: #000000; padding: 40px 20px; font-family: 'Courier New', Consolas, monospace;">
                            <div style="max-width: 520px; margin: 0 auto; border: 1px solid #1a1a1a; padding: 0;">
                                
                                <!-- Header -->
                                <div style="background-color: #0a0a0a; border-bottom: 1px solid #1a1a1a; padding: 20px 24px;">
                                    <span style="color: #ef4444; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;">[ RELOAD DISTRO // ORDER SYSTEM ]</span>
                                </div>

                                <!-- Body -->
                                <div style="padding: 32px 24px;">
                                    <div style="margin-bottom: 28px;">
                                        <span style="color: #22c55e; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; display: block; margin-bottom: 8px;">> STATUS UPDATE</span>
                                        <h1 style="color: #fafafa; font-size: 20px; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold;">Order #${id}</h1>
                                    </div>

                                    <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0 0 24px 0;">
                                        Halo, <span style="color: #d4d4d8;">${order.name || 'Customer'}</span>. Berikut adalah update terbaru untuk pesanan wholesale Anda.
                                    </p>

                                    <!-- Status Box -->
                                    <div style="background-color: #0a0a0a; border: 1px solid #27272a; padding: 20px; margin-bottom: 24px;">
                                        <span style="color: #52525b; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; display: block; margin-bottom: 10px;">CURRENT STATUS:</span>
                                        <div style="display: inline-block; border: 1px solid ${statusColor}; padding: 8px 16px;">
                                            <span style="color: ${statusColor}; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: bold;">[ ${status} ]</span>
                                        </div>
                                    </div>

                                    <!-- Info Grid -->
                                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #1a1a1a;">
                                                <span style="color: #52525b; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;">ORDER ID</span>
                                            </td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                                                <span style="color: #22c55e; font-size: 12px;">#${id}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #1a1a1a;">
                                                <span style="color: #52525b; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;">TIMESTAMP</span>
                                            </td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                                                <span style="color: #a1a1aa; font-size: 12px;">${new Date().toLocaleString('id-ID')}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0;">
                                                <span style="color: #52525b; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;">INQUIRY TYPE</span>
                                            </td>
                                            <td style="padding: 8px 0; text-align: right;">
                                                <span style="color: #a1a1aa; font-size: 12px;">${order.inquiry_type || '-'}</span>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="color: #3f3f46; font-size: 11px; line-height: 1.5; margin: 0;">
                                        Jika ada pertanyaan, silakan hubungi tim RELOAD melalui email atau media sosial kami.
                                    </p>
                                </div>

                                <!-- Footer -->
                                <div style="background-color: #0a0a0a; border-top: 1px solid #1a1a1a; padding: 16px 24px; text-align: center;">
                                    <span style="color: #27272a; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO // ALL RIGHTS RESERVED</span>
                                </div>
                            </div>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
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
