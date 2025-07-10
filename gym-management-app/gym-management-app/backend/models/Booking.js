const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User making the booking is required.'],
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: [true, 'Facility being booked is required.'],
  },
  startTime: {
    type: Date,
    required: [true, 'Booking start time is required.'],
  },
  endTime: {
    type: Date,
    required: [true, 'Booking end time is required.'],
  },
  status: {
    type: String,
    enum: ['Confirmed', 'CancelledByMember', 'CancelledByAdmin', 'Completed', 'NoShow'],
    default: 'Confirmed',
  },
  notes: { // Optional notes by the member during booking
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters.']
  },
  // bookingTypeUsed: { // Snapshot of facility.bookingType at time of booking (can be derived or stored)
  //   type: String,
  //   required: true,
  // },
  // bookedSlots: { // If bookingType is slot_based, could store number of slots or derived
  //   type: Number,
  // }
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Validate that endTime is after startTime
BookingSchema.path('endTime').validate(function (value) {
  return this.startTime < value;
}, 'End time must be after start time.');

// Validate that a booking duration is reasonable (e.g., not excessively long if not daily)
// This can be more complex and tied to facility.bookingType and facility.slotDurationMinutes
BookingSchema.path('endTime').validate(function(value) {
    const durationHours = (value.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
    // Example: Max 8 hours for non-daily bookings (can be made more dynamic)
    // This validation would ideally happen in the route, using facility settings.
    // For now, a simple model-level check.
    // if (this.bookingTypeUsed !== 'daily' && durationHours > 8) { // Assuming bookingTypeUsed is set
    //     return false;
    // }
    return true;
}, 'Booking duration is too long for this booking type.');


// Ensure the user making the booking is a 'member' or 'trainer' (admins usually don't book for themselves this way)
BookingSchema.path('user').validate(async function (value) {
  const User = mongoose.model('User');
  try {
    const userDoc = await User.findById(value);
    return userDoc && (userDoc.role === 'member' || userDoc.role === 'trainer') && userDoc.isActive;
  } catch (error) {
    return false;
  }
}, "Booking user must be an active 'member' or 'trainer'.");

// Ensure the facility exists and is active at the time of validation
BookingSchema.path('facility').validate(async function (value) {
    const Facility = mongoose.model('Facility');
    try {
        const facilityDoc = await Facility.findById(value);
        return facilityDoc && facilityDoc.isActive; // Basic check
    } catch (error) {
        return false;
    }
  }, "Booked facility must exist and be active.");


BookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

BookingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Index for common queries
BookingSchema.index({ facility: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ user: 1, startTime: 1 });


module.exports = mongoose.model('Booking', BookingSchema);
