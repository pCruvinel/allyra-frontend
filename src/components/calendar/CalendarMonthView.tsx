import { useMemo } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface CalendarMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
}

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
const WEEKDAYS_COMPACT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const eventTypeColors: Record<CalendarEvent['type'], string> = {
  consulta: 'bg-emerald-500',
  retorno: 'bg-blue-500',
  exame: 'bg-amber-500',
  procedimento: 'bg-purple-500',
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()

  const daysFromPrevMonth: Date[] = []
  for (let i = startDayOfWeek - 1; i >= 0; i -= 1) {
    daysFromPrevMonth.push(new Date(year, month, -i))
  }

  const daysInMonth: Date[] = []
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    daysInMonth.push(new Date(year, month, day))
  }

  const allDays = [...daysFromPrevMonth, ...daysInMonth]
  const remainingDays = 7 - (allDays.length % 7)
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i += 1) {
      allDays.push(new Date(year, month + 1, i))
    }
  }

  return allDays
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
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

export function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: CalendarMonthViewProps) {
  const isMobile = useIsMobile()
  const days = useMemo(() => getMonthDays(currentDate), [currentDate])
  const weekdayLabels = isMobile ? WEEKDAYS_COMPACT : WEEKDAYS
  const maxVisibleEvents = isMobile ? 1 : 2

  const weeks = useMemo(() => {
    const result: Date[][] = []
    for (let index = 0; index < days.length; index += 7) {
      result.push(days.slice(index, index + 7))
    }
    return result
  }, [days])

  const getEventsForDay = (date: Date) => events.filter((event) => isSameDay(event.date, date))

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-7 bg-primary">
        {weekdayLabels.map((day) => (
          <div
            key={day}
            className="border-r border-primary-foreground/20 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-primary-foreground last:border-r-0 md:py-3 md:text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flatMap((week) =>
          week.map((date) => {
            const dayEvents = getEventsForDay(date)
            const visibleEvents = dayEvents.slice(0, maxVisibleEvents)
            const remainingCount = dayEvents.length - visibleEvents.length

            return (
              <div
                key={date.toISOString()}
                role="button"
                tabIndex={0}
                onClick={() => onDateClick?.(date)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onDateClick?.(date)
                  }
                }}
                className={cn(
                  'min-h-[92px] border border-border/60 p-1.5 text-left align-top transition-colors hover:bg-muted/40 md:min-h-[124px] md:p-2',
                  isToday(date) && 'bg-primary/10',
                  !isSameMonth(date, currentDate) && 'bg-muted/20 text-muted-foreground/70',
                )}
              >
                <div className="mb-1 flex justify-end md:mb-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium md:h-7 md:w-7 md:text-sm',
                      isToday(date) && 'bg-primary text-primary-foreground',
                      !isToday(date) && isSameMonth(date, currentDate) && 'text-foreground',
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>

                <div className="space-y-1">
                  {visibleEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        onEventClick(event)
                      }}
                      className="flex w-full items-center gap-1 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-background/80"
                      title={`${event.patientName} - ${event.time}`}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 flex-shrink-0 rounded-full',
                          eventTypeColors[event.type],
                        )}
                      />
                      <span className="truncate text-[11px] text-muted-foreground md:text-xs">
                        {event.patientName}
                      </span>
                    </button>
                  ))}

                  {remainingCount > 0 && (
                    <span className="block px-1 text-[10px] font-medium text-muted-foreground md:text-xs">
                      +{remainingCount} mais
                    </span>
                  )}
                </div>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
