const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

// Mock pdf and csv exports to avoid binary stream issues in testing
jest.mock('../../services/reportService', () => {
    const originalModule = jest.requireActual('../../services/reportService');
    return {
        __esModule: true,
        ...originalModule,
        generateCSVReport: jest.fn(() => 'id,amount\n1,500'),
        generatePDFReport: jest.fn(() => Buffer.from('mock pdf data'))
    };
});

describe('Reports API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch report summary', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Income', totalAmount: 5000 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Expense', totalAmount: 2000 }]);

        const res = await request(app)
            .get('/api/reports/summary')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalIncome).toBe(5000);
        expect(res.body.data.netSavings).toBe(3000);
    });

    it('should export CSV', async () => {
        const res = await request(app)
            .get('/api/reports/export/csv')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('should export PDF', async () => {
        const res = await request(app)
            .get('/api/reports/export/pdf')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
});
