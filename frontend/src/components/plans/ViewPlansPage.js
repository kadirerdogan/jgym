import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, CircularProgress, Alert, Grid, Card, CardContent, CardActions, Button, Chip
} from '@mui/material';
import AuthContext from '../../context/AuthContext'; // To check if user is logged in for potential actions

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ViewPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext); // Get auth state for potential actions

  useEffect(() => {
    const fetchActivePlans = async () => {
      setLoading(true);
      setError('');
      try {
        // This endpoint should be public or require minimal authentication
        // In our backend, GET /api/plans returns active plans
        const response = await axios.get(`${API_URL}/plans`);
        setPlans(response.data);
      } catch (err) {
        console.error("Error fetching active plans:", err);
        setError(err.response?.data?.msg || 'Failed to fetch plans.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivePlans();
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
        Our Membership Plans
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {plans.length === 0 && !loading && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center' }}>
          No membership plans currently available. Please check back later.
        </Typography>
      )}

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item key={plan._id} xs={12} sm={6} md={4}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom color="primary">
                  {plan.name}
                </Typography>
                <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
                  ${plan.price.toFixed(2)}
                  <Typography variant="caption" component="span" sx={{ ml: 0.5 }}>
                    / {plan.duration === 30 ? 'month' : `${plan.duration} days`}
                  </Typography>
                </Typography>
                <Typography variant="body1" paragraph sx={{minHeight: '60px'}}>
                  {plan.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {plan.features && plan.features.length > 0 && (
                    <Typography variant="subtitle2" gutterBottom>Features:</Typography>
                  )}
                  {plan.features.map((feature, index) => (
                    <Chip label={feature} key={index} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', p:2 }}>
                {/* TODO: Implement "Choose Plan" or "Subscribe" functionality */}
                {/* This button's action would depend on whether user is logged in, etc. */}
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!authState.isAuthenticated} // Example: disable if not logged in
                  onClick={() => alert(`Subscribing to ${plan.name} - (Not Implemented)`)}
                >
                  {authState.isAuthenticated ? 'Choose Plan' : 'Login to Subscribe'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ViewPlansPage;
