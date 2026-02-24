import { Modal, ModalBody } from '@/components/ui/modal'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemCount?: number
  itemLabel?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemCount,
  itemLabel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  variant = 'danger',
}: ConfirmActionModalProps) {
  const isMobile = useIsMobile()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const content = (
    <div className="text-center py-2">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>

      {itemCount && itemLabel && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary">
            {itemCount} {itemLabel}
          </span>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )

  // Footer mobile: stack vertical (primario embaixo)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleConfirm}
        className={`w-full rounded-full gap-2 ${
          variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
        }`}
      >
        <Trash2 className="w-4 h-4" />
        {confirmLabel}
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full rounded-full border-primary text-primary hover:bg-primary/10"
      >
        {cancelLabel}
      </Button>
    </div>
  )

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        snapPoints={[0.45]}
        dismissible
      >
        <div className="px-2">
          {content}
        </div>
        <BottomSheetFooter>
          {mobileActions}
        </BottomSheetFooter>
      </BottomSheet>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton>
      <ModalBody className="pt-2">
        {content}

        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full px-6 border-primary text-primary hover:bg-primary/10"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`rounded-full px-6 gap-2 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {confirmLabel}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  )
}
