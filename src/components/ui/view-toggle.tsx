/**
 * ViewToggle Component
 * Toggle entre visualização Grid e Lista
 * Baseado no padrão do módulo de metas (mod_metas)
 */

import { cn } from '@/lib/utils'
import { LayoutGrid, List } from 'lucide-react'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
  disabled?: boolean
  /** Key for localStorage persistence. If provided, stores preference automatically */
  storageKey?: string
}

export function ViewToggle({
  value,
  onChange,
  className,
  disabled = false,
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-background p-1',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center rounded-full p-2 transition-colors',
          value === 'grid'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Visualização em grade"
        aria-pressed={value === 'grid'}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center rounded-full p-2 transition-colors',
          value === 'list'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Visualização em lista"
        aria-pressed={value === 'list'}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Hook para persistir preferência de visualização
 */
import { useState, useCallback, useEffect } from 'react'

export function useViewMode(key: string, defaultValue: ViewMode = 'grid') {
  const storageKey = `allyra_view_mode_${key}`

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'grid' || stored === 'list') {
        return stored
      }
    }
    return defaultValue
  })

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, mode)
    }
  }, [storageKey])

  // Sincronizar entre abas
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        if (e.newValue === 'grid' || e.newValue === 'list') {
          setViewModeState(e.newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [storageKey])

  return [viewMode, setViewMode] as const
}
