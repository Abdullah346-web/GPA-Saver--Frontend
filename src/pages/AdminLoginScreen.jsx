import { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { authAPI } from '../services/api'

function AdminLoginScreen() {
  const { login } = useContext(AuthContext)
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showClearSessions, setShowClearSessions] = useState(false)

  const handleClearSessions = async () => {
    try {
      setLoading(true)
      const identifier = adminId === 'admin' ? 'admin123@gmail.com' : adminId
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    setShowClearSessions(false)

    try {
      const email = adminId === 'admin' ? 'admin123@gmail.com' : adminId
      const response = await authAPI.login(email, password)
      const { token, user } = response

      if (!user || user.role !== 'admin') {
        setError('This account does not have admin access.')
        return
      }

      login(user, token)
      window.location.href = '/admin-dashboard'
    } catch (err) {
      const errorMsg = err.message || 'Admin login failed. Please try again.'
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
    <main className="login-screen admin-screen">
      <section className="login-card admin-card">
        <p className="login-eyebrow">Admin access</p>
        <h1>Admin Login</h1>
        <p className="login-copy">
          Sign in to manage users, moderate shared notes, and monitor platform activity.
        </p>

        <form onSubmit={handleSubmit} className="login-fields" aria-label="Admin login form">
          <div className="login-field">
            <span>Admin email or username</span>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="admin123@gmail.com or admin"
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
            {loading ? 'Signing in...' : 'Continue as Admin'}
          </button>
        </form>

      </section>
    </main>
  )
}

export default AdminLoginScreen