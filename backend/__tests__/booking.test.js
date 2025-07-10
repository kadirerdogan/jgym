const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Facility = require('../models/Facility');

// Mock dependent models for validation
jest.mock('../models/User');
jest.mock('../models/Facility');

describe('Booking Model', () => {
  let sampleUserMember;
  let sampleUserTrainer;
  let sampleFacilityActive;

  beforeAll(() => {
    sampleUserMember = { _id: new mongoose.Types.ObjectId(), role: 'member', isActive: true };
    sampleUserTrainer = { _id: new mongoose.Types.ObjectId(), role: 'trainer', isActive: true };
    sampleFacilityActive = { _id: new mongoose.Types.ObjectId(), name: 'Tennis Court 1', isActive: true };

    User.findById = jest.fn(id => {
      if (id.equals(sampleUserMember._id)) return Promise.resolve(sampleUserMember);
      if (id.equals(sampleUserTrainer._id)) return Promise.resolve(sampleUserTrainer);
      return Promise.resolve(null);
    });
    Facility.findById = jest.fn(id => {
      if (id.equals(sampleFacilityActive._id)) return Promise.resolve(sampleFacilityActive);
      return Promise.resolve(null);
    });
  });

  beforeEach(() => {
    User.findById.mockClear();
    Facility.findById.mockClear();
    // Re-register mock implementations
    User.findById.mockImplementation(id => {
        if (id.equals(sampleUserMember._id)) return Promise.resolve(sampleUserMember);
        if (id.equals(sampleUserTrainer._id)) return Promise.resolve(sampleUserTrainer);
        return Promise.resolve(null);
    });
    Facility.findById.mockImplementation(id => {
        if (id.equals(sampleFacilityActive._id)) return Promise.resolve(sampleFacilityActive);
        return Promise.resolve(null);
    });
  });

  test('should be invalid if endTime is before or same as startTime', async () => {
    const booking = new Booking({
      user: sampleUserMember._id,
      facility: sampleFacilityActive._id,
      startTime: new Date('2024-03-15T10:00:00Z'),
      endTime: new Date('2024-03-15T09:00:00Z'), // End before start
    });
    let err;
    try {
      await booking.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.endTime.message).toBe('End time must be after start time.');
  });

  test('should be invalid if booking user is not an active member or trainer', async () => {
    const inactiveUser = { _id: new mongoose.Types.ObjectId(), role: 'member', isActive: false };
    User.findById.mockImplementationOnce(id => Promise.resolve(inactiveUser));

    const booking = new Booking({
      user: inactiveUser._id,
      facility: sampleFacilityActive._id,
      startTime: new Date('2024-03-15T10:00:00Z'),
      endTime: new Date('2024-03-15T11:00:00Z'),
    });
    let err;
    try {
      await booking.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.user.message).toBe("Booking user must be an active 'member' or 'trainer'.");
  });

  test('should be invalid if booking user is an admin (via this model validation)', async () => {
    const adminUser = { _id: new mongoose.Types.ObjectId(), role: 'admin', isActive: true };
    User.findById.mockImplementationOnce(id => Promise.resolve(adminUser));

    const booking = new Booking({
      user: adminUser._id,
      facility: sampleFacilityActive._id,
      startTime: new Date('2024-03-15T10:00:00Z'),
      endTime: new Date('2024-03-15T11:00:00Z'),
    });
    let err;
    try {
      await booking.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.user.message).toBe("Booking user must be an active 'member' or 'trainer'.");
  });


  test('should be invalid if facility is not active', async () => {
    const inactiveFacility = { _id: new mongoose.Types.ObjectId(), name: 'Pool', isActive: false };
    Facility.findById.mockImplementationOnce(id => Promise.resolve(inactiveFacility));

    const booking = new Booking({
      user: sampleUserMember._id,
      facility: inactiveFacility._id,
      startTime: new Date('2024-03-15T10:00:00Z'),
      endTime: new Date('2024-03-15T11:00:00Z'),
    });
    let err;
    try {
      await booking.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.facility.message).toBe('Booked facility must exist and be active.');
  });

  test('should be valid with correct data for a member', async () => {
    const booking = new Booking({
      user: sampleUserMember._id,
      facility: sampleFacilityActive._id,
      startTime: new Date('2024-03-15T14:00:00Z'),
      endTime: new Date('2024-03-15T15:00:00Z'),
      status: 'Confirmed',
    });
    await expect(booking.validate()).resolves.toBeUndefined();
  });

  test('should be valid with correct data for a trainer', async () => {
    const booking = new Booking({
      user: sampleUserTrainer._id,
      facility: sampleFacilityActive._id,
      startTime: new Date('2024-03-15T16:00:00Z'),
      endTime: new Date('2024-03-15T17:00:00Z'),
      status: 'Confirmed',
    });
    await expect(booking.validate()).resolves.toBeUndefined();
  });
});
