import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import LoadingScreen from './pages/LoadingScreen.jsx'
import LoginScreen from './pages/LoginScreen.jsx'
import AdminLoginScreen from './pages/AdminLoginScreen.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import UserDashboard from './pages/UserDashboard.jsx'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [showBootLoader, setShowBootLoader] = useState(() => window.location.pathname === '/')

  const navigateTo = useCallback((nextPath) => {
    window.history.replaceState({}, '', nextPath)
    setPath(nextPath)
  }, [])

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)

    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      const isAdminShortcut = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a'
      const isUserShortcut = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'u'

      if (isAdminShortcut) {
        event.preventDefault()
        navigateTo('/admin-login')
        return
      }

      if (isUserShortcut) {
        event.preventDefault()
        navigateTo('/login')
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateTo])

  useEffect(() => {
    if (showBootLoader) {
      return
    }

    const knownRoutes = ['/login', '/admin-login', '/admin-dashboard', '/user-dashboard']
    if (!knownRoutes.includes(path)) {
      navigateTo('/login')
    }
  }, [showBootLoader, path, navigateTo])

  if (showBootLoader) {
    return (
      <LoadingScreen
        onDone={() => {
          setShowBootLoader(false)
          navigateTo('/login')
        }}
      />
    )
  }

  // Route handling
  if (path === '/admin-login') {
    return (
      <AuthProvider>
        <AdminLoginScreen />
      </AuthProvider>
    )
  }

  if (path === '/admin-dashboard') {
    return (
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    )
  }

  if (path === '/login') {
    return (
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    )
  }

  if (path === '/user-dashboard') {
    return (
      <AuthProvider>
        <UserDashboard />
      </AuthProvider>
    )
  }

  // Safe fallback to avoid blank screens.
  return (
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  )
}

export default App