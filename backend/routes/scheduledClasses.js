const express = require('express');
const router = express.Router();
const ScheduledClass = require('../models/ScheduledClass');
const ClassType = require('../models/ClassType');
const User = require('../models/User');
const Facility = require('../models/Facility');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST api/scheduledclasses
// @desc    Schedule a new class
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { classTypeId, trainerId, facilityId, startTime, endTime, capacity, notes, isRecurring } = req.body;

  try {
    // Validate classType, trainer, facility exist and are appropriate
    const classTypeExists = await ClassType.findById(classTypeId);
    if (!classTypeExists || !classTypeExists.isActive) {
      return res.status(400).json({ msg: 'Valid and active Class Type is required.' });
    }

    const trainerExists = await User.findById(trainerId);
    if (!trainerExists || trainerExists.role !== 'trainer' || !trainerExists.isActive) {
      return res.status(400).json({ msg: 'Valid and active Trainer is required.' });
    }

    if (facilityId) {
        const facilityExists = await Facility.findById(facilityId);
        if (!facilityExists || !facilityExists.isActive) {
            return res.status(400).json({ msg: 'If provided, facility must be valid and active.' });
        }
    }

    // Basic conflict check (can be more sophisticated)
    // Check if trainer is already scheduled for an overlapping class
    const trainerConflict = await ScheduledClass.findOne({
      trainer: trainerId,
      status: { $in: ['Scheduled', 'Full'] }, // Only consider active schedules
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }, // Overlaps
      ],
    });
    if (trainerConflict) {
      return res.status(400).json({ msg: `Trainer is already scheduled for another class at this time (Class ID: ${trainerConflict._id}).` });
    }

    // Check if facility (if provided) is already booked for an overlapping class
    if (facilityId) {
      const facilityConflict = await ScheduledClass.findOne({
        facility: facilityId,
        status: { $in: ['Scheduled', 'Full'] },
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        ],
      });
      if (facilityConflict) {
        return res.status(400).json({ msg: `Facility is already booked for another class at this time (Class ID: ${facilityConflict._id}).` });
      }
    }


    const newScheduledClass = new ScheduledClass({
      classType: classTypeId,
      trainer: trainerId,
      facility: facilityId || null,
      startTime,
      endTime,
      capacity,
      notes,
      isRecurring: isRecurring || false, // Handle recurrence later if true
    });

    const scheduledClass = await newScheduledClass.save();
    // Populate referenced fields for the response
    const populatedClass = await ScheduledClass.findById(scheduledClass._id)
        .populate('classType', 'name defaultDurationMinutes')
        .populate('trainer', 'firstName lastName username email')
        .populate('facility', 'name type');

    res.status(201).json(populatedClass);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ msg: messages.join(' ') });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/scheduledclasses
