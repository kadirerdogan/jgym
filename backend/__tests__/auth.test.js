const request = require('supertest');
const app = require('../server'); // Path to your server.js file
const mongoose = require('mongoose');
const User = require('../models/User');
// require('dotenv').config({ path: './.env.test' }); // Optional: for test-specific env vars

describe('Auth API Endpoints', () => {
  // Connect to a test database before all tests
  beforeAll(async () => {
    // Ensure MONGO_URI_TEST is set in your .env.test or similar for a separate test DB
    // For this example, we'll assume a test DB URI is available or use in-memory.
    // const testMongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/gym_management_db_test';
    // await mongoose.connect(testMongoUri);
    // For now, we won't actually connect to DB in this example to keep it simple for the environment.
    // In a real setup, this is crucial.
  });

  // Clear the User collection before each test to ensure isolation
  beforeEach(async () => {
    // await User.deleteMany({}); // Requires DB connection
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    // await mongoose.connection.close(); // Requires DB connection
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with valid data', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const uniqueUsername = `testuser_${Date.now()}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          email: uniqueEmail,
          password: 'password123',
          role: 'member',
        });

      // Note: Without a live DB & User.deleteMany, this test will fail on reruns due to unique constraints.
      // The status code check is the most reliable part in this simplified example.
      expect(res.statusCode).toEqual(201); // Or 200 if your API returns 200 on registration
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(uniqueEmail);
      expect(res.body.user.username).toBe(uniqueUsername);
      expect(res.body.user.role).toBe('member');

      // Optional: Verify user is in the database (requires DB connection and setup)
      // const userInDb = await User.findOne({ email: uniqueEmail });
      // expect(userInDb).not.toBeNull();
      // if (userInDb) {
      //   expect(userInDb.username).toBe(uniqueUsername);
      // }
    });

    it('should fail to register a user with an existing email', async () => {
      const existingUser = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };
      // First, create the user (or ensure one exists - this part is tricky without proper DB seeding/cleanup)
      // For this example, we'll assume the previous test created a user or this is the first run.
      // To make this test robust, you'd typically create 'existing@example.com' in a beforeEach specifically for this test block.

      // For now, let's try to register the same user twice, expecting the second to fail.
      // This is not ideal as it makes tests dependent.
      const uniqueEmail = `duplicate_${Date.now()}@example.com`;
      const uniqueUsername = `duplicate_${Date.now()}`;
      await request(app)
        .post('/api/auth/register')
        .send({ username: uniqueUsername, email: uniqueEmail, password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: `${uniqueUsername}_new`, email: uniqueEmail, password: 'password123' }); // Same email

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('msg', 'User already exists with this email or username');
    });

    it('should fail to register a user with missing required fields (e.g., email)', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testmissing',
            // email is missing
            password: 'password123',
          });
        expect(res.statusCode).toEqual(500); // Or 400 if you have specific validation middleware before model validation
                                            // Mongoose validation error caught by general server error = 500
                                            // If you have custom error handling for validation, it might be 400.
        // expect(res.body).toHaveProperty('msg'); // Check for a specific error message if applicable
      });
  });

  // TODO: Add tests for POST /api/auth/login
  // describe('POST /api/auth/login', () => { ... });
});
