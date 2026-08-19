const notificationService = require('../services/notificationService');
const notificationEngine = require('../services/notificationEngine');
const { successResponse } = require('../utils/apiResponse');

const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const result = await notificationService.getNotifications(userId, limit, offset);
        return successResponse(res, result, "Notifications fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const count = await notificationService.getUnreadCount(userId);
        return res.status(200).json({ count });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;
        await notificationService.markAsRead(userId, notificationId);
        return successResponse(res, null, "Notification marked as read", 200);
    } catch (error) {
        next(error);
    }
};

const markAllRead = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        await notificationService.markAllRead(userId);
        return successResponse(res, null, "All notifications marked as read", 200);
    } catch (error) {
        next(error);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;
        await notificationService.deleteNotification(userId, notificationId);
        return successResponse(res, null, "Notification deleted", 200);
    } catch (error) {
        next(error);
    }
};

const generateNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        await notificationEngine.generateNotifications(userId);
        return successResponse(res, null, "Notification engine executed", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
    generateNotifications
};
