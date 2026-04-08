import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import DeviceDashboard from './pages/DeviceDashboard'
import DeviceDetail from './pages/DeviceDetail'
import './App.css'

function AppRoutes() {
  const isAuthenticated = !!localStorage.getItem('token')
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    navigate('/devices')
  }

  const handleRegisterSuccess = () => {
    navigate('/login')
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={<LoginForm onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => navigate('/register')} />} 
      />
      <Route 
        path="/register" 
        element={<RegisterForm onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => navigate('/login')} />} 
      />
      <Route 
        path="/devices" 
        element={isAuthenticated ? <DeviceDashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/devices/:id" 
        element={isAuthenticated ? <DeviceDetail /> : <Navigate to="/login" />} 
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/devices' : '/login'} />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App