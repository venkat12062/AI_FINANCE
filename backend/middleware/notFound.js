const { errorResponse } = require('../utils/apiResponse');
const MESSAGES = require('../constants/messages');

const notFoundHandler = (req, res, next) => {
    return errorResponse(res, MESSAGES.RESOURCE_NOT_FOUND, [], 404);
};

module.exports = notFoundHandler;
