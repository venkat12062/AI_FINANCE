const authService = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        const userData = await authService.registerUser(name, email, password);
        
        return successResponse(res, userData, "Registration successful", 201);
    } catch (error) {
        // Pass to global error handler
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const data = await authService.loginUser(email, password);
        
        return successResponse(res, data, "Login successful", 200);
    } catch (error) {
        next(error);
    }
};

const getCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const userProfile = await authService.getCurrentUser(userId);
        
        return successResponse(res, userProfile, "User profile fetched", 200);
    } catch (error) {
        next(error);
    }
};

const verifyToken = (req, res) => {
    // If the middleware authenticateUser passes, then the token is valid.
    return successResponse(res, {}, "Token valid", 200);
};

module.exports = {
    register,
    login,
    getCurrentUser,
    verifyToken
};
