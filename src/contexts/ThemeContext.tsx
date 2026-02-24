/**
 * ThemeContext - Gerenciamento de tema (light/dark)
 *
 * - Salva preferência no localStorage (allyra_theme)
 * - Aplica classe 'dark' no elemento <html>
 * - Usa estratégia 'class' do Tailwind
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'allyra_theme'

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return null
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Prioridade: localStorage > system > default
    const stored = getStoredTheme()
    if (stored) return stored
    return defaultTheme
  })

  // Aplica tema inicial no mount
  useEffect(() => {
    applyTheme(theme)
  }, [])

  // Atualiza quando tema muda
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // Escuta mudanças no sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Só atualiza se não tiver preferência salva
      if (!getStoredTheme()) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook opcional que retorna fallback se não estiver no provider
export function useThemeOptional(): ThemeContextType | null {
  return useContext(ThemeContext) ?? null
}
