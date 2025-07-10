import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert,
  Paper, Grid, Chip, IconButton, Select, MenuItem, InputLabel, FormControl // Stack removed, Select, MenuItem etc added for availability
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import AuthContext from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TrainerProfileForm() {
  // const navigate = useNavigate(); // Was unused
  const { authState /*, login*/ } = useContext(AuthContext); // login was unused

  const [formData, setFormData] = useState({
    specializations: [], // Array of strings
    bio: '',
    availability: [{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }], // Default availability slot
  });
  const [specializationInput, setSpecializationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authState.token) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${authState.token}` } };
        const response = await axios.get(`${API_URL}/trainer-profiles/me`, config);
        const profile = response.data;
        setFormData({
          specializations: profile.specializations || [],
          bio: profile.bio || '',
          availability: profile.availability && profile.availability.length > 0 ? profile.availability : [{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }],
        });
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // Profile not found, use default form data (already set)
          setFormError('No profile found. Please create yours.');
        } else {
          console.error("Error fetching trainer profile:", err);
          setFormError(err.response?.data?.msg || 'Failed to fetch profile.');
        }
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, [authState.token]);

  const handleSpecializationAdd = () => {
    if (specializationInput && !formData.specializations.includes(specializationInput.trim())) {
      setFormData(prev => ({ ...prev, specializations: [...prev.specializations, specializationInput.trim()] }));
      setSpecializationInput('');
    }
  };

  const handleSpecializationDelete = (specToDelete) => {
    setFormData(prev => ({ ...prev, specializations: prev.specializations.filter(spec => spec !== specToDelete) }));
  };

  const handleAvailabilityChange = (index, field, value) => {
    const updatedAvailability = [...formData.availability];
    updatedAvailability[index][field] = value;
    setFormData(prev => ({ ...prev, availability: updatedAvailability }));
  };

  const addAvailabilitySlot = () => {
    setFormData(prev => ({
      ...prev,
      availability: [...prev.availability, { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }]
    }));
  };

  const removeAvailabilitySlot = (index) => {
    if (formData.availability.length <= 1) {
        setFormError("At least one availability slot is required.");
        return;
    }
    const updatedAvailability = formData.availability.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, availability: updatedAvailability }));
  };


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setFormSuccess('');

    // Validate availability times
    for (const slot of formData.availability) {
        if (slot.startTime >= slot.endTime) {
            setFormError(`Error in slot for ${slot.dayOfWeek}: Start time must be before end time.`);
            setLoading(false);
            return;
        }
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      };
      // POST will create or update based on backend logic
      // const response = await axios.post(`${API_URL}/trainer-profiles/me`, formData, config); // response was unused
      await axios.post(`${API_URL}/trainer-profiles/me`, formData, config);
      setFormSuccess('Trainer profile saved successfully!');
      // Optionally update authState if trainer profile details are stored there (not currently the case)
      // login(authState.token, { ...authState.user, trainerProfile: response.data }); // login was commented out as unused

      // Navigate or give feedback
      // setTimeout(() => navigate('/dashboard'), 1500); // navigate was commented out as unused
    } catch (err) {
      console.error("Error saving trainer profile:", err.response || err);
      setFormError(err.response?.data?.msg || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb:4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Trainer Profile
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFormSuccess('')}>{formSuccess}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Specializations</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  label="Add Specialization"
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  size="small"
                  sx={{ mr: 1, flexGrow: 1 }}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSpecializationAdd(); }}}
                />
                <Button variant="outlined" onClick={handleSpecializationAdd} startIcon={<AddCircleOutline />}>Add</Button>
              </Box>
              <Box>
                {formData.specializations.map(spec => (
                  <Chip key={spec} label={spec} onDelete={() => handleSpecializationDelete(spec)} sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField name="bio" label="Bio / About Me" value={formData.bio} onChange={handleChange} fullWidth multiline rows={4} disabled={loading} helperText="Max 500 characters."/>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Availability</Typography>
              {formData.availability.map((slot, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Day</InputLabel>
                        <Select name="dayOfWeek" value={slot.dayOfWeek} label="Day" onChange={(e) => handleAvailabilityChange(index, 'dayOfWeek', e.target.value)}>
                          {DAYS_OF_WEEK.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={5} sm={3}>
                      <TextField label="Start Time" type="time" name="startTime" value={slot.startTime} onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} size="small"/>
                    </Grid>
                    <Grid item xs={5} sm={3}>
                      <TextField label="End Time" type="time" name="endTime" value={slot.endTime} onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} size="small"/>
                    </Grid>
                    <Grid item xs={2} sm={3} textAlign="right">
                      <IconButton onClick={() => removeAvailabilitySlot(index)} color="error" disabled={formData.availability.length <= 1}>
                        <RemoveCircleOutline />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button onClick={addAvailabilitySlot} startIcon={<AddCircleOutline />} variant="outlined" size="small">Add Time Slot</Button>
            </Grid>

            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Save Profile'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default TrainerProfileForm;
