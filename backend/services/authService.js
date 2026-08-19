const bcrypt = require('bcrypt');
const dbUtils = require('../utils/database');

const registerUser = async (name, email, password) => {
    // 1. Check if email already exists
    const existingUser = await dbUtils.executeQuery('SELECT user_id FROM users WHERE email = ?', [email]);
    
    if (existingUser && existingUser.length > 0) {
        const error = new Error('Email already exists');
        error.statusCode = 400; // Bad request
        throw error;
    }

    // 2. Hash password (10 salt rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insert user
    const result = await dbUtils.executeQuery(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
    );

    // 4. Return user info (excluding password hash)
    return {
        userId: result.insertId,
        name,
        email
    };
};

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (user) => {
    return jwt.sign(
        { userId: user.userId, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );
};

const loginUser = async (email, password) => {
    // 1. Find user by email
    const users = await dbUtils.executeQuery('SELECT user_id, name, email, password_hash FROM users WHERE email = ?', [email]);
    
    if (!users || users.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    
    const user = users[0];

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        const error = new Error('Invalid password');
        error.statusCode = 401; // Unauthorized
        throw error;
    }

    // 3. Generate Token
    const userPayload = { userId: user.user_id, name: user.name, email: user.email };
    const token = generateToken(userPayload);

    // 4. Return user and token (excluding password hash)
    return {
        token,
        user: userPayload
    };
};

const getCurrentUser = async (userId) => {
    const users = await dbUtils.executeQuery(
        'SELECT user_id AS userId, name, email FROM users WHERE user_id = ?',
        [userId]
    );

    if (!users || users.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return users[0];
};

module.exports = {
    registerUser,
    loginUser,
    generateToken,
    getCurrentUser
};
