import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Paper, Divider, Chip, Button
} from '@mui/material';
import { DeleteOutline as CancelIcon, EventAvailable, History } from '@mui/icons-material';
import AuthContext from '../../context/AuthContext';
import { format, isPast } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');
  const { authState } = useContext(AuthContext);

  const fetchMyBookings = async () => {
    if (!authState.token) {
      setError("You need to be logged in to view your bookings.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setCancelError('');
    setCancelSuccess('');
    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      const response = await axios.get(`${API_URL}/bookings/my`, config);
      // Sort bookings: upcoming first, then past ones
      response.data.sort((a, b) => {
        const aIsPast = isPast(new Date(a.startTime));
        const bIsPast = isPast(new Date(b.startTime));
        if (aIsPast && !bIsPast) return 1; // a is past, b is upcoming, so b comes first
        if (!aIsPast && bIsPast) return -1; // a is upcoming, b is past, so a comes first
        return new Date(a.startTime) - new Date(b.startTime); // Both same category, sort by time
      });
      setBookings(response.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.response?.data?.msg || 'Failed to fetch your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelError('');
    setCancelSuccess('');
    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      const response = await axios.delete(`${API_URL}/bookings/${bookingId}/my`, config);
      setCancelSuccess(response.data.msg || 'Booking cancelled successfully.');
      fetchMyBookings(); // Refresh the list
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setCancelError(err.response?.data?.msg || 'Failed to cancel booking.');
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'CancelledByMember':
      case 'CancelledByAdmin': return 'error';
      case 'Completed': return 'info';
      case 'NoShow': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  const upcomingBookings = bookings.filter(b => !isPast(new Date(b.endTime)) && (b.status === 'Confirmed'));
  const pastOrCancelledBookings = bookings.filter(b => isPast(new Date(b.endTime)) || b.status !== 'Confirmed');


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Facility Bookings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
      {cancelSuccess && <Alert severity="success" sx={{ mb: 2 }}>{cancelSuccess}</Alert>}

      <Paper elevation={2} sx={{p:2, mb:3}}>
        <Typography variant="h5" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><EventAvailable sx={{mr:1, color: 'primary.main'}}/>Upcoming Bookings</Typography>
        {upcomingBookings.length > 0 ? (
            <List>
            {upcomingBookings.map((booking, index) => (
              <React.Fragment key={booking._id}>
                <ListItem>
                  <ListItemText
                    primary={`${booking.facility?.name || 'Facility N/A'} (${booking.facility?.type || 'N/A'})`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(parseISO(booking.startTime), 'PPP p')} - {format(parseISO(booking.endTime), 'p')}
                        </Typography>
                        <br />
                        Status: <Chip label={booking.status} color={getStatusChipColor(booking.status)} size="small" />
                        {booking.notes && <Typography variant="caption" display="block">Notes: {booking.notes}</Typography>}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {(booking.status === 'Confirmed' && !isPast(new Date(booking.startTime))) && (
                      <Tooltip title="Cancel Booking">
                        <IconButton edge="end" aria-label="cancel" onClick={() => handleCancelBooking(booking._id)}>
                          <CancelIcon color="error"/>
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < upcomingBookings.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
            <Typography>You have no upcoming bookings.</Typography>
        )}
      </Paper>

      <Paper elevation={2} sx={{p:2}}>
      <Typography variant="h5" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><History sx={{mr:1, color: 'text.secondary'}}/>Past & Cancelled Bookings</Typography>
        {pastOrCancelledBookings.length > 0 ? (
            <List>
            {pastOrCancelledBookings.map((booking, index) => (
              <React.Fragment key={booking._id}>
                <ListItem>
                  <ListItemText
                    primary={`${booking.facility?.name || 'Facility N/A'} (${booking.facility?.type || 'N/A'})`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(parseISO(booking.startTime), 'PPP p')} - {format(parseISO(booking.endTime), 'p')}
                        </Typography>
                        <br />
                        Status: <Chip label={booking.status} color={getStatusChipColor(booking.status)} size="small" />
                      </>
                    }
                  />
                </ListItem>
                {index < pastOrCancelledBookings.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
            <Typography>No past or cancelled bookings.</Typography>
        )}
      </Paper>


    </Container>
  );
}

export default MyBookingsPage;
