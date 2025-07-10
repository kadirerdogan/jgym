const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // Do not return password by default
  },
  role: {
    type: String,
    enum: ['member', 'trainer', 'admin'],
    default: 'member',
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  firstName: { // Adding first name
    type: String,
    trim: true,
  },
  lastName: { // Adding last name
    type: String,
    trim: true,
  },
  membershipPlan: { // Reference to the user's current plan
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    default: null,
  },
  isActive: { // To allow admins to deactivate accounts
    type: Boolean,
    default: true,
  }
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Note: JWT generation will be handled in the controller/route logic, not directly in the model.
// However, you could add a method here to generate a JWT if preferred.
// UserSchema.methods.getSignedJwtToken = function() {
//   return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE,
//   });
// };

module.exports = mongoose.model('User', UserSchema);
