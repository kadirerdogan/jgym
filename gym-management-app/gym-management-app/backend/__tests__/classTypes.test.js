const request = require('supertest');
const app = require('../server'); // Path to your server.js
const mongoose = require('mongoose');
const ClassType = require('../models/ClassType');
const User = require('../models/User'); // For generating admin token
const jwt = require('jsonwebtoken');

describe('ClassTypes API Endpoints (Admin)', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    // In a real test suite, connect to a test DB & clear collections.
    // For this example, we'll mock some parts or assume a clean state.

    // Create an admin user and generate a token for protected routes
    // This part would ideally hit the DB or use a reliable mock.
    const adminId = new mongoose.Types.ObjectId();
    adminUser = { _id: adminId, role: 'admin', email: `admin_${Date.now()}@test.com`, username: `admin_${Date.now()}` };

    // Mock User.findById for the 'protect' middleware if not hitting DB
    jest.spyOn(User, 'findById').mockImplementation((id) => {
        if (id.toString() === adminId.toString()) {
            return Promise.resolve(adminUser);
        }
        return Promise.resolve(null);
    });

    adminToken = jwt.sign({ user: { id: adminId, role: 'admin' } }, process.env.JWT_SECRET || 'yourDefaultJwtSecret', { expiresIn: '1h' });
  });

  beforeEach(async () => {
    // Clear ClassType collection before each test if connected to a real test DB
    // await ClassType.deleteMany({});
  });

  afterAll(async () => {
    // await mongoose.connection.close();
    jest.restoreAllMocks(); // Restore original implementations
  });

  describe('POST /api/classtypes', () => {
    it('should create a new class type with valid data as admin', async () => {
      const classTypeName = `Yoga Basics ${Date.now()}`;
      const res = await request(app)
        .post('/api/classtypes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: classTypeName,
          description: 'Fundamental yoga poses and breathing techniques.',
          defaultDurationMinutes: 60,
          requiredEquipment: ['Yoga Mat'],
          isActive: true,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(classTypeName);
      expect(res.body.description).toBe('Fundamental yoga poses and breathing techniques.');
      expect(res.body.defaultDurationMinutes).toBe(60);
      expect(res.body.requiredEquipment).toEqual(['Yoga Mat']);
      expect(res.body.isActive).toBe(true);
    });

    it('should fail to create a class type if not admin', async () => {
      // Generate a non-admin token (e.g., member)
      const memberId = new mongoose.Types.ObjectId();
      const memberToken = jwt.sign({ user: { id: memberId, role: 'member' } }, process.env.JWT_SECRET || 'yourDefaultJwtSecret', { expiresIn: '1h' });

      // Mock User.findById for this specific non-admin user for 'protect' middleware
      User.findById.mockImplementationOnce((id) => {
        if (id.toString() === memberId.toString()) {
            return Promise.resolve({ _id: memberId, role: 'member' });
        }
        return Promise.resolve(null);
      });


      const res = await request(app)
        .post('/api/classtypes')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Pilates Advanced',
          description: 'Core strengthening exercises.',
          defaultDurationMinutes: 50,
        });
      expect(res.statusCode).toEqual(403); // Forbidden due to role
      expect(res.body.msg).toContain('not authorized');
    });

    it('should fail to create a class type with missing required fields (e.g., name)', async () => {
      const res = await request(app)
        .post('/api/classtypes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // name is missing
          description: 'A class without a name.',
          defaultDurationMinutes: 45,
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.msg).toContain('Please provide a class type name');
    });

    it('should fail to create a class type with a duplicate name', async () => {
        const uniqueName = `Spin Class ${Date.now()}`;
        // First, create it successfully
        await request(app)
          .post('/api/classtypes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: uniqueName, description: 'Indoor cycling.', defaultDurationMinutes: 45 });

        // Then, attempt to create it again
        const res = await request(app)
          .post('/api/classtypes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: uniqueName, description: 'Another indoor cycling.', defaultDurationMinutes: 50 });

        // This requires the DB to enforce uniqueness or a mock that simulates it.
        // For now, assuming the previous test might have created it, leading to a duplicate.
        // A robust test would mock ClassType.save() to throw a duplicate key error.
        // Or, ensure the DB is actually hit and cleaned.
        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toBe('Class type name already exists.');
      });
  });

  // TODO: Add tests for GET, PUT, DELETE /api/classtypes/:id
  // TODO: Add tests for GET /api/classtypes/active (public route)
});
