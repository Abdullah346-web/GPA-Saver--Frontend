import { useContext, useState } from 'react'
import { authAPI } from '../services/api'
import { AuthContext } from '../context/AuthContext'

function LoginScreen() {
  const { login } = useContext(AuthContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showClearSessions, setShowClearSessions] = useState(false)

  const handleClearSessions = async () => {
    try {
      setLoading(true)
      // Get email or use username as identifier
      const identifier = username === 'admin' ? 'admin123@gmail.com' : username
      await authAPI.forceLogoutAll(identifier, password)
      setError('')
      setShowClearSessions(false)
      alert('✅ All sessions cleared! You can now login.')
    } catch (err) {
      setError(err.message || 'Failed to clear sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setShowClearSessions(false)

    try {
      // Admin credentials check (for demo)
      if (username === 'admin' && password === 'abdullah12345') {
        const response = await authAPI.login('admin123@gmail.com', password)
        const { token, user } = response
        login(user, token)
        window.location.href = '/admin-dashboard'
        return
      }

      const response = await authAPI.login(username, password)
      const { token, user } = response
      login(user, token)
      window.location.href = '/user-dashboard'
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please try again.'
      setError(errorMsg)
      
      // Show clear sessions option if account is already in use
      if (errorMsg.includes('already in use')) {
        setShowClearSessions(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <p className="login-eyebrow">GPA Saver</p>
        <h1>Login to your account</h1>
        <p className="login-copy">
          Access shared notes from one place and continue to the community notes library.
        </p>

        <form onSubmit={handleSubmit} className="login-fields">
          <div className="login-field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              className="login-input"
              required
            />
          </div>
          <div className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="login-input"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          {showClearSessions && (
            <div className="session-alert">
              <p>
                <strong>Stuck session?</strong> If you refreshed the page and can't login, click below to emergency clear all sessions. 
              </p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.6)', margin: '8px 0 0 0' }}>
                Note: One account can only be logged in from one device at a time.
              </p>
              <button
                type="button"
                className="clear-session-btn"
                onClick={handleClearSessions}
                disabled={loading}
              >
                {loading ? 'Clearing sessions...' : '🔓 Clear All Sessions'}
              </button>
            </div>
          )}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginScreen