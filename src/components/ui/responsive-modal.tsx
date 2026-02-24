import * as React from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Modal, ModalBody, ModalFooter } from './modal'
import { BottomSheet, BottomSheetFooter, BottomSheetSection } from './bottom-sheet'
import { cn } from '@/lib/utils'

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Snap points para o bottom sheet (mobile) */
  snapPoints?: (number | string)[]
  /** Se true, permite fechar arrastando para baixo no mobile */
  dismissible?: boolean
}

/**
 * Modal responsivo que renderiza:
 * - Desktop: Modal tradicional centralizado
 * - Mobile: Bottom Sheet com gestos de swipe
 */
export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
  snapPoints,
  dismissible = true,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={title}
        description={description}
        snapPoints={snapPoints}
        dismissible={dismissible}
        className={className}
      >
        {children}
      </BottomSheet>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      className={className}
    >
      {description && (
        <p className="px-6 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </Modal>
  )
}

/**
 * Body do modal responsivo
 * Usa ModalBody em desktop e div simples em mobile (BottomSheet já tem padding)
 */
interface ResponsiveModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalBody({
  children,
  className,
}: ResponsiveModalBodyProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <div className={cn('space-y-4', className)}>{children}</div>
  }

  return <ModalBody className={className}>{children}</ModalBody>
}

/**
 * Footer do modal responsivo
 * Layout sticky em ambos os casos
 */
interface ResponsiveModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalFooter({
  children,
  className,
}: ResponsiveModalFooterProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <BottomSheetFooter className={cn('flex items-center gap-3', className)}>
        {children}
      </BottomSheetFooter>
    )
  }

  return <ModalFooter className={className}>{children}</ModalFooter>
}

/**
 * Seção do modal responsivo
 * Agrupa conteúdo com título opcional
 */
interface ResponsiveModalSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalSection({
  title,
  children,
  className,
}: ResponsiveModalSectionProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <BottomSheetSection title={title} className={className}>
        {children}
      </BottomSheetSection>
    )
  }

  return (
    <div className={cn('py-2', className)}>
      {title && (
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          {title}
        </h4>
      )}
      {children}
    </div>
  )
}

/**
 * Hook para usar em componentes que precisam saber se estão em mobile
 * para adaptar seu conteúdo dentro do modal
 */
export { useIsMobile as useIsModalMobile } from '@/hooks/useMediaQuery'
