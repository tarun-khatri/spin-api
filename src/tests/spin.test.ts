import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { SpinGrant } from '../models/SpinGrant';
import { SpinSource } from '../types';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';
import rateLimit from 'express-rate-limit';

// Mock rate limiter for tests
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation(() => {
    return (req: any, res: any, next: any) => next();
  });
});

describe('Free Spin Granting API', () => {
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/free-spin-test');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await SpinGrant.deleteMany({});
    // Create test admin user
    const adminUser = await User.create({
      userId: 'admin123',
      email: 'admin@test.com',
      username: 'admin',
      role: 'ADMIN'
    });
    adminToken = jwt.sign(
      { userId: adminUser.userId, role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    // Create test user
    const testUser = await User.create({
      userId: 'user123',
      email: 'user@test.com',
      username: 'testuser',
      role: 'USER'
    });
    testUserId = testUser.userId;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/grant-spin', () => {
    const validSpinRequest = {
      userId: 'user123',
      source: SpinSource.VAULT_REWARD,
      spinCount: 5
    };

    it('should require admin authentication', async () => {
      const response = await request(app)
        .post('/api/v1/grant-spin')
        .send(validSpinRequest);
      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      const invalidRequests = [
        { userId: 'user123', source: 'INVALID_SOURCE', spinCount: 5 },
        { userId: 'user123', source: SpinSource.VAULT_REWARD, spinCount: 0 },
        { userId: 'user123', source: SpinSource.VAULT_REWARD },
        { source: SpinSource.VAULT_REWARD, spinCount: 5 }
      ];
      for (const invalidRequest of invalidRequests) {
        const response = await request(app)
          .post('/api/v1/grant-spin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidRequest);
        expect(response.status).toBe(400);
      }
    });

    it('should prevent duplicate spins for same user and source per day', async () => {
      const firstResponse = await request(app)
        .post('/api/v1/grant-spin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSpinRequest);
      expect(firstResponse.status).toBe(200);

      const secondResponse = await request(app)
        .post('/api/v1/grant-spin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSpinRequest);
      expect(secondResponse.status).toBe(409);
      // Check for error message in the response body
      expect(secondResponse.body.error).toBeTruthy();
      expect(secondResponse.body.error).toContain('Duplicate spin grant');
    });

    it('should successfully grant spins', async () => {
      const response = await request(app)
        .post('/api/v1/grant-spin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSpinRequest);
      expect(response.status).toBe(200);
      expect(response.body.data.spinCount).toBe(validSpinRequest.spinCount);
      const user = await User.findOne({ userId: validSpinRequest.userId });
      expect(user?.spins).toBe(validSpinRequest.spinCount);
    });

    it('should log transaction details', async () => {
      const response = await request(app)
        .post('/api/v1/grant-spin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSpinRequest);
      expect(response.status).toBe(200);
      const spinGrant = await SpinGrant.findOne({
        userId: validSpinRequest.userId,
        source: validSpinRequest.source
      });
      expect(spinGrant).toBeTruthy();
      expect(spinGrant?.spinCount).toBe(validSpinRequest.spinCount);
      expect(spinGrant?.ipAddress).toBeTruthy();
      expect(spinGrant?.createdAt).toBeTruthy();
    });

    // Test rate limiting separately
    describe('Rate Limiting', () => {
      // Restore rate limiter for this test
      beforeEach(() => {
        jest.unmock('express-rate-limit');
      });

      it('should enforce rate limiting', async () => {
        const requests = Array(6).fill(validSpinRequest);
        for (const req of requests) {
          await request(app)
            .post('/api/v1/grant-spin')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(req);
        }
        const response = await request(app)
          .post('/api/v1/grant-spin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validSpinRequest);
        expect(response.status).toBe(409);
      });
    });

    it('should allow different sources for same user on same day', async () => {
      const sources = [SpinSource.VAULT_REWARD, SpinSource.ADMIN_PANEL, SpinSource.DAILY_BONUS];
      for (const source of sources) {
        const response = await request(app)
          .post('/api/v1/grant-spin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...validSpinRequest,
            source
          });
        expect(response.status).toBe(200);
      }
    });
  });
}); 