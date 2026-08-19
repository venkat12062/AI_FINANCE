const bcrypt = require('bcrypt');
const dbUtils = require('../utils/database');

const getProfile = async (userId) => {
    const users = await dbUtils.executeQuery(
        'SELECT user_id AS userId, name, email, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE user_id = ?',
        [userId]
    );

    if (!users || users.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return users[0];
};

const updateProfile = async (userId, name, email) => {
    // Check if new email is already taken by another user
    const existingUsers = await dbUtils.executeQuery(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, userId]
    );

    if (existingUsers && existingUsers.length > 0) {
        const error = new Error('Email already in use by another account');
        error.statusCode = 400;
        throw error;
    }

    await dbUtils.executeQuery(
        'UPDATE users SET name = ?, email = ? WHERE user_id = ?',
        [name, email, userId]
    );

    return true;
};

const changePassword = async (userId, currentPassword, newPassword) => {
    // 1. Fetch user to get password hash
    const users = await dbUtils.executeQuery(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [userId]
    );

    if (!users || users.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const user = users[0];

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
        const error = new Error('Current password incorrect');
        error.statusCode = 400;
        throw error;
    }

    // 3. Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 4. Update password
    await dbUtils.executeQuery(
        'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [passwordHash, userId]
    );

    return true;
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};
