const db = require('../config/database');
const { logAdminActivity } = require('../utils/activityLogger');

const getCategories = async () => {
    const [rows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = "product_categories"');
    return rows.length > 0 ? JSON.parse(rows[0].setting_value) : [];
};

const saveCategories = async (categoriesArray) => {
    const jsonStr = JSON.stringify(categoriesArray);
    await db.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES ("product_categories", ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [jsonStr, jsonStr]
    );
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await getCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil kategori' });
    }
};

exports.createCategory = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama kategori wajib diisi! ' });

    try {
        const categories = await getCategories();

        if (categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
            return res.status(400).json({ message: 'Kategori ini sudah ada!' });
        }

        categories.push(name);
        await saveCategories(categories);

        await logAdminActivity(req, 'CREATE', 'Category', null, { name });

        res.status(201).json({ message: 'Kategori berhasil ditambahkan', data: categories });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah kategori' });
    }
};

exports.deleteCategory = async (req, res) => {
    const categoryName = req.params.name;
    try {
        let categories = await getCategories();
        categories = categories.filter(c => c !== categoryName);
        await saveCategories(categories);

        await logAdminActivity(req, 'DELETE', 'Category', null, { name: categoryName });

        res.json({ message: 'Kategori berhasil dihapus', data: categories });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus kategori' });
    }
};

exports.updateCategory = async (req, res) => {
    const oldName = req.params.name;
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Nama kategori wajib diisi!' });

    try {
        let categories = await getCategories();
        
        const categoryIndex = categories.findIndex(c => c === oldName);
        if (categoryIndex === -1) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        }

        if (name.toLowerCase() !== oldName.toLowerCase() && 
            categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
            return res.status(400).json({ message: 'Kategori dengan nama baru sudah ada!' });
        }

        categories[categoryIndex] = name;
        await saveCategories(categories);

        await logAdminActivity(req, 'UPDATE', 'Category', null, { oldName, newName: name });

        res.json({ message: 'Kategori berhasil diperbarui', data: categories });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui kategori' });
    }
};