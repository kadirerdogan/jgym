const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const { startOfDay, endOfDay, addMinutes, format, parse, differenceInMinutes, isWithinInterval } = require('date-fns'); // Using date-fns

// HELPER FUNCTION to generate slots (simplified)
// This is a complex part and would need significant refinement for production
async function generateAvailableSlots(facility, targetDateStr) {
    if (!facility || !facility.operatingHours || facility.operatingHours.length === 0) {
        return []; // No operating hours defined
    }

    const targetDate = parse(targetDateStr, 'yyyy-MM-dd', new Date());
    const dayOfWeek = format(targetDate, 'EEEE'); // E.g., 'Monday'

    const dailyOps = facility.operatingHours.find(oh => oh.dayOfWeek === dayOfWeek);
    if (!dailyOps) {
        return []; // Facility closed on this day
    }

    const openTimeParts = dailyOps.openTime.split(':').map(Number);
    const closeTimeParts = dailyOps.closeTime.split(':').map(Number);

    let slotStartTime = new Date(targetDate);
    slotStartTime.setHours(openTimeParts[0], openTimeParts[1], 0, 0);

    const facilityCloseTime = new Date(targetDate);
    facilityCloseTime.setHours(closeTimeParts[0], closeTimeParts[1], 0, 0);

    const slotDuration = facility.slotDurationMinutes || 60;
    const allPossibleSlots = [];

    while (slotStartTime < facilityCloseTime) {
        const slotEndTime = addMinutes(slotStartTime, slotDuration);
        if (slotEndTime > facilityCloseTime) break; // Slot extends beyond closing time

        allPossibleSlots.push({
            startTime: new Date(slotStartTime), // new Date to ensure it's a copy
            endTime: new Date(slotEndTime),
            isBooked: false, // Will be updated based on existing bookings
        });
        slotStartTime = slotEndTime;
    }

    // Fetch existing bookings for this facility on this day
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const existingBookings = await Booking.find({
        facility: facility._id,
        status: 'Confirmed', // Only consider confirmed bookings for conflicts
        $or: [ // Check for any overlap
            { startTime: { $lt: dayEnd }, endTime: { $gt: dayStart } }
        ]
    });

    // Mark slots that are booked
    const availableSlots = allPossibleSlots.map(slot => {
        const isBooked = existingBookings.some(booking =>
            // Check if the slot's interval overlaps with any booking's interval
            (slot.startTime < booking.endTime && slot.endTime > booking.startTime)
        );
        return { ...slot, isBooked };
    });

    return availableSlots.filter(slot => !slot.isBooked && slot.startTime >= new Date()); // Only future, unbooked slots
}


// @route   GET /api/facilities/:facilityId/availability
// @desc    Get available booking slots for a facility on a given date
// @access  Public (or Authenticated Users)
router.get('/facilities/:facilityId/availability', async (req, res) => {
    const { facilityId } = req.params;
    const { date } = req.query; // Expecting date in 'yyyy-MM-dd' format

    if (!date) {
        return res.status(400).json({ msg: 'Date query parameter is required (yyyy-MM-dd).' });
    }
    try {
        const facility = await Facility.findById(facilityId);
        if (!facility) {
            return res.status(404).json({ msg: 'Facility not found.' });
        }
        if (!facility.isActive) {
            return res.status(400).json({ msg: 'Facility is currently not active.' });
        }

        const slots = await generateAvailableSlots(facility, date);
        res.json(slots.map(s => ({startTime: s.startTime, endTime: s.endTime}))); // Only return start/end of available slots

    } catch (err) {
        console.error("Error fetching availability:", err.message);
        if (err instanceof Error && err.message.includes("Invalid time value")) { // from date-fns parse
            return res.status(400).json({ msg: "Invalid date format. Please use yyyy-MM-dd." });
        }
        res.status(500).send('Server Error getting availability.');
    }
});


// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (Authenticated Members/Trainers)
router.post('/', protect, authorize('member', 'trainer'), async (req, res) => {
    const { facilityId, startTime, endTime, notes } = req.body;
    const userId = req.user.id;

    try {
        const facility = await Facility.findById(facilityId);
        if (!facility || !facility.isActive) {
            return res.status(404).json({ msg: 'Facility not found or is inactive.' });
        }

        const bookingStartTime = parse(startTime, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date());
        const bookingEndTime = parse(endTime, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date());

        if (isNaN(bookingStartTime.getTime()) || isNaN(bookingEndTime.getTime())) {
            return res.status(400).json({ msg: 'Invalid startTime or endTime format. Please use ISO 8601 format.' });
        }

        if (bookingEndTime <= bookingStartTime) {
            return res.status(400).json({ msg: 'End time must be after start time.' });
        }

        // Check if within operating hours
        const bookingDay = format(bookingStartTime, 'EEEE');
        const dailyOps = facility.operatingHours.find(oh => oh.dayOfWeek === bookingDay);
        if (!dailyOps) {
            return res.status(400).json({ msg: `Facility is closed on ${bookingDay}.` });
        }

        const opOpenTime = parse(dailyOps.openTime, 'HH:mm', bookingStartTime); // Use bookingStartTime to get the correct date context
        const opCloseTime = parse(dailyOps.closeTime, 'HH:mm', bookingStartTime);

        if (bookingStartTime < opOpenTime || bookingEndTime > opCloseTime) {
            return res.status(400).json({ msg: `Booking time is outside of operating hours (${dailyOps.openTime} - ${dailyOps.closeTime}).` });
        }

        // Check slot alignment and duration based on facility.bookingType
        const slotDuration = facility.slotDurationMinutes;
        const bookingDurationMinutes = differenceInMinutes(bookingEndTime, bookingStartTime);

        if (facility.bookingType === 'hourly' || facility.bookingType === 'slot_based') {
            if (bookingDurationMinutes % slotDuration !== 0) {
                return res.status(400).json({ msg: `Booking duration must be in multiples of ${slotDuration} minutes.`});
            }
            if (bookingStartTime.getMinutes() % slotDuration !== 0 && slotDuration < 60) { // For sub-hour slots
                 // More complex check for alignment with slot boundaries needed if not on the hour for hourly
                 // For simplicity, if hourly, often assume starts on the hour.
            }
        }

        const numSlotsBooked = bookingDurationMinutes / slotDuration;
        if (numSlotsBooked > facility.maxBookingLengthSlots) {
            return res.status(400).json({ msg: `Booking exceeds maximum allowed length of ${facility.maxBookingLengthSlots} slots.` });
        }

        // Check lead time
        const now = new Date();
        const earliestBookingDate = startOfDay(now); // Can book for today if leadTime is 0
        const latestBookingDate = endOfDay(addMinutes(now, facility.bookingLeadTimeDays * 24 * 60)); // approx

        if (bookingStartTime < earliestBookingDate) {
             return res.status(400).json({ msg: 'Cannot book for a past date/time.' });
        }
        // This lead time check needs refinement: compare bookingStartTime with (now + leadTimeDays)
        // For now, a simpler check: if bookingStartTime is beyond X days from now.
        const leadTimeCutoff = addMinutes(startOfDay(new Date()), (facility.bookingLeadTimeDays + 1) * 24 * 60);
        if (bookingStartTime > leadTimeCutoff) {
             return res.status(400).json({ msg: `Bookings can only be made up to ${facility.bookingLeadTimeDays} days in advance.`});
        }


        // Conflict Checking
        const existingBooking = await Booking.findOne({
            facility: facilityId,
            status: 'Confirmed',
            $or: [
                { startTime: { $lt: bookingEndTime }, endTime: { $gt: bookingStartTime } },
            ],
        });

        if (existingBooking) {
            return res.status(400).json({ msg: 'Time slot is already booked or overlaps with an existing booking.' });
        }

        const newBooking = new Booking({
            user: userId,
            facility: facilityId,
            startTime: bookingStartTime,
            endTime: bookingEndTime,
            notes,
            // bookingTypeUsed: facility.bookingType // Snapshot
        });

        await newBooking.save();
        const populatedBooking = await Booking.findById(newBooking._id)
            .populate('user', 'username firstName lastName')
            .populate('facility', 'name type');

        res.status(201).json(populatedBooking);

    } catch (err) {
        console.error("Error creating booking:", err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(' ') });
        }
        if (err instanceof Error && err.message.includes("Invalid time value")) {
            return res.status(400).json({ msg: "Invalid date format in request body. Please use ISO 8601 (e.g., yyyy-MM-ddTHH:mm:ss.SSSZ)." });
        }
        res.status(500).send('Server Error creating booking.');
    }
});


