import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Chip
} from '@mui/material';
import { Edit, DeleteOutline as CancelIcon, Add, EventNote, Visibility } from '@mui/icons-material'; // Using DeleteOutline for Cancel
import { Link as RouterLink } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';
import { format } from 'date-fns'; // For formatting dates

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ScheduledClassListPage() {
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext);

  const fetchScheduledClasses = async () => {
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      // Admin gets all scheduled classes, including past/cancelled
      const response = await axios.get(`${API_URL}/scheduledclasses/admin/all`, config);
      setScheduledClasses(response.data);
    } catch (err) {
      console.error("Error fetching scheduled classes:", err);
      setError(err.response?.data?.msg || 'Failed to fetch scheduled classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.token) {
      fetchScheduledClasses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  const handleCancelClass = async (classId) => {
    if (!window.confirm('Are you sure you want to cancel this class? This will change its status to "Cancelled".')) {
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${authState.token}` } };
      // Using DELETE endpoint which handles cancellation (soft delete)
      await axios.delete(`${API_URL}/scheduledclasses/${classId}`, config);
      fetchScheduledClasses(); // Refresh list
    } catch (err) {
      console.error("Error cancelling class:", err);
      setError(err.response?.data?.msg || 'Failed to cancel class.');
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'primary';
      case 'Full': return 'secondary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };


  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}> {/* Using xl for wider table */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Scheduled Classes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          component={RouterLink}
          to="/admin/scheduledclasses/new"
        >
          Schedule New Class
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 750 }} aria-label="scheduled classes table">
          <TableHead>
            <TableRow>
              <TableCell>Class Type</TableCell>
              <TableCell>Trainer</TableCell>
              <TableCell>Facility</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time (Start-End)</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Attendees</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduledClasses.length === 0 && !loading ? (
                <TableRow>
                    <TableCell colSpan={9} align="center">No classes scheduled.</TableCell>
                </TableRow>
            ) : (
              scheduledClasses.map((sc) => (
                <TableRow key={sc._id} hover>
                  <TableCell>{sc.classType?.name || 'N/A'}</TableCell>
                  <TableCell>{sc.trainer?.firstName ? `${sc.trainer.firstName} ${sc.trainer.lastName}` : sc.trainer?.username || 'N/A'}</TableCell>
                  <TableCell>{sc.facility?.name || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(sc.startTime), 'PP (E)')}</TableCell> {/* PP: Long date, E: day of week short */}
                  <TableCell>{`${format(new Date(sc.startTime), 'p')} - ${format(new Date(sc.endTime), 'p')}`}</TableCell> {/* p: short time */}
                  <TableCell>{sc.capacity}</TableCell>
                  <TableCell>{sc.attendees?.length || 0}</TableCell>
                  <TableCell>
                    <Chip label={sc.status} color={getStatusChipColor(sc.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View/Edit Details">
                      <IconButton
                        color="primary"
                        component={RouterLink}
                        to={`/admin/scheduledclasses/edit/${sc._id}`} // Edit will also serve as view for now
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    {sc.status !== 'Cancelled' && sc.status !== 'Completed' && (
                      <Tooltip title="Cancel Class">
                        <IconButton color="error" onClick={() => handleCancelClass(sc._id)}>
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    )}
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

export default ScheduledClassListPage;
