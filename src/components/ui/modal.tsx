import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
  headerColor?: 'default' | 'danger'
  showCloseButton?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

const headerColors = {
  default: 'bg-background',
  danger: 'bg-[#A31B64]',
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  headerColor = 'default',
  showCloseButton = true,
  className,
  size = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'bg-background rounded-2xl shadow-xl w-full mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between px-6 py-4 rounded-t-2xl',
              headerColors[headerColor],
              headerColor === 'danger' && 'text-white'
            )}
          >
            {title && (
              <h2
                id={titleId}
                className={cn(
                  'text-base font-semibold',
                  headerColor === 'danger' ? 'text-white' : 'text-foreground'
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="sr-only">{description}</p>
            )}
            {showCloseButton && headerColor === 'default' && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>,
    document.body
  )
}

// Modal Footer component for consistent button layout
interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30', className)}>
      {children}
    </div>
  )
}

// Modal Body component
interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('flex-1 min-h-0 overflow-y-auto px-6 py-4 custom-scrollbar', className)}>
      {children}
    </div>
  )
}
