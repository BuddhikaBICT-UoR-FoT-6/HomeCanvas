import { useState } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import './index.css'

function App() {
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login')

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
  }

  const handleSwitchToRegister = () => {
    setCurrentPage('register')
  }

  const handleSwitchToLogin = () => {
    setCurrentPage('login')
  }

  const handleRegisterSuccess = () => {
    setCurrentPage('login')
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome, {user.username}!</h1>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          <button 
            onClick={() => {
              localStorage.clear()
              setUser(null)
            }}
            className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {currentPage === 'login' ? (
        <LoginForm 
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      ) : (
        <RegisterForm 
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
}


export default App;