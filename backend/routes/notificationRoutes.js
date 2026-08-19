const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.use(authenticateUser);

// POST /api/notifications/generate
router.post('/generate', notificationController.generateNotifications);

// GET /api/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/read-all
router.put('/read-all', notificationController.markAllRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', notificationController.markAsRead);

// GET /api/notifications
router.get('/', notificationController.getNotifications);

// DELETE /api/notifications/:id
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
