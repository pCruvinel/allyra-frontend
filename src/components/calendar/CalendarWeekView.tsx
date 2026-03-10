import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface CalendarWeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (date: Date, hour: number) => void
  onEventDrop?: (eventId: string, targetDate: Date, targetHour: number, targetMinutes: number) => void
}

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06:00 - 22:00
const HALF_HOUR_SLOTS = HOURS.flatMap((hour) => [
  { hour, minutes: 0 },
  { hour, minutes: 30 },
])

function getWeekDays(date: Date): Date[] {
  const days: Date[] = []
  const start = new Date(date)
  const dayOfWeek = start.getDay() // 0 = Domingo
  start.setDate(start.getDate() - dayOfWeek) // Volta para domingo

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }

  return days
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function getEventTop(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const startHour = 6
  return ((hours - startHour) * 60 + minutes) * (48 / 60) // 48px por hora
}

function getEventHeight(duration: number): number {
  return duration * (48 / 60) // 48px por hora
}

const eventTypeLabels: Record<CalendarEvent['type'], string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  exame: 'Exame',
  procedimento: 'Procedimento',
}

const eventTypePastel: Record<CalendarEvent['type'], { bg: string; border: string; text: string; dot: string }> = {
  consulta: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-l-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  retorno: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-l-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  exame: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-l-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  procedimento: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-l-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
}

export function CalendarWeekView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  onEventDrop,
}: CalendarWeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => isSameDay(event.date, date))
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Container com scroll */}
      <div className="overflow-auto max-h-[680px] min-h-[400px]">
        <div className="min-w-[760px]">
          {/* Header roxo com dias da semana - sticky */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10">
            {/* Coluna de horas (vazia no header) */}
            <div className="py-3 px-2 bg-primary" />

            {/* Dias da semana - fundo roxo sólido */}
            {weekDays.map((date, index) => (
              <div
                key={index}
                className={cn(
                  'py-3 text-center border-r border-primary-foreground/20 last:border-r-0',
                  isToday(date) ? 'bg-primary/80' : 'bg-primary'
                )}
              >
                <div className="text-xs font-semibold text-primary-foreground uppercase">
                  {WEEKDAYS[index]}
                </div>
                <div className="text-lg font-bold text-primary-foreground">
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de horários */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Coluna de horas */}
            <div className="border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-12 px-2 border-b border-border/50 flex items-start justify-end pt-1"
              >
                <span className="text-xs text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {weekDays.map((date, dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                'relative border-r border-border last:border-r-0',
                isToday(date) && 'bg-primary/5'
              )}
            >
              {/* Sub-slots de 30 minutos (clicáveis e droppáveis) */}
              {HALF_HOUR_SLOTS.map((slot) => (
                <div
                  key={`${slot.hour}-${slot.minutes}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onTimeSlotClick(date, slot.hour)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add('bg-primary/20', 'ring-2', 'ring-primary/40', 'ring-inset')
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-primary/20', 'ring-2', 'ring-primary/40', 'ring-inset')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('bg-primary/20', 'ring-2', 'ring-primary/40', 'ring-inset')
                    const eventId = e.dataTransfer.getData('eventId')
                    if (eventId && onEventDrop) {
                      onEventDrop(eventId, date, slot.hour, slot.minutes)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onTimeSlotClick(date, slot.hour)
                    }
                  }}
                  className={cn(
                    'h-6 hover:bg-primary/10 cursor-pointer transition-colors relative',
                    slot.minutes === 0 ? 'border-b border-border/20' : 'border-b border-border/50',
                  )}
                />
              ))}

              {/* Eventos do dia - Cards pastel */}
              {getEventsForDay(date).map((event) => {
                const colors = eventTypePastel[event.type]
                return (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('eventId', event.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      document.querySelectorAll('.ring-primary\\/40').forEach((el) => {
                        el.classList.remove('bg-primary/20', 'ring-2', 'ring-primary/40', 'ring-inset')
                      })
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onEventClick(event)
                      }
                    }}
                    style={{
                      top: `${getEventTop(event.time)}px`,
                      height: `${getEventHeight(event.duration)}px`,
                    }}
                    className={cn(
                      'absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden cursor-pointer',
                      'hover:shadow-md transition-all border-l-[3px]',
                      colors.bg,
                      colors.border,
                    )}
                  >
                    <div className="flex items-start justify-between gap-0.5">
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'text-[9px] font-bold uppercase tracking-wide leading-tight',
                          colors.text
                        )}>
                          {eventTypeLabels[event.type]}
                        </div>
                        <div className="text-xs font-semibold text-foreground truncate">
                          {event.patientName}
                        </div>
                      </div>
                      <span className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0 mt-0.5',
                        colors.dot
                      )} />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  )
}
