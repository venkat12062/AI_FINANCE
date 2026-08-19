const backupService = require('../services/backupService');
const { successResponse } = require('../utils/apiResponse');

const createBackup = async (req, res, next) => {
    try {
        const backupData = await backupService.createBackup();
        return successResponse(res, backupData, 'Database backup created successfully', 201);
    } catch (error) {
        next(error);
    }
};

const getBackups = async (req, res, next) => {
    try {
        const backups = await backupService.listBackups();
        return successResponse(res, backups, 'Backups retrieved successfully', 200);
    } catch (error) {
        next(error);
    }
};

const deleteBackup = async (req, res, next) => {
    try {
        const { filename } = req.params;
        await backupService.deleteBackup(filename);
        return successResponse(res, null, 'Backup deleted successfully', 200);
    } catch (error) {
        next(error);
    }
};

const restoreBackup = async (req, res, next) => {
    try {
        const { file } = req.body;
        await backupService.restoreBackup(file);
        return successResponse(res, null, 'Database restored successfully', 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBackup,
    getBackups,
    deleteBackup,
    restoreBackup
};
