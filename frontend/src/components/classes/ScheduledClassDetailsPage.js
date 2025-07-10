import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Alert, Container, Card, Button, Spinner, Typography, ListGroup, Box, Paper } from '@mui/material'; // Assuming Material-UI

// Dummy API service functions (replace with actual API calls)
const apiGetScheduledClassById = async (id) => {
  console.log(`Fetching scheduled class by ID: ${id}`);
  // Simulate API call
  // Replace with: const response = await fetch(`/api/scheduledclasses/${id}`);
  // const data = await response.json();
  // return data;
  const mockClasses = [
    { _id: '1', classType: { name: 'Yoga Flow', description: 'A relaxing yoga session for all levels. Focuses on breathing and gentle poses.', requiredEquipment: ['Yoga Mat'] }, trainer: { firstName: 'Jane', lastName: 'Doe', bio: 'Certified Yoga Instructor with 5 years experience.' }, startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 25 * 3600 * 1000).toISOString(), capacity: 15, attendees: [{_id: 'user1'}, {_id: 'user2'}], facility: { name: 'Studio A', type: 'Yoga Studio' }, status: 'Scheduled', notes: 'Please arrive 10 minutes early.' },
    { _id: '2', classType: { name: 'HIIT Blast', description: 'High-Intensity Interval Training to get your heart pumping.' }, trainer: { firstName: 'John', lastName: 'Smith' }, startTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 49 * 3600 * 1000).toISOString(), capacity: 10, attendees: Array(10).fill({_id: 'someUser'}), facility: { name: 'Main Gym' }, status: 'Full' },
  ];
  return mockClasses.find(c => c._id === id) || Promise.reject(new Error('Class not found'));
};

const apiBookClass = async (id, token) => {
  console.log(`Booking class ID: ${id} with token: ${token ? 'present' : 'missing'}`);
  // Simulate API call
  // Replace with actual fetch:
  // const response = await fetch(`/api/scheduledclasses/${id}/book`, {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // if (!response.ok) { throw new Error('Failed to book class'); }
  // return response.json();
  return { msg: 'Successfully booked class.', class: { _id: id, attendees: [{_id: 'currentUser'}, {_id: 'user1'}, {_id: 'user2'}], status: 'Scheduled', capacity: 15 } }; // Simulate current user added
};

const apiUnbookClass = async (id, token) => {
  console.log(`Unbooking class ID: ${id} with token: ${token ? 'present' : 'missing'}`);
  // Simulate API call
  // Replace with actual fetch:
  // const response = await fetch(`/api/scheduledclasses/${id}/unbook`, {
  //   method: 'DELETE',
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // if (!response.ok) { throw new Error('Failed to unbook class'); }
  // return response.json();
  return { msg: 'Successfully unbooked from class.', class: { _id: id, attendees: [{_id: 'user1'}], status: 'Scheduled', capacity: 15 } }; // Simulate current user removed
};


const ScheduledClassDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [sClass, setSClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchClassDetails = async () => {
      setLoading(true);
      setError('');
      try {
        // const response = await fetch(`/api/scheduledclasses/${id}`);
        // if (!response.ok) {
        //   const errorData = await response.json().catch(() => ({ msg: 'Class not found or error fetching details' }));
        //   throw new Error(errorData.msg || `Error: ${response.statusText}`);
        // }
        // const data = await response.json();
        const data = await apiGetScheduledClassById(id); // Using dummy data
        setSClass(data);
      } catch (err) {
        console.error("Error fetching class details:", err);
        setError(err.message || 'Could not fetch class details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClassDetails();
    }
  }, [id]);

  const handleBooking = async () => {
    if (!user || user.role !== 'member') {
      setActionError('Only members can book classes. Please log in as a member.');
      return;
    }
    if (!token) {
        setActionError('Authentication token not found. Please log in again.');
        return;
    }

    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      // const response = await fetch(`/api/scheduledclasses/${id}/book`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });
      // const data = await response.json();
      // if (!response.ok) {
      //   throw new Error(data.msg || 'Failed to book class.');
      // }
      const data = await apiBookClass(id, token); // Dummy call
      setSClass(prev => ({ ...prev, ...data.class, attendees: [...prev.attendees, { _id: user.id }] })); // Optimistic update + sync with response
      setActionSuccess(data.msg || 'Successfully booked class!');
    } catch (err) {
      console.error("Booking error:", err);
      setActionError(err.message || 'An error occurred while booking the class.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbooking = async () => {
    if (!user || user.role !== 'member') {
      setActionError('Only members can unbook classes.');
      return;
    }
     if (!token) {
        setActionError('Authentication token not found. Please log in again.');
        return;
    }

    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      // const response = await fetch(`/api/scheduledclasses/${id}/unbook`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });
      // const data = await response.json();
      // if (!response.ok) {
      //   throw new Error(data.msg || 'Failed to cancel booking.');
      // }
      const data = await apiUnbookClass(id, token); // Dummy call
      setSClass(prev => ({...prev, ...data.class, attendees: prev.attendees.filter(att => att._id !== user.id) })); // Optimistic update
      setActionSuccess(data.msg || 'Successfully cancelled booking!');
    } catch (err) {
      console.error("Unbooking error:", err);
      setActionError(err.message || 'An error occurred while cancelling the booking.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><Spinner /></Container>;
  }

  if (error || !sClass) {
    return <Container sx={{ mt: 2 }}><Alert severity="error">{error || 'Class details could not be loaded.'}</Alert></Container>;
  }

  const isUserBooked = sClass.attendees && sClass.attendees.some(attendee => attendee._id === user?.id);
  const canBook = user && user.role === 'member' && !isUserBooked && sClass.status !== 'Full' && sClass.status !== 'Cancelled' && sClass.status !== 'Completed' && new Date(sClass.startTime) > new Date();
  const canUnbook = user && user.role === 'member' && isUserBooked && sClass.status !== 'Cancelled' && sClass.status !== 'Completed' && new Date(sClass.startTime) > new Date();
  const spotsAvailable = sClass.capacity - (sClass.attendees?.length || 0);

  return (
    <Container sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {sClass.classType?.name || 'Class Details'}
        </Typography>

        {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
        {actionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{actionSuccess}</Alert>}

        <ListGroup>
          <ListGroup.Item><strong>Description:</strong> {sClass.classType?.description || 'N/A'}</ListGroup.Item>
          <ListGroup.Item><strong>Trainer:</strong> {sClass.trainer?.firstName} {sClass.trainer?.lastName || 'N/A'}</ListGroup.Item>
          {sClass.trainer?.bio && <ListGroup.Item><strong>Trainer Bio:</strong> {sClass.trainer.bio}</ListGroup.Item>}
          <ListGroup.Item><strong>Date & Time:</strong> {new Date(sClass.startTime).toLocaleString()} - {new Date(sClass.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ListGroup.Item>
          <ListGroup.Item><strong>Location:</strong> {sClass.facility?.name || 'N/A'} ({sClass.facility?.type || 'General Area'})</ListGroup.Item>
          <ListGroup.Item><strong>Status:</strong> <span style={{ color: sClass.status === 'Full' ? 'red' : (sClass.status === 'Scheduled' ? 'green' : 'grey')}}>{sClass.status}</span></ListGroup.Item>
          <ListGroup.Item><strong>Availability:</strong> {spotsAvailable > 0 ? `${spotsAvailable} / ${sClass.capacity} spots remaining` : 'No spots available'}</ListGroup.Item>
          {sClass.classType?.requiredEquipment && sClass.classType.requiredEquipment.length > 0 && (
            <ListGroup.Item><strong>Equipment Needed:</strong> {sClass.classType.requiredEquipment.join(', ')}</ListGroup.Item>
          )}
          {sClass.notes && <ListGroup.Item><strong>Notes:</strong> {sClass.notes}</ListGroup.Item>}
        </ListGroup>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {canBook && (
            <Button variant="contained" color="primary" onClick={handleBooking} disabled={isProcessing}>
              {isProcessing ? <Spinner size="sm" /> : 'Book Class'}
            </Button>
          )}
          {canUnbook && (
            <Button variant="outlined" color="error" onClick={handleUnbooking} disabled={isProcessing}>
              {isProcessing ? <Spinner size="sm" /> : 'Cancel Booking'}
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back to List
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ScheduledClassDetailsPage;
