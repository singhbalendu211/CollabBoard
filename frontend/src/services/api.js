import axios from 'axios';

// Create an Axios instance with a base URL and cookie support
const api = axios.create({
  baseURL: '/api', // This proxies to http://localhost:5000 in development
  withCredentials: true, // Crucial for sending httpOnly cookies
});

export default api;