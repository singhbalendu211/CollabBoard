import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Core layout and page components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout'; // <-- UPDATED PATH

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected pages
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms'; 
import Whiteboard from './pages/Whiteboard';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* --- Protected Routes --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
         
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Full-screen route without the main sidebar */}
        <Route path="/room/:roomId" element={<Whiteboard />} />
      </Route>
    </Routes>
  );
}

export default App;