import React, { createContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../services/api'

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

    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  // Auto logout when user leaves/closes page without proper logout
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentToken = localStorage.getItem('token')
      if (currentToken) {
        try {
          const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
          const beaconData = JSON.stringify({
            Authorization: `Bearer ${currentToken}`,
          })
          // sendBeacon is more reliable for page unload
          navigator.sendBeacon(`${apiUrl}/api/auth/logout`, beaconData)
        } catch {
          // Silently fail
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

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
