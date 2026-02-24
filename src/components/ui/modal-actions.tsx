import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface ModalActionsProps {
  /** Callback ao cancelar */
  onCancel: () => void
  /** Callback ao confirmar */
  onConfirm: () => void
  /** Label do botão cancelar */
  cancelLabel?: string
  /** Label do botão confirmar */
  confirmLabel?: string
  /** Se true, mostra spinner no botão confirmar */
  isLoading?: boolean
  /** Se true, desabilita o botão confirmar */
  isDisabled?: boolean
  /** Variante visual do botão confirmar */
  variant?: 'primary' | 'danger'
  /** Classes CSS adicionais */
  className?: string
}

/**
 * ModalActions - Footer de modal com botões padronizados
 *
 * Renderiza layout responsivo:
 * - Mobile: Stack vertical (primário em cima, cancelar embaixo)
 * - Desktop: Horizontal (cancelar à esquerda, primário à direita)
 *
 * @example
 * <ModalFooter>
 *   <ModalActions
 *     onCancel={handleClose}
 *     onConfirm={handleSubmit}
 *     confirmLabel="Salvar"
 *     isLoading={isSaving}
 *   />
 * </ModalFooter>
 */
export function ModalActions({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  isLoading = false,
  isDisabled = false,
  variant = 'primary',
  className,
}: ModalActionsProps) {
  const isMobile = useIsMobile()

  const confirmButton = (
    <Button
      onClick={onConfirm}
      disabled={isDisabled || isLoading}
      variant={variant === 'danger' ? 'destructive' : 'default'}
      className={cn(
        'rounded-full',
        isMobile ? 'w-full' : 'px-8'
      )}
    >
      {isLoading ? 'Processando...' : confirmLabel}
    </Button>
  )

  const cancelButton = (
    <Button
      variant="outline"
      onClick={onCancel}
      disabled={isLoading}
      className={cn(
        'rounded-full',
        isMobile ? 'w-full' : 'px-8'
      )}
    >
      {cancelLabel}
    </Button>
  )

  // Mobile: stack vertical (primário em cima)
  if (isMobile) {
    return (
      <div className={cn('flex flex-col gap-3 w-full', className)}>
        {confirmButton}
        {cancelButton}
      </div>
    )
  }

  // Desktop: horizontal (cancelar à esquerda, confirmar à direita)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {cancelButton}
      {confirmButton}
    </div>
  )
}
