const cron = require('node-cron');
const backupService = require('../services/backupService');
const logger = require('../utils/logger');

// Run everyday at 2:00 AM
const backupCronJob = cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled daily database backup...');
    try {
        await backupService.createBackup();
        logger.info('Scheduled daily backup completed successfully.');

        // Cleanup old backups, keeping only the latest 30
        const backups = await backupService.listBackups();
        if (backups.length > 30) {
            const backupsToDelete = backups.slice(30);
            for (const backup of backupsToDelete) {
                await backupService.deleteBackup(backup.filename);
                logger.info(`Deleted old backup: ${backup.filename}`);
            }
        }
    } catch (error) {
        logger.error(`Scheduled daily backup failed: ${error.message}`);
    }
}, {
    scheduled: false // Do not start automatically upon import
});

module.exports = backupCronJob;
