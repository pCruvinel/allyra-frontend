import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { ReadOnlyField } from '@/components/ui'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { AuditLog } from '@/types/audit'

interface DetalhesLogModalProps {
  isOpen: boolean
  onClose: () => void
  log: AuditLog | null
}

export function DetalhesLogModal({ isOpen, onClose, log }: DetalhesLogModalProps) {
  const isMobile = useIsMobile()

  if (!log) return null

  const content = (
    <div className="space-y-4">
      <ReadOnlyField label="Ação" value={log.action} />
      <ReadOnlyField label="IP" value={log.ip} />
      <ReadOnlyField label="Browser" value={log.browser} />
      <ReadOnlyField label="Dispositivo" value={log.device} />
    </div>
  )

  // Footer mobile: stack vertical
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={onClose}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        Fechar
      </Button>
    </div>
  )

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Detalhes do Log"
        snapPoints={[0.55, 0.75]}
        dismissible
      >
        {content}
        <BottomSheetFooter>
          {mobileActions}
        </BottomSheetFooter>
      </BottomSheet>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Log" size="md">
      <ModalBody className="space-y-4">
        {content}
      </ModalBody>

      <ModalFooter>
        <Button
          onClick={onClose}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
