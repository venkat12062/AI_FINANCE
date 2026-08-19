const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = require('../config/env');

async function initDatabase() {
    let connection;
    try {
        const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
        const port = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10);
        const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
        const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
        const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'ai_finance_manager';

        console.log(`Connecting to MySQL server at ${host}:${port}...`);
        
        const connectionConfig = env.DATABASE_URL
            ? { uri: env.DATABASE_URL, multipleStatements: true }
            : {
                host,
                port,
                user,
                password,
                multipleStatements: true
            };

        connection = await mysql.createConnection(connectionConfig);
        console.log(`✅ Connected to MySQL database server`);

        // Create database if missing (on Railway, the database usually already exists)
        try {
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            await connection.query(`USE \`${dbName}\``);
        } catch (dbSwitchErr) {
            console.log(`Using current database connection (${dbName}).`);
        }

        // Helper to run SQL file
        const runSqlFile = async (filename, description) => {
            const filePath = path.join(__dirname, filename);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Warning: ${filename} not found.`);
                return;
            }
            const sql = fs.readFileSync(filePath, 'utf8');
            if (sql.trim().length === 0) return;

            try {
                await connection.query(sql);
                console.log(`✅ ${description} executed successfully.`);
            } catch (err) {
                // If it's a duplicate table or index error, ignore to keep script idempotent
                if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`✅ ${description} executed (already exists).`);
                } else {
                    console.warn(`Notice during ${description}:`, err.message);
                }
            }
        };

        // Execute schema, indexes, seed
        await runSqlFile('schema.sql', 'schema.sql');
        await runSqlFile('indexes.sql', 'indexes.sql');
        await runSqlFile('seed.sql', 'seed.sql');

        console.log('🎉 Database initialization completed successfully.');

    } catch (error) {
        console.warn('ℹ️ MySQL database-init notice (using database fallback if needed):', error.message);
    } finally {
        if (connection) {
            try { await connection.end(); } catch {}
        }
    }
}

module.exports = initDatabase;
