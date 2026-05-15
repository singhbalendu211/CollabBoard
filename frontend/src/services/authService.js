import api from './api';

// Function to handle user signup
export const signup = async (email, password) => {
  try {
    const response = await api.post('/auth/signup', { email, password });
    return response.data; // Returns user data on success
  } catch (error) {
    // Throws an error with the message from the backend
    throw new Error(error.response?.data?.message || 'Signup failed');
  }
};

// Function to handle user login
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Returns user data on success
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// Function to handle user logout
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Logout failed');
  }
};