import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Renamed to avoid conflict if MUI Link is used
import AuthContext from '../../context/AuthContext';
import {
    Alert, Container, Card, Button, Typography, CircularProgress, Grid,
    CardContent, CardActions, List, ListItem, ListItemText, Divider
} from '@mui/material'; // Replaced Spinner, Row, Col, ListGroup; Added CardContent, CardActions, Grid, List components

// Dummy API service functions (replace with actual API calls)
const apiGetScheduledClasses = async () => {
  // Simulate API call
  // Replace with: const response = await fetch('/api/scheduledclasses');
  // const data = await response.json();
  // return data;
  console.log("Fetching scheduled classes...");
  // Example data structure
  return [
    { _id: '1', classType: { name: 'Yoga Flow', description: 'A relaxing yoga session.' }, trainer: { firstName: 'Jane', lastName: 'Doe' }, startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 25 * 3600 * 1000).toISOString(), capacity: 15, attendees: [], facility: { name: 'Studio A' }, status: 'Scheduled' },
    { _id: '2', classType: { name: 'HIIT Blast', description: 'High-Intensity Interval Training.' }, trainer: { firstName: 'John', lastName: 'Smith' }, startTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 49 * 3600 * 1000).toISOString(), capacity: 10, attendees: Array(10).fill('id'), facility: { name: 'Main Gym' }, status: 'Full' },
    { _id: '3', classType: { name: 'Spin Power', description: 'Intense cycling workout.' }, trainer: { firstName: 'Alice', lastName: 'Brown' }, startTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 73 * 3600 * 1000).toISOString(), capacity: 20, attendees: Array(5).fill('id'), facility: { name: 'Spin Room' }, status: 'Scheduled' },
  ];
};


const ViewScheduledClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext); // Get user info if needed

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError('');
      try {
        // const response = await fetch('/api/scheduledclasses?upcomingLimit=20'); // Fetch upcoming 20 classes
        // if (!response.ok) {
        //   throw new Error(`Failed to fetch classes: ${response.statusText} (${response.status})`);
        // }
        // const data = await response.json();
        const data = await apiGetScheduledClasses(); // Using dummy data for now
        setClasses(data);
      } catch (err) {
        console.error("Error fetching scheduled classes:", err);
        setError(err.message || 'Could not fetch scheduled classes.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Classes
      </Typography>
      {classes.length === 0 ? (
        <Typography variant="subtitle1">No classes currently scheduled or available.</Typography>
      ) : (
        <Grid container spacing={3}>
          {classes.map((sClass) => (
            <Grid item key={sClass._id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" gutterBottom>
                    {sClass.classType?.name || 'Unnamed Class'}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    Trainer: {sClass.trainer?.firstName} {sClass.trainer?.lastName || 'N/A'}
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disableGutters>
                      <ListItemText
                        primary="Date & Time:"
                        secondary={`${new Date(sClass.startTime).toLocaleString()} - ${new Date(sClass.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText primary="Location:" secondary={sClass.facility?.name || 'N/A'} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText primary="Status:" secondary={sClass.status} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText
                        primary="Availability:"
                        secondary={`${sClass.capacity - sClass.attendees.length} / ${sClass.capacity} spots`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    component={RouterLink}
                    to={`/classes/${sClass._id}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={sClass.status === 'Cancelled' || new Date(sClass.startTime) < new Date()}
                  >
                    View Details / Book
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ViewScheduledClassesPage;
