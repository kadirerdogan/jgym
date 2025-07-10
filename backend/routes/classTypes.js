const express = require('express');
const router = express.Router();
const ClassType = require('../models/ClassType');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes, only admins can manage class types
router.use(protect);
router.use(authorize('admin'));

// @route   POST api/classtypes
// @desc    Create a new class type
// @access  Private (Admin only)
router.post('/', async (req, res) => {
  const { name, description, defaultDurationMinutes, requiredEquipment, isActive } = req.body;
  try {
    const newClassType = new ClassType({
      name,
      description,
      defaultDurationMinutes,
      requiredEquipment,
      isActive,
    });
    const classType = await newClassType.save();
    res.status(201).json(classType);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Class type name already exists.' });
    }
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ msg: messages.join(' ') });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classtypes
// @desc    Get all class types (admins can see all, including inactive)
// @access  Private (Admin only - for management. Public might need different route or filter)
router.get('/', async (req, res) => {
  try {
    const classTypes = await ClassType.find().sort({ name: 1 });
    res.json(classTypes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classtypes/active (Public route to get active class types)
// @desc    Get all active class types
// @access  Public (or Authenticated users)
// This route is added here for convenience, it does not use admin protection.
router.get('/active', /* No admin protection */ async (req, res) => {
    try {
      const classTypes = await ClassType.find({ isActive: true }).sort({ name: 1 });
      res.json(classTypes);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });


// @route   GET api/classtypes/:id
// @desc    Get a single class type by ID
// @access  Private (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const classType = await ClassType.findById(req.params.id);
    if (!classType) {
      return res.status(404).json({ msg: 'Class type not found' });
    }
    res.json(classType);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class type not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/classtypes/:id
// @desc    Update a class type
// @access  Private (Admin only)
router.put('/:id', async (req, res) => {
  const { name, description, defaultDurationMinutes, requiredEquipment, isActive } = req.body;
  const classTypeFields = {};
  if (name) classTypeFields.name = name;
  if (description) classTypeFields.description = description;
  if (defaultDurationMinutes) classTypeFields.defaultDurationMinutes = defaultDurationMinutes;
  if (requiredEquipment) classTypeFields.requiredEquipment = requiredEquipment;
  if (isActive !== undefined) classTypeFields.isActive = isActive;

  try {
    let classType = await ClassType.findById(req.params.id);
    if (!classType) {
      return res.status(404).json({ msg: 'Class type not found' });
    }
    classType = await ClassType.findByIdAndUpdate(
      req.params.id,
      { $set: classTypeFields },
      { new: true, runValidators: true }
    );
    res.json(classType);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Class type name already exists.' });
    }
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ msg: messages.join(' ') });
    }
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class type not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/classtypes/:id
// @desc    Delete a class type
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const classType = await ClassType.findById(req.params.id);
    if (!classType) {
      return res.status(404).json({ msg: 'Class type not found' });
    }
    // TODO: Add check if any ScheduledClass uses this ClassType before deleting.
    // If so, prevent deletion or provide a warning/option to reassign.
    // For now, direct delete.
    await ClassType.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Class type permanently deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class type not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
