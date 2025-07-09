const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST api/plans
// @desc    Create a new membership plan
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { name, description, price, duration, features, isActive } = req.body;

  try {
    const newPlan = new Plan({
      name,
      description,
      price,
      duration,
      features,
      isActive,
      // createdBy: req.user.id // If you add createdBy field to schema
    });

    const plan = await newPlan.save();
    res.status(201).json(plan);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) { // Duplicate key error (e.g. unique plan name)
        return res.status(400).json({ msg: 'Plan name already exists.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/plans
// @desc    Get all membership plans (optionally filter active ones for non-admins)
// @access  Public (or Authenticated Users) - Let's make it public for now to view plans
router.get('/', async (req, res) => {
  try {
    // Non-admins see only active plans by default, admins can see all or filter
    // For simplicity here, we can just return all active plans to everyone.
    // Or, if req.user exists and is admin, show all.
    // Let's adjust based on if a user is logged in and their role for flexibility.

    let query = Plan.find();
    // If we want only active plans for non-authenticated or non-admin users:
    // if (!req.user || (req.user && req.user.role !== 'admin')) {
    //   query = query.where('isActive').equals(true);
    // }
    // For now, let's return all plans and frontend can filter if needed, or only active ones
    query = query.where('isActive').equals(true); // Default to active plans for general viewing

    const plans = await query.sort({ price: 1 }); // Sort by price, for example
    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/plans/all (Admin only - to get all plans including inactive)
// @desc    Get all membership plans (including inactive)
// @access  Private (Admin only)
router.get('/all', protect, authorize('admin'), async (req, res) => {
    try {
      const plans = await Plan.find().sort({ createdAt: -1 }); // Sort by creation date
      res.json(plans);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });


// @route   GET api/plans/:id
// @desc    Get a single membership plan by ID
// @access  Public (or Authenticated Users)
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ msg: 'Plan not found' });
    }
    // Optionally, add isActive check if non-admins shouldn't see inactive plans by direct ID access
    // if (!plan.isActive && (!req.user || (req.user && req.user.role !== 'admin'))) {
    //    return res.status(404).json({ msg: 'Plan not found or is inactive' });
    // }
    res.json(plan);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Plan not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/plans/:id
// @desc    Update a membership plan
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { name, description, price, duration, features, isActive } = req.body;

  // Build plan object
  const planFields = {};
  if (name) planFields.name = name;
  if (description) planFields.description = description;
  if (price !== undefined) planFields.price = price;
  if (duration) planFields.duration = duration;
  if (features) planFields.features = features;
  if (isActive !== undefined) planFields.isActive = isActive;
  // planFields.updatedAt = Date.now(); // Handled by pre-save or pre-findOneAndUpdate hook

  try {
    let plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ msg: 'Plan not found' });
    }

    plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { $set: planFields },
      { new: true, runValidators: true } // new:true returns the modified document
    );
    res.json(plan);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'Plan name already exists.' });
    }
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Plan not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/plans/:id
// @desc    Delete a membership plan (can be soft delete or hard delete)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ msg: 'Plan not found' });
    }

    // Option 1: Hard delete
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Plan permanently deleted' });

    // Option 2: Soft delete (set isActive to false)
    // plan.isActive = false;
    // await plan.save();
    // res.json({ msg: 'Plan deactivated (soft delete)' });

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Plan not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