// @desc    Get all scheduled classes (e.g., for a public calendar or member view)
// @access  Public (or Authenticated Users) - Filters can be applied
router.get('/', async (req, res) => {
  try {
    const { date, trainerId, classTypeId, facilityId, upcomingLimit } = req.query;
    const query = { status: { $in: ['Scheduled', 'Full'] } }; // Default to active, non-cancelled classes

    if (date) { // Get classes for a specific date (startTime on that day)
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }
    if (upcomingLimit && !date) { // If no specific date, get upcoming N classes
        query.startTime = { $gte: new Date() }; // From now onwards
    }

    if (trainerId) query.trainer = trainerId;
    if (classTypeId) query.classType = classTypeId;
    if (facilityId) query.facility = facilityId;

    let scheduledClassesQuery = ScheduledClass.find(query)
      .populate('classType', 'name description defaultDurationMinutes')
      .populate('trainer', 'firstName lastName username') // Only public trainer info
      .populate('facility', 'name type')
      .sort({ startTime: 1 }); // Sort by start time

    if (upcomingLimit) {
        scheduledClassesQuery = scheduledClassesQuery.limit(parseInt(upcomingLimit, 10));
    }

    const scheduledClasses = await scheduledClassesQuery;
    res.json(scheduledClasses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/scheduledclasses/admin/all (Admin: get all, including past/cancelled)
// @desc    Get all scheduled classes for admin view
// @access  Private (Admin only)
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
    try {
      const scheduledClasses = await ScheduledClass.find()
        .populate('classType', 'name')
        .populate('trainer', 'username firstName lastName')
        .populate('facility', 'name')
        .sort({ startTime: -1 }); // Recently scheduled first, or by start time
      res.json(scheduledClasses);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });


// @route   GET api/scheduledclasses/:id
// @desc    Get a single scheduled class by ID
// @access  Public (or Authenticated Users)
router.get('/:id', async (req, res) => {
  try {
    const scheduledClass = await ScheduledClass.findById(req.params.id)
      .populate('classType')
      .populate('trainer', 'firstName lastName username email specializations bio') // More details for single view
      .populate('facility')
      .populate('attendees', 'username firstName lastName'); // Show attendees for this specific class view

    if (!scheduledClass) {
      return res.status(404).json({ msg: 'Scheduled class not found' });
    }
    // Optional: Add status check if non-admins shouldn't see cancelled/completed by direct ID
    // if (scheduledClass.status === 'Cancelled' && (!req.user || req.user.role !== 'admin')) { ... }
    res.json(scheduledClass);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Scheduled class not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/scheduledclasses/:id
// @desc    Update a scheduled class (details, status, etc.)
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { classTypeId, trainerId, facilityId, startTime, endTime, capacity, notes, status, isRecurring } = req.body;

  const classFields = {};
  if (classTypeId) classFields.classType = classTypeId;
  if (trainerId) classFields.trainer = trainerId;
  if (facilityId !== undefined) classFields.facility = facilityId === "" ? null : facilityId; // Allow unsetting facility
  if (startTime) classFields.startTime = startTime;
  if (endTime) classFields.endTime = endTime;
  if (capacity) classFields.capacity = capacity;
  if (notes !== undefined) classFields.notes = notes;
  if (status) classFields.status = status;
  if (isRecurring !== undefined) classFields.isRecurring = isRecurring;
  // Be careful with attendees update here, usually handled by booking/unbooking routes.

  try {
    let scheduledClass = await ScheduledClass.findById(req.params.id);
    if (!scheduledClass) {
      return res.status(404).json({ msg: 'Scheduled class not found' });
    }

    // Fields that, if changed, might require conflict checks
    const newStartTime = classFields.startTime ? new Date(classFields.startTime) : scheduledClass.startTime;
    const newEndTime = classFields.endTime ? new Date(classFields.endTime) : scheduledClass.endTime;
    const newTrainerId = classFields.trainer || scheduledClass.trainer.toString();
    const newFacilityId = classFields.facility !== undefined ? classFields.facility : (scheduledClass.facility ? scheduledClass.facility.toString() : null);

    // Perform conflict checks if relevant fields are changing
    if (
        (classFields.startTime || classFields.endTime || classFields.trainer) &&
        (newTrainerId.toString() !== scheduledClass.trainer._id.toString() || newStartTime.getTime() !== scheduledClass.startTime.getTime() || newEndTime.getTime() !== scheduledClass.endTime.getTime())
       ) {
        const trainerConflict = await ScheduledClass.findOne({
            _id: { $ne: scheduledClass._id }, // Exclude current class being updated
            trainer: newTrainerId,
            status: { $in: ['Scheduled', 'Full'] },
            $or: [{ startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } }],
        });
        if (trainerConflict) {
            return res.status(400).json({ msg: `Update conflict: Trainer is already scheduled for another class (ID: ${trainerConflict._id}) at this time.` });
        }
    }

    if (
        newFacilityId &&
        (classFields.startTime || classFields.endTime || classFields.facility !== undefined) &&
        (newFacilityId.toString() !== (scheduledClass.facility?._id.toString() || null) || newStartTime.getTime() !== scheduledClass.startTime.getTime() || newEndTime.getTime() !== scheduledClass.endTime.getTime())
       ) {
        const facilityConflict = await ScheduledClass.findOne({
            _id: { $ne: scheduledClass._id }, // Exclude current class
            facility: newFacilityId,
            status: { $in: ['Scheduled', 'Full'] },
            $or: [{ startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } }],
        });
        if (facilityConflict) {
            return res.status(400).json({ msg: `Update conflict: Facility is already booked for another class (ID: ${facilityConflict._id}) at this time.` });
        }
    }

    // Validate classType, trainer, facility exist and are appropriate if changed
    if (classFields.classType) {
        const classTypeExists = await ClassType.findById(classFields.classType);
        if (!classTypeExists || !classTypeExists.isActive) {
            return res.status(400).json({ msg: 'Valid and active Class Type is required.' });
        }
    }
    if (classFields.trainer) {
        const trainerExists = await User.findById(classFields.trainer);
        if (!trainerExists || trainerExists.role !== 'trainer' || !trainerExists.isActive) {
            return res.status(400).json({ msg: 'Valid and active Trainer is required.' });
        }
    }
    if (classFields.facility) { // if facilityId is being set (not null)
        const facilityExists = await Facility.findById(classFields.facility);
        if (!facilityExists || !facilityExists.isActive) {
            return res.status(400).json({ msg: 'If provided, facility must be valid and active.' });
        }
    }


    scheduledClass = await ScheduledClass.findByIdAndUpdate(
      req.params.id,
      { $set: classFields },
      { new: true, runValidators: true }
    )
    .populate('classType', 'name')
    .populate('trainer', 'username firstName lastName')
    .populate('facility', 'name');

    res.json(scheduledClass);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ msg: messages.join(' ') });
    }
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Resource not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/scheduledclasses/:id
// @desc    Delete (or cancel) a scheduled class
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const scheduledClass = await ScheduledClass.findById(req.params.id);
    if (!scheduledClass) {
      return res.status(404).json({ msg: 'Scheduled class not found' });
    }

    // Option 1: Hard delete
    // await ScheduledClass.findByIdAndDelete(req.params.id);
    // res.json({ msg: 'Scheduled class permanently deleted' });

    // Option 2: Soft delete (mark as 'Cancelled') - often preferred
    if (scheduledClass.status === 'Cancelled') {
        return res.status(400).json({ msg: 'Class is already cancelled.' });
    }
    if (scheduledClass.attendees && scheduledClass.attendees.length > 0) {
        // Notify attendees? Or prevent cancellation? For now, allow.
    }
    scheduledClass.status = 'Cancelled';
    await scheduledClass.save();
    // Populate for response
    const populatedClass = await ScheduledClass.findById(scheduledClass._id)
        .populate('classType', 'name')
        .populate('trainer', 'username firstName lastName')
        .populate('facility', 'name');
    res.json({ msg: 'Scheduled class cancelled', class: populatedClass });

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Scheduled class not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// --- Attendee Management (Booking/Unbooking) - To be implemented in a later step ---
// Example placeholder for booking a class by a member:
// router.post('/:id/book', protect, authorize('member'), async (req, res) => { ... });
// router.delete('/:id/unbook', protect, authorize('member'), async (req, res) => { ... });

module.exports = router;
