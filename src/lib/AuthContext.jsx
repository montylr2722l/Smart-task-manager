import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('stm_currentUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('stm_currentUser')
      }
    }
    setIsLoading(false)
  }, [])

  const register = (username, password, email) => {
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('stm_users') || '{}')
    
    if (users[username]) {
      throw new Error('Username already exists')
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password, // In production, this should be hashed!
      createdAt: new Date().toISOString(),
    }

    users[username] = newUser
    localStorage.setItem('stm_users', JSON.stringify(users))

    // Auto-login after registration
    setUser(newUser)
    localStorage.setItem('stm_currentUser', JSON.stringify(newUser))

    return newUser
  }

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('stm_users') || '{}')
    const user = users[username]

    if (!user) {
      throw new Error('Username not found')
    }

    if (user.password !== password) {
      throw new Error('Invalid password')
    }

    setUser(user)
    localStorage.setItem('stm_currentUser', JSON.stringify(user))

    return user
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('stm_currentUser')
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