// @route   GET /api/bookings/my
// @desc    Get all bookings for the logged-in user
// @access  Private (Authenticated User)
router.get('/my', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('facility', 'name type description')
            .sort({ startTime: -1 }); // Most recent first
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/bookings/:bookingId/my
// @desc    Cancel user's own booking
// @access  Private (Authenticated User - owner of booking)
router.delete('/:bookingId/my', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found.' });
        }
        if (booking.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to cancel this booking.' });
        }
        if (booking.status === 'CancelledByMember' || booking.status === 'CancelledByAdmin') {
            return res.status(400).json({ msg: 'Booking is already cancelled.' });
        }
        if (booking.status === 'Completed' || new Date(booking.startTime) < new Date()) {
            return res.status(400).json({ msg: 'Cannot cancel a past or completed booking.' });
        }

        // TODO: Implement cancellationPolicyHours check from Facility model if desired

        booking.status = 'CancelledByMember';
        await booking.save();
        const populatedBooking = await Booking.findById(booking._id)
            .populate('facility', 'name type');
        res.json({ msg: 'Booking cancelled successfully.', booking: populatedBooking });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Booking not found (invalid ID).' });
        }
        res.status(500).send('Server Error');
    }
});


// --- Admin specific booking routes ---

// @route   GET /api/bookings/facility/:facilityId
// @desc    Get all bookings for a specific facility (Admin/Trainer view)
// @access  Private (Admin/Trainer)
router.get('/facility/:facilityId', protect, authorize('admin', 'trainer'), async (req, res) => {
    try {
        const bookings = await Booking.find({ facility: req.params.facilityId })
            .populate('user', 'username firstName lastName email')
            .populate('facility', 'name')
            .sort({ startTime: 1 });
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/bookings/:bookingId
// @desc    Get details of a specific booking by ID (Admin/Owner)
// @access  Private
router.get('/:bookingId', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate('user', 'username firstName lastName email')
            .populate('facility');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found.' });
        }
        // Check if user is admin or owner of the booking
        if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'User not authorized to view this booking.' });
        }
        res.json(booking);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Booking not found (invalid ID).' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/bookings/:bookingId
// @desc    Update booking status or details (Admin only)
// @access  Private (Admin only)
router.put('/:bookingId', protect, authorize('admin'), async (req, res) => {
    const { status, notes } = req.body; // Admins can mainly change status or add admin notes

    const bookingUpdateFields = {};
    if (status) bookingUpdateFields.status = status;
    if (notes !== undefined) bookingUpdateFields.notes = notes; // Could be admin notes separate from user notes

    try {
        let booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found.' });
        }

        // For other fields like startTime, endTime, facility, user - admin would typically cancel and rebook.
        // Direct modification of these can be complex with conflict checks.

        booking = await Booking.findByIdAndUpdate(
            req.params.bookingId,
            { $set: bookingUpdateFields },
            { new: true, runValidators: true }
        ).populate('user', 'username firstName lastName').populate('facility', 'name type');

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(' ') });
        }
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Booking not found (invalid ID).' });
        }
        res.status(500).send('Server Error');
    }
});


module.exports = router;
