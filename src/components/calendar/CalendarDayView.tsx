import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui'
import type { CalendarEvent } from '@/types'

interface CalendarDayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (hour: number) => void
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06:00 - 22:00
const START_HOUR = 6
const HOUR_HEIGHT = 60 // px por hora

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
  return ((hours - START_HOUR) * 60 + minutes) * (HOUR_HEIGHT / 60)
}

function getEventHeight(duration: number): number {
  return duration * (HOUR_HEIGHT / 60)
}

function getCurrentTimePosition(): number {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return ((hours - START_HOUR) * 60 + minutes) * (HOUR_HEIGHT / 60)
}

function getEndTime(time: string, duration: number): string {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
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

export function CalendarDayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}: CalendarDayViewProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState(getCurrentTimePosition())
  const dayEvents = events.filter((event) => isSameDay(event.date, currentDate))
  const todayView = isToday(currentDate)

  // Atualizar linha do horário atual a cada minuto
  useEffect(() => {
    if (!todayView) return

    const interval = setInterval(() => {
      setCurrentTimePosition(getCurrentTimePosition())
    }, 60000) // A cada minuto

    return () => clearInterval(interval)
  }, [todayView])

  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header com data */}
      <div
        className={cn(
          'py-4 px-6 border-b border-border',
          isToday(currentDate) && 'bg-primary/10'
        )}
      >
        <h2
          className={cn(
            'text-lg font-semibold capitalize',
            isToday(currentDate) ? 'text-primary' : 'text-foreground'
          )}
        >
          {formattedDate}
        </h2>
        {isToday(currentDate) && (
          <span className="text-sm text-primary font-medium">Hoje</span>
        )}
        <div className="text-sm text-muted-foreground mt-1">
          {dayEvents.length} agendamento{dayEvents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid de horários */}
      <div className="flex overflow-auto max-h-[600px] min-h-[400px]">
        {/* Coluna de horas */}
        <div className="border-r border-border flex-shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[60px] px-3 border-b border-border/50 flex items-start justify-end pt-1"
            >
              <span className="text-sm text-muted-foreground">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Coluna do dia */}
        <div
          className={cn('relative flex-1', todayView && 'bg-primary/5')}
        >
          {/* Linhas de hora (clicáveis) */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              role="button"
              tabIndex={0}
              onClick={() => onTimeSlotClick(hour)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onTimeSlotClick(hour)
                }
              }}
              className="h-[60px] border-b border-border/50 hover:bg-primary/10 cursor-pointer transition-colors group relative"
            >
              {/* Linha tracejada de meia hora */}
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border/30" />
              {/* Indicador de "clique para agendar" no hover */}
              <div className="hidden group-hover:flex items-center justify-center h-full relative z-10">
                <span className="text-xs text-primary/60 font-medium">
                  + Agendar
                </span>
              </div>
            </div>
          ))}

          {/* Indicador de hora atual (linha vermelha) */}
          {todayView && currentTimePosition >= 0 && currentTimePosition <= HOURS.length * HOUR_HEIGHT && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-sm" />
                <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
              </div>
            </div>
          )}

          {/* Eventos do dia - Cards com bg pastel */}
          {dayEvents.map((event) => {
            const colors = eventTypePastel[event.type]
            return (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
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
                  height: `${Math.max(getEventHeight(event.duration), 48)}px`,
                }}
                className={cn(
                  'absolute left-2 right-2 rounded-xl p-3 overflow-hidden cursor-pointer',
                  'hover:shadow-lg transition-all duration-200',
                  'border-l-4 shadow-sm',
                  colors.bg,
                  colors.border,
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-xs font-bold uppercase tracking-wide',
                      colors.text
                    )}>
                      {eventTypeLabels[event.type]}
                    </span>
                    <div className="font-semibold text-foreground truncate mt-0.5">
                      {event.patientName}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm">
                        {event.time} - {getEndTime(event.time, event.duration)}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    'w-3 h-3 rounded-full flex-shrink-0 mt-1',
                    colors.dot
                  )} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Se não houver eventos */}
      {dayEvents.length === 0 && (
        <div className="py-8 flex items-center justify-center">
          <EmptyState
            icon={Calendar}
            title="Nenhum agendamento"
            description="Clique em um horário para agendar uma consulta"
          />
        </div>
      )}
    </div>
  )
}
