const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan'); // Needed for populating plan details
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes in this file will be admin-protected
router.use(protect);
router.use(authorize('admin'));

// @route   GET api/users
// @desc    Get all users (or filter by role, e.g., members)
// @access  Private (Admin only)
router.get('/', async (req, res) => {
  try {
    // Example: to get only members, trainers. Admins are usually not listed here.
    const users = await User.find({ role: { $in: ['member', 'trainer'] } })
                            .populate('membershipPlan', 'name price') // Populate plan name and price
                            .select('-password') // Exclude password
                            .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:id
// @desc    Get a single user by ID
// @access  Private (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
                           .populate('membershipPlan', 'name price duration')
                           .select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found (invalid ID)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user details (e.g., role, isActive, plan) by Admin
// @access  Private (Admin only)
router.put('/:id', async (req, res) => {
  const { firstName, lastName, email, username, role, isActive, membershipPlanId } = req.body;

  const userFields = {};
  if (firstName) userFields.firstName = firstName;
  if (lastName) userFields.lastName = lastName;
  if (email) userFields.email = email; // Consider implications of changing email if it's a login ID
  if (username) userFields.username = username; // Same for username
  if (role) userFields.role = role;
  if (isActive !== undefined) userFields.isActive = isActive;
  if (membershipPlanId === null || membershipPlanId) { // Check for explicit null to unset plan
    userFields.membershipPlan = membershipPlanId ? membershipPlanId : null;
  }
  // Password changes should ideally go through a separate, more secure endpoint/flow.

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent admin from accidentally making themselves non-admin or inactive through this generic route
    // This is a basic safeguard; more robust checks might be needed depending on app complexity.
    if (user.role === 'admin' && (userFields.role && userFields.role !== 'admin')) {
        return res.status(400).json({ msg: 'Admin role cannot be changed through this route.'});
    }
    if (user.role === 'admin' && userFields.isActive === false) {
        // Could check if it's the *only* admin, etc. For now, simple prevention.
        // if (req.user.id === user.id) return res.status(400).json({msg: "Admin cannot deactivate their own account."})
        return res.status(400).json({ msg: 'Admin account cannot be deactivated through this general route.'});
    }


    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true, runValidators: true }
    ).select('-password').populate('membershipPlan', 'name price');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) { // Handle unique constraint errors (e.g. email/username already taken)
        return res.status(400).json({ msg: 'Email or username already exists.' });
    }
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User or Plan not found (invalid ID)' });
    }
    res.status(500).send('Server Error');
  }
});

// Note: Deleting users is a sensitive operation.
// For now, we're focusing on activate/deactivate via `isActive` field.
// A DELETE endpoint would be similar to others if hard delete is required.
// router.delete('/:id', async (req, res) => { ... });

module.exports = router;
