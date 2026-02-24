import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { LucideIcon, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  /** Título do modal (header) */
  title?: string
  /** Heading interno (texto em destaque) */
  heading?: string
  /** Descrição/mensagem do modal */
  description: string | React.ReactNode
  /** Texto do botão de confirmar */
  confirmLabel?: string
  /** Texto do botão de cancelar */
  cancelLabel?: string
  /** Variante visual */
  variant?: 'danger' | 'warning' | 'info' | 'default'
  /** Se true, mostra estado de loading */
  isLoading?: boolean
  /** Ícone opcional no botão de confirmar */
  confirmIcon?: LucideIcon
  /** Quantidade de itens (para exibir badge) */
  itemCount?: number
  /** Label dos itens (ex: "pacientes selecionados") */
  itemLabel?: string
  /** Cor do header do modal */
  headerColor?: 'default' | 'danger'
  /** Se true, mostra botão de fechar no header */
  showCloseButton?: boolean
  /** Tamanho do modal */
  size?: 'sm' | 'md' | 'lg'
  /** Snap points do BottomSheet mobile */
  snapPoints?: number[]
}

const variantStyles = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  info: 'bg-blue-600 hover:bg-blue-700 text-white',
  default: 'bg-primary hover:bg-primary/90',
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  heading,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  isLoading = false,
  confirmIcon,
  itemCount,
  itemLabel,
  headerColor = 'default',
  showCloseButton = false,
  size = 'sm',
  snapPoints = [0.4],
}: ConfirmationModalProps) {
  const isMobile = useIsMobile()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const ConfirmIcon = confirmIcon || (variant === 'danger' ? Trash2 : undefined)

  const content = (
    <div className="text-center py-2">
      {heading && (
        <h3 className="text-lg font-bold text-foreground mb-3">{heading}</h3>
      )}

      {itemCount !== undefined && itemLabel && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary">
            {itemCount} {itemLabel}
          </span>
        </div>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )

  // Footer mobile: stack vertical (primário em cima)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleConfirm}
        disabled={isLoading}
        className={cn('w-full rounded-full gap-2', variantStyles[variant])}
      >
        {ConfirmIcon && <ConfirmIcon className="w-4 h-4" />}
        {isLoading ? 'Processando...' : confirmLabel}
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
        className="w-full rounded-full"
      >
        {cancelLabel}
      </Button>
    </div>
  )

  // Desktop actions
  const desktopActions = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
        className="rounded-full px-8"
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={isLoading}
        className={cn('rounded-full px-8 gap-2', variantStyles[variant])}
      >
        {ConfirmIcon && <ConfirmIcon className="w-4 h-4" />}
        {isLoading ? 'Processando...' : confirmLabel}
      </Button>
    </>
  )

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && !isLoading && onClose()}
        snapPoints={snapPoints}
        dismissible={!isLoading}
      >
        <div className="px-2">{content}</div>
        <BottomSheetFooter>{mobileActions}</BottomSheetFooter>
      </BottomSheet>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      headerColor={headerColor}
      showCloseButton={showCloseButton}
      size={size}
    >
      <ModalBody>{content}</ModalBody>
      <ModalFooter className="border-t-0">{desktopActions}</ModalFooter>
    </Modal>
  )
}
