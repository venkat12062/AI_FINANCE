const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const dbUtils = require('../utils/database');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const logsDir = path.join(__dirname, '..', 'logs');

// Helper to delete old files in a directory
const deleteOldFiles = (dir, maxAgeDays) => {
    if (!fs.existsSync(dir)) return;
    
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        // Skip .gitkeep
        if (file === '.gitkeep') continue;
        
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAgeMs) {
            try {
                fs.unlinkSync(filePath);
                logger.info(`Cleaned up old file: ${filePath}`);
            } catch (err) {
                logger.error(`Failed to delete old file ${filePath}: ${err.message}`);
            }
        }
    }
};

// Run everyday at 3:00 AM
const cleanupCronJob = cron.schedule('0 3 * * *', async () => {
    logger.info('Starting daily cleanup job...');
    
    try {
        // 1. Delete expired in-memory cache explicitly
        const cacheMap = cache._getCacheMap();
        const now = Date.now();
        for (const [key, item] of cacheMap.entries()) {
            if (now > item.expiresAt) {
                cache.del(key);
            }
        }
        logger.info('Expired cache cleared.');

        // 2. Delete logs older than 90 days
        deleteOldFiles(logsDir, 90);

        // 3. Delete unlinked/orphaned receipt images from /uploads
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file === '.gitkeep') continue;
                
                // Query database to see if this file is referenced
                const filePath = `/uploads/${file}`;
                const sql = `SELECT 1 FROM receipts WHERE image_url = ? LIMIT 1`;
                const rows = await dbUtils.executeQuery(sql, [filePath]);
                
                if (rows.length === 0) {
                    try {
                        fs.unlinkSync(path.join(uploadsDir, file));
                        logger.info(`Deleted orphaned receipt upload: ${file}`);
                    } catch (err) {
                        logger.error(`Failed to delete orphaned upload ${file}: ${err.message}`);
                    }
                }
            }
        }

        logger.info('Daily cleanup job completed successfully.');
    } catch (error) {
        logger.error(`Daily cleanup job failed: ${error.message}`);
    }
}, {
    scheduled: false // Do not start automatically upon import
});

module.exports = cleanupCronJob;
