const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { logAdminActivity } = require('../utils/activityLogger');

exports.getAllCollections = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM collections ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error("Error fetching collections:", error);
        res.status(500).json({ message: 'Gagal mengambil data koleksi' });
    }
};

exports.getCollectionBySlug = async (req, res) => {
    try {
        const slug = req.params.slug;

        const [collections] = await db.query('SELECT * FROM collections WHERE slug = ?', [slug]);
        if (collections.length === 0) {
            return res.status(404).json({ message: 'Koleksi tidak ditemukan' });
        }

        const collectionData = collections[0];

        const queryProducts = `
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
            WHERE p.collection_id = ?
            ORDER BY p.created_at DESC
        `;

        const [products] = await db.query(queryProducts, [collectionData.collection_id]);

        const formattedProducts = products.map(p => ({
            ...p,
            images: p.all_images ? p.all_images.split(',') : [],
            primary_image: p.all_images ? p.all_images.split(',')[0] : null
        }));

        res.json({
            collection: collectionData,
            products: formattedProducts
        });

    } catch (error) {
        console.error("Error fetching collection by slug:", error);
        res.status(500).json({ message: 'Gagal mengambil data detail koleksi' });
    }
};

exports.getCollectionById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM collections WHERE collection_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Koleksi tidak ditemukan' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching collection:", error);
        res.status(500).json({ message: 'Gagal mengambil data koleksi' });
    }
};

exports.createCollection = async (req, res) => {
    try {
        const { name, slug, description, year } = req.body;

        let cover_image = null;
        if (req.file) {
            cover_image = req.file.filename;
        } else {
            return res.status(400).json({ message: 'Cover image wajib diunggah!' });
        }

        const [existing] = await db.query('SELECT * FROM collections WHERE slug = ?', [slug]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Nama/slug koleksi sudah digunakan' });
        }

        const [result] = await db.query(
            'INSERT INTO collections (name, slug, description, year, cover_image) VALUES (?, ?, ?, ?, ?)',
            [name, slug, description, parseInt(year), cover_image]
        );

        const [newCollection] = await db.query('SELECT * FROM collections WHERE collection_id = ?', [result.insertId]);
        
        await logAdminActivity(req, 'CREATE', 'Collection', result.insertId, { name, slug, description, year });
        
        res.status(201).json({ message: 'Koleksi berhasil ditambahkan', data: newCollection[0] });
    } catch (error) {
        console.error("Error creating collection:", error);
        res.status(500).json({ message: 'Gagal membuat koleksi baru' });
    }
};

exports.updateCollection = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, year, cover_image: existingCover } = req.body;

        let cover_image = existingCover;
        if (req.file) {
            cover_image = req.file.filename;
        }

        const [existing] = await db.query('SELECT * FROM collections WHERE collection_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Koleksi tidak ditemukan' });
        }

        const [duplicate] = await db.query('SELECT * FROM collections WHERE slug = ? AND collection_id != ?', [slug, id]);
        if (duplicate.length > 0) {
            return res.status(400).json({ message: 'Nama/slug koleksi sudah digunakan oleh data lain' });
        }

        await db.query(
            'UPDATE collections SET name = ?, slug = ?, description = ?, year = ?, cover_image = ? WHERE collection_id = ?',
            [name, slug, description, parseInt(year), cover_image, id]
        );

        if (req.file && existing[0].cover_image && existing[0].cover_image !== cover_image) {
            const oldPath = path.join(__dirname, '..', 'uploads', existing[0].cover_image);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const [updatedData] = await db.query('SELECT * FROM collections WHERE collection_id = ?', [id]);
        
        await logAdminActivity(req, 'UPDATE', 'Collection', id, { name, slug, description, year });
        
        res.json({ message: 'Koleksi berhasil diperbarui', data: updatedData[0] });
    } catch (error) {
        console.error("Error updating collection:", error);
        res.status(500).json({ message: 'Gagal memperbarui koleksi' });
    }
};

exports.deleteCollection = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT * FROM collections WHERE collection_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Koleksi tidak ditemukan' });
        }

        const coverImage = existing[0].cover_image;

        await db.query('DELETE FROM collections WHERE collection_id = ?', [id]);
        
        if (coverImage) {
            const filePath = path.join(__dirname, '..', 'uploads', coverImage);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await logAdminActivity(req, 'DELETE', 'Collection', id, { collection_id: id });

        res.json({ message: 'Koleksi berhasil dihapus' });
    } catch (error) {
        console.error("Error deleting collection:", error);
        res.status(500).json({ message: 'Gagal menghapus koleksi' });
    }
};