import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip
} from '@mui/material';
import { Edit, Delete, Add, CheckCircleOutline, CancelOutlined } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ClassTypeListPage() {
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext);

  const fetchClassTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      // Admin gets all class types from /api/classtypes (which includes inactive)
      const response = await axios.get(`${API_URL}/classtypes`, config);
      setClassTypes(response.data);
    } catch (err) {
      console.error("Error fetching class types:", err);
      setError(err.response?.data?.msg || 'Failed to fetch class types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.token) {
      fetchClassTypes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  const handleDeleteClassType = async (classTypeId) => {
    if (!window.confirm('Are you sure you want to delete this class type permanently? This might affect scheduled classes.')) {
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      await axios.delete(`${API_URL}/classtypes/${classTypeId}`, config);
      fetchClassTypes(); // Refresh list
    } catch (err) {
      console.error("Error deleting class type:", err);
      setError(err.response?.data?.msg || 'Failed to delete class type.');
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Class Types
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          component={RouterLink}
          to="/admin/classtypes/new"
        >
          Add New Class Type
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="class types table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Duration (Mins)</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classTypes.length === 0 && !loading ? (
                <TableRow>
                    <TableCell colSpan={6} align="center">No class types found.</TableCell>
                </TableRow>
            ) : (
              classTypes.map((ct) => (
                <TableRow key={ct._id}>
                  <TableCell component="th" scope="row">{ct.name}</TableCell>
                  <TableCell sx={{maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    <Tooltip title={ct.description}><Box>{ct.description}</Box></Tooltip>
                  </TableCell>
                  <TableCell>{ct.defaultDurationMinutes}</TableCell>
                  <TableCell>{ct.requiredEquipment?.join(', ') || 'None'}</TableCell>
                  <TableCell>
                    {ct.isActive ? <CheckCircleOutline color="success" /> : <CancelOutlined color="error" />}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Class Type">
                      <IconButton
                        color="primary"
                        component={RouterLink}
                        to={`/admin/classtypes/edit/${ct._id}`}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Class Type">
                      <IconButton color="error" onClick={() => handleDeleteClassType(ct._id)}>
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

export default ClassTypeListPage;
