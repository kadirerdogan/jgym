const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  dayOfWeek: { // e.g., 'Monday', 'Tuesday'
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: { // e.g., '09:00'
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for start time']
  },
  endTime: { // e.g., '17:00'
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format for end time']
  }
}, {_id: false}); // _id: false for subdocuments if not needed independently

const TrainerProfileSchema = new mongoose.Schema({
  user: { // Link to the User model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Each user can only have one trainer profile
  },
  specializations: { // E.g., ['Yoga', 'Weightlifting', 'Cardio']
    type: [String],
    default: [],
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  availability: [TimeSlotSchema], // Array of available time slots
  // Could also include yearsOfExperience, certifications, etc.
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

TrainerProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

TrainerProfileSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Ensure that the user linked has the 'trainer' role
TrainerProfileSchema.pre('save', async function(next) {
  const User = mongoose.model('User');
  try {
    const userDoc = await User.findById(this.user);
    if (!userDoc || userDoc.role !== 'trainer') {
      return next(new Error('User associated with TrainerProfile must have the role "trainer".'));
    }
    next();
  } catch (error) {
    return next(error);
  }
});


module.exports = mongoose.model('TrainerProfile', TrainerProfileSchema);
