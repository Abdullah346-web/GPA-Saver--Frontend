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
