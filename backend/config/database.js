const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then((connection) => {
        console.log('Berhasil terkoneksi ke database MySQL (reload_db)');
        connection.release();
    })
    .catch((err) => {
        console.error('Gagal terkoneksi ke database:', err.message);
    });

module.exports = pool;