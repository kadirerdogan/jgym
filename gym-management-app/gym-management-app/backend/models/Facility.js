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
  // For more complex scheduling/booking:
  // operatingHours: [{ dayOfWeek: String, openTime: String, closeTime: String }],
  // bookings: [{ userId: mongoose.Schema.Types.ObjectId, startTime: Date, endTime: Date, status: String }]
  // For simplicity, we are not implementing full booking system in this step.

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
