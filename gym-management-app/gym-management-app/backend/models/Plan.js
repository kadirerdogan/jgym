const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a plan name'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a plan description'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative'],
  },
  duration: { // Duration in days, e.g., 30 for monthly, 90 for quarterly, 365 for yearly
    type: Number,
    required: [true, 'Please provide the duration in days'],
    min: [1, 'Duration must be at least 1 day'],
  },
  features: { // Array of strings describing plan features
    type: [String],
    default: [],
  },
  isActive: { // To allow deactivating plans without deleting them
    type: Boolean,
    default: true,
  },
  // createdBy: { // Optional: track who created/updated the plan
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   // required: true // if you make it mandatory
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Middleware to update `updatedAt` field before each save
PlanSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// If using findOneAndUpdate, Mongoose by default does not run `save` middleware.
// If you need `updatedAt` to be updated with findOneAndUpdate, you might need to explicitly set it
// or use a pre('findOneAndUpdate') hook.
PlanSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});


module.exports = mongoose.model('Plan', PlanSchema);
