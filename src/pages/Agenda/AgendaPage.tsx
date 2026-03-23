import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, CalendarClock, Clock, FileText, MessageCircle, Users } from 'lucide-react'
import { CalendarDayView, CalendarGrid, CalendarHeader, CalendarWeekView } from '@/components/calendar'
import { ChatPanel } from '@/components/chat'
import { AppointmentDetailsModal } from '@/components/modals/AppointmentDetailsModal'
import { HorariosVagosModal } from '@/components/modals/HorariosVagosModal'
import { ListaEsperaModal } from '@/components/modals/ListaEsperaModal'
import { FloatingButton } from '@/components/ui'
import { StandardFilterBar } from '@/components/ui/standard-filter-bar'
import { SkeletonCalendar } from '@/components/ui/skeleton'
import { useModal } from '@/contexts'
import { useAuth } from '@/contexts/AuthContext'
import { useAppointments, useProfessionals } from '@/hooks'

import type { CalendarEvent, CalendarView, Professional } from '@/types'
import { toast } from 'sonner'
import { formatLocalISO } from '@/utils/appointment-helpers'
import { OrcamentosTab } from './OrcamentosTab'
import { RecepcaoTab } from './RecepcaoTab'
import { canViewAllAgendas, getAgendaPreferenceKey, resolveInitialAgendaProfessional } from './agendaPreferences'
import { Select } from '@/components/ui/select'

type AgendaTab = 'calendario' | 'recepcao' | 'orcamentos'

const typeMap: Record<string, CalendarEvent['type']> = {
  consulta: 'consulta',
  retorno: 'retorno',
  exame: 'exame',
  procedimento: 'procedimento',
}

const statusMap: Record<string, CalendarEvent['status']> = {
  agendado: 'scheduled',
  confirmado: 'confirmed',
  aguardando: 'waiting',
  em_atendimento: 'in_progress',
  concluido: 'completed',
  cancelado: 'cancelled',
  falta: 'cancelled',
  reagendado: 'scheduled',
}

