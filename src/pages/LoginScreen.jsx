import { useContext, useState } from 'react'
import { authAPI } from '../services/api'
import { AuthContext } from '../context/AuthContext'

const navigateWithoutReload = (nextPath) => {
  window.history.replaceState({}, '', nextPath)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function LoginScreen() {
  const { login } = useContext(AuthContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Admin credentials check (for demo)
      if (username === 'admin' && password === 'abdullah12345') {
        const response = await authAPI.login('admin123@gmail.com', password)
        const { token, user } = response
        login(user, token)
        navigateWithoutReload('/admin-dashboard')
        return
      }

      const response = await authAPI.login(username, password)
      const { token, user } = response
      login(user, token)
      navigateWithoutReload('/user-dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
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

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginScreen