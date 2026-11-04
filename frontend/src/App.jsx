import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Incidents from './pages/Incidents';
import Prototype from './pages/Prototype';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white text-gray-900">
          <Navbar />
          <Routes>
            {/* Public Route: Accessible to everyone */}
            <Route path="/" element={<Home />} />
            
            {/* Biometric Face Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes: Accessible only after Facial Recognition Login */}
            <Route 
              path="/prototype" 
              element={
                <ProtectedRoute>
                  <Prototype />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/simulation" 
              element={
                <ProtectedRoute>
                  <Prototype />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/incidents" 
              element={
                <ProtectedRoute>
                  <Incidents />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
