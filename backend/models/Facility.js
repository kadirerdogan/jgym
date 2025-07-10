const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a facility name'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
  },
  type: { // E.g., 'Equipment', 'Studio', 'Court', 'Pool'
    type: String,
    required: [true, 'Please specify the type of facility'],
    trim: true,
  },
  capacity: { // Maximum number of users, if applicable
    type: Number,
    min: [0, 'Capacity cannot be negative'],
    default: 1, // Default for single-user equipment, can be higher for studios/courts
  },
  status: { // E.g., 'Available', 'Under Maintenance', 'Booked' (could be more dynamic)
    type: String,
    enum: ['Available', 'Under Maintenance', 'Unavailable', 'Restricted'],
    default: 'Available',
  },
  operatingHours: [{ // E.g., [{ dayOfWeek: 'Monday', openTime: '08:00', closeTime: '22:00' }]
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    openTime: { // HH:MM format
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for open time']
    },
    closeTime: { // HH:MM format
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for close time']
    }
  }],
  bookingType: {
    type: String,
    enum: ['hourly', 'daily', 'slot_based'], // 'slot_based' means fixed duration slots
    default: 'hourly',
  },
  slotDurationMinutes: { // Relevant for 'hourly' (e.g., 60 for 1-hour slots) or 'slot_based'
    type: Number,
    min: [15, 'Slot duration must be at least 15 minutes'],
    default: 60,
  },
  maxBookingLengthSlots: { // Max number of consecutive slots a user can book
    type: Number,
    min: [1, 'Max booking length must be at least 1 slot'],
    default: 3, // e.g., max 3 hours if slot is 1 hour
  },
  bookingLeadTimeDays: { // How many days in advance bookings can be made
    type: Number,
    min: [0, 'Booking lead time cannot be negative'], // 0 means can book for today
    default: 7, // Default 7 days in advance
  },
  // cancellationPolicyHours: { // How many hours before booking it can be cancelled
  //   type: Number,
  //   min: [0, 'Cancellation policy hours cannot be negative'],
  //   default: 24,
  // },

  notes: { // Any additional notes for users or admins
    type: String,
    trim: true,
  },
  isActive: { // To allow deactivating facilities without deleting
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

FacilitySchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

FacilitySchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Facility', FacilitySchema);
