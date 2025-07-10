import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert,
  Paper, Grid, MenuItem, Select, InputLabel, FormControl
  // FormGroup, FormControlLabel, Checkbox were removed as they are unused (part of commented code)
} from '@mui/material';
import { AdapterDateFnsV3 } from '@mui/x-date-pickers/AdapterDateFnsV3'; // Reverted to V3 adapter
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import AuthContext from '../../../context/AuthContext';
import { formatISO, parseISO } from 'date-fns'; // For ISO string conversion

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ScheduledClassForm() {
  const { scheduledClassId } = useParams();
  const isEditMode = Boolean(scheduledClassId);
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    classTypeId: '',
    trainerId: '',
    facilityId: '', // Optional
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // Default 1 hour later
    capacity: '10',
    notes: '',
    status: 'Scheduled', // Default status
    isRecurring: false, // Simplified for now
  });

  const [classTypes, setClassTypes] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const [loading, setLoading] = useState(false); // For form submission
  const [initialLoading, setInitialLoading] = useState(true); // For fetching dropdown data and existing class data
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch data for dropdowns (ClassTypes, Trainers, Facilities) and existing ScheduledClass if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!authState.token) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      setFormError('');
      try {
        const config = { headers: { Authorization: `Bearer ${authState.token}` } };

        const [classTypesRes, usersRes, facilitiesRes] = await Promise.all([
          axios.get(`${API_URL}/classtypes/active`, config), // Fetch only active class types
          axios.get(`${API_URL}/users`, config), // Fetches members and trainers (filter for trainers)
          axios.get(`${API_URL}/facilities/all`, config) // Fetch all facilities (admin might schedule in inactive ones intentionally)
        ]);

        setClassTypes(classTypesRes.data);
        setTrainers(usersRes.data.filter(user => user.role === 'trainer' && user.isActive));
        setFacilities(facilitiesRes.data); // Admins can choose any facility

        if (isEditMode) {
          const scheduledClassRes = await axios.get(`${API_URL}/scheduledclasses/${scheduledClassId}`, config);
          const sc = scheduledClassRes.data;
          setFormData({
            classTypeId: sc.classType?._id || '',
            trainerId: sc.trainer?._id || '',
            facilityId: sc.facility?._id || '',
            startTime: parseISO(sc.startTime), // Parse ISO string to Date object
            endTime: parseISO(sc.endTime),     // Parse ISO string to Date object
            capacity: sc.capacity.toString(),
            notes: sc.notes || '',
            status: sc.status,
            isRecurring: sc.isRecurring || false,
          });
        }
      } catch (err) {
        console.error("Error fetching data for form:", err);
        setFormError(err.response?.data?.msg || 'Failed to fetch required data for the form.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledClassId, isEditMode, authState.token]);


  const handleDateTimeChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
     // Auto-update end time if start time changes and classType is selected
     if (name === 'startTime' && formData.classTypeId) {
        const selectedClassType = classTypes.find(ct => ct._id === formData.classTypeId);
        if (selectedClassType && selectedClassType.defaultDurationMinutes) {
            const newEndTime = new Date(date.getTime() + selectedClassType.defaultDurationMinutes * 60000);
            setFormData(prev => ({ ...prev, endTime: newEndTime }));
        }
    }
  };

  const handleClassTypeChange = (e) => {
    const selectedClassTypeId = e.target.value;
    setFormData(prev => ({ ...prev, classTypeId: selectedClassTypeId }));
    // Auto-update end time based on selected class type's default duration
    const selectedClassType = classTypes.find(ct => ct._id === selectedClassTypeId);
    if (selectedClassType && selectedClassType.defaultDurationMinutes && formData.startTime) {
        const newEndTime = new Date(formData.startTime.getTime() + selectedClassType.defaultDurationMinutes * 60000);
        setFormData(prev => ({ ...prev, endTime: newEndTime }));
    }
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

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        setFormError('End time must be after start time.');
        setLoading(false);
        return;
    }

    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity, 10),
      // Ensure dates are sent in a format backend expects (e.g., ISO string)
      startTime: formatISO(formData.startTime),
      endTime: formatISO(formData.endTime),
      facilityId: formData.facilityId === '' ? null : formData.facilityId, // Send null if empty
    };
    // Remove classTypeId from payload name to match backend expectation
    payload.classTypeId = formData.classTypeId;


    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/scheduledclasses/${scheduledClassId}`, payload, config);
        setFormSuccess('Scheduled Class updated successfully!');
      } else {
        await axios.post(`${API_URL}/scheduledclasses`, payload, config);
        setFormSuccess('Class scheduled successfully!');
      }

      setTimeout(() => {
        navigate('/admin/scheduledclasses');
      }, 1500);

    } catch (err) {
      console.error("Error submitting scheduled class form:", err.response || err);
      setFormError(err.response?.data?.msg || `Failed to ${isEditMode ? 'update' : 'schedule'} class.`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Paper elevation={3} sx={{ p: {xs:2, md:4} }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {isEditMode ? 'Edit Scheduled Class' : 'Schedule New Class'}
          </Typography>

          {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={()=>setFormError('')}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={()=>setFormSuccess('')}>{formSuccess}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={loading || initialLoading}>
                  <InputLabel id="classType-select-label">Class Type</InputLabel>
                  <Select labelId="classType-select-label" name="classTypeId" value={formData.classTypeId} label="Class Type" onChange={handleClassTypeChange}>
                    {classTypes.map(ct => <MenuItem key={ct._id} value={ct._id}>{ct.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={loading || initialLoading}>
                  <InputLabel id="trainer-select-label">Trainer</InputLabel>
                  <Select labelId="trainer-select-label" name="trainerId" value={formData.trainerId} label="Trainer" onChange={handleChange}>
                    {trainers.map(t => <MenuItem key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.username})</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading || initialLoading}>
                  <InputLabel id="facility-select-label">Facility (Optional)</InputLabel>
                  <Select labelId="facility-select-label" name="facilityId" value={formData.facilityId} label="Facility (Optional)" onChange={handleChange}>
                    <MenuItem value=""><em>None</em></MenuItem>
                    {facilities.map(f => <MenuItem key={f._id} value={f._id} disabled={!f.isActive && formData.facilityId !== f._id}>{f.name} ({f.isActive ? 'Active': 'Inactive'})</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="capacity" label="Capacity" type="number" value={formData.capacity} onChange={handleChange} fullWidth required InputProps={{ inputProps: { min: 1 } }} disabled={loading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker label="Start Time" value={formData.startTime} onChange={(newValue) => handleDateTimeChange('startTime', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />} disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker label="End Time" value={formData.endTime} onChange={(newValue) => handleDateTimeChange('endTime', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />} disabled={loading}
                />
              </Grid>
               {isEditMode && (
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required disabled={loading}>
                        <InputLabel id="status-select-label">Status</InputLabel>
                        <Select labelId="status-select-label" name="status" value={formData.status} label="Status" onChange={handleChange}>
                            {['Scheduled', 'Full', 'Completed', 'Cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
               )}
              <Grid item xs={12}>
                <TextField name="notes" label="Notes (Optional)" value={formData.notes} onChange={handleChange} fullWidth multiline rows={3} disabled={loading} />
              </Grid>
              {/* Basic Recurrence - Future Enhancement
              <Grid item xs={12}>
                <FormGroup>
                  <FormControlLabel control={<Checkbox name="isRecurring" checked={formData.isRecurring} onChange={handleChange} disabled={loading} />} label="This is a recurring class" />
                </FormGroup>
              </Grid>
              */}
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" component={RouterLink} to="/admin/scheduledclasses" disabled={loading}>Cancel</Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading || initialLoading}>
                  {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Scheduled Class' : 'Schedule Class')}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </LocalizationProvider>
    </Container>
  );
}

export default ScheduledClassForm;
