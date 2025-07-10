import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert,
  FormControlLabel, Checkbox, FormGroup, Paper, Grid
} from '@mui/material';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function PlanForm() {
  const { planId } = useParams(); // For editing existing plan
  const isEditMode = Boolean(planId);
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '', // in days
    features: '', // Comma-separated string for input, will be converted to array
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (isEditMode && authState.token) {
      setLoading(true);
      axios.get(`${API_URL}/plans/${planId}`, {
        headers: { Authorization: `Bearer ${authState.token}` } // Admin can fetch any plan by ID
      })
      .then(response => {
        const plan = response.data;
        setFormData({
          name: plan.name,
          description: plan.description,
          price: plan.price.toString(),
          duration: plan.duration.toString(),
          features: plan.features.join(', '), // Convert array to comma-separated string for TextField
          isActive: plan.isActive,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching plan details:", err);
        setFormError(err.response?.data?.msg || 'Failed to fetch plan details.');
        setLoading(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, isEditMode, authState.token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setFormSuccess('');

    const planDataPayload = {
      ...formData,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration, 10),
      features: formData.features.split(',').map(f => f.trim()).filter(f => f), // Convert string to array
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/plans/${planId}`, planDataPayload, config);
        setFormSuccess('Plan updated successfully!');
      } else {
        await axios.post(`${API_URL}/plans`, planDataPayload, config);
        setFormSuccess('Plan created successfully!');
      }

      setTimeout(() => {
        navigate('/admin/plans'); // Redirect to plans list after a short delay
      }, 1500);

    } catch (err) {
      console.error("Error submitting plan form:", err.response || err);
      setFormError(err.response?.data?.msg || `Failed to ${isEditMode ? 'update' : 'create'} plan.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.name) { // Show loader only on initial fetch for edit mode
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Plan' : 'Create New Plan'}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Plan Name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={3}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Price ($)"
                type="number"
                value={formData.price}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="duration"
                label="Duration (days)"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 1 } }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="features"
                label="Features (comma-separated)"
                value={formData.features}
                onChange={handleChange}
                fullWidth
                helperText="e.g., Access to cardio, Weightlifting area, 2 group classes"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  }
                  label="Plan is Active"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/admin/plans"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Plan' : 'Create Plan')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default PlanForm;
