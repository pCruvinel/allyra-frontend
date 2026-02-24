import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  submitLabel?: string
  cancelLabel?: string
  submitDisabled?: boolean
  submitVariant?: 'default' | 'destructive'
  children: React.ReactNode
}

/**
 * FormModal - Modal responsivo para formularios
 *
 * Desktop: Modal tradicional centralizado
 * Mobile: AppDrawer fullscreen com footer fixo
 */
export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  size = 'md',
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  submitDisabled = false,
  submitVariant = 'default',
  children,
}: FormModalProps) {
  const isMobile = useIsMobile()

  // Footer mobile: stack vertical (primario embaixo)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={onSubmit}
        disabled={submitDisabled}
        variant={submitVariant}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        {submitLabel}
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full rounded-full"
      >
        {cancelLabel}
      </Button>
    </div>
  )

  // Mobile: usar AppDrawer fullscreen
  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={title}
        description={description}
      >
        <AppDrawerBody className="space-y-4">
          {children}
        </AppDrawerBody>
        <AppDrawerFooter>
          {mobileActions}
        </AppDrawerFooter>
      </AppDrawer>
    )
  }

  // Desktop: usar Modal tradicional
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <ModalBody className="space-y-4">
        {children}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-full"
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitDisabled}
          variant={submitVariant}
          className="rounded-full bg-primary hover:bg-primary/90"
        >
          {submitLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
