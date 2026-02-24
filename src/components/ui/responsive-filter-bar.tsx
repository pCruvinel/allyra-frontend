import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface ResponsiveFilterBarProps {
  /** Conteúdo dos filtros (inputs, selects, etc) */
  children: React.ReactNode
  /** Callback ao aplicar filtros (mobile) */
  onApply?: () => void
  /** Callback ao limpar filtros */
  onClear?: () => void
  /** Título do BottomSheet mobile */
  title?: string
  /** Indica se há filtros ativos */
  hasActiveFilters?: boolean
  /** Contador de filtros ativos */
  activeFiltersCount?: number
  /** Classe CSS adicional para o container */
  className?: string
}

/**
 * ResponsiveFilterBar - Barra de filtros responsiva
 *
 * Desktop: Filtros inline em uma barra horizontal
 * Mobile: Botão que abre BottomSheet com filtros
 */
export function ResponsiveFilterBar({
  children,
  onApply,
  onClear,
  title = 'Filtros',
  hasActiveFilters = false,
  activeFiltersCount = 0,
  className,
}: ResponsiveFilterBarProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = () => {
    onApply?.()
    setIsOpen(false)
  }

  const handleClear = () => {
    onClear?.()
  }

  // Mobile: Botão + BottomSheet
  if (isMobile) {
    return (
      <>
        <div className={cn('flex items-center gap-2', className)}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="relative rounded-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <BottomSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          title={title}
          snapPoints={[0.6, 0.85]}
          dismissible
        >
          <div className="space-y-4 px-1">
            {children}
          </div>

          <BottomSheetFooter>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleApply}
                className="w-full rounded-full bg-primary hover:bg-primary/90"
              >
                Aplicar filtros
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleClear()
                    setIsOpen(false)
                  }}
                  className="w-full rounded-full"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </BottomSheetFooter>
        </BottomSheet>
      </>
    )
  }

  // Desktop: Filtros inline
  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      {children}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
