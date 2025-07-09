import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios'; // Needed for potential re-authentication or fetching user data

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: true, // To handle initial load, e.g. validating token
  });

  // Function to simulate loading user data or validating token on app start
  // In a real app, you might want to hit a /me endpoint to verify the token
  // and get fresh user data.
  useEffect(() => {
    const validateToken = async () => {
      if (authState.token) {
        try {
          // Example: Set authorization header for future axios requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;

          axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;

          // Make a request to a protected '/api/auth/me' endpoint to validate token
          // and get fresh user data.
          const response = await axios.get(`${API_URL}/auth/me`);

          if (response.data) { // Assuming /me returns the user object directly
            localStorage.setItem('user', JSON.stringify(response.data)); // response.data is the user object
            setAuthState({
              token: authState.token,
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // This case might not be hit if /me throws error for invalid token/user
            logout(); // Token valid but user data not returned, treat as logout
          }
        } catch (error) {
          console.error("Token validation with /me endpoint failed:", error.response ? error.response.data : error.message);
          logout(); // Clear invalid token and user data
        }
      } else {
        // No token in localStorage
        delete axios.defaults.headers.common['Authorization']; // Ensure no old token is lingering in axios defaults
        setAuthState(prevState => ({ ...prevState, token: null, user: null, isAuthenticated: false, isLoading: false }));
      }
    };

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAuthState({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // Consider redirecting to login page here or in the component that calls logout
    // navigate('/login'); // if navigate is available
  };

  // You might also add a register function here if it involves setting auth state directly
  // const register = (token, user) => { ... similar to login ... };

  return (
    <AuthContext.Provider value={{ authState, login, logout /*, register */ }}>
      {!authState.isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
