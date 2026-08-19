const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

// All receipt routes must be authenticated
router.use(authenticateUser);

// POST /api/receipts/upload
router.post('/upload', uploadMiddleware.single('file'), receiptController.uploadReceipt);

// GET /api/receipts
router.get('/', receiptController.getReceipts);

// GET /api/receipts/:id
router.get('/:id', receiptController.getReceiptById);

// DELETE /api/receipts/:id
router.delete('/:id', receiptController.deleteReceipt);

// POST /api/receipts/create-expense
router.post('/create-expense', receiptController.createExpense);

module.exports = router;
