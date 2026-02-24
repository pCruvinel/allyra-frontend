/**
 * ReportModal - Modal para visualização do relatório de evolução
 */

import { Modal, ModalBody } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody } from '@/components/ui/app-drawer'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { ReportView } from '../ReportView'
import type { TherapeuticPlan } from '@/types/goals'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  plan: TherapeuticPlan | null
}

export function ReportModal({ isOpen, onClose, plan }: ReportModalProps) {
  const isMobile = useIsMobile()

  if (!plan) return null

  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Relatório de Evolução"
      >
        <AppDrawerBody className="pb-8">
          <ReportView plan={plan} />
        </AppDrawerBody>
      </AppDrawer>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Evolução"
      size="lg"
    >
      <ModalBody className="max-h-[80vh] overflow-y-auto">
        <ReportView plan={plan} />
      </ModalBody>
    </Modal>
  )
}
