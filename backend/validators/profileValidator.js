const { body } = require('express-validator');

const updateProfileValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8, max: 50 }).withMessage('New password must be between 8 and 50 characters')
        .matches(/[A-Z]/).withMessage('New password must contain at least 1 uppercase letter')
        .matches(/[a-z]/).withMessage('New password must contain at least 1 lowercase letter')
        .matches(/[0-9]/).withMessage('New password must contain at least 1 number')
        .matches(/[^A-Za-z0-9]/).withMessage('New password must contain at least 1 special character')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password cannot be the same as current password');
            }
            return true;
        }),

    body('confirmPassword')
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

module.exports = {
    updateProfileValidation,
    changePasswordValidation
};
