import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, CircularProgress, Alert, Grid, Card, CardContent, CardActions, Button, Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Import RouterLink
// import AuthContext from '../../context/AuthContext'; // If needed for booking actions

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ViewFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // const { authState } = useContext(AuthContext); // For potential future actions like booking

  useEffect(() => {
    const fetchActiveFacilities = async () => {
      setLoading(true);
      setError('');
      try {
        // This endpoint GET /api/facilities returns active facilities
        const response = await axios.get(`${API_URL}/facilities`);
        setFacilities(response.data);
      } catch (err) {
        console.error("Error fetching active facilities:", err);
        setError(err.response?.data?.msg || 'Failed to fetch facilities.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveFacilities();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Our Gym Facilities
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {facilities.length === 0 && !loading && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center' }}>
          No facilities currently listed or available. Please check back later.
        </Typography>
      )}

      <Grid container spacing={4} justifyContent="center">
        {facilities.map((facility) => (
          <Grid item key={facility._id} xs={12} sm={6} md={4}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom color="primary">
                  {facility.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Type: {facility.type}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Capacity: {facility.capacity}
                </Typography>
                <Chip
                    label={facility.status}
                    color={facility.status === 'Available' ? 'success' : facility.status === 'Under Maintenance' ? 'warning' : 'default'}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <Typography variant="body2" paragraph sx={{minHeight: '60px'}}>
                  {facility.description}
                </Typography>
                {facility.notes && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{mt:1}}>
                        Note: {facility.notes}
                    </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                <Button
                  variant="contained"
                  color="secondary" // Using secondary color from theme
                  component={RouterLink}
                  to={`/facilities/${facility._id}/availability`} // Link to the new availability page
                  disabled={facility.status !== 'Available' || !facility.isActive}
                >
                  View Availability & Book
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ViewFacilitiesPage;
