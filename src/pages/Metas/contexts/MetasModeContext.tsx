/**
 * MetasModeContext - Contexto para controlar o modo Stand-alone vs Integrado
 *
 * Stand-alone: Gestao manual de pacientes e atendimentos (modulo avulso)
 * Integrado: Usa dados do sistema principal (pacientes, agendamentos)
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../types/standalone'

interface MetasModeContextType {
  // Estado do modo
  isStandaloneMode: boolean

  // Estado do onboarding
  showOnboarding: boolean
  dismissOnboarding: () => void
  resetOnboarding: () => void
  showTutorial: () => void
}

const MetasModeContext = createContext<MetasModeContextType | null>(null)

interface MetasModeProviderProps {
  children: ReactNode
}

export function MetasModeProvider({ children }: MetasModeProviderProps) {
  const [isStandaloneMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODE)
      return stored === 'true'
    } catch {
      return false
    }
  })

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED)
      const mode = localStorage.getItem(STORAGE_KEYS.MODE)
      return mode === 'true' && dismissed !== 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, String(isStandaloneMode))
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [isStandaloneMode])

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, 'true')
    } catch {
      // Silently fail
    }
  }, [])

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DISMISSED)
      if (isStandaloneMode) {
        setShowOnboarding(true)
      }
    } catch {
      // Silently fail
    }
  }, [isStandaloneMode])

  const showTutorial = useCallback(() => {
    setShowOnboarding(true)
  }, [])

  return (
    <MetasModeContext.Provider
      value={{
        isStandaloneMode,
        showOnboarding,
        dismissOnboarding,
        resetOnboarding,
        showTutorial,
      }}
    >
      {children}
    </MetasModeContext.Provider>
  )
}

export function useMetasMode() {
  const context = useContext(MetasModeContext)
  if (!context) {
    throw new Error('useMetasMode must be used within a MetasModeProvider')
  }
  return context
}
