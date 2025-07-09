import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';

// Define the API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function PlanListPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      };
      // Admin gets all plans, including inactive ones
      const response = await axios.get(`${API_URL}/plans/all`, config);
      setPlans(response.data);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err.response?.data?.msg || 'Failed to fetch plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.token) {
      fetchPlans();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan permanently?')) {
      return;
    }
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      };
      await axios.delete(`${API_URL}/plans/${planId}`, config);
      // Refresh plans list
      fetchPlans();
    } catch (err) {
      console.error("Error deleting plan:", err);
      setError(err.response?.data?.msg || 'Failed to delete plan.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Membership Plans
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          component={RouterLink}
          to="/admin/plans/new" // Route for creating a new plan
        >
          Add New Plan
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Duration (Days)</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Features</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.length === 0 && !loading ? (
                <TableRow>
                    <TableCell colSpan={6} align="center">No plans found.</TableCell>
                </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow
                  key={plan._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {plan.name}
                  </TableCell>
                  <TableCell>${plan.price.toFixed(2)}</TableCell>
                  <TableCell>{plan.duration}</TableCell>
                  <TableCell>{plan.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{plan.features.join(', ')}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Plan">
                      <IconButton
                        color="primary"
                        component={RouterLink}
                        to={`/admin/plans/edit/${plan._id}`}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Plan">
                      <IconButton color="error" onClick={() => handleDeletePlan(plan._id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default PlanListPage;
