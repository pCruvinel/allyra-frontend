import { useState, useMemo } from 'react'
import {
  Clock, Calendar, Sun, Sunset, CheckCircle2,
  ChevronLeft, ChevronRight, CalendarPlus, Loader2
} from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface HorariosVagosModalProps {
  isOpen: boolean
  onClose: () => void
  events: CalendarEvent[]
  currentDate: Date
  professionalName?: string
  onSelectSlot?: (date: Date, hour: number) => void
  onNavigateDate?: (direction: 'prev' | 'next') => void
  loading?: boolean
}

interface TimeSlot {
  hour: number
  minute: number
  available: boolean
  label: string
}

type PeriodFilter = 'all' | 'morning' | 'afternoon'

// Gera slots de horário do dia (8h às 18h, de 30 em 30 min)
function generateTimeSlots(events: CalendarEvent[], date: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startHour = 8
  const endHour = 18

  // Normaliza a data para comparação
  const dateStr = date.toISOString().split('T')[0]

  // Eventos do dia selecionado
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.date).toISOString().split('T')[0]
    return eventDate === dateStr
  })

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

      // Verifica se há agendamento neste horário
      const isOccupied = dayEvents.some(event => {
        const [eventHour, eventMinute] = event.time.split(':').map(Number)
        const eventStart = eventHour * 60 + eventMinute
        const eventEnd = eventStart + event.duration
        const slotStart = hour * 60 + minute
        const slotEnd = slotStart + 30

        // Verifica sobreposição
        return slotStart < eventEnd && slotEnd > eventStart
      })

      slots.push({
        hour,
        minute,
        available: !isOccupied,
        label: timeLabel,
      })
    }
  }

  return slots
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function isPeriodMorning(slot: TimeSlot): boolean {
  return slot.hour < 12
}

// Componente de Slot de Horário
function TimeSlotButton({
  slot,
  isSelected,
  onClick,
  disabled,
}: {
  slot: TimeSlot
  isSelected: boolean
  onClick: () => void
  disabled?: boolean
}) {
  const isAvailable = slot.available && !disabled

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAvailable}
      className={cn(
        'relative flex items-center justify-center gap-1.5 px-3 py-2.5',
        'rounded-xl text-sm font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-lg scale-105'
          : isAvailable
            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-md border border-primary/20'
            : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
      )}
    >
      <Clock className={cn('w-3.5 h-3.5', isSelected && 'text-primary-foreground/80')} />
      <span>{slot.label}</span>

      {isSelected && (
        <CheckCircle2 className="w-4 h-4 absolute -top-1 -right-1 text-white bg-green-500 rounded-full" />
      )}
    </button>
  )
}

// Componente de Filtro de Período
function PeriodFilterComponent({
  value,
  onChange,
  morningCount,
  afternoonCount,
}: {
  value: PeriodFilter
  onChange: (value: PeriodFilter) => void
  morningCount: number
  afternoonCount: number
}) {
  const filters = [
    { id: 'all' as const, label: 'Todos', icon: Clock, count: morningCount + afternoonCount },
    { id: 'morning' as const, label: 'Manhã', icon: Sun, count: morningCount },
    { id: 'afternoon' as const, label: 'Tarde', icon: Sunset, count: afternoonCount },
  ]

  return (
    <div className="flex gap-2 p-1 bg-muted rounded-xl">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            value === filter.id
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <filter.icon className="w-4 h-4" />
          <span>{filter.label}</span>
          <span className={cn(
            'px-1.5 py-0.5 rounded-full text-xs',
            value === filter.id
              ? 'bg-primary/10 text-primary'
              : 'bg-muted-foreground/10 text-muted-foreground'
          )}>
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  )
}

// Componente de Seção de Horários
function TimeSlotsSection({
  title,
  icon: Icon,
  slots,
  selectedSlot,
  onSelectSlot,
}: {
  title: string
  icon: React.ElementType
  slots: TimeSlot[]
  selectedSlot: TimeSlot | null
  onSelectSlot: (slot: TimeSlot) => void
}) {
  if (slots.length === 0) return null

  const availableCount = slots.filter(s => s.available).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {availableCount} disponíveis
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot) => (
          <TimeSlotButton
            key={slot.label}
            slot={slot}
            isSelected={selectedSlot?.label === slot.label}
            onClick={() => onSelectSlot(slot)}
          />
        ))}
      </div>
    </div>
  )
}

interface ContentProps {
  slots: TimeSlot[]
  currentDate: Date
  professionalName?: string
  onSelectSlot?: (date: Date, hour: number) => void
  onClose: () => void
  onNavigateDate?: (direction: 'prev' | 'next') => void
  loading?: boolean
}

