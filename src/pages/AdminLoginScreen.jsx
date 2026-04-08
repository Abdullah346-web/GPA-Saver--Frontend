import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import { authAPI, FORCED_LOGOUT_MESSAGE_KEY } from '../services/api'

const navigateWithoutReload = (nextPath) => {
  window.history.replaceState({}, '', nextPath)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function AdminLoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [forcedLogoutMessage, setForcedLogoutMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useContext(AuthContext)

  useEffect(() => {
    const forcedMessage = localStorage.getItem(FORCED_LOGOUT_MESSAGE_KEY)
    if (forcedMessage) {
      setForcedLogoutMessage(forcedMessage)
      localStorage.removeItem(FORCED_LOGOUT_MESSAGE_KEY)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setForcedLogoutMessage('')
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError('Please enter both email and password')
        setIsLoading(false)
        return
      }

      const response = await authAPI.login(email, password)

      if (response.success) {
        login(response.user, response.token)
        navigateWithoutReload('/admin-dashboard')
      } else {
        setError(response.message || 'Login failed')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-screen admin-screen">
      <section className="login-card admin-card">
        <p className="login-eyebrow">Admin access</p>
        <h1>Admin Login</h1>
        <p className="login-copy">
          Sign in to manage users, moderate shared notes, and monitor platform activity.
        </p>

        {forcedLogoutMessage && (
          <div className="error-message" style={{ marginTop: '12px' }}>
            {forcedLogoutMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="login-fields" aria-label="Admin login form">
            <div className="login-field">
              <span>Admin Email</span>
              <input
                type="email"
                className="login-input"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="login-field">
              <span>Password</span>
              <input
                type="password"
                className="login-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ color: '#ef4444', marginTop: '12px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button 
            className="login-button" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Continue as Admin'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AdminLoginScreen