import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import DeviceDashboard from './pages/DeviceDashboard'
import DeviceDetail from './pages/DeviceDetail'
import Analytics from './pages/Analytics'
import UserManagement from './pages/UserManagement'
import MainLayout from './components/MainLayout'
import './App.css'

// AppRoutes renders the page routes and passes theme props to the dashboard
function AppRoutes({ theme, onToggleTheme }: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const isAuthenticated = !!localStorage.getItem('token')
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    navigate('/devices')
  }

  const handleRegisterSuccess = () => {
    navigate('/login')
  }

  // We only show the custom layout for authenticated routes. Unauthenticated routes are full page.
  return (
    <>
      <Routes>
        <Route 
          path="/login" 
          element={<LoginForm onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => navigate('/register')} />} 
        />
        <Route 
          path="/register" 
          element={<RegisterForm onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => navigate('/login')} />} 
        />
        
        {/* Authenticated Routes wrapped in MainLayout */}
        <Route 
          path="/devices" 
          element={
            isAuthenticated 
              ? <MainLayout theme={theme} onToggleTheme={onToggleTheme}><DeviceDashboard /></MainLayout> 
              : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/devices/:id" 
          element={isAuthenticated ? <MainLayout theme={theme} onToggleTheme={onToggleTheme}><DeviceDetail /></MainLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/analytics" 
          element={
            isAuthenticated 
              ? <MainLayout theme={theme} onToggleTheme={onToggleTheme}><Analytics /></MainLayout> 
              : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/users" 
          element={
            isAuthenticated 
              ? <MainLayout theme={theme} onToggleTheme={onToggleTheme}><UserManagement /></MainLayout> 
              : <Navigate to="/login" />
          } 
        />
        
        <Route path="/" element={<Navigate to={isAuthenticated ? '/devices' : '/login'} />} />
      </Routes>
    </>
  )
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <Router>
      <AppRoutes theme={theme} onToggleTheme={toggleTheme} />
    </Router>
  )
}

export default App