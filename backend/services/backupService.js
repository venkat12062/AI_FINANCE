const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const { AppError } = require('../utils/AppError');
const dbUtils = require('../utils/database');

const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Creates a complete database SQL backup
 */
async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    try {
        // Generate universal SQL dump from database tables
        const tables = ['users', 'categories', 'transactions', 'budgets', 'receipts', 'ai_insights', 'voice_entries', 'notifications'];
        let sqlDump = `-- AI Finance Manager Database Backup\n-- Generated: ${new Date().toISOString()}\n\n`;

        for (const table of tables) {
            try {
                const rows = await dbUtils.executeQuery(`SELECT * FROM ${table}`);
                if (rows && rows.length > 0) {
                    sqlDump += `-- Table: ${table}\n`;
                    for (const row of rows) {
                        const cols = Object.keys(row).join(', ');
                        const vals = Object.values(row).map(v => v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`).join(', ');
                        sqlDump += `INSERT INTO ${table} (${cols}) VALUES (${vals});\n`;
                    }
                    sqlDump += '\n';
                }
            } catch (err) {}
        }

        fs.writeFileSync(filepath, sqlDump, 'utf8');
        const stats = fs.statSync(filepath);

        return {
            filename,
            sizeBytes: stats.size,
            createdAt: new Date()
        };
    } catch (err) {
        console.error('Backup failed:', err);
        throw new AppError('Database backup failed', 500);
    }
}

/**
 * Lists all available backups
 */
async function listBackups() {
    try {
        const files = fs.readdirSync(backupDir);
        const backups = files
            .filter(file => file.endsWith('.sql'))
            .map(file => {
                const stats = fs.statSync(path.join(backupDir, file));
                return {
                    filename: file,
                    sizeBytes: stats.size,
                    createdAt: stats.birthtime
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt); // newest first
        
        return backups;
    } catch (error) {
        throw new AppError('Failed to list backups', 500);
    }
}

/**
 * Deletes a specific backup safely
 */
async function deleteBackup(filename) {
    // Validate filename to prevent path traversal
    if (!filename || typeof filename !== 'string' || !filename.match(/^backup_.*\.sql$/)) {
        throw new AppError('Invalid backup filename', 400);
    }

    const filepath = path.join(backupDir, filename);
    
    // Final sanity check
    if (path.dirname(filepath) !== backupDir) {
        throw new AppError('Invalid file path', 400);
    }

    if (!fs.existsSync(filepath)) {
        throw new AppError('Backup file not found', 404);
    }

    try {
        fs.unlinkSync(filepath);
        return true;
    } catch (error) {
        throw new AppError('Failed to delete backup file', 500);
    }
}

/**
 * Restores a specific backup
 */
async function restoreBackup(filename) {
    if (!filename || typeof filename !== 'string' || !filename.match(/^backup_.*\.sql$/)) {
        throw new AppError('Invalid backup filename', 400);
    }

    const filepath = path.join(backupDir, filename);
    
    if (path.dirname(filepath) !== backupDir || !fs.existsSync(filepath)) {
        throw new AppError('Backup file not found', 404);
    }

    return new Promise((resolve, reject) => {
        // Uses mysql client which must be available in system PATH
        const restoreCommand = `mysql -h ${env.DB_HOST} -u ${env.DB_USER} ${env.DB_PASSWORD ? `-p${env.DB_PASSWORD}` : ''} ${env.DB_NAME} < ${filepath}`;

        exec(restoreCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Restore failed: ${error.message}`);
                return reject(new AppError('Database restore failed', 500));
            }
            resolve(true);
        });
    });
}

module.exports = {
    createBackup,
    listBackups,
    deleteBackup,
    restoreBackup
};
