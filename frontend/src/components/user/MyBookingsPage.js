import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Paper, Divider, Chip, Tooltip
  // Button was removed from here in a previous step, but the warning was for a different Button import (likely a typo in the warning or it was already fixed)
} from '@mui/material';
import { DeleteOutline as CancelIcon, EventAvailable, History, FitnessCenter as FacilityIcon, Class as ClassIconMUI } from '@mui/icons-material';
import AuthContext from '../../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns'; // Added parseISO

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Dummy API for class bookings (replace with actual calls)
const fetchMyClassBookingsAPI = async (token) => {
  console.log("Fetching my class bookings with token:", token ? "present" : "missing");
  // Simulate: GET /api/scheduledclasses/my-bookings or similar
  // This would ideally return classes the user is an attendee of.
  // For now, returning a couple of examples. User ID 'currentUser' assumed for filtering.
  const allClasses = [
     { _id: 'class1', classType: { name: 'Yoga Flow Intensive' }, trainer: { firstName: 'Jane' }, startTime: new Date(Date.now() + 36 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 37 * 3600 * 1000).toISOString(), facility: { name: 'Studio Zen' }, status: 'Scheduled', attendees: [{_id: 'currentUser'}, {_id: 'user2'}] },
     { _id: 'class2', classType: { name: 'Advanced HIIT' }, trainer: { firstName: 'Mike' }, startTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() - 23 * 3600 * 1000).toISOString(), facility: { name: 'Gym Floor' }, status: 'Completed', attendees: [{_id: 'currentUser'}] },
     { _id: 'class3', classType: { name: 'Cycling Endurance' }, trainer: { firstName: 'Sara' }, startTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 73 * 3600 * 1000).toISOString(), facility: { name: 'Spin Studio' }, status: 'Scheduled', attendees: [{_id: 'userOnly'}, {_id: 'currentUser'}] },
  ];
  // Filter for current user - this logic would be on backend ideally
  // return allClasses.filter(c => c.attendees.some(att => att._id === 'currentUser'));
  // For now, this API call will be mocked in the main fetch function.
  return Promise.resolve(allClasses.filter(c => c.attendees.some(att => att._id === 'currentUser')));
};

const cancelClassBookingAPI = async (classId, token) => {
    console.log(`Cancelling class booking for ${classId} with token ${token ? 'present' : 'missing'}`);
    // Simulate: DELETE /api/scheduledclasses/${classId}/unbook
    // const response = await axios.delete(`${API_URL}/scheduledclasses/${classId}/unbook`, { headers: { Authorization: `Bearer ${token}` } });
    // return response.data;
    return Promise.resolve({ msg: 'Class booking cancelled successfully.' });
};


