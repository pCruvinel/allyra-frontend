import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, LayoutGrid, List, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { CreateAppointmentModal } from '@/components/modals'
import { CalendarMonthView } from '@/components/calendar'
import { apiService, type ApiResponse, type Appointment } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'
import { usePaginationConfig } from '@/hooks'
import type { CalendarEvent } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AgendamentosSectionProps {
  patientId: string
}

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  falta: 'Falta',
  reagendado: 'Reagendado',
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

const statusStyles: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-primary text-white',
  cancelado: 'bg-red-100 text-red-700',
  concluido: 'bg-muted text-muted-foreground',
  aguardando: 'bg-yellow-100 text-yellow-700',
  em_atendimento: 'bg-purple-100 text-purple-700',
  falta: 'bg-red-100 text-red-700',
  reagendado: 'bg-cyan-100 text-cyan-700',
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-primary text-white',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-muted text-muted-foreground',
}

export function AgendamentosSection({ patientId }: AgendamentosSectionProps) {
  const { currentClinica, user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draftSlot, setDraftSlot] = useState<{ date: string; time: string } | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { itemsPerPage } = usePaginationConfig()

  const fetchAppointments = useCallback(async () => {
    if (!currentClinica?.id || !patientId) {
      setAppointments([])
      return
    }

    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        clinica_id: currentClinica.id,
        paciente_id: patientId,
        mode: 'all',
      })
      const response = await apiService.get<ApiResponse<Appointment[]>>(`/api/appointments?${query.toString()}`)
      const nextAppointments = [...(response.data || [])].sort(
        (left, right) =>
          new Date(left.data_hora_inicio).getTime() - new Date(right.data_hora_inicio).getTime(),
      )
      setAppointments(nextAppointments)
    } catch {
      toast.error('Não foi possível carregar os agendamentos deste paciente')
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, patientId])

  useEffect(() => {
    if (patientId) {
      void fetchAppointments()
    }
  }, [fetchAppointments, patientId])

  const totalPages = Math.ceil(appointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAppointments = appointments.slice(startIndex, startIndex + itemsPerPage)

  const appointmentRows = useMemo(() => {
    return paginatedAppointments.map((appointment) => {
      const startDate = new Date(appointment.data_hora_inicio)
      const endDate = new Date(appointment.data_hora_fim)
      const isValidStart = !Number.isNaN(startDate.getTime())
      const isValidEnd = !Number.isNaN(endDate.getTime())

      return {
        ...appointment,
        serviceName: appointment.servico?.nome || 'Consulta',
        dateLabel: isValidStart
          ? startDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '-',
        timeLabel: isValidStart
          ? startDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
        durationLabel: isValidStart && isValidEnd
          ? Math.max(30, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
          : 30,
      }
    })
  }, [paginatedAppointments])

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const statusMap: Record<string, CalendarEvent['status']> = {
      agendado: 'scheduled',
      confirmado: 'confirmed',
      cancelado: 'cancelled',
      concluido: 'completed',
      aguardando: 'waiting',
      em_atendimento: 'in_progress',
      reagendado: 'scheduled',
      falta: 'cancelled',
    }

    return appointments.flatMap((appointment) => {
      const startDate = new Date(appointment.data_hora_inicio)
      const endDate = new Date(appointment.data_hora_fim)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return []
      }

      const duration = Math.max(30, Math.round((endDate.getTime() - startDate.getTime()) / 60000))

      return [{
        id: appointment.id,
        patientName: appointment.paciente?.nome_completo || 'Paciente',
        patientId: appointment.paciente?.id || patientId,
        date: startDate,
        time: startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        duration,
        type: 'consulta',
        status: statusMap[appointment.status] || 'scheduled',
        professionalId: appointment.profissional?.id || '',
      }]
    })
  }, [appointments, patientId])

  const formattedCurrentMonth = useMemo(
    () =>
      currentDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
    [currentDate],
  )

  const shiftMonth = (months: number) => {
    setCurrentDate((previous) => {
      const next = new Date(previous)
      next.setMonth(previous.getMonth() + months)
      return next
    })
  }

  const handleNewAppointment = () => {
    setDraftSlot(null)
    setIsAppointmentModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setCurrentDate(new Date(event.date))
  }

  const handleAppointmentCreate = async (data: {
    service: string
    insurance: string
    professional: string
    patient: string
    date: string
    time: string
  }) => {
    if (!currentClinica?.id || !user?.id) {
      toast.error('Clínica ou usuário não identificados')
      return
    }

    const tzOffset = (() => {
      const off = -new Date().getTimezoneOffset()
      const sign = off >= 0 ? '+' : '-'
      const abs = Math.abs(off)
      return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
    })()
    const dataHoraInicio = `${data.date}T${data.time}:00${tzOffset}`
    const [hours, minutes] = data.time.split(':').map(Number)
    const endMinutes = minutes + 30
    const endHours = hours + Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const dataHoraFim = `${data.date}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00${tzOffset}`

    const result = await apiService.createAppointment({
      paciente_id: patientId,
      profissional_id: data.professional,
      servico_id: data.service,
      data_hora_inicio: dataHoraInicio,
      data_hora_fim: dataHoraFim,
      duracao_minutos: 30,
      tipo: 'consulta',
      convenio_id: data.insurance !== 'particular' ? data.insurance : undefined,
      observacoes: '',
      criado_por_id: user.id,
    }, currentClinica.id)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Agendamento criado com sucesso')
    setIsAppointmentModalOpen(false)
    setDraftSlot(null)
    void fetchAppointments()
  }

  const handleModalClose = () => {
    setIsAppointmentModalOpen(false)
    setDraftSlot(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Histórico de agendamentos</h3>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
                viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Calendário
            </button>
          </div>

          <Button
            onClick={handleNewAppointment}
            className="rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            Novo agendamento
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <>
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Calendário mensal</p>
              <p className="text-sm font-medium text-foreground capitalize">{formattedCurrentMonth}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CalendarMonthView
            currentDate={currentDate}
            events={calendarEvents}
            onEventClick={handleEventClick}
            onDateClick={setCurrentDate}
          />
        </>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {appointmentRows.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-1 h-12 bg-primary rounded-full" />

                <div>
                  <p className="text-sm font-medium text-foreground">
                    {appointment.serviceName}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {appointment.dateLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {appointment.timeLabel}
                    </span>
                    <span>{appointment.durationLabel} min</span>
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  statusStyles[appointment.status] || 'bg-muted text-muted-foreground'
                )}
              >
                {statusLabels[appointment.status] || appointment.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum agendamento encontrado
        </div>
      )}

      {viewMode === 'list' && appointments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={appointments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      <CreateAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={handleModalClose}
        onSubmit={handleAppointmentCreate}
        initialPatientId={patientId}
        initialDate={draftSlot?.date}
        initialTime={draftSlot?.time}
      />
    </div>
  )
}
