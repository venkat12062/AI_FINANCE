const { body } = require('express-validator');

const currentYear = new Date().getFullYear();

const budgetValidation = [
    body('month')
        .notEmpty().withMessage('Month is required')
        .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),

    body('year')
        .notEmpty().withMessage('Year is required')
        .isInt({ min: 2000 }).withMessage('Year must be valid'),

    body('budgetLimit')
        .notEmpty().withMessage('Budget limit is required')
        .isFloat({ gt: 0 }).withMessage('Budget limit must be greater than 0')
];

module.exports = {
    budgetValidation
};