function MyBookingsPage() {
  const [facilityBookings, setFacilityBookings] = useState([]);
  const [classBookings, setClassBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState(''); // For both types of cancellations
  const [actionSuccess, setActionSuccess] = useState(''); // For both types of cancellations
  const { authState } = useContext(AuthContext);

  const fetchAllMyBookings = async () => {
    if (!authState.token) {
      setError("You need to be logged in to view your bookings.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setActionError('');
    setActionSuccess('');

    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };

      // Fetch Facility Bookings
      const facilityResponse = await axios.get(`${API_URL}/bookings/my`, config);
      facilityResponse.data.sort((a, b) => {
        const aIsPast = isPast(new Date(a.startTime));
        const bIsPast = isPast(new Date(b.startTime));
        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;
        return new Date(a.startTime) - new Date(b.startTime);
      });
      setFacilityBookings(facilityResponse.data);

      // Fetch Class Bookings (using mocked API for now)
      // const classResponse = await axios.get(`${API_URL}/scheduledclasses/my-bookings`, config); // Ideal
      const classData = await fetchMyClassBookingsAPI(authState.token); // Mocked
      classData.sort((a, b) => {
        const aIsPast = isPast(new Date(a.startTime));
        const bIsPast = isPast(new Date(b.startTime));
        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;
        return new Date(a.startTime) - new Date(b.startTime);
      });
      setClassBookings(classData);

    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.response?.data?.msg || 'Failed to fetch some of your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMyBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  const handleCancelFacilityBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this facility booking?')) return;
    setActionError('');
    setActionSuccess('');
    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      const response = await axios.delete(`${API_URL}/bookings/${bookingId}/my`, config);
      setActionSuccess(response.data.msg || 'Facility booking cancelled successfully.');
      fetchAllMyBookings(); // Refresh both lists
    } catch (err) {
      console.error("Error cancelling facility booking:", err);
      setActionError(err.response?.data?.msg || 'Failed to cancel facility booking.');
    }
  };

  const handleCancelClassBooking = async (classId) => {
    if (!window.confirm('Are you sure you want to cancel this class booking?')) return;
    setActionError('');
    setActionSuccess('');
    try {
      // const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      // const response = await axios.delete(`${API_URL}/scheduledclasses/${classId}/unbook`, config);
      const response = await cancelClassBookingAPI(classId, authState.token); // Mocked
      setActionSuccess(response.msg || 'Class booking cancelled successfully.');
      fetchAllMyBookings(); // Refresh both lists
    } catch (err) {
      console.error("Error cancelling class booking:", err);
      setActionError(err.response?.data?.msg || 'Failed to cancel class booking.');
    }
  };

  const getBookingStatusChipColor = (status) => {
    // For Facility Bookings
    switch (status) {
      case 'Confirmed': return 'success';
      case 'CancelledByMember':
      case 'CancelledByAdmin': return 'error';
      case 'Completed': return 'info';
      case 'NoShow': return 'warning';
      default: return 'default';
    }
  };

  const getClassStatusChipColor = (status) => {
    // For Scheduled Classes
    switch (status) {
      case 'Scheduled': return 'success';
      case 'Full': return 'warning';
      case 'Cancelled': return 'error';
      case 'Completed': return 'info';
      default: return 'default';
    }
  };


  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  const upcomingFacilityBookings = facilityBookings.filter(b => !isPast(new Date(b.endTime)) && (b.status === 'Confirmed'));
  const pastOrCancelledFacilityBookings = facilityBookings.filter(b => isPast(new Date(b.endTime)) || b.status !== 'Confirmed');

  const upcomingClassBookings = classBookings.filter(c => !isPast(new Date(c.endTime)) && (c.status === 'Scheduled' || c.status === 'Full'));
  const pastOrCancelledClassBookings = classBookings.filter(c => isPast(new Date(c.endTime)) || c.status === 'Cancelled' || c.status === 'Completed');


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Bookings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
      {actionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{actionSuccess}</Alert>}

      {/* Facility Bookings Section */}
      <Paper elevation={2} sx={{p:2, mb:4}}>
        <Typography variant="h5" gutterBottom sx={{display: 'flex', alignItems: 'center'}}>
            <FacilityIcon sx={{mr:1, color: 'primary.main'}}/>Facility Bookings
        </Typography>

        <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mt: 2, color: 'text.secondary'}}><EventAvailable sx={{mr:1}}/>Upcoming Facility Bookings</Typography>
        {upcomingFacilityBookings.length > 0 ? (
            <List>
            {upcomingFacilityBookings.map((booking, index) => (
              <React.Fragment key={`facility-${booking._id}`}>
                <ListItem>
                  <ListItemText
                    primary={`${booking.facility?.name || 'N/A'} (${booking.facility?.type || 'N/A'})`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(parseISO(booking.startTime), 'PPP p')} - {format(parseISO(booking.endTime), 'p')}
                        </Typography>
                        <br />
                        Status: <Chip label={booking.status} color={getBookingStatusChipColor(booking.status)} size="small" />
                        {booking.notes && <Typography variant="caption" display="block">Notes: {booking.notes}</Typography>}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {(booking.status === 'Confirmed' && !isPast(new Date(booking.startTime))) && (
                      <Tooltip title="Cancel Facility Booking">
                        <IconButton edge="end" aria-label="cancel-facility" onClick={() => handleCancelFacilityBooking(booking._id)}>
                          <CancelIcon color="error"/>
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < upcomingFacilityBookings.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
            <Typography sx={{pl:2}}>You have no upcoming facility bookings.</Typography>
        )}

        <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mt:3,  color: 'text.secondary'}}><History sx={{mr:1}}/>Past & Cancelled Facility Bookings</Typography>
        {pastOrCancelledFacilityBookings.length > 0 ? (
            <List>
            {pastOrCancelledFacilityBookings.map((booking, index) => (
              <React.Fragment key={`facility-past-${booking._id}`}>
                <ListItem>
                  <ListItemText
                    primary={`${booking.facility?.name || 'N/A'} (${booking.facility?.type || 'N/A'})`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(parseISO(booking.startTime), 'PPP p')} - {format(parseISO(booking.endTime), 'p')}
                        </Typography>
                        <br />
                        Status: <Chip label={booking.status} color={getBookingStatusChipColor(booking.status)} size="small" />
                      </>
                    }
                  />
                </ListItem>
                {index < pastOrCancelledFacilityBookings.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
            <Typography sx={{pl:2}}>No past or cancelled facility bookings.</Typography>
        )}
      </Paper>

      {/* Class Bookings Section */}
      <Paper elevation={2} sx={{p:2, mt: 4}}>
        <Typography variant="h5" gutterBottom sx={{display: 'flex', alignItems: 'center'}}>
            <ClassIconMUI sx={{mr:1, color: 'secondary.main'}}/>Class Bookings
        </Typography>

        <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mt: 2, color: 'text.secondary'}}><EventAvailable sx={{mr:1}}/>Upcoming Class Bookings</Typography>
        {upcomingClassBookings.length > 0 ? (
            <List>
            {upcomingClassBookings.map((sClass, index) => (
              <React.Fragment key={`class-${sClass._id}`}>
                <ListItem>
                  <ListItemText
                    primary={`${sClass.classType?.name || 'N/A'} with ${sClass.trainer?.firstName || 'N/A'}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(parseISO(sClass.startTime), 'PPP p')} - {format(parseISO(sClass.endTime), 'p')}
                        </Typography>
                        <br />
                        Location: {sClass.facility?.name || 'N/A'}
                        <br />
                        Status: <Chip label={sClass.status} color={getClassStatusChipColor(sClass.status)} size="small" />
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {(sClass.status === 'Scheduled' || sClass.status === 'Full') && !isPast(new Date(sClass.startTime)) && (
                      <Tooltip title="Cancel Class Booking">
                        <IconButton edge="end" aria-label="cancel-class" onClick={() => handleCancelClassBooking(sClass._id)}>
                          <CancelIcon color="error"/>
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < upcomingClassBookings.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
            <Typography sx={{pl:2}}>You have no upcoming class bookings.</Typography>
        )}

        <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mt:3, color: 'text.secondary'}}><History sx={{mr:1}}/>Past & Cancelled Class Bookings</Typography>
        {pastOrCancelledClassBookings.length > 0 ? (
            <List>
            {pastOrCancelledClassBookings.map((sClass, index) => (
              <React.Fragment key={`class-past-${sClass._id}`}>
                <ListItem>
                  <ListItemText
                    primary={`${sClass.classType?.name || 'N/A'} with ${sClass.trainer?.firstName || 'N/A'}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(parseISO(sClass.startTime), 'PPP p')} - {format(parseISO(sClass.endTime), 'p')}
                        </Typography>
                        <br />
                        Status: <Chip label={sClass.status} color={getClassStatusChipColor(sClass.status)} size="small" />
                      </>
                    }
                  />
                </ListItem>
                {index < pastOrCancelledClassBookings.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
            <Typography sx={{pl:2}}>No past or cancelled class bookings.</Typography>
        )}
      </Paper>
    </Container>
  );
}

export default MyBookingsPage;
