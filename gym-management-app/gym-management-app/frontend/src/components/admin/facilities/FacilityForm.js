import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert,
  FormControlLabel, Checkbox, FormGroup, Paper, Grid, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const FACILITY_TYPES = ['Equipment', 'Studio', 'Court', 'Pool', 'Other']; // Example types
const FACILITY_STATUSES = ['Available', 'Under Maintenance', 'Unavailable', 'Restricted'];

function FacilityForm() {
  const { facilityId } = useParams();
  const isEditMode = Boolean(facilityId);
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    capacity: '1',
    status: 'Available',
    notes: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (isEditMode && authState.token) {
      setLoading(true);
      axios.get(`${API_URL}/facilities/${facilityId}`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      })
      .then(response => {
        const facility = response.data;
        setFormData({
          name: facility.name,
          description: facility.description,
          type: facility.type,
          capacity: facility.capacity.toString(),
          status: facility.status,
          notes: facility.notes || '',
          isActive: facility.isActive,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching facility details:", err);
        setFormError(err.response?.data?.msg || 'Failed to fetch facility details.');
        setLoading(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, isEditMode, authState.token]);

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

    const facilityDataPayload = {
      ...formData,
      capacity: parseInt(formData.capacity, 10),
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/facilities/${facilityId}`, facilityDataPayload, config);
        setFormSuccess('Facility updated successfully!');
      } else {
        await axios.post(`${API_URL}/facilities`, facilityDataPayload, config);
        setFormSuccess('Facility created successfully!');
      }

      setTimeout(() => {
        navigate('/admin/facilities');
      }, 1500);

    } catch (err) {
      console.error("Error submitting facility form:", err.response || err);
      setFormError(err.response?.data?.msg || `Failed to ${isEditMode ? 'update' : 'create'} facility.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.name) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Facility' : 'Create New Facility'}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField name="name" label="Facility Name" value={formData.name} onChange={handleChange} fullWidth required disabled={loading} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="description" label="Description" value={formData.description} onChange={handleChange} fullWidth required multiline rows={3} disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel id="type-select-label">Type</InputLabel>
                <Select labelId="type-select-label" id="type" name="type" value={formData.type} label="Type" onChange={handleChange}>
                  {FACILITY_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="capacity" label="Capacity" type="number" value={formData.capacity} onChange={handleChange} fullWidth required InputProps={{ inputProps: { min: 0 } }} disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select labelId="status-select-label" id="status" name="status" value={formData.status} label="Status" onChange={handleChange}>
                  {FACILITY_STATUSES.map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" label="Additional Notes (optional)" value={formData.notes} onChange={handleChange} fullWidth multiline rows={2} disabled={loading}/>
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleChange} disabled={loading} />} label="Facility is Active" />
              </FormGroup>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" component={RouterLink} to="/admin/facilities" disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Facility' : 'Create Facility')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default FacilityForm;
