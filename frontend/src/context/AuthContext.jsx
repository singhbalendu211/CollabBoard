import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Your pre-configured Axios instance

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // This function will run once when the app loads
    const checkUserStatus = async () => {
      try {
        // Ask the backend if we have a valid session
        const response = await api.get('/auth/status');
        setUser(response.data); // If yes, set the user
      } catch (error) {
        // If no valid session, the API will throw an error
        setUser(null);
      } finally {
        setIsLoading(false); // Stop loading once the check is complete
      }
    };

    checkUserStatus();
  }, []);

  // The value provided to consuming components
  const value = { user, setUser, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create a custom hook for easy consumption
export const useAuth = () => {
  return useContext(AuthContext);
};