/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()
const API_BASE_URL = import.meta.env.VITE_API_URL 

const LS_USER_KEY = 'stm_currentUser'
const LS_TOKEN_KEY = 'stm_auth_token'

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(LS_USER_KEY)
    if (!savedUser) return null
    try {
      return JSON.parse(savedUser)
    } catch (error) {
      console.error('Failed to parse saved user:', error)
      localStorage.removeItem(LS_USER_KEY)
      localStorage.removeItem(LS_TOKEN_KEY)
      return null
    }
  })
  const [isLoading] = useState(false)

  const register = async (name, email, password) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })

    setUser(data.user)
    localStorage.setItem(LS_USER_KEY, JSON.stringify(data.user))
    localStorage.setItem(LS_TOKEN_KEY, data.token)
    return data.user
  }

  const login = async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    setUser(data.user)
    localStorage.setItem(LS_USER_KEY, JSON.stringify(data.user))
    localStorage.setItem(LS_TOKEN_KEY, data.token)
    return data.user
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(LS_USER_KEY)
    localStorage.removeItem(LS_TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, register, login, logout }}>
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
