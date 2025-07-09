import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert,
  FormControlLabel, Checkbox, FormGroup, Paper, Grid, Chip, Stack
} from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ClassTypeForm() {
  const { classTypeId } = useParams();
  const isEditMode = Boolean(classTypeId);
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultDurationMinutes: '60',
    requiredEquipment: [], // Array of strings
    isActive: true,
  });
  const [equipmentInput, setEquipmentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (isEditMode && authState.token) {
      setInitialLoading(true);
      axios.get(`${API_URL}/classtypes/${classTypeId}`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      })
      .then(response => {
        const ct = response.data;
        setFormData({
          name: ct.name,
          description: ct.description,
          defaultDurationMinutes: ct.defaultDurationMinutes.toString(),
          requiredEquipment: ct.requiredEquipment || [],
          isActive: ct.isActive,
        });
        setInitialLoading(false);
      })
      .catch(err => {
        console.error("Error fetching class type details:", err);
        setFormError(err.response?.data?.msg || 'Failed to fetch class type details.');
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classTypeId, isEditMode, authState.token]);

  const handleEquipmentAdd = () => {
    if (equipmentInput && !formData.requiredEquipment.includes(equipmentInput.trim())) {
      setFormData(prev => ({ ...prev, requiredEquipment: [...prev.requiredEquipment, equipmentInput.trim()] }));
      setEquipmentInput('');
    }
  };

  const handleEquipmentDelete = (equipToDelete) => {
    setFormData(prev => ({ ...prev, requiredEquipment: prev.requiredEquipment.filter(eq => eq !== equipToDelete) }));
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

    const payload = {
      ...formData,
      defaultDurationMinutes: parseInt(formData.defaultDurationMinutes, 10),
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/classtypes/${classTypeId}`, payload, config);
        setFormSuccess('Class Type updated successfully!');
      } else {
        await axios.post(`${API_URL}/classtypes`, payload, config);
        setFormSuccess('Class Type created successfully!');
      }

      setTimeout(() => {
        navigate('/admin/classtypes');
      }, 1500);

    } catch (err) {
      console.error("Error submitting class type form:", err.response || err);
      setFormError(err.response?.data?.msg || `Failed to ${isEditMode ? 'update' : 'create'} class type.`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading && isEditMode) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: {xs:2, md:4} }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Class Type' : 'Create New Class Type'}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={()=>setFormError('')}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={()=>setFormSuccess('')}>{formSuccess}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField name="name" label="Class Type Name" value={formData.name} onChange={handleChange} fullWidth required disabled={loading} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="description" label="Description" value={formData.description} onChange={handleChange} fullWidth required multiline rows={3} disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="defaultDurationMinutes" label="Default Duration (minutes)" type="number" value={formData.defaultDurationMinutes} onChange={handleChange} fullWidth required InputProps={{ inputProps: { min: 15 } }} disabled={loading} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Required Equipment</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  label="Add Equipment"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  size="small"
                  sx={{ mr: 1, flexGrow: 1 }}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEquipmentAdd(); }}}
                />
                <Button variant="outlined" onClick={handleEquipmentAdd} startIcon={<AddCircleOutline />} size="small">Add</Button>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {formData.requiredEquipment.map(eq => (
                  <Chip key={eq} label={eq} onDelete={() => handleEquipmentDelete(eq)} />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleChange} disabled={loading} />} label="Class Type is Active" />
              </FormGroup>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" component={RouterLink} to="/admin/classtypes" disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Class Type' : 'Create Class Type')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default ClassTypeForm;
