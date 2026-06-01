import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

function enrichUser(user, profile) {
  if (!user) return null

  return { ...user, avatar: profile?.photo || null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/profile/')
      setUser(enrichUser(response.data.user, response.data.profile))
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials)
      setUser(enrichUser(response.data.user, response.data.profile))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка входа'
      }
    }
  }

  const telegramLogin = async (code, telegramData) => {
    try {
      const response = await api.post('/auth/telegram/', {
        code,
        ...telegramData
      })
      setUser(enrichUser(response.data.user, response.data.profile))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка авторизации через Telegram'
      }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout/')
    } catch (error) {
      console.error('Ошибка выхода:', error)
    } finally {
      setUser(null)
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData)
      setUser(enrichUser(response.data.user, response.data.profile))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка регистрации'
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      telegramLogin,
      logout,
      register,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
