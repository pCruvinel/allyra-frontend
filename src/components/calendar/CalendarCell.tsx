import { cn } from '@/lib/utils'
import { EventBadge } from './EventBadge'
import type { CalendarEvent } from '@/types'

interface CalendarCellProps {
  date: Date
  events: CalendarEvent[]
  isToday: boolean
  isCurrentMonth: boolean
  onClick: () => void
  onEventClick: (event: CalendarEvent) => void
}

const MAX_VISIBLE_EVENTS = 2

export function CalendarCell({
  date,
  events,
  isToday,
  isCurrentMonth,
  onClick,
  onEventClick,
}: CalendarCellProps) {
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS)
  const remainingCount = events.length - MAX_VISIBLE_EVENTS

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'min-h-[100px] p-2 border border-border text-left transition-colors hover:bg-muted/50 cursor-pointer',
        isToday && 'bg-primary/10',
        !isCurrentMonth && 'bg-muted/30'
      )}
    >
      <div className="flex justify-end mb-1">
        <span
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium',
            isToday && 'bg-primary text-primary-foreground',
            !isToday && isCurrentMonth && 'text-foreground',
            !isCurrentMonth && 'text-muted-foreground/50'
          )}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <EventBadge
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
          />
        ))}

        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground pl-1">
            +{remainingCount} mais
          </span>
        )}
      </div>
    </div>
  )
}
