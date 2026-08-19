const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = require('./env');

const dbConfig = env.DATABASE_URL
    ? { uri: env.DATABASE_URL }
    : {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'ai_finance_manager',
    };

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'ai_finance_manager';
        console.log(`✅ Successfully connected to the MySQL database (${dbName})`);
        connection.release();
    } catch (error) {
        console.warn('ℹ️ MySQL direct connection info:', error.message);
    }
}

testConnection();

module.exports = pool;
