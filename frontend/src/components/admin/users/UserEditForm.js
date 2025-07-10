import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert,
  FormControlLabel, Checkbox, FormGroup, Paper, Grid, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const USER_ROLES = ['member', 'trainer', 'admin']; // Admins should be cautious changing roles

function UserEditForm() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: 'member',
    isActive: true,
    membershipPlanId: '', // Store plan ID
  });
  const [allPlans, setAllPlans] = useState([]); // To populate plan dropdown
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // For initial data fetch
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch user details and available plans on component mount
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

        // Fetch user details
        const userRes = await axios.get(`${API_URL}/users/${userId}`, config);
        const userData = userRes.data;
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email,
          username: userData.username,
          role: userData.role,
          isActive: userData.isActive,
          membershipPlanId: userData.membershipPlan?._id || '', // Handle if plan is null
        });

        // Fetch all plans for the dropdown (admins see all plans)
        const plansRes = await axios.get(`${API_URL}/plans/all`, config);
        setAllPlans(plansRes.data);

      } catch (err) {
        console.error("Error fetching data for user edit:", err);
        setFormError(err.response?.data?.msg || 'Failed to fetch required data.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authState.token]);

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

    const { membershipPlanId, ...payload } = formData;
    const finalPayload = {
        ...payload,
        // Send null if empty string, otherwise send the ID
        membershipPlanId: membershipPlanId === "" ? null : membershipPlanId,
    };


    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      };
      await axios.put(`${API_URL}/users/${userId}`, finalPayload, config);
      setFormSuccess('User updated successfully!');
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      console.error("Error updating user:", err.response || err);
      setFormError(err.response?.data?.msg || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit User: {formData.username}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}><TextField name="firstName" label="First Name" value={formData.firstName} onChange={handleChange} fullWidth disabled={loading} /></Grid>
            <Grid item xs={12} sm={6}><TextField name="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} fullWidth disabled={loading} /></Grid>
            <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={formData.email} onChange={handleChange} fullWidth required disabled={loading}/></Grid>
            <Grid item xs={12} sm={6}><TextField name="username" label="Username" value={formData.username} onChange={handleChange} fullWidth required disabled={loading}/></Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading || formData.role === 'admin'}> {/* Disable role change for admin for safety */}
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select labelId="role-select-label" name="role" value={formData.role} label="Role" onChange={handleChange}
                  // Prevent admin from changing their own role or another admin's role easily here
                  readOnly={formData.role === 'admin' && authState.user?.id === userId}
                >
                  {USER_ROLES.map(role => <MenuItem key={role} value={role} disabled={role === 'admin' && formData.role !== 'admin'}>{role}</MenuItem>)}
                </Select>
                 {formData.role === 'admin' && <Typography variant="caption" color="warning.main">Admin role cannot be changed here.</Typography>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel id="plan-select-label">Membership Plan</InputLabel>
                <Select labelId="plan-select-label" name="membershipPlanId" value={formData.membershipPlanId} label="Membership Plan" onChange={handleChange}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {allPlans.map(plan => (
                    <MenuItem key={plan._id} value={plan._id} disabled={!plan.isActive && formData.membershipPlanId !== plan._id}>
                      {plan.name} ({plan.isActive ? 'Active' : 'Inactive'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel control={
                    <Checkbox name="isActive" checked={formData.isActive} onChange={handleChange}
                              disabled={loading || (formData.role === 'admin' && authState.user?.id === userId)} // Prevent admin self-deactivation
                    />}
                    label="User is Active"
                />
                {formData.role === 'admin' && authState.user?.id === userId && !formData.isActive &&
                    <Typography variant="caption" color="warning.main">Admin cannot deactivate their own account here.</Typography>}
              </FormGroup>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" component={RouterLink} to="/admin/users" disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Update User'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default UserEditForm;
