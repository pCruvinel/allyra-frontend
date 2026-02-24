import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface EventBadgeProps {
  event: CalendarEvent
  onClick: () => void
}

const eventTypeColors: Record<CalendarEvent['type'], string> = {
  consulta: 'bg-emerald-500',
  retorno: 'bg-blue-500',
  exame: 'bg-amber-500',
  procedimento: 'bg-purple-500',
}

export function EventBadge({ event, onClick }: EventBadgeProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex items-center gap-1.5 w-full text-left hover:bg-muted/50 rounded-lg px-1 py-0.5 transition-colors group"
      title={`${event.patientName} - ${event.time}`}
    >
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', eventTypeColors[event.type])} />
      <span className="text-xs text-muted-foreground truncate group-hover:text-foreground">
        {event.patientName}
      </span>
    </button>
  )
}
