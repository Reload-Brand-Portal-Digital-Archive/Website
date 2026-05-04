const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const SUPPORTED_RATIOS = ['4:3', '9:16'];

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
        res.status(500).json({ message: 'Failed to fetch endorsements' });
    }
};

exports.createEndorsement = async (req, res) => {
    const { name, ratio_type, caption } = req.body;

    if (!name) return res.status(400).json({ message: 'Endorser name is required!' });
    if (!req.file) return res.status(400).json({ message: 'An image is required!' });

    const resolvedRatio = (ratio_type && SUPPORTED_RATIOS.includes(ratio_type.trim()))
        ? ratio_type.trim()
        : '4:3';
    if (ratio_type && !SUPPORTED_RATIOS.includes(ratio_type.trim())) {
        console.warn(`[Endorsement] Unknown ratio_type received: "${ratio_type}" — defaulting to 4:3`);
    }

    try {
        const endorsements = await getEndorsements();

        const newEndorsement = {
            id: Date.now().toString(),
            name,
            image_path: `/uploads/${req.file.filename}`,
            ratio_type: resolvedRatio,
            caption: caption || '',
            is_active: true
        };

        endorsements.push(newEndorsement);
        await saveEndorsements(endorsements);

        res.status(201).json({ message: 'Endorsement added successfully', data: endorsements });
    } catch (error) {
        console.error('Error creating endorsement:', error);
        if (req.file) {
            const filePath = path.join(__dirname, '..', `uploads/${req.file.filename}`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Failed to add endorsement' });
    }
};

exports.updateEndorsement = async (req, res) => {
    const endorsementId = req.params.id;
    const { name, is_active, ratio_type, caption } = req.body;

    if (!name) return res.status(400).json({ message: 'Endorser name is required!' });

    try {
        let endorsements = await getEndorsements();
        const index = endorsements.findIndex(e => e.id === endorsementId);

        if (index === -1) {
            if (req.file) fs.unlinkSync(path.join(__dirname, '..', `uploads/${req.file.filename}`));
            return res.status(404).json({ message: 'Endorsement not found' });
        }

        endorsements[index].name = name;
        endorsements[index].caption = caption !== undefined ? caption : (endorsements[index].caption || '');

        if (ratio_type !== undefined && SUPPORTED_RATIOS.includes(ratio_type.toString().trim())) {
            endorsements[index].ratio_type = ratio_type.toString().trim();
        } else if (!endorsements[index].ratio_type) {
            endorsements[index].ratio_type = '4:3';
        }

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
        res.json({ message: 'Endorsement updated successfully', data: endorsements });
    } catch (error) {
        console.error('Error updating endorsement:', error);
        if (req.file) {
            const filePath = path.join(__dirname, '..', `uploads/${req.file.filename}`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Failed to update endorsement' });
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
        }

        res.json({ message: 'Endorsement deleted successfully', data: endorsements });
    } catch (error) {
        console.error('Error deleting endorsement:', error);
        res.status(500).json({ message: 'Failed to delete endorsement' });
    }
};
