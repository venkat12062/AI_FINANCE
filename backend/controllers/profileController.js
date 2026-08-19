const profileService = require('../services/profileService');
const { successResponse } = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await profileService.getProfile(userId);
        return successResponse(res, profile, "Profile fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { name, email } = req.body;
        
        await profileService.updateProfile(userId, name, email);
        return successResponse(res, null, "Profile updated successfully", 200);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        
        await profileService.changePassword(userId, currentPassword, newPassword);
        return successResponse(res, null, "Password changed successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};
