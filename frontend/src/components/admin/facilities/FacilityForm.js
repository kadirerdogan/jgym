import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert,
  FormControlLabel, Checkbox, FormGroup, Paper, Grid, MenuItem, Select, InputLabel, FormControl,
  IconButton, Divider, Chip // Added Chip
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const FACILITY_TYPES = ['Equipment', 'Studio', 'Court', 'Pool', 'Meeting Room', 'Other'];
const FACILITY_STATUSES = ['Available', 'Under Maintenance', 'Unavailable', 'Restricted'];
const BOOKING_TYPES = ['hourly', 'daily', 'slot_based'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    operatingHours: [{ dayOfWeek: 'Monday', openTime: '09:00', closeTime: '17:00' }], // Default
    bookingType: 'hourly',
    slotDurationMinutes: '60',
    maxBookingLengthSlots: '3',
    bookingLeadTimeDays: '7',
  });
  const [loading, setLoading] = useState(false); // For form submission
  const [initialLoading, setInitialLoading] = useState(true); // Separate state for initial data load
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    // Renamed setLoading to setInitialLoading for clarity during data fetch
    if (isEditMode && authState.token) {
      setInitialLoading(true);
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
          operatingHours: facility.operatingHours && facility.operatingHours.length > 0 ? facility.operatingHours : [{ dayOfWeek: 'Monday', openTime: '09:00', closeTime: '17:00' }],
          bookingType: facility.bookingType || 'hourly',
          slotDurationMinutes: (facility.slotDurationMinutes || 60).toString(),
          maxBookingLengthSlots: (facility.maxBookingLengthSlots || 3).toString(),
          bookingLeadTimeDays: (facility.bookingLeadTimeDays !== undefined ? facility.bookingLeadTimeDays : 7).toString(),
        });
        setInitialLoading(false); // Finish initial loading
      })
      .catch(err => {
        console.error("Error fetching facility details:", err);
        setFormError(err.response?.data?.msg || 'Failed to fetch facility details.');
        setInitialLoading(false); // Finish initial loading even on error
      });
    } else {
      setInitialLoading(false); // Not edit mode or no token, finish initial loading
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, isEditMode, authState.token]);

  const handleOperatingHoursChange = (index, field, value) => {
    const updatedHours = [...formData.operatingHours];
    updatedHours[index][field] = value;
    setFormData(prev => ({ ...prev, operatingHours: updatedHours }));
  };

  const addOperatingHourSlot = () => {
    const usedDays = formData.operatingHours.map(oh => oh.dayOfWeek);
    const availableDay = DAYS_OF_WEEK.find(d => !usedDays.includes(d)) || 'Monday'; // Default or find unused
    setFormData(prev => ({
      ...prev,
      operatingHours: [...prev.operatingHours, { dayOfWeek: availableDay, openTime: '09:00', closeTime: '17:00' }]
    }));
  };

  const removeOperatingHourSlot = (index) => {
    // Prevent removing the last slot if you want to enforce at least one, or add validation elsewhere
    // if (formData.operatingHours.length <= 1) return;
    const updatedHours = formData.operatingHours.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, operatingHours: updatedHours }));
  };

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

    // Validate operating hours before submission
    for (const oh of formData.operatingHours) {
        if (oh.openTime >= oh.closeTime) {
            setFormError(`Invalid time for ${oh.dayOfWeek}: Open time must be before close time.`);
            setLoading(false);
            return;
        }
    }

    const facilityDataPayload = {
      ...formData,
      capacity: parseInt(formData.capacity, 10),
      slotDurationMinutes: parseInt(formData.slotDurationMinutes, 10),
      maxBookingLengthSlots: parseInt(formData.maxBookingLengthSlots, 10),
      bookingLeadTimeDays: parseInt(formData.bookingLeadTimeDays, 10),
      // operatingHours is already an array of objects
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

  // Use initialLoading for the main page loader, not submission loading state
  if (initialLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Changed to lg for more space */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Facility' : 'Create New Facility'}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFormSuccess('')}>{formSuccess}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Info Section */}
            <Grid item xs={12}><Typography variant="h6">Basic Information</Typography></Grid>
            <Grid item xs={12} md={6}>
              <TextField name="name" label="Facility Name" value={formData.name} onChange={handleChange} fullWidth required disabled={loading} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel id="type-select-label">Type</InputLabel>
                <Select labelId="type-select-label" name="type" value={formData.type} label="Type" onChange={handleChange}>
                  {FACILITY_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField name="description" label="Description" value={formData.description} onChange={handleChange} fullWidth required multiline rows={3} disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField name="capacity" label="Capacity" type="number" value={formData.capacity} onChange={handleChange} fullWidth required InputProps={{ inputProps: { min: 0 } }} disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select labelId="status-select-label" name="status" value={formData.status} label="Status" onChange={handleChange}>
                  {FACILITY_STATUSES.map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormGroup sx={{height: '100%', display: 'flex', justifyContent: 'center'}}>
                <FormControlLabel control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleChange} disabled={loading} />} label="Facility is Active" />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" label="Additional Notes (optional)" value={formData.notes} onChange={handleChange} fullWidth multiline rows={2} disabled={loading}/>
            </Grid>

            {/* Booking Configuration Section */}
            <Grid item xs={12}><Divider sx={{my:2}}><Chip label="Booking Configuration" /></Divider></Grid>
            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required disabled={loading}>
                    <InputLabel id="bookingType-select-label">Booking Type</InputLabel>
                    <Select labelId="bookingType-select-label" name="bookingType" value={formData.bookingType} label="Booking Type" onChange={handleChange}>
                        {BOOKING_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <TextField name="slotDurationMinutes" label="Slot Duration (Minutes)" type="number" value={formData.slotDurationMinutes} onChange={handleChange} fullWidth required InputProps={{inputProps: {min: 15}}} disabled={loading} helperText="e.g., 60 for hourly bookings"/>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <TextField name="maxBookingLengthSlots" label="Max Booking Length (Slots)" type="number" value={formData.maxBookingLengthSlots} onChange={handleChange} fullWidth required InputProps={{inputProps: {min: 1}}} disabled={loading} helperText="Max consecutive slots per booking"/>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <TextField name="bookingLeadTimeDays" label="Booking Lead Time (Days)" type="number" value={formData.bookingLeadTimeDays} onChange={handleChange} fullWidth required InputProps={{inputProps: {min: 0}}} disabled={loading} helperText="Days in advance bookings open (0 for same day)"/>
            </Grid>

            {/* Operating Hours Section */}
            <Grid item xs={12}><Divider sx={{my:2}}><Chip label="Operating Hours" /></Divider></Grid>
            {formData.operatingHours.map((oh, index) => (
                <Grid item container spacing={2} xs={12} key={index} alignItems="center" sx={{mb:1}}>
                    <Grid item xs={12} sm={4} md={3}>
                        <FormControl fullWidth required disabled={loading} size="small">
                            <InputLabel>Day</InputLabel>
                            <Select name="dayOfWeek" value={oh.dayOfWeek} label="Day" onChange={(e) => handleOperatingHoursChange(index, 'dayOfWeek', e.target.value)}>
                                {DAYS_OF_WEEK.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={5} sm={3} md={3}>
                        <TextField label="Open Time" type="time" name="openTime" value={oh.openTime} onChange={(e) => handleOperatingHoursChange(index, 'openTime', e.target.value)} fullWidth required InputLabelProps={{ shrink: true }} size="small" disabled={loading}/>
                    </Grid>
                    <Grid item xs={5} sm={3} md={3}>
                        <TextField label="Close Time" type="time" name="closeTime" value={oh.closeTime} onChange={(e) => handleOperatingHoursChange(index, 'closeTime', e.target.value)} fullWidth required InputLabelProps={{ shrink: true }} size="small" disabled={loading}/>
                    </Grid>
                    <Grid item xs={2} sm={2} md={3} sx={{textAlign: {xs: 'right', sm:'left'}}}>
                        <IconButton onClick={() => removeOperatingHourSlot(index)} color="error" disabled={loading || formData.operatingHours.length === 0}>
                            <RemoveCircleOutline />
                        </IconButton>
                    </Grid>
                </Grid>
            ))}
            <Grid item xs={12}>
                <Button onClick={addOperatingHourSlot} startIcon={<AddCircleOutline />} variant="outlined" size="small" disabled={loading || formData.operatingHours.length >= 7}>Add Operating Day</Button>
            </Grid>


            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" component={RouterLink} to="/admin/facilities" disabled={loading || initialLoading}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading || initialLoading}>
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
