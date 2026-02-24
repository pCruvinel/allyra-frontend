/**
 * MetasModeContext - Contexto para controlar o modo Stand-alone vs Integrado
 *
 * Stand-alone: Gestão manual de pacientes e atendimentos (módulo avulso)
 * Integrado: Usa dados do sistema principal (pacientes, agendamentos)
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../types/standalone'

interface MetasModeContextType {
  // Estado do modo
  isStandaloneMode: boolean
  toggleMode: () => void
  setStandaloneMode: (value: boolean) => void

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
  // Inicializa o modo a partir do localStorage
  const [isStandaloneMode, setIsStandaloneMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODE)
      return stored === 'true'
    } catch {
      return false
    }
  })

  // Controle do onboarding
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED)
      const mode = localStorage.getItem(STORAGE_KEYS.MODE)
      // Mostra onboarding se está em modo stand-alone e não foi fechado ainda
      return mode === 'true' && dismissed !== 'true'
    } catch {
      return false
    }
  })

  // Persiste o modo no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, String(isStandaloneMode))
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [isStandaloneMode])

  // Toggle do modo
  const toggleMode = useCallback(() => {
    setIsStandaloneMode(prev => {
      const newValue = !prev
      // Se ativou o modo stand-alone e onboarding não foi mostrado, mostra
      if (newValue) {
        const dismissed = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED)
        if (dismissed !== 'true') {
          setShowOnboarding(true)
        }
      }
      return newValue
    })
  }, [])

  // Set modo diretamente
  const setStandaloneMode = useCallback((value: boolean) => {
    setIsStandaloneMode(value)
    if (value) {
      const dismissed = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED)
      if (dismissed !== 'true') {
        setShowOnboarding(true)
      }
    }
  }, [])

  // Fecha o onboarding e marca como visto
  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, 'true')
    } catch {
      // Silently fail
    }
  }, [])

  // Reseta o onboarding (útil para debugging)
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

  // Mostra o tutorial (abre o modal de onboarding)
  const showTutorial = useCallback(() => {
    setShowOnboarding(true)
  }, [])

  return (
    <MetasModeContext.Provider
      value={{
        isStandaloneMode,
        toggleMode,
        setStandaloneMode,
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
