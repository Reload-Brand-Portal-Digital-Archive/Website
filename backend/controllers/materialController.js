const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const getMaterials = async () => {
    const [rows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = "landing_materials"');
    return rows.length > 0 ? JSON.parse(rows[0].setting_value) : [];
};

const saveMaterials = async (materialsArray) => {
    const jsonStr = JSON.stringify(materialsArray);
    await db.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES ("landing_materials", ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [jsonStr, jsonStr]
    );
};

exports.getAllMaterials = async (req, res) => {
    try {
        const materials = await getMaterials();
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data material' });
    }
};

exports.createMaterial = async (req, res) => {
    const { title, description } = req.body;
    if (!title || !req.file) return res.status(400).json({ message: 'Judul dan gambar wajib diisi!' });

    try {
        const materials = await getMaterials();

        if (materials.length >= 3) {
            fs.unlinkSync(path.join(__dirname, '..', `/uploads/${req.file.filename}`));
            return res.status(400).json({ message: 'Maksimal 3 material! Hapus material lama terlebih dahulu' });
        }

        const newMaterial = {
            id: Date.now().toString(),
            title,
            description,
            image_path: `/uploads/${req.file.filename}`
        };

        materials.push(newMaterial);
        await saveMaterials(materials);

        res.status(201).json({ message: 'Material berhasil ditambahkan', data: materials });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah material' });
    }
};

exports.deleteMaterial = async (req, res) => {
    const materialId = req.params.id;
    try {
        let materials = await getMaterials();
        const materialToDelete = materials.find(m => m.id === materialId);

        if (materialToDelete) {
            const filePath = path.join(__dirname, '..', materialToDelete.image_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            materials = materials.filter(m => m.id !== materialId);
            await saveMaterials(materials);
        }

        res.json({ message: 'Material berhasil dihapus', data: materials });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus material' });
    }
};

exports.updateMaterial = async (req, res) => {
    const materialId = req.params.id;
    const { title, description } = req.body;

    if (!title) return res.status(400).json({ message: 'Judul wajib diisi!' });

    try {
        let materials = await getMaterials();
        const materialIndex = materials.findIndex(m => m.id === materialId);

        if (materialIndex === -1) {
            if (req.file) fs.unlinkSync(path.join(__dirname, '..', `/uploads/${req.file.filename}`));
            return res.status(404).json({ message: 'Material tidak ditemukan' });
        }

        materials[materialIndex].title = title;
        materials[materialIndex].description = description;

        if (req.file) {
            const oldImagePath = path.join(__dirname, '..', materials[materialIndex].image_path);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            materials[materialIndex].image_path = `/uploads/${req.file.filename}`;
        }

        await saveMaterials(materials);
        res.json({ message: 'Material berhasil diperbarui', data: materials });
    } catch (error) {
        if (req.file) {
            const filePath = path.join(__dirname, '..', `/uploads/${req.file.filename}`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Gagal memperbarui material' });
    }
};