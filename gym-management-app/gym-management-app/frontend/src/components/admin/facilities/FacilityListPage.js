import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Tooltip
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function FacilityListPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext);

  const fetchFacilities = async () => {
    setLoading(true);
    setError('');
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` },
      };
      // Admin gets all facilities, including inactive ones
      const response = await axios.get(`${API_URL}/facilities/all`, config);
      setFacilities(response.data);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setError(err.response?.data?.msg || 'Failed to fetch facilities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.token) {
      fetchFacilities();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  const handleDeleteFacility = async (facilityId) => {
    if (!window.confirm('Are you sure you want to delete this facility permanently?')) {
      return;
    }
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` },
      };
      await axios.delete(`${API_URL}/facilities/${facilityId}`, config);
      fetchFacilities(); // Refresh list
    } catch (err) {
      console.error("Error deleting facility:", err);
      setError(err.response?.data?.msg || 'Failed to delete facility.');
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Facilities
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          component={RouterLink}
          to="/admin/facilities/new"
        >
          Add New Facility
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="facilities table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facilities.length === 0 && !loading ? (
                <TableRow>
                    <TableCell colSpan={6} align="center">No facilities found.</TableCell>
                </TableRow>
            ) : (
              facilities.map((facility) => (
                <TableRow key={facility._id}>
                  <TableCell component="th" scope="row">{facility.name}</TableCell>
                  <TableCell>{facility.type}</TableCell>
                  <TableCell>{facility.capacity}</TableCell>
                  <TableCell>
                    <Chip
                        label={facility.status}
                        color={facility.status === 'Available' ? 'success' : facility.status === 'Under Maintenance' ? 'warning' : 'default'}
                        size="small"
                    />
                  </TableCell>
                  <TableCell>{facility.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Facility">
                      <IconButton
                        color="primary"
                        component={RouterLink}
                        to={`/admin/facilities/edit/${facility._id}`}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Facility">
                      <IconButton color="error" onClick={() => handleDeleteFacility(facility._id)}>
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

export default FacilityListPage;
