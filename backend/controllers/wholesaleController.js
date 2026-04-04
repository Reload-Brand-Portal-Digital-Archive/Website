const db = require('../config/database');

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
        const query = 'UPDATE wholesale_orders SET status = ? WHERE order_id = ?';
        const [result] = await db.query(query, [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
