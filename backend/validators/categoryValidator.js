const { body } = require('express-validator');

const categoryValidation = [
    body('categoryName')
        .trim()
        .notEmpty().withMessage('Category name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),

    body('categoryType')
        .trim()
        .notEmpty().withMessage('Category type is required')
        .isIn(['Income', 'Expense']).withMessage('Category type must be either Income or Expense')
];

module.exports = {
    categoryValidation
};
