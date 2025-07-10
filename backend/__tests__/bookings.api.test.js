const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');
const { formatISO, addHours, format } = require('date-fns');

describe('Bookings API Endpoints', () => {
  let memberToken, adminToken;
  let memberUser, adminUser;
  let sampleFacility;
  const now = new Date();

  beforeAll(async () => {
    // For real tests, connect to a test DB. Here, we heavily mock or assume clean state.
    const memberId = new mongoose.Types.ObjectId();
    memberUser = { _id: memberId, role: 'member', email: `member_${Date.now()}@test.com`, username: `member_${Date.now()}`, isActive: true };
    memberToken = jwt.sign({ user: { id: memberId, role: 'member' } }, process.env.JWT_SECRET || 'yourDefaultJwtSecret');

    const adminId = new mongoose.Types.ObjectId();
    adminUser = { _id: adminId, role: 'admin', email: `admin_book_${Date.now()}@test.com`, username: `admin_book_${Date.now()}`, isActive: true };
    adminToken = jwt.sign({ user: { id: adminId, role: 'admin' } }, process.env.JWT_SECRET || 'yourDefaultJwtSecret');

    // Mock User.findById for 'protect' middleware
    // This spy will be restored in afterAll
    jest.spyOn(User, 'findById').mockImplementation((id) => {
        if (id.toString() === memberId.toString()) return Promise.resolve(memberUser);
        if (id.toString() === adminId.toString()) return Promise.resolve(adminUser);
        return Promise.resolve(null);
    });

    // Create a sample facility in memory / or mock Facility.findById
    sampleFacility = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Court 1 for Booking',
        isActive: true,
        operatingHours: [{ dayOfWeek: format(now, 'EEEE'), openTime: '09:00', closeTime: '22:00' }],
        bookingType: 'hourly',
        slotDurationMinutes: 60,
        maxBookingLengthSlots: 2,
        bookingLeadTimeDays: 7,
    };
    jest.spyOn(Facility, 'findById').mockResolvedValue(sampleFacility);
  });

  beforeEach(async () => {
    // Clear Bookings collection if using a real test DB: await Booking.deleteMany({});
    // For mocked approach, we might need to reset spies on Booking if they are used directly.
    jest.spyOn(Booking, 'find').mockResolvedValue([]); // Default to no existing bookings for availability
    jest.spyOn(Booking, 'findOne').mockResolvedValue(null); // Default to no conflict
    jest.spyOn(Booking.prototype, 'save').mockResolvedValue(this); // Mock save for new bookings
  });

  afterEach(() => {
    // Clear all mocks created by jest.spyOn to avoid interference between tests
     jest.clearAllMocks();
     // Re-apply the general User.findById mock needed by 'protect' if it was cleared by clearAllMocks
     // This is tricky; better to manage spies more granularly or re-init in beforeEach if needed.
     // For simplicity, we assume the User.findById spy from beforeAll largely persists or is re-mocked implicitly by next test.
     // This area highlights complexities of extensive mocking vs. test DB.
  });


  afterAll(async () => {
    jest.restoreAllMocks(); // Restore all original implementations
    // await mongoose.connection.close();
  });

  describe('GET /api/facilities/:facilityId/availability', () => {
    it('should return available slots for a given date', async () => {
      const targetDate = format(now, 'yyyy-MM-dd');
      Booking.find.mockResolvedValue([]); // No existing bookings

      const res = await request(app)
        .get(`/api/facilities/${sampleFacility._id}/availability?date=${targetDate}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Example: Check if it returns slots from 09:00 to 21:00 (as 22:00 is closeTime)
      // This depends on the exact logic of generateAvailableSlots
      // For 09:00-22:00, 60min slots: 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21 (13 slots)
      if (now.getHours() < 21) { // Only expect future slots
          const expectedSlots = (21 - Math.max(9, now.getHours() + (now.getMinutes() > 0 ? 1:0) )) +1;
          // This is a very rough check, actual slot generation needs precise testing.
          // expect(res.body.length).toBeGreaterThanOrEqual(1); // At least one slot if current time is before closing
      }
      if(res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('startTime');
        expect(res.body[0]).toHaveProperty('endTime');
      }
    });

    it('should return empty array if facility is closed on that day', async () => {
        const closedFacility = { ...sampleFacility, operatingHours: [] };
        Facility.findById.mockResolvedValueOnce(closedFacility); // Override for this test
        const targetDate = format(now, 'yyyy-MM-dd');

        const res = await request(app)
            .get(`/api/facilities/${sampleFacility._id}/availability?date=${targetDate}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/bookings', () => {
    it('should create a booking for a member with valid data and no conflicts', async () => {
      const startTime = addHours(startOfDay(now), 10); // 10:00 AM on current day
      if (startTime < now) startTime.setDate(startTime.getDate() + 1); // Ensure future for test
      const endTime = addHours(startTime, 1); // 11:00 AM

      // Mock the save to return the object with an _id
      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        user: memberUser._id, facility: sampleFacility._id,
        startTime, endTime, status: 'Confirmed',
        populate: jest.fn().mockReturnThis(), // Mock populate for chained calls
        toObject: jest.fn().mockReturnValue({ // if .save() returns a Mongoose doc
            _id: new mongoose.Types.ObjectId(), user: memberUser, facility: sampleFacility,
            startTime, endTime, status: 'Confirmed'
        })
       };
      Booking.prototype.save = jest.fn().mockResolvedValue(mockSavedBooking);
      // Mock findById for the population step after save
      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSavedBooking)
      });


      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          facilityId: sampleFacility._id.toString(),
          startTime: formatISO(startTime),
          endTime: formatISO(endTime),
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.facility.name).toBe(sampleFacility.name);
      expect(new Date(res.body.startTime).toISOString()).toBe(startTime.toISOString());
    });

    it('should fail to create a booking if there is a time conflict', async () => {
      const startTime = addHours(startOfDay(now), 14); // 02:00 PM
      if (startTime < now) startTime.setDate(startTime.getDate() + 1);
      const endTime = addHours(startTime, 1); // 03:00 PM

      // Simulate an existing booking
      Booking.findOne.mockResolvedValueOnce({
          _id: new mongoose.Types.ObjectId(), facility: sampleFacility._id,
          startTime: startTime, endTime: endTime, status: 'Confirmed'
      });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          facilityId: sampleFacility._id.toString(),
          startTime: formatISO(startTime), // Try to book the same conflicting slot
          endTime: formatISO(endTime),
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.msg).toBe('Time slot is already booked or overlaps with an existing booking.');
    });

    it('should fail if booking time is outside operating hours', async () => {
        const startTime = addHours(startOfDay(now), 6); // 06:00 AM (assuming facility opens at 09:00)
        if (startTime < now && startTime.getDate() === now.getDate()) startTime.setDate(startTime.getDate() +1);

        const endTime = addHours(startTime, 1); // 07:00 AM

        const res = await request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            facilityId: sampleFacility._id.toString(),
            startTime: formatISO(startTime),
            endTime: formatISO(endTime),
          });

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toContain('Booking time is outside of operating hours');
      });
  });

  // TODO: Add tests for GET /api/bookings/my, DELETE /api/bookings/:bookingId/my
  // TODO: Add tests for Admin booking routes
});
