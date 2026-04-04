import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { userAPI, notesAPI } from '../services/api'

function AdminDashboard() {
  const { user, token, logout } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [notes, setNotes] = useState([])
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      window.location.href = '/login'
    }

    loadStats()

    // Poll every 5 seconds to update online users
    const interval = setInterval(() => {
      loadStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [user])

  const loadStats = async () => {
    try {
      const statsData = await userAPI.getUserStats(token)
      const usersData = await userAPI.getAllUsers(token)
      const notesData = await notesAPI.getAdminNotes(token)
      setStats(statsData.stats)
      setUsers(usersData.users || [])
      setNotes(notesData.notes || [])
      setStats((currentStats) => ({
        ...(currentStats || {}),
        totalNotes: notesData.count || 0,
      }))
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleRegisterUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await userAPI.registerUser(newUser, token)
      setMessage('User created successfully')
      setNewUser({ name: '', email: '', password: '' })
      loadStats()
    } catch (error) {
      setMessage('Error: ' + (error.message || 'Failed to register user'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId, token)
        loadStats()
        setMessage('User deleted successfully')
      } catch (error) {
        setMessage('Error: ' + (error.message || 'Failed to delete user'))
      }
    }
  }

  const handleEditPassword = async (userId, userName) => {
    const newPassword = prompt(`Enter new password for ${userName} (min 6 chars):`)

    if (newPassword === null) {
      return
    }

    const normalizedPassword = String(newPassword).trim()
    if (normalizedPassword.length < 6) {
      setMessage('Error: Password must be at least 6 characters')
      return
    }

    try {
      await userAPI.updateUserPassword(userId, normalizedPassword, token)
      setMessage('Password updated successfully')
    } catch (error) {
      setMessage('Error: ' + (error.message || 'Failed to update password'))
    }
  }

  const handleDeleteNote = async (noteId) => {
    const confirm_delete = confirm('Are you sure you want to delete this note?')
    if (confirm_delete) {
      const reason = prompt('Please provide a reason for deleting this note:')
      if (reason === null) return // User cancelled

      if (!reason || reason.trim().length === 0) {
        setMessage('Error: Please provide a reason for deletion')
        return
      }

      try {
        await notesAPI.deleteNote(noteId, token, reason)
        loadStats()
        setMessage('Note deleted successfully. User has been notified.')
      } catch (error) {
        setMessage('Error: ' + (error.message || 'Failed to delete note'))
      }
    }
  }

  const onlineUsers = users.filter((userItem) => userItem.isOnline)

  return (
    <main className="admin-dashboard">
      <div className="admin-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h2>GPA Saver Admin</h2>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Registered Users
            </button>
            <button
              className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Shared Notes
            </button>
            <button
              className={`nav-item ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register New User
            </button>
          </nav>

          <div className="sidebar-footer">
            <p>
              <strong>{user?.name}</strong>
            </p>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="admin-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <section className="tab-content">
              <h1>Admin Dashboard</h1>
              {stats && (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Total Users</h3>
                      <p className="stat-number">{stats.totalUsers}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Shared Notes</h3>
                      <p className="stat-number">{stats.totalNotes || 0}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Active Users</h3>
                      <p className="stat-number">{stats.activeUsers}</p>
                    </div>
                  </div>
                  <div className="online-users-panel">
                    <h3>Currently Online Users</h3>
                    {onlineUsers.length > 0 ? (
                      <ul className="online-users-list">
                        {onlineUsers.map((onlineUser) => (
                          <li key={onlineUser._id}>
                            <strong>{onlineUser.name}</strong>
                            <span>{onlineUser.email || onlineUser.username}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No users are online right now.</p>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <section className="tab-content">
              <h1>Registered Users</h1>
              {message && <div className="message">{message}</div>}
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email || u.username}</td>
                        <td>{u.isOnline ? 'Online' : 'Offline'}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => handleEditPassword(u._id, u.name)}
                          >
                            Edit Password
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <section className="tab-content">
              <h1>Shared Notes</h1>
              {message && <div className="message">{message}</div>}
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Shared By</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => (
                      <tr key={note._id}>
                        <td>{note.title}</td>
                        <td>{note.subject}</td>
                        <td>{note.uploadedByName || note.uploadedBy?.name || note.uploadedByUsername}</td>
                        <td>{new Date(note.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteNote(note._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Register Tab */}
          {activeTab === 'register' && (
            <section className="tab-content">
              <h1>Register New User</h1>
              {message && <div className="message">{message}</div>}
              <form onSubmit={handleRegisterUser} className="register-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email (Username)</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    pattern="^25f-cy-[0-9]{3}@gmail[.]com$"
                    placeholder="25f-cy-005@gmail.com"
                    title="Use this format: 25f-cy-XXX@gmail.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Registering...' : 'Register User'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

export default AdminDashboard
