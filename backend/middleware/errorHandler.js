const { AppError } = require('../utils/AppError');
const logger = require('../utils/fileLogger');

const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error(`${err.name || 'Error'}: ${err.message} - ${req.method} ${req.originalUrl}`);

    // AppError instances (explicit app errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || []
        });
    }

    // Service layer errors: plain Error objects with a statusCode attached
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: []
        });
    }

    // MySQL / DB errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'A record with this value already exists.',
            errors: []
        });
    }

    if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({
            success: false,
            message: 'Database unavailable. Please try again shortly.',
            errors: []
        });
    }

    // Unknown 500 errors
    if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal Server Error',
            errors: []
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: []
    });
};

module.exports = errorHandler;
