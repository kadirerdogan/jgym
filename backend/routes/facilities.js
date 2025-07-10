const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST api/facilities
// @desc    Create a new facility
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { name, description, type, capacity, status, notes, isActive } = req.body;
  try {
    const newFacility = new Facility({
      name,
      description,
      type,
      capacity,
      status,
      notes,
      isActive,
    });
    const facility = await newFacility.save();
    res.status(201).json(facility);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'Facility name already exists.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/facilities
// @desc    Get all active facilities
// @access  Public (or Authenticated Users)
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true }).sort({ name: 1 });
    res.json(facilities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/facilities/all (Admin only - to get all facilities including inactive)
// @desc    Get all facilities
// @access  Private (Admin only)
router.get('/all', protect, authorize('admin'), async (req, res) => {
    try {
      const facilities = await Facility.find().sort({ createdAt: -1 });
      res.json(facilities);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// @route   GET api/facilities/:id
// @desc    Get a single facility by ID
// @access  Public (or Authenticated Users)
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ msg: 'Facility not found' });
    }
    // Optional: Check if facility is active if user is not admin
    // if (!facility.isActive && (!req.user || req.user.role !== 'admin')) {
    //   return res.status(404).json({ msg: 'Facility not found or is inactive' });
    // }
    res.json(facility);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Facility not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/facilities/:id
// @desc    Update a facility
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const {
    name, description, type, capacity, status, notes, isActive,
    operatingHours, bookingType, slotDurationMinutes, maxBookingLengthSlots, bookingLeadTimeDays
  } = req.body;

  const facilityFields = {};
  if (name) facilityFields.name = name;
  if (description) facilityFields.description = description;
  if (type) facilityFields.type = type;
  if (capacity !== undefined) facilityFields.capacity = capacity;
  if (status) facilityFields.status = status;
  if (notes !== undefined) facilityFields.notes = notes; // Allow empty string for notes
  if (isActive !== undefined) facilityFields.isActive = isActive;

  // New booking configuration fields
  if (operatingHours) facilityFields.operatingHours = operatingHours; // TODO: Add validation for operatingHours array structure
  if (bookingType) facilityFields.bookingType = bookingType;
  if (slotDurationMinutes) facilityFields.slotDurationMinutes = slotDurationMinutes;
  if (maxBookingLengthSlots) facilityFields.maxBookingLengthSlots = maxBookingLengthSlots;
  if (bookingLeadTimeDays !== undefined) facilityFields.bookingLeadTimeDays = bookingLeadTimeDays;


  try {
    // Validate operatingHours structure if provided
    if (operatingHours) {
      if (!Array.isArray(operatingHours) || !operatingHours.every(oh =>
        oh.dayOfWeek && typeof oh.openTime === 'string' && typeof oh.closeTime === 'string' &&
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(oh.openTime) &&
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(oh.closeTime) &&
        oh.openTime < oh.closeTime
      )) {
        return res.status(400).json({ msg: 'Invalid operatingHours format or content. Each entry must have dayOfWeek, valid openTime (HH:MM), and closeTime (HH:MM) with openTime < closeTime.' });
      }
    }

    let facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ msg: 'Facility not found' });
    }
    facility = await Facility.findByIdAndUpdate(
      req.params.id,
      { $set: facilityFields },
      { new: true, runValidators: true }
    );
    res.json(facility);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'Facility name already exists.' });
    }
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Facility not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/facilities/:id
// @desc    Delete a facility
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ msg: 'Facility not found' });
    }
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Facility permanently deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Facility not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
