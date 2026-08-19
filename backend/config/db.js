const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // Fallback if ran directly, but normally env loaded in server.js

// Using config from env
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_finance_manager',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(`✅ Successfully connected to the MySQL database (${process.env.DB_NAME})`);
        connection.release();
    } catch (error) {
        console.error('❌ Failed to connect to the MySQL database:', error.message);
    }
}

testConnection();

module.exports = pool;