export function AgendaPage() {
  const { openModal } = useModal()
  const { user, currentClinica } = useAuth()
  const [activeTab, setActiveTab] = useState<AgendaTab>('calendario')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [view, setView] = useState<CalendarView>('month')
  const [selectedTypes, setSelectedTypes] = useState<CalendarEvent['type'][]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<CalendarEvent['status'][]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false)
  const [isEmptySlotsOpen, setIsEmptySlotsOpen] = useState(false)

  const {
    professionals: professionalsData,
    isLoading: professionalsLoading,
    hasLoaded: professionalsLoaded,
  } = useProfessionals()
  const allowAllAgendas = canViewAllAgendas(user?.perfil_tipo)
  const initializationKey = `${currentClinica?.id ?? 'sem-clinica'}:${user?.id ?? 'sem-usuario'}`
  const initializedSelectionRef = useRef<string | null>(null)

  const preferenceKey = useMemo(() => {
    if (!currentClinica?.id || !user?.id || !allowAllAgendas) return null
    return getAgendaPreferenceKey(currentClinica.id, user.id)
  }, [allowAllAgendas, currentClinica?.id, user?.id])

  const professionals: Professional[] = useMemo(() => (
    professionalsData.map((professional) => ({
      id: professional.id,
      name: professional.name,
      specialty: professional.specialties?.[0] || 'Geral',
      avatar: professional.avatar ?? undefined,
    }))
  ), [professionalsData])

  const visibleProfessionals = useMemo(() => {
    if (allowAllAgendas) return professionals

    const ownProfessionalId = professionalsData.find((professional) => professional.userId === user?.id)?.id
    return professionals.filter((professional) => professional.id === ownProfessionalId)
  }, [allowAllAgendas, professionals, professionalsData, user?.id])

  const defaultProfessionalScope = selectedProfessional || (!allowAllAgendas ? visibleProfessionals[0]?.id || '' : '')

  useEffect(() => {
    if (!professionalsLoaded || !user?.id) return
    if (initializedSelectionRef.current === initializationKey) return

    const storedProfessionalId = preferenceKey
      ? localStorage.getItem(preferenceKey) || undefined
      : undefined

    const nextProfessionalId = resolveInitialAgendaProfessional({
      perfilTipo: user.perfil_tipo,
      userId: user.id,
      professionals: professionalsData.map((professional) => ({
        id: professional.id,
        userId: professional.userId,
      })),
      storedProfessionalId,
    })

    setSelectedProfessional(nextProfessionalId)
    initializedSelectionRef.current = initializationKey
  }, [initializationKey, preferenceKey, professionalsData, professionalsLoaded, user?.id, user?.perfil_tipo])

  useEffect(() => {
    if (!preferenceKey || initializedSelectionRef.current !== initializationKey) return

    if (selectedProfessional) {
      localStorage.setItem(preferenceKey, selectedProfessional)
    } else {
      localStorage.removeItem(preferenceKey)
    }
  }, [initializationKey, preferenceKey, selectedProfessional])

  const {
    appointments,
    isLoading: appointmentsLoading,
    registerArrival,
    startAttendance,
    cancelAppointment: cancelAppointment,
    changeStatus,
    updateAppointment,
  } = useAppointments({
    mode: 'month',
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  })

  const calendarEvents: CalendarEvent[] = useMemo(() => (
    appointments.map((appointment) => ({
      id: appointment.id,
      patientName: appointment.patientName,
      patientId: appointment.patientId,
      date: new Date(`${appointment.date}T00:00:00`),
      time: appointment.time,
      duration: appointment.duration,
      type: typeMap[appointment.type] || 'consulta',
      status: statusMap[appointment.status] || 'scheduled',
      professionalId: appointment.professionalId,
    }))
  ), [appointments])

  const filteredEvents = useMemo(() => {
    if (!allowAllAgendas && !defaultProfessionalScope) {
      return []
    }

    let result = calendarEvents

    if (defaultProfessionalScope) {
      result = result.filter((event) => event.professionalId === defaultProfessionalScope)
    }

    if (selectedTypes.length > 0) {
      result = result.filter((event) => selectedTypes.includes(event.type))
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((event) => selectedStatuses.includes(event.status))
    }

    return result
  }, [allowAllAgendas, calendarEvents, defaultProfessionalScope, selectedStatuses, selectedTypes])

  const isLoading = professionalsLoading || appointmentsLoading

  const openAppointmentModal = (professionalId?: string) => {
    openModal('appointment', undefined, undefined, professionalId || defaultProfessionalScope || undefined)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDetailsModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleTimeSlotClick = (date: Date, _hour: number) => {
    void _hour
    setCurrentDate(date)
    openAppointmentModal()
  }

  const handleDayTimeSlotClick = (_hour: number) => {
    void _hour
    openAppointmentModal()
  }

  const handleWaitingList = () => {
    setIsWaitingListOpen(true)
  }

  const handleEmptySlots = () => {
    setIsEmptySlotsOpen(true)
  }

  const handleStartAttendance = async (event: CalendarEvent) => {
    // State machine: aguardando → em_atendimento (via dedicated endpoint)
    const success = await startAttendance(event.id)
    if (success) {
      toast.success(`Atendimento de ${event.patientName} iniciado`)
    }
  }

  const handleCancelWaiting = async (event: CalendarEvent) => {
    // State machine: aguardando → cancelado | confirmado → cancelado | agendado → cancelado
    // "Cancelar" from waiting list should set status to 'cancelado'
    const success = await cancelAppointment(event.id)
    if (success) {
      toast.info(`${event.patientName} removido da lista de espera`)
    }
  }

  const handleSelectEmptySlot = (date: Date, _hour: number) => {
    void _hour
    setCurrentDate(date)
    openAppointmentModal()
  }



  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const handleConfirmArrival = async (event: CalendarEvent) => {
    const success = await registerArrival(event.id)
    if (success) {
      toast.success(`Chegada de ${event.patientName} registrada`)
    }
  }

  const handleReschedule = async (event: CalendarEvent) => {
    // State machine valid transitions to 'reagendado':
    //   agendado → reagendado ✓
    //   confirmado → reagendado ✓
    //   aguardando → reagendado ✗ (not allowed, must cancel first)
    //   em_atendimento → reagendado ✗ (can only go to concluido)
    // Map internal CalendarEvent status back to DB status for validation
    const dbStatusMap: Record<string, string> = {
      scheduled: 'agendado',
      confirmed: 'confirmado',
      waiting: 'aguardando',
      completed: 'concluido',
      cancelled: 'cancelado',
    }
    const currentDbStatus = dbStatusMap[event.status] || event.status

    // If patient is currently in a state that doesn't allow 'reagendado',
    // cancel first then open a new appointment
    if (currentDbStatus === 'em_atendimento') {
      toast.error(`Não é possível reagendar: ${event.patientName} está em atendimento. Conclua o atendimento primeiro.`)
      return
    }

    if (currentDbStatus === 'aguardando') {
      // From 'aguardando', can't go to 'reagendado' directly.
      // Cancel the appointment and open a new one
      const success = await cancelAppointment(event.id)
      if (success) {
        toast.info(`Agendamento de ${event.patientName} cancelado. Crie um novo agendamento.`)
        openAppointmentModal(event.professionalId)
      }
      return
    }

    const success = await changeStatus(event.id, 'reagendado')
    if (success) {
      toast.info(`Agendamento de ${event.patientName} marcado como reagendado. Crie um novo agendamento.`)
      openAppointmentModal(event.professionalId)
    }
  }

  const handleCancelAppointment = async (event: CalendarEvent) => {
    const success = await cancelAppointment(event.id)
    if (success) {
      toast.success(`Agendamento de ${event.patientName} cancelado`)
    }
  }

  const handleEventDrop = async (eventId: string, targetDate: Date, targetHour: number, targetMinutes: number = 0) => {
    const event = calendarEvents.find((calendarEvent) => calendarEvent.id === eventId)
    if (!event) return

    const newStart = new Date(targetDate)
    newStart.setHours(targetHour, targetMinutes, 0, 0)

    const newEnd = new Date(newStart.getTime() + event.duration * 60000)
    const data_hora_inicio = formatLocalISO(newStart)
    const data_hora_fim = formatLocalISO(newEnd)

    const updated = await updateAppointment(eventId, {
      data_hora_inicio,
      data_hora_fim,
    })

    if (updated) {
      const timeStr = `${targetHour}:${targetMinutes.toString().padStart(2, '0')}`
      toast.success(`Agendamento de ${event.patientName} remarcado para ${newStart.toLocaleDateString()} as ${timeStr}`)
    }
  }

  const handleDayEventDrop = async (eventId: string, targetHour: number, targetMinutes: number = 0) => {
    await handleEventDrop(eventId, currentDate, targetHour, targetMinutes)
  }

  const handleConverterOrcamentoAgendamento = (
    _orcamentoId: string,
    _pacienteId: string,
    professionalId: string,
  ) => {
    setSelectedProfessional(professionalId)
    setActiveTab('calendario')
    openAppointmentModal(professionalId)
    toast.info('Selecione data e horario para o agendamento')
  }

  return (
    <div className="space-y-6 pb-20">
      <StandardFilterBar
        tabs={[
          { value: 'calendario', label: 'Calendario', icon: <Calendar className="h-4 w-4" /> },
          {
            value: 'recepcao',
            label: 'Recepcao',
            icon: <Users className="h-4 w-4" />,
            visible: ['secretaria', 'administrador_total', 'admin_master'].includes(user?.perfil_tipo ?? ''),
          },
          { value: 'orcamentos', label: 'Orcamentos', icon: <FileText className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as AgendaTab)}
        showDivider={activeTab === 'calendario'}
        centerSlot={
          activeTab === 'calendario' ? (
            <Select
              options={[
                ...(allowAllAgendas ? [{ value: '', label: 'Todas as agendas' }] : []),
                ...professionals.map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={selectedProfessional}
              onChange={setSelectedProfessional}
              placeholder={allowAllAgendas ? 'Todas as agendas' : 'Selecione'}
              className="hidden min-w-[180px] sm:flex"
            />
          ) : undefined
        }
        actions={
          activeTab === 'calendario'
            ? [
                {
                  label: 'Lista de espera',
                  icon: <Clock className="h-4 w-4" />,
                  onClick: handleWaitingList,
                  hideOnMobile: true,
                },
                {
                  label: 'Horario vago',
                  icon: <CalendarClock className="h-4 w-4" />,
                  onClick: handleEmptySlots,
                  hideOnMobile: true,
                },
              ]
            : undefined
        }

      />

      {activeTab === 'calendario' ? (
        <>
          <CalendarHeader
            currentDate={currentDate}
            view={view}
            selectedTypes={selectedTypes}
            selectedStatuses={selectedStatuses}
            onDateChange={setCurrentDate}
            onViewChange={setView}
            onTypesChange={setSelectedTypes}
            onStatusesChange={setSelectedStatuses}
          />

          {isLoading ? (
            <SkeletonCalendar />
          ) : (
            <>
              {view === 'month' && (
                <CalendarGrid
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onDateClick={handleDateClick}
                />
              )}

              {view === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventDrop={handleEventDrop}
                />
              )}

              {view === 'day' && (
                <CalendarDayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleDayTimeSlotClick}
                  onEventDrop={handleDayEventDrop}
                />
              )}


            </>
          )}
        </>
      ) : activeTab === 'recepcao' ? (
        <RecepcaoTab />
      ) : (
        <OrcamentosTab onConverterAgendamento={handleConverterOrcamentoAgendamento} />
      )}

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedEvent(null)
        }}
        event={selectedEvent}
        onConfirmArrival={handleConfirmArrival}
        onReschedule={handleReschedule}
        onCancel={handleCancelAppointment}
      />

      <ListaEsperaModal
        isOpen={isWaitingListOpen}
        onClose={() => setIsWaitingListOpen(false)}
        events={filteredEvents}
        onStartAttendance={handleStartAttendance}
        onCancelWaiting={handleCancelWaiting}
        onConfirmArrival={handleConfirmArrival}
        onReschedule={handleReschedule}
      />

      <HorariosVagosModal
        isOpen={isEmptySlotsOpen}
        onClose={() => setIsEmptySlotsOpen(false)}
        events={filteredEvents}
        currentDate={currentDate}
        professionalName={professionals.find((professional) => professional.id === selectedProfessional)?.name}
        onSelectSlot={handleSelectEmptySlot}
      />

      <FloatingButton
        icon={<MessageCircle className="h-8 w-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
