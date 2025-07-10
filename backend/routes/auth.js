const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is here

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if user already exists (by username or email)
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists with this email or username' });
    }

    // Create a new user instance (password will be hashed by pre-save hook in User model)
    user = new User({
      username,
      email,
      password,
      role, // Optional: if not provided, defaults to 'member' as per schema
    });

    await user.save();

    // Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'yourDefaultJwtSecret', // Use environment variable for secret
      { expiresIn: process.env.JWT_EXPIRE || 360000 }, // Use environment variable for expiry
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during registration');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token (Login)
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH_LOGIN] Attempting login for email: ${email}`);
  console.log(`[AUTH_LOGIN] MONGO_URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.substring(0,30) + '...' : 'Not Set'}`); // Log part of URI or if not set

  try {
    console.log(`[AUTH_LOGIN] Searching for user with email: ${email}`);
    // Check if user exists
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password

    if (!user) {
      console.warn(`[AUTH_LOGIN] User not found in DB for email: ${email}`);
      return res.status(400).json({ msg: 'Invalid credentials (user not found)' });
    }
    console.log(`[AUTH_LOGIN] User found for email: ${email}, User ID: ${user._id}. Proceeding to password check.`);

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials (password mismatch)' });
    }

    // User matched, create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'yourDefaultJwtSecret',
      { expiresIn: process.env.JWT_EXPIRE || 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during login');
  }
});

// @route   GET api/auth/admin-test
// @desc    Test route for admin role
// @access  Private (Admin only)
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/admin-test', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin! You have accessed a protected admin route.', user: req.user });
});

// @route   GET api/auth/me
// @desc    Get current logged-in user details (excluding password)
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is already populated by the 'protect' middleware and password is excluded
    if (!req.user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/auth/updatedetails
// @desc    Update current logged-in user's details (e.g., firstName, lastName)
// @access  Private
router.put('/updatedetails', protect, async (req, res) => {
  const { firstName, lastName /*, potentially other fields like phone, address */ } = req.body;

  // Fields that user can update on their own
  const userUpdatableFields = {};
  if (firstName !== undefined) userUpdatableFields.firstName = firstName;
  if (lastName !== undefined) userUpdatableFields.lastName = lastName;

  // Prevent updating sensitive fields like role, isActive, email, username, password via this route.
  // Email/username/password changes should have dedicated, more secure flows.

  try {
    // req.user.id comes from the 'protect' middleware
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userUpdatableFields },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from the returned user object

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
