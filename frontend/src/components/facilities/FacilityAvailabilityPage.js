import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Button,
  List, ListItem, ListItemText, Divider, TextField, Chip, useTheme, ListItemButton, ListItemIcon, ListSubheader
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AuthContext from '../../context/AuthContext';
import { format, parseISO, formatISO, addMinutes, isSameDay } from 'date-fns'; // Added isSameDay
import { EventAvailable as EventAvailableIcon, AccessTime as AccessTimeIcon, InfoOutlined as InfoIcon, EventBusy as EventBusyIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function FacilityAvailabilityPage() {
  const { facilityId } = useParams();
  const { authState } = useContext(AuthContext);
  const theme = useTheme();

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
      // const response = await axios.post(`${API_URL}/bookings`, payload, config); // response was unused
      await axios.post(`${API_URL}/bookings`, payload, config);
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
    <Container
        maxWidth="lg" // Wider for better layout
        sx={{
            mt: 4,
            mb: 4,
            py: 3,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
            borderRadius: 2
        }}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Paper elevation={4} sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EventAvailableIcon color="primary" sx={{ fontSize: {xs:28, md:32}, mr: 1.5 }} />
            <Typography variant="h4" component="h1" gutterBottom color="primary.main" sx={{mb:0}}>
              {facility.name} - Book a Slot
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" paragraph sx={{mb:3}}>
            {facility.description}
          </Typography>
          <Divider sx={{mb:3}} />

          <Grid container spacing={4}> {/* Increased spacing */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom sx={{mb: 2}}>Select Date</Typography>
              <DatePicker
                label="Booking Date"
                value={selectedDate}
                onChange={handleDateChange}
                minDate={new Date()}
                maxDate={addMinutes(new Date(), (facility.bookingLeadTimeDays || 7) * 24 * 60)}
                slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
              />
               <Box sx={{mt:2.5, p:1.5, border: `1px solid ${theme.palette.divider}`, borderRadius:1 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">Facility Details:</Typography>
                <List dense disablePadding>
                    <ListItem disableGutters sx={{py:0.5}}>
                        <ListItemIcon sx={{minWidth: 32}}><InfoIcon fontSize="small"/></ListItemIcon>
                        <ListItemText primary="Type" secondary={facility.bookingType} />
                    </ListItem>
                    <ListItem disableGutters sx={{py:0.5}}>
                        <ListItemIcon sx={{minWidth: 32}}><AccessTimeIcon fontSize="small"/></ListItemIcon>
                        <ListItemText primary="Slot Duration" secondary={`${facility.slotDurationMinutes} minutes`} />
                    </ListItem>
                     <ListItem disableGutters sx={{py:0.5}}>
                        <ListItemIcon sx={{minWidth: 32}}><AccessTimeIcon fontSize="small"/></ListItemIcon> {/* Could use a different icon */}
                        <ListItemText primary="Max Slots/Booking" secondary={facility.maxBookingLengthSlots} />
                    </ListItem>
                </List>
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Available Slots for {format(selectedDate, 'PPP')}
              </Typography>
              {error && !loadingSlots && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
              {loadingSlots ? (
                <Box sx={{display: 'flex', justifyContent:'center', my:3}}><CircularProgress /></Box>
              ) : availableSlots.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 350, overflow: 'auto' }}>
                  <List component="nav" aria-label="available time slots">
                    {availableSlots.map((slot, index) => (
                      <ListItemButton
                        key={index}
                        selected={selectedSlot?.startTime.getTime() === slot.startTime.getTime()}
                        onClick={() => handleSlotSelection(slot)}
                        disabled={new Date(slot.startTime) < new Date() && !isSameDay(new Date(slot.startTime), new Date())} // More precise past slot disabling
                        sx={{
                            '&.Mui-selected': {
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                }
                            },
                            '&.Mui-disabled': {
                                opacity: 0.6,
                            }
                        }}
                      >
                        <ListItemIcon sx={{color: selectedSlot?.startTime.getTime() === slot.startTime.getTime() ? 'primary.contrastText' : 'inherit'}}>
                            <AccessTimeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${format(slot.startTime, 'p')} - ${format(slot.endTime, 'p')}`}
                          primaryTypographyProps={{fontWeight: 'medium'}}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Box sx={{display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', p:3, border: `1px dashed ${theme.palette.divider}`, borderRadius: 1, mt:1}}>
                    <EventBusyIcon sx={{fontSize: 40, color: 'text.secondary', mb:1}}/>
                    <Typography color="text.secondary">No available slots for this date.</Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {selectedSlot && (
            <Paper elevation={2} sx={{ mt: 4, p: 2.5, textAlign: 'center', backgroundColor: theme.palette.action.selected }}>
              <Typography variant="h6" gutterBottom color="primary.dark">Confirm Your Booking</Typography>
              <List dense disablePadding sx={{mb:2}}>
                <ListItemText primary="Facility:" secondary={<strong>{facility.name}</strong>} sx={{textAlign:'center', mb:0.5}}/>
                <ListItemText primary="Date:" secondary={<strong>{format(selectedDate, 'PPP')}</strong>} sx={{textAlign:'center', mb:0.5}}/>
                <ListItemText primary="Time:" secondary={<strong>{`${format(selectedSlot.startTime, 'p')} - ${format(selectedSlot.endTime, 'p')}`}</strong>} sx={{textAlign:'center'}}/>
              </List>
              <Button
                variant="contained"
                color="secondary" // Changed to secondary for booking confirmation
                onClick={handleBookingConfirm}
                disabled={bookingLoading || !authState.isAuthenticated}
                sx={{ mt: 1, px:4, py:1.2 }}
                startIcon={bookingLoading ? <CircularProgress size={20} color="inherit"/> : null}
              >
                {authState.isAuthenticated ? 'Confirm & Book Slot' : 'Login to Book'}
              </Button>
            </Paper>
          )}
          {bookingError && <Alert severity="error" sx={{ mt: 3 }}>{bookingError}</Alert>}
          {bookingSuccess && <Alert severity="success" sx={{ mt: 3 }}>{bookingSuccess}</Alert>}

        </Paper>
      </LocalizationProvider>
    </Container>
  );
}

export default FacilityAvailabilityPage;
