const { body } = require('express-validator');

const incomeValidation = [
    body('categoryId')
        .notEmpty().withMessage('Category ID is required')
        .isInt().withMessage('Category ID must be an integer'),

    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),

    body('transactionDate')
        .notEmpty().withMessage('Transaction date is required')
        .isISO8601().withMessage('Invalid date format'),

    body('description')
        .optional()
        .isLength({ max: 255 }).withMessage('Description cannot exceed 255 characters')
];

module.exports = {
    incomeValidation
};
