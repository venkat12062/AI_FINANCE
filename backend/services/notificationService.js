const dbUtils = require('../utils/database');

const getNotifications = async (userId, limit = 50, offset = 0) => {
    return await dbUtils.executeQuery(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
    );
};

const getUnreadCount = async (userId) => {
    const result = await dbUtils.executeQuery(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );
    return result[0].count;
};

const markAsRead = async (userId, notificationId) => {
    await dbUtils.executeQuery(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND notification_id = ?`,
        [userId, notificationId]
    );
    return true;
};

const markAllRead = async (userId) => {
    await dbUtils.executeQuery(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );
    return true;
};

const deleteNotification = async (userId, notificationId) => {
    await dbUtils.executeQuery(
        `DELETE FROM notifications WHERE user_id = ? AND notification_id = ?`,
        [userId, notificationId]
    );
    return true;
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllRead,
    deleteNotification
};
