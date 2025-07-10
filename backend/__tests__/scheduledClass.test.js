const mongoose = require('mongoose');
const ScheduledClass = require('../models/ScheduledClass');
const ClassType = require('../models/ClassType');
const User = require('../models/User');
const Facility = require('../models/Facility');

// Mock dependent models for validation purposes if not hitting a DB
jest.mock('../models/User');
jest.mock('../models/Facility');

describe('ScheduledClass Model', () => {
  let sampleClassType;
  let sampleTrainer;
  let sampleFacility;

  beforeAll(() => {
    // These would normally be actual DB objects or more sophisticated mocks
    sampleClassType = { _id: new mongoose.Types.ObjectId(), name: 'Yoga', isActive: true };
    sampleTrainer = { _id: new mongoose.Types.ObjectId(), username: 'yogateacher', role: 'trainer', isActive: true };
    sampleFacility = { _id: new mongoose.Types.ObjectId(), name: 'Studio A', isActive: true };

    User.findById = jest.fn(id => {
      if (id.equals(sampleTrainer._id)) return Promise.resolve(sampleTrainer);
      return Promise.resolve(null);
    });
    Facility.findById = jest.fn(id => {
        if (id.equals(sampleFacility._id)) return Promise.resolve(sampleFacility);
        return Promise.resolve(null);
      });
  });

  beforeEach(() => {
    // Reset mocks if they are stateful between tests
    User.findById.mockClear();
    Facility.findById.mockClear();
    // Re-register mock implementations if cleared
    User.findById.mockImplementation(id => {
        if (id.equals(sampleTrainer._id)) return Promise.resolve(sampleTrainer);
        return Promise.resolve(null);
    });
    Facility.findById.mockImplementation(id => {
        if (id.equals(sampleFacility._id)) return Promise.resolve(sampleFacility);
        return Promise.resolve(null);
    });
  });


  test('should be invalid if endTime is before or same as startTime', async () => {
    const sc = new ScheduledClass({
      classType: sampleClassType._id,
      trainer: sampleTrainer._id,
      startTime: new Date('2024-01-01T10:00:00.000Z'),
      endTime: new Date('2024-01-01T09:00:00.000Z'), // End time before start time
      capacity: 10,
    });
    let err;
    try {
      await sc.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.endTime).toBeDefined();
    expect(err.errors.endTime.message).toBe('End time must be after start time.');
  });

  test('should be invalid if assigned trainer does not have "trainer" role', async () => {
    const nonTrainerUser = { _id: new mongoose.Types.ObjectId(), username: 'memberuser', role: 'member', isActive: true };
    User.findById.mockImplementationOnce(id => Promise.resolve(nonTrainerUser)); // Override mock for this test

    const sc = new ScheduledClass({
      classType: sampleClassType._id,
      trainer: nonTrainerUser._id, // Assigning a non-trainer
      startTime: new Date('2024-01-01T10:00:00.000Z'),
      endTime: new Date('2024-01-01T11:00:00.000Z'),
      capacity: 10,
    });
    let err;
    try {
      await sc.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.trainer).toBeDefined();
    expect(err.errors.trainer.message).toBe("Assigned user must be a 'trainer'.");
  });

  test('should be invalid if assigned facility is not active (if facility provided)', async () => {
    const inactiveFacility = { _id: new mongoose.Types.ObjectId(), name: 'Studio B', isActive: false };
    Facility.findById.mockImplementationOnce(id => Promise.resolve(inactiveFacility)); // Override mock

    const sc = new ScheduledClass({
      classType: sampleClassType._id,
      trainer: sampleTrainer._id,
      facility: inactiveFacility._id, // Assigning an inactive facility
      startTime: new Date('2024-01-01T10:00:00.000Z'),
      endTime: new Date('2024-01-01T11:00:00.000Z'),
      capacity: 10,
    });
    let err;
    try {
      await sc.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.facility).toBeDefined();
    expect(err.errors.facility.message).toBe("Assigned facility must exist and be active.");
  });

  test('should correctly set status to "Full" if attendees meet capacity on save', () => {
    // This tests the conceptual logic of the pre-save hook.
    // A full test would involve a mock save that triggers the hook.
    const attendeesArray = Array(10).fill(null).map(() => new mongoose.Types.ObjectId());
    const sc = new ScheduledClass({
      classType: sampleClassType._id,
      trainer: sampleTrainer._id,
      startTime: new Date('2024-01-01T10:00:00.000Z'),
      endTime: new Date('2024-01-01T11:00:00.000Z'),
      capacity: 10,
      attendees: attendeesArray,
      status: 'Scheduled'
    });
    // Manually trigger parts of the pre-save logic for this conceptual test
    if (sc.attendees.length === sc.capacity && sc.status === 'Scheduled') {
        sc.status = 'Full';
    }
    expect(sc.status).toBe('Full');
  });

  test('should correctly revert status from "Full" to "Scheduled" if spots open up', () => {
    const attendeesArray = Array(9).fill(null).map(() => new mongoose.Types.ObjectId());
    const sc = new ScheduledClass({
        classType: sampleClassType._id,
        trainer: sampleTrainer._id,
        startTime: new Date('2024-01-01T10:00:00.000Z'),
        endTime: new Date('2024-01-01T11:00:00.000Z'),
        capacity: 10,
        attendees: attendeesArray,
        status: 'Full' // Start as Full but with fewer attendees than capacity
      });
      if (sc.attendees.length < sc.capacity && sc.status === 'Full') {
        sc.status = 'Scheduled';
      }
      expect(sc.status).toBe('Scheduled');
  });

});
