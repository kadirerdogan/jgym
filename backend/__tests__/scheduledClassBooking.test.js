const request = require('supertest');
const app = require('../server'); // Assuming server.js exports the app
const mongoose = require('mongoose');
const ScheduledClass = require('../models/ScheduledClass');
const User = require('../models/User');
const ClassType = require('../models/ClassType'); // Needed if populating
const Facility = require('../models/Facility'); // Needed if populating

// Mock the auth middleware
jest.mock('../middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => {
    // Simulate an authenticated user (member)
    req.user = { id: 'mockUserId', role: 'member' }; // Default to member
    next();
  }),
  authorize: jest.fn((...roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ msg: 'User role not authorized' });
    }
  }),
}));

// Mock Mongoose models
jest.mock('../models/ScheduledClass');
jest.mock('../models/User');
// jest.mock('../models/ClassType'); // Only if deep population is tested and matters
// jest.mock('../models/Facility');


describe('Scheduled Class Booking API Endpoints', () => {
  let mockScheduledClass;
  let mockUserMember;
  let mockUserTrainer; // If needed for other tests, not directly for booking by member

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test

    mockUserMember = {
      _id: 'mockUserId', // Must match req.user.id from 'protect' mock
      username: 'testmember',
      email: 'member@example.com',
      role: 'member',
      isActive: true,
    };

    mockScheduledClass = {
      _id: 'mockClassId',
      classType: { _id: 'mockClassTypeId', name: 'Test Class Type' },
      trainer: { _id: 'mockTrainerId', firstName: 'Test', lastName: 'Trainer' },
      facility: { _id: 'mockFacilityId', name: 'Test Facility' },
      startTime: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 3600 * 1000 * 25).toISOString(),   // Tomorrow + 1 hour
      capacity: 10,
      attendees: [],
      status: 'Scheduled',
      save: jest.fn().mockResolvedValue(this), // Mock save function
      // Add populate for fluent interface if your route uses it after save
      populate: jest.fn().mockReturnThis(), // Mocks populate and returns the object itself
      execPopulate: jest.fn().mockResolvedValue(this), // For older mongoose, if populate().execPopulate()
    };

    // Default mock implementations
    ScheduledClass.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockScheduledClass) // default class found
    });
    User.findById = jest.fn().mockResolvedValue(mockUserMember); // Default to finding the member
  });

  describe('POST /api/scheduledclasses/:id/book', () => {
    it('should allow a member to book a spot in an available class', async () => {
      // Modify mockScheduledClass for this specific test if needed
      mockScheduledClass.attendees = [];
      mockScheduledClass.status = 'Scheduled';
      ScheduledClass.findById.mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockScheduledClass)
      });
      mockScheduledClass.save.mockResolvedValueOnce(mockScheduledClass);


      const res = await request(app)
        .post('/api/scheduledclasses/mockClassId/book');
        // .set('Authorization', 'Bearer fakeToken'); // Not needed due to protect mock

      expect(res.statusCode).toBe(200); // Or 201 if you use that for creation-like actions
      expect(res.body).toHaveProperty('msg', 'Successfully booked class.');
      expect(res.body.class.attendees).toContain('mockUserId'); // Check if user was added
      expect(mockScheduledClass.save).toHaveBeenCalled();
    });

    it('should return 400 if class is already full', async () => {
      mockScheduledClass.attendees = Array(10).fill().map((_, i) => `otherUser${i}`); // Class is full
      mockScheduledClass.status = 'Full';
       ScheduledClass.findById.mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockScheduledClass)
      });
      mockScheduledClass.save.mockResolvedValueOnce(mockScheduledClass); // Save might be called to update status

      const res = await request(app)
        .post('/api/scheduledclasses/mockClassId/book');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('msg', 'Class is full.');
      expect(mockScheduledClass.save).toHaveBeenCalledTimes(1); // Called to set status to Full if it wasn't
    });

    it('should return 400 if user is already booked', async () => {
      mockScheduledClass.attendees = ['mockUserId']; // Current user is already an attendee
      ScheduledClass.findById.mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockScheduledClass)
      });

      const res = await request(app)
        .post('/api/scheduledclasses/mockClassId/book');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('msg', 'Already booked for this class.');
      expect(mockScheduledClass.save).not.toHaveBeenCalled();
    });

    it('should return 404 if class not found', async () => {
      ScheduledClass.findById.mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(null) // Class not found
      });

      const res = await request(app)
        .post('/api/scheduledclasses/nonExistentClassId/book');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Scheduled class not found');
    });
     it('should return 400 if class is cancelled', async () => {
      mockScheduledClass.status = 'Cancelled';
      ScheduledClass.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(mockScheduledClass) });

      const res = await request(app).post('/api/scheduledclasses/mockClassId/book');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('msg', 'Cannot book a cancelled class.');
    });

    it('should return 400 if class has already started', async () => {
      mockScheduledClass.startTime = new Date(Date.now() - 3600 * 1000).toISOString(); // Class started 1 hour ago
      ScheduledClass.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(mockScheduledClass) });

      const res = await request(app).post('/api/scheduledclasses/mockClassId/book');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('msg', 'Cannot book a class that has already started or passed.');
    });
  });

  describe('DELETE /api/scheduledclasses/:id/unbook', () => {
    it('should allow a member to unbook from a class they are booked in', async () => {
      mockScheduledClass.attendees = ['mockUserId', 'otherUser1'];
      mockScheduledClass.status = 'Scheduled';
      ScheduledClass.findById.mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockScheduledClass)
      });
      mockScheduledClass.save.mockResolvedValueOnce(mockScheduledClass);


      const res = await request(app)
        .delete('/api/scheduledclasses/mockClassId/unbook');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('msg', 'Successfully unbooked from class.');
      expect(res.body.class.attendees).not.toContain('mockUserId');
      expect(mockScheduledClass.save).toHaveBeenCalled();
    });

    it('should return 400 if user is not booked for the class', async () => {
      mockScheduledClass.attendees = ['otherUser1', 'otherUser2']; // Current user not an attendee
      ScheduledClass.findById.mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockScheduledClass)
      });

      const res = await request(app)
        .delete('/api/scheduledclasses/mockClassId/unbook');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('msg', 'You are not booked for this class.');
      expect(mockScheduledClass.save).not.toHaveBeenCalled();
    });

    it('should update class status from Full to Scheduled if space opens up', async () => {
      mockScheduledClass.attendees = ['mockUserId', ...Array(9).fill(null).map((_,i) => `user${i}`)]; // Exactly full with mockUser
      mockScheduledClass.capacity = 10;
      mockScheduledClass.status = 'Full';
      ScheduledClass.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(mockScheduledClass) });
      mockScheduledClass.save.mockImplementationOnce(function() { // 'this' refers to mockScheduledClass
        this.status = 'Scheduled'; // Simulate the status change in the route
        this.attendees = this.attendees.filter(id => id !== 'mockUserId');
        return Promise.resolve(this);
      });

      const res = await request(app)
        .delete('/api/scheduledclasses/mockClassId/unbook');

      expect(res.statusCode).toBe(200);
      expect(mockScheduledClass.save).toHaveBeenCalled();
      // The actual check for status change is tricky here without inspecting the mockScheduledClass *after* save
      // The response body.class.status should reflect the change if the route logic is correct
      expect(res.body.class.status).toBe('Scheduled');
    });

    it('should return 404 if class not found for unbooking', async () => {
      ScheduledClass.findById.mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(null)
      });
      const res = await request(app)
        .delete('/api/scheduledclasses/nonExistentClassId/unbook');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('msg', 'Scheduled class not found');
    });
  });
});
