import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import DeviceDashboard from './pages/DeviceDashboard'
import DeviceDetail from './pages/DeviceDetail'
import './App.css'

// AppRoutes renders the page routes and passes theme props to the dashboard
function AppRoutes({ theme, onToggleTheme }: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const isAuthenticated = !!localStorage.getItem('token')
  const navigate = useNavigate()
  const location = useLocation()

  // Only show the floating theme button on non-dashboard pages
  const showFloatingTheme = !location.pathname.startsWith('/devices')

  const handleLoginSuccess = () => {
    navigate('/devices')
  }

  const handleRegisterSuccess = () => {
    navigate('/login')
  }

  return (
    <>
      {/* Floating theme toggle — only on login / register pages */}
      {showFloatingTheme && (
        <div className="fixed top-4 right-4 z-[70] flex gap-2 items-center">
          <button
            onClick={onToggleTheme}
            className="rounded-full border border-slate-300/70 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      )}

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
          element={
            isAuthenticated 
              ? <DeviceDashboard theme={theme} onToggleTheme={onToggleTheme} /> 
              : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/devices/:id" 
          element={isAuthenticated ? <DeviceDetail /> : <Navigate to="/login" />} 
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