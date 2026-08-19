const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AuthenticationError } = require('../utils/AppError');

const authenticateUser = (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new AuthenticationError('Not authorized, no token provided');
        }

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token has expired, please log in again');
            } else if (err.name === 'JsonWebTokenError') {
                throw new AuthenticationError('Invalid token structure');
            } else {
                throw new AuthenticationError('Token verification failed');
            }
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authenticateUser
};
