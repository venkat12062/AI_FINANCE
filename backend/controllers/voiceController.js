'use strict';

const voiceService = require('../services/voiceService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * POST /api/voice/parse
 * Parse a voice text string — no DB write, returns parsed intent/amount/category
 */
const parseVoice = async (req, res, next) => {
    try {
        const { voiceText } = req.body;
        if (!voiceText || typeof voiceText !== 'string' || !voiceText.trim()) {
            return errorResponse(res, 'voiceText is required and must be a non-empty string', [], 400);
        }
        const result = await voiceService.parseVoiceText(voiceText);
        return successResponse(res, result, 'Voice text parsed successfully', 200);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/voice/create-transaction
 * Execute a voice command — creates transaction OR answers a query
 */
const createTransaction = async (req, res, next) => {
    try {
        const userId    = req.user.userId;
        const { voiceText } = req.body;

        if (!voiceText || typeof voiceText !== 'string' || !voiceText.trim()) {
            return errorResponse(res, 'voiceText is required and must be a non-empty string', [], 400);
        }

        const result  = await voiceService.executeVoiceCommand(userId, voiceText);
        const message = result.answer || 'Voice command executed successfully.';

        // Use 200 for queries, 201 for transaction creation
        const status = result.type === 'transaction_created' ? 201 : 200;
        return successResponse(res, result, message, status);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/voice/history?limit=50&offset=0
 * Retrieve paginated voice command history for authenticated user
 */
const getHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const limit  = Math.min(parseInt(req.query.limit  || '50'), 100); // max 100
        const offset = Math.max(parseInt(req.query.offset || '0'), 0);

        const result = await voiceService.getVoiceHistory(userId, limit, offset);
        return successResponse(res, result, 'Voice history fetched successfully', 200);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/voice/history/:id
 * Delete a specific voice entry — user can only delete their own entries (enforced in service)
 */
const deleteHistory = async (req, res, next) => {
    try {
        const userId  = req.user.userId;
        const voiceId = req.params.id;

        if (!voiceId) {
            return errorResponse(res, 'Voice entry ID is required', 400);
        }

        await voiceService.deleteVoiceHistory(userId, voiceId);
        return successResponse(res, null, 'Voice record deleted successfully', 200);
    } catch (error) {
        next(error);
    }
};

module.exports = { parseVoice, createTransaction, getHistory, deleteHistory };
