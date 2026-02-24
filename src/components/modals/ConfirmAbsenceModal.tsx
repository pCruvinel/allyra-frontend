import { ConfirmationModal } from './ConfirmationModal'

interface ConfirmAbsenceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmAbsenceModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmAbsenceModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmar ação"
      heading="REGISTRAR FALTA!"
      description="Antes de proceder, gostaríamos de confirmar se você realmente deseja realizar essa ação. Por favor, confirme sua decisão."
      confirmLabel="Confirmar"
      cancelLabel="Cancelar"
      headerColor="danger"
    />
  )
}
