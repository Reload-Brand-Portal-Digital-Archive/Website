const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { logAdminActivity } = require('../utils/activityLogger');

const getEndorsements = async () => {
    const [rows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = "endorsements_data"');
    if (rows.length > 0) {
        try {
            return JSON.parse(rows[0].setting_value);
        } catch (e) {
            console.error('Failed to parse endorsements_data JSON:', e);
            return [];
        }
    }
    return [];
};

const saveEndorsements = async (endorsementsArray) => {
    const jsonStr = JSON.stringify(endorsementsArray);
    await db.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES ("endorsements_data", ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [jsonStr, jsonStr]
    );
};

exports.getAllEndorsements = async (req, res) => {
    try {
        const endorsements = await getEndorsements();
        res.json(endorsements);
    } catch (error) {
        console.error('Error fetching endorsements:', error);
        res.status(500).json({ message: 'Gagal mengambil data endorsement' });
    }
};

exports.createEndorsement = async (req, res) => {
    const { name } = req.body;
    if (!name || !req.file) return res.status(400).json({ message: 'Nama dan gambar wajib diisi!' });

    try {
        const endorsements = await getEndorsements();

        const newEndorsement = {
            id: Date.now().toString(),
            name,
            image_path: `/uploads/${req.file.filename}`,
            is_active: true
        };

        endorsements.push(newEndorsement);
        await saveEndorsements(endorsements);

        await logAdminActivity(req, 'CREATE', 'Endorsement', newEndorsement.id, { name });

        res.status(201).json({ message: 'Endorsement berhasil ditambahkan', data: endorsements });
    } catch (error) {
        console.error('Error creating endorsement:', error);
        if (req.file) {
            const filePath = path.join(__dirname, '..', `uploads/${req.file.filename}`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Gagal menambah endorsement' });
    }
};

exports.updateEndorsement = async (req, res) => {
    const endorsementId = req.params.id;
    const { name, is_active } = req.body;

    if (!name) return res.status(400).json({ message: 'Nama wajib diisi!' });

    try {
        let endorsements = await getEndorsements();
        const index = endorsements.findIndex(e => e.id === endorsementId);

        if (index === -1) {
            if (req.file) fs.unlinkSync(path.join(__dirname, '..', `uploads/${req.file.filename}`));
            return res.status(404).json({ message: 'Endorsement tidak ditemukan' });
        }

        endorsements[index].name = name;

        if (is_active !== undefined) {
            endorsements[index].is_active = is_active === true || is_active === 'true';
        }

        if (req.file) {
            const oldImagePath = path.join(__dirname, '..', endorsements[index].image_path);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            endorsements[index].image_path = `/uploads/${req.file.filename}`;
        }

        await saveEndorsements(endorsements);

        await logAdminActivity(req, 'UPDATE', 'Endorsement', endorsementId, { name, is_active });

        res.json({ message: 'Endorsement berhasil diperbarui', data: endorsements });
    } catch (error) {
        console.error('Error updating endorsement:', error);
        if (req.file) {
            const filePath = path.join(__dirname, '..', `uploads/${req.file.filename}`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Gagal memperbarui endorsement' });
    }
};

exports.deleteEndorsement = async (req, res) => {
    const endorsementId = req.params.id;
    try {
        let endorsements = await getEndorsements();
        const toDelete = endorsements.find(e => e.id === endorsementId);

        if (toDelete) {
            const filePath = path.join(__dirname, '..', toDelete.image_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            endorsements = endorsements.filter(e => e.id !== endorsementId);
            await saveEndorsements(endorsements);

            await logAdminActivity(req, 'DELETE', 'Endorsement', endorsementId, { name: toDelete.name });
        }

        res.json({ message: 'Endorsement berhasil dihapus', data: endorsements });
    } catch (error) {
        console.error('Error deleting endorsement:', error);
        res.status(500).json({ message: 'Gagal menghapus endorsement' });
    }
};
