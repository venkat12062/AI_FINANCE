const MESSAGES = require('../constants/messages');

const successResponse = (res, data = {}, message = MESSAGES.OPERATION_SUCCESS, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const errorResponse = (res, message = MESSAGES.SERVER_ERROR, errors = [], statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors
    });
};

module.exports = {
    successResponse,
    errorResponse
};
