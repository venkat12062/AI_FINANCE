const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');
const bcrypt = require('bcrypt');

describe('Auth Login API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should login a valid user', async () => {
        const hashedPassword = await bcrypt.hash('Password123!', 10);
        
        dbUtils.executeQuery.mockResolvedValueOnce([{
            user_id: 1,
            name: 'Test User',
            email: 'test@example.com',
            password_hash: hashedPassword
        }]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Password123!'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    it('should fail on invalid password', async () => {
        const hashedPassword = await bcrypt.hash('Password123!', 10);
        
        dbUtils.executeQuery.mockResolvedValueOnce([{
            user_id: 1,
            password_hash: hashedPassword
        }]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'WrongPassword!'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
