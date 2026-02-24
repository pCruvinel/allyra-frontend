import { useState, useMemo } from 'react'
import { MessageCircle, Calendar, FileText, Clock, CalendarClock, Plus, Users } from 'lucide-react'
import { CalendarHeader, CalendarGrid, CalendarWeekView, CalendarDayView, CalendarLegend } from '@/components/calendar'
import { FloatingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { SkeletonCalendar } from '@/components/ui/skeleton'
import { ChatPanel } from '@/components/chat'
import { AppointmentDetailsModal } from '@/components/modals/AppointmentDetailsModal'
import { ListaEsperaModal } from '@/components/modals/ListaEsperaModal'
import { HorariosVagosModal } from '@/components/modals/HorariosVagosModal'
import { OrcamentosTab } from './OrcamentosTab'
import { RecepcaoTab } from './RecepcaoTab'
import { useModal } from '@/contexts'
import { useAppointments, useProfessionals } from '@/hooks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CalendarView, CalendarEvent, Professional } from '@/types'

type AgendaTab = 'calendario' | 'recepcao' | 'orcamentos'

// Mapeia tipo de agendamento do banco para o tipo do calendário
const typeMap: Record<string, CalendarEvent['type']> = {
  consulta: 'consulta',
  retorno: 'retorno',
  exame: 'exame',
  procedimento: 'procedimento',
}

// Mapeia status do banco para o status do calendário
const statusMap: Record<string, CalendarEvent['status']> = {
  agendado: 'scheduled',
  confirmado: 'confirmed',
  aguardando: 'waiting',
  em_atendimento: 'confirmed',
  concluido: 'completed',
  cancelado: 'cancelled',
  falta: 'cancelled',
  reagendado: 'scheduled',
}

export function AgendaPage() {
  const { openModal } = useModal()
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

  // Buscar profissionais do Supabase
  const { professionals: professionalsData, isLoading: professionalsLoading } = useProfessionals()

  // Converter profissionais para formato do calendário
  const professionals: Professional[] = useMemo(() => {
    return professionalsData.map(p => ({
      id: p.id,
      name: p.name,
      specialty: p.specialties?.[0] || 'Geral',
      avatar: p.avatar ?? undefined,
    }))
  }, [professionalsData])

  // Buscar agendamentos do mês atual do Supabase
  const {
    appointments,
    isLoading: appointmentsLoading,
    registerArrival,
    cancelAppointment: cancelApt,
    changeStatus,
  } = useAppointments({
    mode: 'month',
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  })

  // Converter agendamentos para formato CalendarEvent
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return appointments.map(apt => ({
      id: apt.id,
      patientName: apt.patientName,
      patientId: apt.patientId,
      // appending T00:00:00 forces JS to parse in local time instead of UTC
      date: new Date(`${apt.date}T00:00:00`),
      time: apt.time,
      duration: apt.duration,
      type: typeMap[apt.type] || 'consulta',
      status: statusMap[apt.status] || 'scheduled',
      professionalId: apt.professionalId,
    }))
  }, [appointments])

  // Filtra eventos pelo profissional selecionado, tipo e status
  const filteredEvents = useMemo(() => {
    let result = calendarEvents

    // Filtro por profissional
    if (selectedProfessional) {
      result = result.filter(event => event.professionalId === selectedProfessional)
    }

    // Filtro por tipo de atendimento
    if (selectedTypes.length > 0) {
      result = result.filter(event => selectedTypes.includes(event.type))
    }

    // Filtro por status do agendamento
    if (selectedStatuses.length > 0) {
      result = result.filter(event => selectedStatuses.includes(event.status))
    }

    return result
  }, [selectedProfessional, selectedTypes, selectedStatuses, calendarEvents])

  const isLoading = professionalsLoading || appointmentsLoading

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDetailsModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTimeSlotClick = (date: Date, _hour: number) => {
    setCurrentDate(date)
    openModal('appointment')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDayTimeSlotClick = (_hour: number) => {
    openModal('appointment')
  }

  const handleWaitingList = () => {
    setIsWaitingListOpen(true)
  }

  const handleEmptySlots = () => {
    setIsEmptySlotsOpen(true)
  }

  const handleStartAttendance = async (event: CalendarEvent) => {
    const success = await changeStatus(event.id, 'em_atendimento')
    if (success) {
      toast.success(`Atendimento de ${event.patientName} iniciado`)
    }
  }

  const handleCancelWaiting = async (event: CalendarEvent) => {
    const success = await changeStatus(event.id, 'confirmado')
    if (success) {
      toast.info(`${event.patientName} removido da lista de espera`)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectEmptySlot = (date: Date, _hour: number) => {
    setCurrentDate(date)
    openModal('appointment')
  }

  const handleAddAppointment = () => {
    openModal('appointment')
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
    const success = await changeStatus(event.id, 'reagendado')
    if (success) {
      toast.info(`Agendamento de ${event.patientName} marcado como reagendado. Crie um novo agendamento.`)
      openModal('appointment')
    }
  }

  const handleCancelAppointment = async (event: CalendarEvent) => {
    const success = await cancelApt(event.id)
    if (success) {
      toast.success(`Agendamento de ${event.patientName} cancelado`)
    }
  }

  // Handler para converter orçamento em agendamento
  const handleConverterOrcamentoAgendamento = (
    _orcamentoId: string,
    _pacienteId: string,
    profissionalId: string
  ) => {
    setSelectedProfessional(profissionalId)
    setActiveTab('calendario')
    openModal('appointment')
    toast.info('Selecione data e horário para o agendamento')
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Tabs + Ações */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-1.5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('calendario')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'calendario'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Calendar className="w-4 h-4" />
            Calendário
          </button>
          <button
            onClick={() => setActiveTab('recepcao')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'recepcao'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Users className="w-4 h-4" />
            Recepção
          </button>
          <button
            onClick={() => setActiveTab('orcamentos')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'orcamentos'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <FileText className="w-4 h-4" />
            Orçamentos
          </button>
        </div>

        {/* Botões de ação à direita */}
        {activeTab === 'calendario' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWaitingList}
              className="rounded-full gap-1.5 hidden sm:flex"
            >
              <Clock className="w-4 h-4" />
              Lista de espera
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmptySlots}
              className="rounded-full gap-1.5 hidden sm:flex"
            >
              <CalendarClock className="w-4 h-4" />
              Horário vago
            </Button>
            <Button
              size="sm"
              onClick={handleAddAppointment}
              className="rounded-full gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar agendamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'calendario' ? (
        <>
          <CalendarHeader
            currentDate={currentDate}
            selectedProfessional={selectedProfessional}
            professionals={professionals}
            view={view}
            selectedTypes={selectedTypes}
            selectedStatuses={selectedStatuses}
            onProfessionalChange={setSelectedProfessional}
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
                />
              )}

              {view === 'day' && (
                <CalendarDayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleDayTimeSlotClick}
                />
              )}

              {/* Legenda de tipos e status */}
              <CalendarLegend className="mt-4 px-2" />
            </>
          )}
        </>
      ) : activeTab === 'recepcao' ? (
        <RecepcaoTab />
      ) : (
        <OrcamentosTab onConverterAgendamento={handleConverterOrcamentoAgendamento} />
      )}

      {/* Modal de Detalhes do Agendamento */}
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

      {/* Modal de Lista de Espera */}
      <ListaEsperaModal
        isOpen={isWaitingListOpen}
        onClose={() => setIsWaitingListOpen(false)}
        events={filteredEvents}
        onStartAttendance={handleStartAttendance}
        onCancelWaiting={handleCancelWaiting}
        onConfirmArrival={handleConfirmArrival}
        onReschedule={handleReschedule}
      />

      {/* Modal de Horários Vagos */}
      <HorariosVagosModal
        isOpen={isEmptySlotsOpen}
        onClose={() => setIsEmptySlotsOpen(false)}
        events={filteredEvents}
        currentDate={currentDate}
        professionalName={professionals.find(p => p.id === selectedProfessional)?.name}
        onSelectSlot={handleSelectEmptySlot}
      />

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
