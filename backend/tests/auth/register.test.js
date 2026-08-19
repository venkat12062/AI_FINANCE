const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');
const bcrypt = require('bcrypt');

describe('Auth Registration API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a valid user', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([]); // Check if user exists -> returns empty
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 1 }); // Insert returns ID

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!'
            });

        console.log(res.body);
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe('test@example.com');
        expect(res.body.data.token).toBeDefined();
    });

    it('should fail on duplicate email', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ id: 1 }]); // User already exists

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'duplicate@example.com',
                password: 'Password123!'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/already exists/i);
    });

    it('should fail on weak password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: '123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
