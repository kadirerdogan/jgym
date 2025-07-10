const express = require('express');
const router = express.Router();
const TrainerProfile = require('../models/TrainerProfile');
const User = require('../models/User'); // To ensure user is a trainer
const { protect, authorize } = require('../middleware/authMiddleware');

// Middleware to ensure the user is a trainer for all routes in this file
// For creating/updating their own profile.
router.use(protect);
router.use(authorize('trainer')); // Only trainers can access these routes

// @route   GET api/trainer-profiles/me
// @desc    Get current trainer's profile
// @access  Private (Trainer only)
router.get('/me', async (req, res) => {
  try {
    const profile = await TrainerProfile.findOne({ user: req.user.id }).populate('user', ['firstName', 'lastName', 'email', 'username']);
    if (!profile) {
      return res.status(404).json({ msg: 'Trainer profile not found for this user. Please create one.' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/trainer-profiles/me
// @desc    Create or update current trainer's profile
// @access  Private (Trainer only)
router.post('/me', async (req, res) => {
  const { specializations, bio, availability } = req.body;

  const profileFields = {};
  profileFields.user = req.user.id; // from protect middleware
  if (specializations) profileFields.specializations = Array.isArray(specializations) ? specializations : specializations.split(',').map(s => s.trim());
  if (bio) profileFields.bio = bio;
  if (availability) {
    // Basic validation for availability structure
    if (!Array.isArray(availability) || !availability.every(slot => slot.dayOfWeek && slot.startTime && slot.endTime)) {
        return res.status(400).json({ msg: 'Invalid availability format. Each slot must have dayOfWeek, startTime, and endTime.' });
    }
    profileFields.availability = availability;
  }

  try {
    // Check if user is indeed a trainer (redundant due to authorize middleware, but good practice)
    const userDoc = await User.findById(req.user.id);
    if (!userDoc || userDoc.role !== 'trainer') {
        return res.status(403).json({ msg: 'User is not authorized to create/update a trainer profile.' });
    }

    let profile = await TrainerProfile.findOne({ user: req.user.id });

    if (profile) {
      // Update existing profile
      profile = await TrainerProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, runValidators: true }
      ).populate('user', ['firstName', 'lastName', 'email', 'username']);
      return res.json(profile);
    }

    // Create new profile
    // The pre-save hook in TrainerProfile model will also validate user role.
    profile = new TrainerProfile(profileFields);
    await profile.save();
    // Populate user details before sending response
    profile = await profile.populate('user', ['firstName', 'lastName', 'email', 'username']);
    res.status(201).json(profile);

  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
