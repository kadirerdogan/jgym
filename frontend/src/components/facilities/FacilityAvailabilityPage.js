import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Button,
  List, ListItem, ListItemText, Divider, TextField, Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AuthContext from '../../context/AuthContext';
import { format, parseISO, formatISO } from 'date-fns'; // For date formatting

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function FacilityAvailabilityPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [facility, setFacility] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // { startTime, endTime }

  const [loadingFacility, setLoadingFacility] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Fetch facility details
  useEffect(() => {
    setLoadingFacility(true);
    axios.get(`${API_URL}/facilities/${facilityId}`)
      .then(response => {
        setFacility(response.data);
        setError('');
      })
      .catch(err => {
        console.error("Error fetching facility details:", err);
        setError(err.response?.data?.msg || 'Failed to load facility details.');
      })
      .finally(() => setLoadingFacility(false));
  }, [facilityId]);

  // Fetch available slots when selectedDate or facility changes
  useEffect(() => {
    if (facility && selectedDate) {
      setLoadingSlots(true);
      setAvailableSlots([]); // Clear previous slots
      setSelectedSlot(null); // Clear selected slot
      setError(''); // Clear previous errors

      const dateString = format(selectedDate, 'yyyy-MM-dd');
      axios.get(`${API_URL}/facilities/${facilityId}/availability?date=${dateString}`)
        .then(response => {
          setAvailableSlots(response.data.map(slot => ({
            startTime: parseISO(slot.startTime),
            endTime: parseISO(slot.endTime)
          })));
        })
        .catch(err => {
          console.error("Error fetching availability slots:", err);
          setError(err.response?.data?.msg || 'Failed to fetch available slots.');
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [facilityId, selectedDate, facility]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    setBookingError(''); // Clear previous booking error on new selection
    setBookingSuccess('');
  };

  const handleBookingConfirm = async () => {
    if (!selectedSlot) {
      setBookingError('Please select a time slot to book.');
      return;
    }
    if (!authState.isAuthenticated) {
      setBookingError('You must be logged in to make a booking.');
      // Consider navigating to login: navigate('/login', { state: { from: location } });
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');
    try {
      const payload = {
        facilityId: facility._id,
        startTime: formatISO(selectedSlot.startTime), // Send ISO strings to backend
        endTime: formatISO(selectedSlot.endTime),
        // notes: 'My booking notes' // Optional: Add a field for notes if desired
      };
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      const response = await axios.post(`${API_URL}/bookings`, payload, config);
      setBookingSuccess(`Booking confirmed for ${format(selectedSlot.startTime, 'Pp')} to ${format(selectedSlot.endTime, 'p')}!`);
      setSelectedSlot(null); // Clear selection
      // Re-fetch slots to show updated availability
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      axios.get(`${API_URL}/facilities/${facilityId}/availability?date=${dateString}`)
        .then(res => setAvailableSlots(res.data.map(s => ({startTime: parseISO(s.startTime), endTime: parseISO(s.endTime)}))))
        .catch(err => console.error("Error re-fetching slots:", err));

    } catch (err) {
      console.error("Error confirming booking:", err.response || err);
      setBookingError(err.response?.data?.msg || 'Failed to confirm booking. The slot might have been taken or an error occurred.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loadingFacility) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }
  if (error && !facility) { // Critical error if facility didn't load
    return <Container sx={{mt:2}}><Alert severity="error">{error}</Alert></Container>;
  }
  if (!facility) { // Should be caught by above, but as a fallback
    return <Container sx={{mt:2}}><Alert severity="info">Facility not found.</Alert></Container>;
  }


  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            {facility.name} - Book a Slot
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>{facility.description}</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>Select Date</Typography>
              <DatePicker
                label="Booking Date"
                value={selectedDate}
                onChange={handleDateChange}
                minDate={new Date()} // Cannot select past dates
                maxDate={addMinutes(new Date(), (facility.bookingLeadTimeDays || 7) * 24 * 60)} // Respect lead time
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
               <Box sx={{mt:2}}>
                <Typography variant="caption">Type: <Chip label={facility.bookingType} size="small" /></Typography><br/>
                <Typography variant="caption">Slot Duration: {facility.slotDurationMinutes} mins</Typography><br/>
                <Typography variant="caption">Max {facility.maxBookingLengthSlots} consecutive slots</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Available Slots for {format(selectedDate, 'PPP')} {/* PPP: Long date format */}
              </Typography>
              {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>} {/* Non-critical errors like no slots */}
              {loadingSlots ? (
                <CircularProgress />
              ) : availableSlots.length > 0 ? (
                <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid lightgray', borderRadius: 1 }}>
                  {availableSlots.map((slot, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        button
                        selected={selectedSlot?.startTime.getTime() === slot.startTime.getTime()}
                        onClick={() => handleSlotSelection(slot)}
                        disabled={new Date(slot.startTime) < new Date()} // Disable past slots on current day
                      >
                        <ListItemText
                          primary={`${format(slot.startTime, 'p')} - ${format(slot.endTime, 'p')}`}
                        />
                      </ListItem>
                      {index < availableSlots.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography>No available slots for this date.</Typography>
              )}
            </Grid>
          </Grid>

          {selectedSlot && (
            <Box sx={{ mt: 3, p: 2, border: '1px dashed grey', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h6">Confirm Booking</Typography>
              <Typography>
                Facility: <strong>{facility.name}</strong>
              </Typography>
              <Typography>
                Date: <strong>{format(selectedDate, 'PPP')}</strong>
              </Typography>
              <Typography>
                Time: <strong>{format(selectedSlot.startTime, 'p')} - {format(selectedSlot.endTime, 'p')}</strong>
              </Typography>
              {/* Optional: Add notes field here if needed */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleBookingConfirm}
                disabled={bookingLoading || !authState.isAuthenticated}
                sx={{ mt: 2 }}
              >
                {bookingLoading ? <CircularProgress size={24} /> : (authState.isAuthenticated ? 'Confirm Booking' : 'Login to Book')}
              </Button>
            </Box>
          )}
          {bookingError && <Alert severity="error" sx={{ mt: 2 }}>{bookingError}</Alert>}
          {bookingSuccess && <Alert severity="success" sx={{ mt: 2 }}>{bookingSuccess}</Alert>}

        </Paper>
      </LocalizationProvider>
    </Container>
  );
}

export default FacilityAvailabilityPage;
