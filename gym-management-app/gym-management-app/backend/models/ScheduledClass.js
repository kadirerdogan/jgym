const mongoose = require('mongoose');

const ScheduledClassSchema = new mongoose.Schema({
  classType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassType',
    required: [true, 'Please specify the type of class'],
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User with 'trainer' role
    required: [true, 'Please assign a trainer'],
  },
  facility: { // Optional: if class takes place in a specific facility
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    default: null,
  },
  startTime: {
    type: Date,
    required: [true, 'Please specify the start time'],
  },
  endTime: {
    type: Date,
    required: [true, 'Please specify the end time'],
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify the capacity'],
    min: [1, 'Capacity must be at least 1'],
  },
  attendees: [{ // Array of User ObjectIds who have booked this class
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['Scheduled', 'Cancelled', 'Completed', 'Full'],
    default: 'Scheduled',
  },
  // --- Recurrence (Simplified for now) ---
  // For a more robust system, consider libraries like 'rrule' or a dedicated microservice.
  // Simple example:
  isRecurring: {
    type: Boolean,
    default: false,
  },
  // If isRecurring is true, these fields might be used:
  // recurrenceFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: null },
  // recurrenceInterval: { type: Number, default: 1 }, // e.g., every 1 week, every 2 days
  // recurrenceDaysOfWeek: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}], // for weekly
  // recurrenceEndDate: { type: Date },
  // For this initial implementation, we will mostly handle single, non-recurring instances via API.
  // Actual expansion of recurring events into individual DB entries would be a separate complex logic.
  // A simpler approach for V1 might be to just clone a class multiple times if it's "recurring".

  notes: { // Optional notes for this specific class instance
    type: String,
    trim: true,
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

// Validate that endTime is after startTime
ScheduledClassSchema.path('endTime').validate(function (value) {
  return this.startTime < value;
}, 'End time must be after start time.');

// Validate that assigned trainer actually has the 'trainer' role
ScheduledClassSchema.path('trainer').validate(async function (value) {
  const User = mongoose.model('User');
  try {
    const userDoc = await User.findById(value);
    return userDoc && userDoc.role === 'trainer';
  } catch (error) {
    return false;
  }
}, "Assigned user must be a 'trainer'.");

// Optional: Validate facility exists and is active/available (could be more complex)
ScheduledClassSchema.path('facility').validate(async function (value) {
    if (!value) return true; // Facility is optional
    const Facility = mongoose.model('Facility');
    try {
        const facilityDoc = await Facility.findById(value);
        return facilityDoc && facilityDoc.isActive; // Basic check
    } catch (error) {
        return false;
    }
}, "Assigned facility must exist and be active.");


ScheduledClassSchema.pre('save', function(next) {
  // Update number of available spots based on capacity and attendees
  // This is more of a dynamic property, might be better handled at query time or via virtuals.
  // For now, we'll ensure attendees count doesn't exceed capacity.
  if (this.attendees.length > this.capacity) {
    return next(new Error('Number of attendees cannot exceed capacity.'));
  }
  if (this.attendees.length === this.capacity && this.status === 'Scheduled') {
    this.status = 'Full'; // Auto-update status if capacity is met
  } else if (this.attendees.length < this.capacity && this.status === 'Full') {
    this.status = 'Scheduled'; // Revert status if spots open up
  }

  this.updatedAt = Date.now();
  next();
});

ScheduledClassSchema.pre('findOneAndUpdate', function(next) {
  // Note: Accessing `this.getUpdate()` for `attendees` and `capacity` in pre-findOneAndUpdate
  // to check logic like in pre-save is more complex as hooks behave differently.
  // For now, just updating timestamp. Logic for 'Full' status might need to be in the route handler.
  this.set({ updatedAt: Date.now() });
  next();
});


module.exports = mongoose.model('ScheduledClass', ScheduledClassSchema);
