import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import DeviceDashboard from './pages/DeviceDashboard'
import DeviceDetail from './pages/DeviceDetail'
import './App.css'

function App() {
  const isAuthenticated = !!localStorage.getItem('token')

  const handleLoginSuccess = (user: any) => {
    // Login success is handled in LoginForm component
    // This callback can be used for additional logic if needed
  }

  // Set up routing for the application using react-router-dom, with protected routes for the 
  // device dashboard and device detail pages that require authentication  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route 
          path="/devices" 
          element={isAuthenticated ? <DeviceDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/devices/:id" 
          element={isAuthenticated ? <DeviceDetail /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/devices" />} />
      </Routes>
    </Router>
  )
}

export default App