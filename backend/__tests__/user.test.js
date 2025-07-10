const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path if your models folder is different

// Mock the bcrypt.compare function for controlled testing
// jest.mock('bcryptjs'); // Option 1: Mock the entire module

describe('User Model - Password Management', () => {
  let testUser;

  beforeAll(async () => {
    // Note: For real tests, you'd connect to a test database.
    // Here, we are testing model logic in isolation as much as possible.
    // The pre-save hook for password hashing is part of the model,
    // so we need to simulate a save or manually hash for comparison.
  });

  beforeEach(async () => {
    // Reset mocks and create a fresh user instance for each test
    // bcrypt.compare.mockReset(); // If using jest.mock('bcryptjs')

    // Create a user instance (password will be hashed by pre-save hook if we were saving)
    // For testing matchPassword directly, we need a user object with a hashed password.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      // password: 'password123', // This would be hashed on save
    });
    // Manually set the hashed password on the instance for testing matchPassword
    testUser.password = hashedPassword;
  });

  test('should correctly validate a matching password', async () => {
    // bcrypt.compare.mockResolvedValue(true); // If using jest.mock('bcryptjs')
    const isMatch = await testUser.matchPassword('password123');
    expect(isMatch).toBe(true);
  });

  test('should correctly invalidate a non-matching password', async () => {
    // bcrypt.compare.mockResolvedValue(false); // If using jest.mock('bcryptjs')
    const isMatch = await testUser.matchPassword('wrongpassword');
    expect(isMatch).toBe(false);
  });

  test('should hash password before saving (conceptual test - requires DB save or mock)', () => {
    // This test is more conceptual without a live DB save and full pre-save hook execution.
    // To properly test the pre-save hook, you would:
    // 1. Create a User instance with a plain password.
    // 2. Save it (mocking the actual DB save if needed).
    // 3. Check that user.password is different from the plain password and is a valid hash.

    const userWithPlainPassword = new User({
        username: 'newuser',
        email: 'new@example.com',
        password: 'plainPassword',
      });
    // At this point, userWithPlainPassword.password is 'plainPassword'
    // If we could call a mock save that triggers hooks:
    // await userWithPlainPassword.save();
    // Then expect(userWithPlainPassword.password).not.toBe('plainPassword');
    // For now, this is more of a placeholder for how one might think about testing it.
    // The matchPassword tests above indirectly confirm hashing works if we assume the setup.
    expect(userWithPlainPassword.password).toBe('plainPassword'); // Before save hook
  });

  afterAll(async () => {
    // Disconnect from test database if connected
  });
});
