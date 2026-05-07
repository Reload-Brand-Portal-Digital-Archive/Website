const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { logAdminActivity } = require('../utils/activityLogger');

const sendProductNotification = async (productData) => {
    try {
        const [subscribers] = await db.query('SELECT email FROM newsletter_subscribers');
        if (subscribers.length === 0) return;

        const emails = subscribers.map(sub => sub.email);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const CHUNK_SIZE = 90;
        for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
            const chunk = emails.slice(i, i + CHUNK_SIZE);
            const mailOptions = {
                from: `"RELOAD DISTRO" <${process.env.EMAIL_USER}>`,
                bcc: chunk,
                subject: `[EARLY ACCESS] New Drop: ${productData.name}`,
                html: `
                <div style="background-color: #000000; padding: 40px 20px; font-family: 'Courier New', Consolas, monospace;">
                    <div style="max-width: 520px; margin: 0 auto; border: 1px solid #1a1a1a; padding: 0;">
                        <div style="background-color: #0a0a0a; border-bottom: 1px solid #1a1a1a; padding: 20px 24px;">
                            <span style="color: #10b981; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;">[ RELOAD DISTRO // EARLY ACCESS ]</span>
                        </div>

                        <div style="padding: 32px 24px;">
                            <div style="margin-bottom: 28px;">
                                <span style="color: #eab308; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; display: block; margin-bottom: 8px;">> NEW DROP DEPLOYED</span>
                                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                                    ${productData.name}
                                </h1>
                            </div>

                            <div style="background-color: #0a0a0a; border: 1px solid #27272a; padding: 16px; margin-bottom: 24px;">
                                <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px 0;"><span style="color: #52525b;">CATEGORY:</span> ${productData.category}</p>
                                ${productData.sizes ? `<p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px 0;"><span style="color: #52525b;">SIZES:</span> ${productData.sizes}</p>` : ''}
                                <p style="color: #d4d4d8; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0;">
                                    A new limited edition drop is here. As a subscriber, you get this early intelligence. Once it's gone, it's gone.
                                </p>
                            </div>
                            
                            <div style="margin-bottom: 32px;">
                                <a href="http://localhost:5173/shop/${productData.slug}" target="_blank" style="display: inline-block; background-color: #0a0a0a; border: 1px solid #10b981; color: #10b981; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">[ INFILTRATE SHOP ]</a>
                            </div>

                            <div style="margin-top: 40px; text-align: center;">
                                <a href="http://localhost:5173/unsubscribe" style="color: #52525b; font-size: 10px; text-decoration: underline; letter-spacing: 0.1em; text-transform: uppercase;">[ UNSUBSCRIBE ]</a>
                            </div>
                        </div>

                        <div style="background-color: #0a0a0a; border-top: 1px solid #1a1a1a; padding: 16px 24px; text-align: center;">
                            <span style="color: #27272a; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO // ALL RIGHTS RESERVED</span>
                        </div>
                    </div>
                </div>
                `
            };
            
            await transporter.sendMail(mailOptions);
        }
        console.log(`Successfully sent new product notifications to ${emails.length} subscribers.`);
    } catch (error) {
        console.error('Failed to send product notification:', error);
    }
};

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
        
        sendProductNotification({
            name,
            slug,
            category,
            sizes
        });

        await logAdminActivity(req, 'CREATE', 'Product', newProductId, { name, category, status, collection_id });

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
        await logAdminActivity(req, 'UPDATE', 'Product', productId, { name, category, status, collection_id });
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
        await logAdminActivity(req, 'DELETE', 'Product', productId, { productId });
        res.json({ message: 'Produk berhasil dihapus permanen!' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ message: 'Gagal menghapus produk' });
    }
};

exports.exportProducts = async (req, res) => {
    const { format } = req.params;
    const archiver = require('archiver');
    const ExcelJS = require('exceljs');
    
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

        if (format === 'csv') {
            const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
            let csv = 'Name,Collection,Category,Description,Status,Sizes,Shopee,TikTok,Image URLs\n';
            products.forEach(product => {
                const escapeCSV = (str) => {
                    if (!str) return '';
                    const cleanStr = String(str).replace(/"/g, '""');
                    if (cleanStr.includes(',') || cleanStr.includes('\n') || cleanStr.includes('"')) {
                        return `"${cleanStr}"`;
                    }
                    return cleanStr;
                };
                
                let imageUrls = '';
                if (product.all_images) {
                    imageUrls = product.all_images.split(',')
                        .map(imgPath => `${baseUrl}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`)
                        .join(' | ');
                }

                csv += `${escapeCSV(product.name)},${escapeCSV(product.collection_name)},${escapeCSV(product.category)},${escapeCSV(product.description)},${escapeCSV(product.status)},${escapeCSV(product.sizes)},${escapeCSV(product.shopee_link)},${escapeCSV(product.tiktok_link)},${escapeCSV(imageUrls)}\n`;
            });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
            await logAdminActivity(req, 'READ', 'Product', null, { action: 'export_products', format: 'csv' });
            return res.status(200).send(csv);

        } else if (format === 'pdf') {
            const PDFDocument = require('pdfkit-table');
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="products_export.pdf"');
            doc.pipe(res);

            const imagePath = path.join(__dirname, '../../frontend/src/assets/reload_transparent.png');
            if (fs.existsSync(imagePath)) {
                doc.save();
                doc.opacity(0.35);
                doc.translate(doc.page.width / 2, doc.page.height / 2);
                doc.rotate(-45);
                doc.image(imagePath, -250, -250, { width: 500 });
                doc.restore();
            }

            doc.font('Helvetica-Bold').fontSize(16).text('Reload Distro - Product List', { align: 'center' });
            doc.moveDown(2);

            const table = {
                title: 'Product List',
                headers: ['Name', 'Collection', 'Category', 'Status', 'Sizes'],
                rows: products.map(product => [
                    product.name || '',
                    product.collection_name || '',
                    product.category || '',
                    product.status || 'Available',
                    product.sizes || ''
                ])
            };

            await doc.table(table, {
                width: 750,
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                prepareRow: () => doc.font('Helvetica').fontSize(10)
            });

            await logAdminActivity(req, 'READ', 'Product', null, { action: 'export_products', format: 'pdf' });
            doc.end();
            return;

        } else if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Products');
            worksheet.columns = [
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Collection', key: 'collection', width: 20 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Description', key: 'description', width: 40 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Sizes', key: 'sizes', width: 20 },
                { header: 'Shopee', key: 'shopee', width: 30 },
                { header: 'TikTok', key: 'tiktok', width: 30 }
            ];

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="products_export.zip"');
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', (err) => { throw err; });
            archive.pipe(res);

            for (const product of products) {
                worksheet.addRow({
                    name: product.name || '',
                    collection: product.collection_name || '',
                    category: product.category || '',
                    description: product.description || '',
                    status: product.status || 'Available',
                    sizes: product.sizes || '',
                    shopee: product.shopee_link || '',
                    tiktok: product.tiktok_link || ''
                });

                if (product.all_images) {
                    const images = product.all_images.split(',');
                    const folderName = (product.name || 'product').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'product';
                    
                    images.forEach((img, idx) => {
                        const filePath = path.join(__dirname, '..', img);
                        if (fs.existsSync(filePath)) {
                            const ext = path.extname(img) || '.jpg';
                            const imageName = `${folderName}_${idx + 1}${ext}`;
                            archive.file(filePath, { name: `${folderName}/${imageName}` });
                        }
                    });
                }
            }

            const excelBuffer = await workbook.xlsx.writeBuffer();
            archive.append(excelBuffer, { name: 'products.xlsx' });

            await logAdminActivity(req, 'READ', 'Product', null, { action: 'export_products', format: 'excel' });
            await archive.finalize();
            return;
        } else {
            return res.status(400).json({ message: 'Invalid format requested' });
        }

    } catch (error) {
        console.error('Export Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Gagal mengekspor produk' });
        }
    }
};