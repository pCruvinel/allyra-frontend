import { ConfirmationModal } from './ConfirmationModal'

interface ConfirmArrivalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  patientName: string
  date: string
  time: string
}

export function ConfirmArrivalModal({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  date,
  time,
}: ConfirmArrivalModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmar ação"
      heading="REGISTRAR CHEGADA DO PACIENTE!"
      description={
        <>
          Ao clicar em "Confirmar" você declara que o paciente{' '}
          <strong>{patientName}</strong> chegou até a clínica na data {date} às {time}.
        </>
      }
      confirmLabel="Confirmar"
      cancelLabel="Cancelar"
      headerColor="danger"
      snapPoints={[0.45]}
    />
  )
}
