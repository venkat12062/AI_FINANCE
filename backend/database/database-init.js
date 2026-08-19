const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function initDatabase() {
    let connection;
    try {
        // 1. Connect MySQL server (without specifying a database)
        console.log('Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true // Enable multiple statements for SQL scripts
        });
        
        const dbName = process.env.DB_NAME || 'ai_finance_manager';

        // 2 & 3. Create database if missing
        console.log(`Ensuring database '${dbName}' exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

        // 4. Switch to database
        await connection.query(`USE \`${dbName}\``);

        // Helper to run SQL file
        const runSqlFile = async (filename, description) => {
            console.log(`Executing ${description}...`);
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
                // If it's a duplicate index error, we can ignore it to keep script idempotent
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`✅ ${description} executed (Indexes already exist).`);
                } else {
                    console.error(`❌ Error executing ${description}:`, err.message);
                    throw err;
                }
            }
        };

        // 5. Execute schema.sql
        await runSqlFile('schema.sql', 'schema.sql');

        // 6. Execute indexes.sql
        await runSqlFile('indexes.sql', 'indexes.sql');

        // 7. Execute seed.sql
        await runSqlFile('seed.sql', 'seed.sql');

        console.log('🎉 Database initialization completed successfully.');

    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = initDatabase;
