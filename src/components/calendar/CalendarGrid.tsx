import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarCell } from './CalendarCell'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface CalendarGridProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const WEEKDAYS_MOBILE = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()

  // Primeiro dia do mês
  const firstDay = new Date(year, month, 1)
  // Último dia do mês
  const lastDay = new Date(year, month + 1, 0)

  // Dia da semana do primeiro dia (0 = Domingo - Sunday-first)
  const startDayOfWeek = firstDay.getDay()

  // Dias do mês anterior para preencher a primeira semana
  const daysFromPrevMonth: Date[] = []
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = new Date(year, month, -i)
    daysFromPrevMonth.push(day)
  }

  // Dias do mês atual
  const daysInMonth: Date[] = []
  for (let day = 1; day <= lastDay.getDate(); day++) {
    daysInMonth.push(new Date(year, month, day))
  }

  // Combina os dias
  const allDays = [...daysFromPrevMonth, ...daysInMonth]

  // Preenche o restante para completar semanas (múltiplo de 7)
  const remainingDays = 7 - (allDays.length % 7)
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      allDays.push(new Date(year, month + 1, i))
    }
  }

  return allDays
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay() // 0 = Domingo
  const diff = date.getDate() - day // Volta para domingo
  const sunday = new Date(date)
  sunday.setDate(diff)

  const week: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    week.push(d)
  }
  return week
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

function isSameMonth(date: Date, currentDate: Date): boolean {
  return (
    date.getFullYear() === currentDate.getFullYear() &&
    date.getMonth() === currentDate.getMonth()
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function CalendarGrid({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: CalendarGridProps) {
  const isMobile = useIsMobile()
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)

  const days = useMemo(() => getMonthDays(currentDate), [currentDate])
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])

  const weeks = useMemo(() => {
    const result: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [days])

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => isSameDay(event.date, date))
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    onDateClick(date)
  }

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedDate(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedDate(newDate)
  }

  const selectedDayEvents = getEventsForDay(selectedDate)

  // Mobile: View semanal com lista de eventos
  if (isMobile) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Navegação semanal */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-1.5 rounded-full hover:bg-muted"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mini grid semanal */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS_MOBILE.map((day, i) => (
            <div
              key={`header-${i}`}
              className="py-1.5 text-center text-[10px] font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map((date, i) => {
            const dayEvents = getEventsForDay(date)
            const isSelected = isSameDay(date, selectedDate)
            const isTodayDate = isToday(date)
            const hasEvents = dayEvents.length > 0

            return (
              <button
                key={`day-${i}`}
                onClick={() => handleDateSelect(date)}
                className={cn(
                  "py-2 flex flex-col items-center transition-colors",
                  isSelected && "bg-primary/10",
                  !isSelected && "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium",
                    isTodayDate && "bg-primary text-primary-foreground",
                    isSelected && !isTodayDate && "bg-primary/20 text-primary",
                    !isSelected && !isTodayDate && "text-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <span
                        key={idx}
                        className="w-1 h-1 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Lista de eventos do dia selecionado */}
        <div className="border-t border-border">
          <div className="px-3 py-2 bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {selectedDayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full px-3 py-3 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "w-1 h-full min-h-[40px] rounded-full shrink-0",
                      event.status === 'confirmed' && "bg-green-500",
                      event.status === 'scheduled' && "bg-yellow-500",
                      event.status === 'waiting' && "bg-orange-500",
                      event.status === 'in_progress' && "bg-purple-500",
                      event.status === 'cancelled' && "bg-red-500",
                      event.status === 'completed' && "bg-blue-500"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {event.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(event.date)} - {event.type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop: Grid mensal completo
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Cabeçalho roxo dos dias da semana */}
      <div className="grid grid-cols-7 bg-primary">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold text-primary-foreground uppercase border-r border-primary-foreground/20 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7">
        {weeks.map((week, weekIndex) =>
          week.map((date, dayIndex) => (
            <CalendarCell
              key={`${weekIndex}-${dayIndex}`}
              date={date}
              events={getEventsForDay(date)}
              isToday={isToday(date)}
              isCurrentMonth={isSameMonth(date, currentDate)}
              onClick={() => handleDateSelect(date)}
              onEventClick={onEventClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
