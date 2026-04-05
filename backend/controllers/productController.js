const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

exports.getAllProducts = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*, 
                c.name AS collection_name,
                (
                    SELECT GROUP_CONCAT(image_path ORDER BY is_primary DESC, sort_order ASC SEPARATOR ',') 
                    FROM product_images 
                    WHERE product_id = p.product_id
                ) AS all_images
            FROM products p
            LEFT JOIN collections c ON p.collection_id = c.collection_id
            ORDER BY p.created_at DESC
        `;
        const [products] = await db.query(query);

        const formattedProducts = products.map(p => ({
            ...p,
            images: p.all_images ? p.all_images.split(',') : [],
            primary_image: p.all_images ? p.all_images.split(',')[0] : null
        }));

        res.json(formattedProducts);
    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ message: 'Gagal mengambil data produk' });
    }
};

exports.getProductBySlug = async (req, res) => {
    const slug = req.params.slug;
    try {
        const query = `
            SELECT 
                p.*, 
                c.name AS collection_name,
                (
                    SELECT GROUP_CONCAT(image_path ORDER BY is_primary DESC, sort_order ASC SEPARATOR ',') 
                    FROM product_images 
                    WHERE product_id = p.product_id
                ) AS all_images
            FROM products p
            LEFT JOIN collections c ON p.collection_id = c.collection_id
            WHERE p.slug = ?
        `;
        const [products] = await db.query(query, [slug]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        const p = products[0];

        const formattedProduct = {
            ...p,
            images: p.all_images ? p.all_images.split(',') : [],
            primary_image: p.all_images ? p.all_images.split(',')[0] : null,
            sizes: p.sizes ? p.sizes.split(',').map(s => s.trim()) : []
        };

        res.json(formattedProduct);
    } catch (error) {
        console.error('Get Product By Slug Error:', error);
        res.status(500).json({ message: 'Gagal mengambil detail produk' });
    }
};

exports.createProduct = async (req, res) => {
    const { collection_id, name, description, category, sizes, status, cover_identifier, shopee_link, tiktok_link } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama produk wajib diisi!' });
    const slug = generateSlug(name);

    try {
        const [result] = await db.query(
            'INSERT INTO products (collection_id, name, slug, description, category, sizes, status, shopee_link, tiktok_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [collection_id || null, name, slug, description, category, sizes, status || 'Available', shopee_link || null, tiktok_link || null]
        );
        const newProductId = result.insertId;

        if (req.files && req.files.length > 0) {
            const imageQueries = req.files.map((file, index) => {
                const imagePath = `/uploads/${file.filename}`;
                const isPrimary = (file.originalname === cover_identifier) || (index === 0 && !cover_identifier);
                return db.query('INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)', [newProductId, imagePath, isPrimary, index]);
            });
            await Promise.all(imageQueries);
        }
        res.status(201).json({ message: 'Produk dan gambar berhasil ditambahkan!' });
    } catch (error) {
        console.error('Create Product Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

exports.updateProduct = async (req, res) => {
    const productId = req.params.id;
    const { collection_id, name, description, category, sizes, status, cover_identifier, shopee_link, tiktok_link } = req.body;
    let retainedImages = req.body.retained_images ? JSON.parse(req.body.retained_images) : [];

    if (!name) return res.status(400).json({ message: 'Nama produk wajib diisi!' });
    const slug = generateSlug(name);

    try {
        await db.query('UPDATE products SET collection_id = ?, name = ?, slug = ?, description = ?, category = ?, sizes = ?, status = ?, shopee_link = ?, tiktok_link = ? WHERE product_id = ?',
            [collection_id || null, name, slug, description, category, sizes, status, shopee_link || null, tiktok_link || null, productId]);

        const [oldImages] = await db.query('SELECT image_path FROM product_images WHERE product_id = ?', [productId]);
        oldImages.forEach((img) => {
            if (!retainedImages.includes(img.image_path)) {
                const filePath = path.join(__dirname, '..', img.image_path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        });

        await db.query('DELETE FROM product_images WHERE product_id = ?', [productId]);

        const allQueries = [];
        let sortCounter = 0;

        retainedImages.forEach(imgPath => {
            const isPrimary = (imgPath === cover_identifier);
            allQueries.push(db.query('INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)', [productId, imgPath, isPrimary, sortCounter++]));
        });

        if (req.files) {
            req.files.forEach(file => {
                const imagePath = `/uploads/${file.filename}`;
                const isPrimary = (file.originalname === cover_identifier);
                allQueries.push(db.query('INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)', [productId, imagePath, isPrimary, sortCounter++]));
            });
        }

        await Promise.all(allQueries);
        res.json({ message: 'Data produk berhasil diperbarui!' });
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ message: 'Gagal memperbarui produk' });
    }
};

exports.deleteProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const [images] = await db.query('SELECT image_path FROM product_images WHERE product_id = ?', [productId]);
        await db.query('DELETE FROM products WHERE product_id = ?', [productId]);
        images.forEach((img) => {
            const filePath = path.join(__dirname, '..', img.image_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
        res.json({ message: 'Produk berhasil dihapus permanen!' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ message: 'Gagal menghapus produk' });
    }
};