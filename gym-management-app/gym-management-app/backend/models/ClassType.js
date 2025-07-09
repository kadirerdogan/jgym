const mongoose = require('mongoose');

const ClassTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a class type name'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for the class type'],
    trim: true,
  },
  defaultDurationMinutes: {
    type: Number,
    required: [true, 'Please provide a default duration in minutes'],
    min: [15, 'Duration must be at least 15 minutes'], // Example minimum
  },
  requiredEquipment: { // Optional: e.g., ['Yoga Mat', 'Spin Bike']
    type: [String],
    default: [],
  },
  // category: { // Optional: e.g., 'Cardio', 'Strength', 'Flexibility'
  //   type: String,
  //   trim: true,
  // },
  isActive: { // To allow deactivating class types without deleting
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

ClassTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

ClassTypeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('ClassType', ClassTypeSchema);
