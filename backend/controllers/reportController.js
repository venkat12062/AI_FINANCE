const reportService = require('../services/reportService');
const { successResponse } = require('../utils/apiResponse');
const cache = require('../utils/cache');

const getReportSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, preset } = req.query;
        
        const result = await reportService.getReportSummary(userId, startDate, endDate, preset);
        return successResponse(res, result, "Report summary fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getCategoryAnalysis = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, preset } = req.query;
        const result = await reportService.getCategoryAnalysis(userId, startDate, endDate, preset);
        return successResponse(res, result, "Category analysis fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getMonthlyAnalysis = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await reportService.getMonthlyAnalysis(userId);
        return successResponse(res, result, "Monthly analysis fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const exportCSV = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, preset } = req.query;
        const csvData = await reportService.generateCSVReport(userId, startDate, endDate, preset);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=financial_report_${new Date().toISOString().split('T')[0]}.csv`);
        return res.status(200).send(csvData);
    } catch (error) {
        next(error);
    }
};

const exportPDF = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, preset } = req.query;
        const pdfData = await reportService.generatePDFReport(userId, startDate, endDate, preset);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=financial_report_${new Date().toISOString().split('T')[0]}.pdf`);
        return res.status(200).send(pdfData);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getReportSummary,
    getCategoryAnalysis,
    getMonthlyAnalysis,
    exportCSV,
    exportPDF
};
