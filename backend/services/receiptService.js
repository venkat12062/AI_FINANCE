'use strict';
/**
 * receiptService.js
 * Handles: image preprocessing with Jimp → Tesseract OCR → receipt parsing → DB save
 */

const tesseract  = require('tesseract.js');
const dbUtils    = require('../utils/database');
const parser     = require('../utils/receiptParser');
const fs         = require('fs');
const path       = require('path');

// ─── Try to load Jimp for preprocessing (pure JS, no native deps) ───────────
let Jimp = null;
try {
    const jimpPkg = require('jimp');
    Jimp = jimpPkg.Jimp || jimpPkg;
} catch (e) {
    console.warn('[OCR] jimp not available — skipping image preprocessing.');
}

// ─── Image Preprocessing ────────────────────────────────────────────────────
/**
 * preprocessImage — improves OCR accuracy by:
 *   1. Converting to grayscale
 *   2. Increasing contrast
 *   3. Sharpening
 *   4. Upscaling small images to at least 800px wide
 *   5. Saving to a temp file for Tesseract to read
 *
 * @param {string} inputPath - path to original uploaded image
 * @returns {string} - path to preprocessed image (or original if jimp unavailable)
 */
const preprocessImage = async (inputPath) => {
    if (!Jimp || !Jimp.read) return inputPath; // fallback: use original image

    try {
        const image = await Jimp.read(inputPath);

        // Upscale very small images — Tesseract performs better on larger images
        const width = image.bitmap ? image.bitmap.width : (image.width || 800);
        const height = image.bitmap ? image.bitmap.height : (image.height || 600);
        if (width < 800) {
            const scale = 800 / width;
            if (typeof image.resize === 'function') {
                image.resize({ w: Math.round(width * scale), h: Math.round(height * scale) });
            }
        }

        // Preprocessing pipeline for receipt OCR
        if (typeof image.greyscale === 'function') image.greyscale();
        if (typeof image.contrast === 'function') image.contrast(0.3);
        if (typeof image.normalize === 'function') image.normalize();

        // Save preprocessed image next to original
        const ext     = path.extname(inputPath);
        const preProc = inputPath.replace(ext, '_preprocessed' + ext);
        if (typeof image.write === 'function') {
            await image.write(preProc);
        } else if (typeof image.writeAsync === 'function') {
            await image.writeAsync(preProc);
        }
        return preProc;
    } catch (err) {
        console.warn('[OCR] Preprocessing notice (using original):', err.message);
        return inputPath;
    }
};

// ─── OCR Engine ─────────────────────────────────────────────────────────────
/**
 * extractText — runs Tesseract.js v7 on the given image path
 * Tesseract v7 API: recognize(image, langs, options)
 */
const extractText = async (imagePath) => {
    let processedPath = imagePath;
    let cleanupNeeded = false;

    try {
        // Step 1: Preprocess
        processedPath = await preprocessImage(imagePath);
        cleanupNeeded = processedPath !== imagePath;

        // Step 2: OCR with Tesseract.js v7
        const result = await tesseract.recognize(processedPath, 'eng', {
            tessedit_char_whitelist: '', // allow all chars
            preserve_interword_spaces: '1',
        });

        const rawText = result.data.text || '';

        // Step 3: Post-process OCR text — clean artifacts
        const cleaned = rawText
            .replace(/\r\n/g, '\n')           // normalize line endings
            .replace(/\r/g, '\n')
            .replace(/[ \t]{2,}/g, ' ')        // collapse multiple spaces
            .replace(/[|]{1,}/g, '')           // remove OCR pipe artifacts
            .replace(/[^\x20-\x7E\n₹]/g, ' ') // remove non-printable except ₹
            .replace(/\n{3,}/g, '\n\n')        // max 2 consecutive blank lines
            .trim();

        return cleaned;
    } catch (err) {
        console.error('[OCR] Tesseract error:', err.message);
        throw new Error('OCR failed: ' + err.message);
    } finally {
        // Cleanup preprocessed temp file
        if (cleanupNeeded && fs.existsSync(processedPath)) {
            try { fs.unlinkSync(processedPath); } catch {}
        }
    }
};

// ─── Receipt Upload & Process ────────────────────────────────────────────────
const uploadReceipt = async (userId, file) => {
    let ocrText = '';
    try {
        // 1. OCR
        ocrText = await extractText(file.path);
    } catch (err) {
        // If OCR completely fails, still save the receipt with empty text
        console.warn('[OCR] Extraction failed, saving receipt without text:', err.message);
        ocrText = '';
    }

    // 2. Parse extracted text
    const parsed   = parser.parseReceiptText(ocrText);
    const imageUrl = `/uploads/receipts/${file.filename}`;

    // 3. Save to DB — store merchant and category in ocr_text as JSON + raw text
    const ocrPayload = ocrText; // store raw OCR text
    const result = await dbUtils.executeQuery(
        `INSERT INTO receipts (user_id, image_url, ocr_text) VALUES (?, ?, ?)`,
        [userId, imageUrl, ocrPayload]
    );

    const receiptId = result.insertId;

    return {
        receiptId,
        ocrText,
        amount:            parsed.amount,
        date:              parsed.date,
        merchant:          parsed.merchant,
        suggestedCategory: parsed.suggestedCategory,
        imageUrl,
        // Confidence indicator
        confidence: {
            amount:   parsed.amount   ? 'extracted' : 'not_found',
            date:     parsed.date !== new Date().toISOString().split('T')[0] ? 'extracted' : 'defaulted_today',
            merchant: parsed.merchant ? 'extracted' : 'not_found',
        }
    };
};

// ─── CRUD ────────────────────────────────────────────────────────────────────
const getReceipts = async (userId) => {
    return await dbUtils.executeQuery(
        `SELECT receipt_id, image_url, ocr_text, created_at
         FROM receipts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
        [userId]
    );
};

const getReceiptById = async (userId, receiptId) => {
    const rows = await dbUtils.executeQuery(
        `SELECT * FROM receipts WHERE user_id = ? AND receipt_id = ?`,
        [userId, receiptId]
    );
    if (rows.length === 0) throw new Error('Receipt not found or access denied');
    return rows[0];
};

const deleteReceipt = async (userId, receiptId) => {
    const receipt = await getReceiptById(userId, receiptId);

    // Delete physical file
    try {
        const fileName = receipt.image_url.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', 'receipts', fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.warn('[Receipt] File delete warning:', err.message);
    }

    await dbUtils.executeQuery(
        `DELETE FROM receipts WHERE user_id = ? AND receipt_id = ?`,
        [userId, receiptId]
    );
    return true;
};

const createExpenseFromReceipt = async (userId, payload) => {
    const { receiptId, categoryId, amount, date, description } = payload;

    if (!receiptId || !categoryId || !amount || !date) {
        throw new Error('receiptId, categoryId, amount, and date are all required');
    }

    // Verify ownership before creating expense
    await getReceiptById(userId, receiptId);

    const result = await dbUtils.executeQuery(
        `INSERT INTO transactions (user_id, category_id, type, amount, transaction_date, description)
         VALUES (?, ?, 'Expense', ?, ?, ?)`,
        [userId, categoryId, parseFloat(amount), date, description || 'Expense from receipt scan']
    );

    return { transactionId: result.insertId };
};

module.exports = {
    extractText,
    uploadReceipt,
    getReceipts,
    getReceiptById,
    deleteReceipt,
    createExpenseFromReceipt
};
