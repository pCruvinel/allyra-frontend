import { useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  Clock,
  User,
  CreditCard,
  UserCheck,
  CalendarClock,
  CalendarX,
  FileText,
  Stethoscope,
} from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { CalendarEvent } from '@/types'

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
  onConfirmArrival?: (event: CalendarEvent) => void
  onStartAttendance?: (event: CalendarEvent) => void
  onReschedule?: (event: CalendarEvent) => void
  onCancel?: (event: CalendarEvent) => void
}

const eventTypeLabels: Record<CalendarEvent['type'], string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  exame: 'Exame',
  procedimento: 'Procedimento',
}

const statusLabels: Record<CalendarEvent['status'], string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  waiting: 'Aguardando',
}

const statusColors: Record<CalendarEvent['status'], string> = {
  scheduled: 'bg-muted text-muted-foreground',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  waiting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  event,
  onConfirmArrival,
  onStartAttendance,
  onReschedule,
  onCancel,
}: AppointmentDetailsModalProps) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  if (!event) return null

  const handleViewPatient = () => {
    onClose()
    navigate({ to: `/pacientes/${event.patientId}` })
  }

  const handleStartAttendance = () => {
    if (onStartAttendance) {
      onStartAttendance(event)
    }
    onClose()
    navigate({ to: `/pacientes/${event.patientId}`, search: { tab: 'prontuario' } })
  }

  const canStartAttendance = event.status === 'confirmed'
  const canConfirmArrival = event.status === 'scheduled' || event.status === 'confirmed'
  const canReschedule = event.status !== 'completed' && event.status !== 'cancelled'
  const canCancel = event.status !== 'completed' && event.status !== 'cancelled'

  const content = (
    <>
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            statusColors[event.status]
          )}
        >
          {statusLabels[event.status]}
        </span>
        <span className="text-sm text-muted-foreground">
          {eventTypeLabels[event.type]}
        </span>
      </div>

      {/* Informacoes do Paciente */}
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">PACIENTE</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{event.patientName}</p>
            <p className="text-sm text-muted-foreground">ID: {event.patientId}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewPatient}
            className="w-full rounded-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver ficha do paciente
          </Button>
          {canStartAttendance && (
            <Button
              size="sm"
              onClick={handleStartAttendance}
              className="w-full rounded-full"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Iniciar Atendimento
            </Button>
          )}
        </div>
      </div>

      {/* Informacoes do Agendamento */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">AGENDAMENTO</h3>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium text-foreground capitalize">{formatDate(event.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Horario</p>
            <p className="font-medium text-foreground">
              {event.time} ({event.duration} minutos)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo</p>
            <p className="font-medium text-foreground">{eventTypeLabels[event.type]}</p>
          </div>
        </div>
      </div>

      {/* Acoes Rapidas - só exibe se houver pelo menos uma ação disponível */}
      {((canConfirmArrival && onConfirmArrival) || (canReschedule && onReschedule) || (canCancel && onCancel)) && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">ACOES RAPIDAS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {canConfirmArrival && onConfirmArrival && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onConfirmArrival(event)
                  onClose()
                }}
                className="rounded-full"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Confirmar chegada
              </Button>
            )}

            {canReschedule && onReschedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReschedule(event)
                  onClose()
                }}
                className="rounded-full"
              >
                <CalendarClock className="w-4 h-4 mr-2" />
                Reagendar
              </Button>
            )}

            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCancel(event)
                  onClose()
                }}
                className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <CalendarX className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )

  // Footer mobile: stack vertical
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full rounded-full"
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
        title="Detalhes do Agendamento"
        snapPoints={[0.75, 0.95]}
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
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Agendamento" size="md">
      <ModalBody>
        {content}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="rounded-full">
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
