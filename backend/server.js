const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('./config/database');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const materialRoutes = require('./routes/materialRoutes');
const endorsementRoutes = require('./routes/endorsementRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const wholesaleRoutes = require('./routes/wholesaleRoutes');
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/endorsements', endorsementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/wholesale', wholesaleRoutes);
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ message: "Welcome to RELOAD API" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});