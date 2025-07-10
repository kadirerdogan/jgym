import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert, Paper, Grid, Card, CardContent, Chip
} from '@mui/material';
import AuthContext from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ProfilePage() {
  const { authState, login } = useContext(AuthContext); // Using login to update context after profile update
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '', // Display only
    username: '', // Display only
    role: '', // Display only
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    if (authState.user) {
      setFormData({
        firstName: authState.user.firstName || '',
        lastName: authState.user.lastName || '',
        email: authState.user.email,
        username: authState.user.username,
        role: authState.user.role,
      });
      // Fetch full plan details if membershipPlan ID exists
      if (authState.user.membershipPlan && typeof authState.user.membershipPlan === 'string') {
        // If only ID is stored in user object, fetch plan details
        axios.get(`${API_URL}/plans/${authState.user.membershipPlan}`)
          .then(response => setCurrentPlan(response.data))
          .catch(err => console.error("Failed to fetch plan details", err));
      } else if (authState.user.membershipPlan && typeof authState.user.membershipPlan === 'object') {
        // If plan object is already populated
        setCurrentPlan(authState.user.membershipPlan);
      } else {
        setCurrentPlan(null);
      }
    }
  }, [authState.user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      };
      const body = JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      const response = await axios.put(`${API_URL}/auth/updatedetails`, body, config);

      // Update AuthContext with new user details
      // The 'login' function in AuthContext updates localStorage and state.
      // It expects token and user object. We have the token, and response.data is the updated user.
      login(authState.token, response.data);

      setFormSuccess('Profile updated successfully!');
      setIsEditMode(false);
    } catch (err) {
      console.error("Error updating profile:", err.response || err);
      setFormError(err.response?.data?.msg || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!authState.user) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField label="Username" value={formData.username} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Email" value={formData.email} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" />
          </Grid>

          {isEditMode ? (
            <>
              <Grid item xs={12} md={6}>
                <TextField name="firstName" label="First Name" value={formData.firstName} onChange={handleChange} fullWidth margin="normal" disabled={loading} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField name="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} fullWidth margin="normal" disabled={loading} />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} md={6}>
                <TextField label="First Name" value={formData.firstName || 'Not set'} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Last Name" value={formData.lastName || 'Not set'} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
            </>
          )}

          <Grid item xs={12} md={6}>
             <TextField label="Role" value={formData.role} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" />
          </Grid>
        </Grid>

        {currentPlan && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Current Membership Plan</Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" component="div">{currentPlan.name}</Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  ${currentPlan.price?.toFixed(2)} / {currentPlan.duration} days
                </Typography>
                <Typography variant="body2">{currentPlan.description}</Typography>
                <Box sx={{mt: 1}}>
                    {currentPlan.features?.map((feature, index) => (
                        <Chip key={index} label={feature} size="small" sx={{mr:0.5, mb:0.5}} />
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
        {!currentPlan && authState.user.role ==='member' && (
             <Typography sx={{mt:2, color:'text.secondary'}}>No active membership plan.</Typography>
        )}


        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          {isEditMode ? (
            <>
              <Button onClick={() => setIsEditMode(false)} disabled={loading} sx={{ mr: 1 }}>Cancel</Button>
              <Button onClick={handleUpdateProfile} variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditMode(true)} variant="contained">Edit Profile</Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default ProfilePage;
