import type { ScheduleType } from './ScheduleBlock'
import { ScheduleBlock } from './ScheduleBlock'

/** Trim "HH:MM:SS" → "HH:MM" */
function trimTime(t: string): string {
  return t.length > 5 ? t.slice(0, 5) : t
}

interface ScheduleItem {
  id: string
  profissional_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  tipo?: ScheduleType | null
  recorrente?: boolean | null
}

interface ProfessionalInfo {
  id: string
  name: string
}

interface ScheduleListFallbackProps {
  schedules: ScheduleItem[]
  professionals: ProfessionalInfo[]
  canUpdate: boolean
  canDelete: boolean
  onEdit: (scheduleId: string) => void
  onDelete: (scheduleId: string) => void
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
}

export function ScheduleListFallback({
  schedules,
  professionals,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: ScheduleListFallbackProps) {
  const professionalMap = new Map(professionals.map((p) => [p.id, p.name]))

  // Group by day of week
  const grouped = new Map<number, typeof schedules>()
  for (const s of schedules) {
    const existing = grouped.get(s.dia_semana) || []
    existing.push(s)
    grouped.set(s.dia_semana, existing)
  }

  // Sort by day (Mon first)
  const sortedDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => grouped.has(d))

  if (sortedDays.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma escala encontrada.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDays.map((day) => {
        const daySchedules = grouped.get(day) || []
        return (
          <div key={day} className="rounded-xl border border-border/40 bg-card p-4 shadow-soft">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {WEEKDAY_LABELS[day]}
            </h4>
            <div className="space-y-2">
              {daySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase flex-shrink-0">
                    {(professionalMap.get(schedule.profissional_id) || '?').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {professionalMap.get(schedule.profissional_id) || 'Profissional'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-[160px]">
                    <ScheduleBlock
                      id={schedule.id}
                      timeRange={`${trimTime(schedule.hora_inicio)} – ${trimTime(schedule.hora_fim)}`}
                      type={schedule.tipo || 'atendimento'}
                      recurrent={Boolean(schedule.recorrente)}
                      canEdit={canUpdate}
                      canDelete={canDelete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
