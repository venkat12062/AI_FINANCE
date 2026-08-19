const { body } = require('express-validator');

const validateEmail = (field = 'email') => {
    return body(field)
        .trim()
        .notEmpty().withMessage(`${field} is required`)
        .isEmail().withMessage(`Invalid ${field} format`)
        .normalizeEmail();
};

const validateRequired = (field) => {
    return body(field)
        .trim()
        .notEmpty().withMessage(`${field} is required`);
};

const validatePositiveAmount = (field = 'amount') => {
    return body(field)
        .notEmpty().withMessage(`${field} is required`)
        .isFloat({ gt: 0 }).withMessage(`${field} must be a positive number`);
};

const validateStringLength = (field, min = 1, max = 255) => {
    return body(field)
        .trim()
        .notEmpty().withMessage(`${field} is required`)
        .isLength({ min, max }).withMessage(`${field} must be between ${min} and ${max} characters`);
};

module.exports = {
    validateEmail,
    validateRequired,
    validatePositiveAmount,
    validateStringLength
};
