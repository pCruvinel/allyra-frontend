import * as React from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  showBackButton?: boolean
  onBack?: () => void
  className?: string
}

/**
 * AppDrawer - Drawer fullscreen para formulários complexos em mobile
 *
 * Características:
 * - Ocupa 100% da tela (inset-0)
 * - Header fixo com título e botão fechar/voltar
 * - Body scrollável com overflow-y-auto
 * - Animação slide-in-from-right
 * - Suporte a dark mode
 * - Focus trap e escape key
 */
export function AppDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  showBackButton = false,
  onBack,
  className,
}: AppDrawerProps) {
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)

  // Handle open/close with animation
  React.useEffect(() => {
    if (open) {
      setIsVisible(true)
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Handle escape key
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!isVisible) return null

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      onOpenChange(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div
        className={cn(
          'absolute inset-0 bg-background flex flex-col transition-transform duration-300 ease-out',
          isAnimating ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Voltar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        {children}
      </div>
    </div>,
    document.body
  )
}

interface AppDrawerBodyProps {
  children: React.ReactNode
  className?: string
}

/**
 * AppDrawerBody - Conteudo scrollavel do drawer
 */
export function AppDrawerBody({ children, className }: AppDrawerBodyProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-4 py-6', className)}>
      {children}
    </div>
  )
}

interface AppDrawerFooterProps {
  children: React.ReactNode
  className?: string
}

/**
 * AppDrawerFooter - Footer fixo com actions (stack vertical)
 */
export function AppDrawerFooter({ children, className }: AppDrawerFooterProps) {
  return (
    <div
      className={cn(
        'shrink-0 border-t border-border bg-background/80 backdrop-blur-md px-4 py-4',
        className
      )}
    >
      {children}
    </div>
  )
}

interface AppDrawerSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * AppDrawerSection - Secao com titulo opcional
 */
export function AppDrawerSection({
  title,
  children,
  className,
}: AppDrawerSectionProps) {
  return (
    <div className={cn('py-4', className)}>
      {title && (
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
