import React, { createContext, useState, useCallback, useEffect } from 'react'
import { API_URL, authAPI } from '../services/api'

export const AuthContext = createContext()

const getStoredUser = () => {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(false)

  const clearAuthState = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const login = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem('token')

    if (currentToken) {
      try {
        await authAPI.logout(currentToken)
      } catch {
        // Ignore logout API failures and clear local auth state anyway.
      }
    }

    clearAuthState()
  }, [clearAuthState])

  useEffect(() => {
    if (!token) {
      return undefined
    }

    const heartbeatInterval = setInterval(() => {
      authAPI.heartbeat(token).catch(() => {
        // Ignore transient network failures; stale-user cleanup handles long disconnects.
      })
    }, 30000)

    return () => {
      clearInterval(heartbeatInterval)
    }
  }, [token])

  useEffect(() => {
    const sendLeaveSignal = () => {
      const currentToken = localStorage.getItem('token')
      if (!currentToken) {
        return
      }

      const payload = JSON.stringify({ token: currentToken })
      const leaveUrl = `${API_URL}/auth/leave`

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(leaveUrl, blob)
        return
      }

      fetch(leaveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Best-effort signal.
      })
    }

    window.addEventListener('pagehide', sendLeaveSignal)

    return () => {
      window.removeEventListener('pagehide', sendLeaveSignal)
    }
  }, [])

  useEffect(() => {
    const handleForceLogout = () => {
      clearAuthState()
    }

    window.addEventListener('auth:force-logout', handleForceLogout)

    return () => {
      window.removeEventListener('auth:force-logout', handleForceLogout)
    }
  }, [clearAuthState])

  const value = {
    user,
    token,
    isLoading,
    setIsLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
