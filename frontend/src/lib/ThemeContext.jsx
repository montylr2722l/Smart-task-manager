/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()
const LS_THEME_KEY = 'stm_theme'

export function ThemeProvider({ children, initialTheme = 'system' }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(LS_THEME_KEY)
    return saved || initialTheme
  })

  useEffect(() => {
    localStorage.setItem(LS_THEME_KEY, theme)
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark')

    if (theme === 'light') {
      root.classList.add('theme-light')
      root.style.colorScheme = 'light'
    } else if (theme === 'dark') {
      root.classList.add('theme-dark')
      root.style.colorScheme = 'dark'
    } else {
      root.style.colorScheme = 'light dark'
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
