import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Tooltip
} from '@mui/material';
import { Edit as EditIcon, CheckCircleOutline, CancelOutlined } from '@mui/icons-material'; // Using Edit icon
import { Link as RouterLink } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` },
        };
        const response = await axios.get(`${API_URL}/users`, config); // Fetches members and trainers
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.response?.data?.msg || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    if (authState.token) {
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Users (Members & Trainers)
        </Typography>
        {/* Optional: Add button for creating users if admins can do that directly */}
        {/* <Button component={RouterLink} to="/admin/users/new" variant="contained">Add User</Button> */}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="users table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Membership Plan</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 && !loading ? (
                <TableRow>
                    <TableCell colSpan={7} align="center">No users found.</TableCell>
                </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell component="th" scope="row">
                    {user.firstName || ''} {user.lastName || ''}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small" color={user.role === 'admin' ? 'secondary' : user.role === 'trainer' ? 'info' : 'default'}/>
                  </TableCell>
                  <TableCell>
                    {user.membershipPlan ? (
                      <Tooltip title={`Price: $${user.membershipPlan.price?.toFixed(2)}`}>
                        <span>{user.membershipPlan.name}</span>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="textSecondary">None</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? <CheckCircleOutline color="success" /> : <CancelOutlined color="error" />}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit User">
                      <IconButton
                        color="primary"
                        component={RouterLink}
                        to={`/admin/users/edit/${user._id}`}
                        aria-label="edit user"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {/* Delete user functionality is not implemented as per backend notes, focusing on activate/deactivate */}
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

export default UserListPage;
