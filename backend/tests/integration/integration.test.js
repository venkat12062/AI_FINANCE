const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');
const bcrypt = require('bcrypt');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 })),
    sign: jest.fn(() => 'mocked.jwt.token')
}));

describe('Integration Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('FLOW 1: Register -> Login -> Create Data -> Dashboard', async () => {
        // Register mocks
        dbUtils.executeQuery.mockResolvedValueOnce([]); // no duplicate
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 1 }); // inserted user

        const regRes = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Int User', email: 'int@example.com', password: 'Password123!' });
        expect(regRes.statusCode).toBe(201);

        // Login mocks
        const hashedPassword = await bcrypt.hash('Password123!', 10);
        dbUtils.executeQuery.mockResolvedValueOnce([{ user_id: 1, name: 'Int User', email: 'int@example.com', password_hash: hashedPassword }]);

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'int@example.com', password: 'Password123!' });
        expect(loginRes.statusCode).toBe(200);
        
        const token = loginRes.body.data.token;

        // Create Category mocks
        dbUtils.executeQuery.mockResolvedValueOnce([]); 
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 2 }); 

        const catRes = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ categoryName: 'Int Cat', categoryType: 'Expense' });
        expect(catRes.statusCode).toBe(201);

        // Create Expense mocks
        dbUtils.executeQuery.mockResolvedValueOnce([{ category_type: 'Expense' }]); 
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 3 }); 

        const expRes = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send({ categoryId: 2, amount: 150, description: 'Test Exp', transactionDate: '2023-10-01' });
        expect(expRes.statusCode).toBe(201);

        // Verify Dashboard mocks
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Income', totalAmount: 0 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Expense', totalAmount: 150 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([]);
        dbUtils.executeQuery.mockResolvedValueOnce([]);

        const dashRes = await request(app)
            .get('/api/dashboard/overview')
            .set('Authorization', `Bearer ${token}`);
        expect(dashRes.statusCode).toBe(200);
        expect(dashRes.body.data.totalExpense).toBe(150);
    });

    it('FLOW 2: AI Insights & Notifications', async () => {
        // AI Mocks
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Income', totalAmount: 2000 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Expense', totalAmount: 1000 }]);

        const aiRes = await request(app)
            .get('/api/ai/health')
            .set('Authorization', 'Bearer token');
        
        expect(aiRes.statusCode).toBe(200);

        // Notification Generation Mocks
        dbUtils.executeQuery.mockResolvedValue([]); // all blank
        
        const notifRes = await request(app)
            .post('/api/notifications/generate')
            .set('Authorization', 'Bearer token');
        
        expect(notifRes.statusCode).toBe(200);
    });
});