function HorariosVagosContent({
  slots,
  currentDate,
  professionalName,
  onSelectSlot,
  onClose,
  onNavigateDate,
  loading,
}: ContentProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [isConfirming, setIsConfirming] = useState(false)

  const { morningSlots, afternoonSlots, availableCount, morningCount, afternoonCount } = useMemo(() => {
    const morning = slots.filter(s => isPeriodMorning(s))
    const afternoon = slots.filter(s => !isPeriodMorning(s))

    return {
      morningSlots: morning,
      afternoonSlots: afternoon,
      availableCount: slots.filter(s => s.available).length,
      morningCount: morning.filter(s => s.available).length,
      afternoonCount: afternoon.filter(s => s.available).length,
    }
  }, [slots])

  const filteredSlots = useMemo(() => {
    switch (periodFilter) {
      case 'morning':
        return { morning: morningSlots, afternoon: [] }
      case 'afternoon':
        return { morning: [], afternoon: afternoonSlots }
      default:
        return { morning: morningSlots, afternoon: afternoonSlots }
    }
  }, [periodFilter, morningSlots, afternoonSlots])

  const handleSelectSlot = (slot: TimeSlot) => {
    if (!slot.available) return
    setSelectedSlot(selectedSlot?.label === slot.label ? null : slot)
  }

  const handleConfirm = async () => {
    if (!selectedSlot || !onSelectSlot) return

    setIsConfirming(true)
    const slotDate = new Date(currentDate)
    slotDate.setHours(selectedSlot.hour, selectedSlot.minute, 0, 0)
    onSelectSlot(slotDate, selectedSlot.hour)
    setIsConfirming(false)
    onClose()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Carregando horários...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between py-3 px-4 -mx-4 bg-muted/50 border-y border-border">
        <button
          type="button"
          onClick={() => onNavigateDate?.('prev')}
          disabled={!onNavigateDate}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {capitalizeFirst(formatDate(currentDate))}
          </p>
          <p className="text-sm text-primary font-medium">
            {availableCount} horários disponíveis
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateDate?.('next')}
          disabled={!onNavigateDate}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {professionalName && (
        <p className="text-sm text-muted-foreground text-center">
          {professionalName}
        </p>
      )}

      {/* Filtros */}
      <PeriodFilterComponent
        value={periodFilter}
        onChange={setPeriodFilter}
        morningCount={morningCount}
        afternoonCount={afternoonCount}
      />

      {/* Horários da Manhã */}
      <TimeSlotsSection
        title="Manhã"
        icon={Sun}
        slots={filteredSlots.morning}
        selectedSlot={selectedSlot}
        onSelectSlot={handleSelectSlot}
      />

      {/* Horários da Tarde */}
      <TimeSlotsSection
        title="Tarde"
        icon={Sunset}
        slots={filteredSlots.afternoon}
        selectedSlot={selectedSlot}
        onSelectSlot={handleSelectSlot}
      />

      {/* Empty state */}
      {filteredSlots.morning.length === 0 && filteredSlots.afternoon.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">Sem horários disponíveis</p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Não há horários vagos para este período. Tente selecionar outro dia ou período.
          </p>
        </div>
      )}

      {/* Footer com seleção */}
      {selectedSlot && onSelectSlot && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Selecionado:</span>
            <span className="font-semibold text-primary">{selectedSlot.label}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSlot(null)}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="rounded-full"
            >
              {isConfirming ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CalendarPlus className="w-4 h-4 mr-2" />
              )}
              Agendar
            </Button>
          </div>
        </div>
      )}

      {!selectedSlot && onSelectSlot && availableCount > 0 && (
        <p className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
          Selecione um horário para criar um novo agendamento
        </p>
      )}
    </div>
  )
}

export function HorariosVagosModal({
  isOpen,
  onClose,
  events,
  currentDate,
  professionalName,
  onSelectSlot,
  onNavigateDate,
  loading,
}: HorariosVagosModalProps) {
  const isMobile = useIsMobile()
  const slots = useMemo(() => generateTimeSlots(events, currentDate), [events, currentDate])

  const contentProps = {
    slots,
    currentDate,
    professionalName,
    onSelectSlot,
    onClose,
    onNavigateDate,
    loading,
  }

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Horários Disponíveis"
        description="Selecione um horário disponível"
        snapPoints={[0.7, 0.95]}
      >
        <HorariosVagosContent {...contentProps} />
      </BottomSheet>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Horários Disponíveis"
      size="md"
    >
      <ModalBody className="p-0">
        <div className="p-6">
          <HorariosVagosContent {...contentProps} />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="rounded-full">
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
