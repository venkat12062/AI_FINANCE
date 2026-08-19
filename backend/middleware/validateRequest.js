const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');
const MESSAGES = require('../constants/messages');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));
        return errorResponse(res, MESSAGES.VALIDATION_FAILED, formattedErrors, 400);
    }
    next();
};

module.exports = validateRequest;
