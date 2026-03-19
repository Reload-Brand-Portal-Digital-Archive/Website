const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const collectionController = require('../controllers/collectionController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../frontend/src/assets/collections');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Strip out non-alphanumeric chars from original name (safeguard)
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cover-' + uniqueSuffix + '-' + sanitizedName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (JPEG/JPG, PNG, WEBP, GIF) yang diizinkan!'));
        }
    }
});

// Define routes for /api/collections
router.get('/', collectionController.getAllCollections);
router.get('/:id', collectionController.getCollectionById);

// Apply multer middleware to POST and PUT that handle cover_image
router.post('/', upload.single('cover_image'), collectionController.createCollection);
router.put('/:id', upload.single('cover_image'), collectionController.updateCollection);
router.delete('/:id', collectionController.deleteCollection);

module.exports = router;
