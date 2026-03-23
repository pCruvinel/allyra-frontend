import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { ScheduleBlock, type ScheduleType } from './ScheduleBlock'
import { ScheduleListFallback } from './ScheduleListFallback'

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

interface WeeklyScheduleGridProps {
  schedules: ScheduleItem[]
  professionals: ProfessionalInfo[]
  selectedProfessionalId: string
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onEdit: (scheduleId: string) => void
  onDelete: (scheduleId: string) => void
  onCreate: (dayOfWeek: number) => void
  isLoading: boolean
}

const WEEKDAYS = [
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
]

export function WeeklyScheduleGrid({
  schedules,
  professionals,
  selectedProfessionalId,
  canCreate,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onCreate,
  isLoading,
}: WeeklyScheduleGridProps) {
  const isMobile = useIsMobile()

  // Group schedules by professional, then by day
  const gridData = useMemo(() => {
    // Filter to relevant professionals
    const relevantProfessionals = selectedProfessionalId
      ? professionals.filter((p) => p.id === selectedProfessionalId)
      : professionals.filter((p) =>
          schedules.some((s) => s.profissional_id === p.id),
        )

    return relevantProfessionals.map((prof) => {
      const profSchedules = schedules.filter(
        (s) => s.profissional_id === prof.id,
      )
      const byDay = new Map<number, ScheduleItem[]>()
      for (const s of profSchedules) {
        const existing = byDay.get(s.dia_semana) || []
        existing.push(s)
        byDay.set(s.dia_semana, existing)
      }
      return { professional: prof, byDay }
    })
  }, [schedules, professionals, selectedProfessionalId])

  // Mobile: list fallback
  if (isMobile) {
    return (
      <ScheduleListFallback
        schedules={schedules}
        professionals={professionals}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-soft">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="grid grid-cols-[180px_repeat(5,1fr)] gap-px">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-muted" />
            ))}
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={`r${i}`} className="h-16 rounded bg-muted/50" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (gridData.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-10 text-center shadow-soft">
        <div className="mx-auto max-w-sm space-y-2">
          <p className="text-sm font-medium text-foreground">
            Nenhuma escala encontrada
          </p>
          <p className="text-xs text-muted-foreground">
            Ajuste os filtros ou cadastre a primeira grade do profissional.
          </p>
        </div>
      </div>
    )
  }

  // Filter weekdays that have at least one schedule to show relevant columns
  const activeWeekdays = WEEKDAYS.filter((wd) =>
    gridData.some((row) => row.byDay.has(wd.value)),
  )
  // Always show Mon-Fri at minimum
  const displayWeekdays =
    activeWeekdays.length >= 5
      ? WEEKDAYS
      : WEEKDAYS.filter(
          (wd) =>
            (wd.value >= 1 && wd.value <= 5) ||
            gridData.some((row) => row.byDay.has(wd.value)),
        )

  return (
    <div className="rounded-2xl border border-border/40 bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground min-w-[180px]">
                Profissional
              </th>
              {displayWeekdays.map((wd) => (
                <th
                  key={wd.value}
                  className="bg-muted/50 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground min-w-[140px]"
                >
                  {wd.fullLabel}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-border/30">
            {gridData.map((row) => (
              <tr
                key={row.professional.id}
                className="group/row hover:bg-muted/20 transition-colors"
              >
                {/* Professional name — sticky left */}
                <td className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/20 transition-colors border-r border-border/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
                      {row.professional.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[130px]">
                      {row.professional.name}
                    </span>
                  </div>
                </td>

                {/* Day cells */}
                {displayWeekdays.map((wd) => {
                  const daySchedules = row.byDay.get(wd.value) || []
                  return (
                    <td
                      key={wd.value}
                      className={cn(
                        'px-2 py-2 align-top border-r border-border/20 last:border-r-0',
                        daySchedules.length === 0 && 'bg-muted/5',
                      )}
                    >
                      <div className="flex flex-col gap-1.5 min-h-[48px]">
                        {daySchedules.map((schedule) => (
                          <ScheduleBlock
                            key={schedule.id}
                            id={schedule.id}
                            timeRange={`${trimTime(schedule.hora_inicio)} – ${trimTime(schedule.hora_fim)}`}
                            type={schedule.tipo || 'atendimento'}
                            recurrent={Boolean(schedule.recorrente)}
                            canEdit={canUpdate}
                            canDelete={canDelete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ))}

                        {/* Add button for empty cells */}
                        {daySchedules.length === 0 && canCreate && (
                          <button
                            type="button"
                            onClick={() => onCreate(wd.value)}
                            className="flex items-center justify-center rounded-lg border border-dashed border-border/50 py-3 text-muted-foreground/50 transition-all hover:border-primary/40 hover:text-primary/60 hover:bg-primary/5"
                            title={`Criar escala — ${wd.fullLabel}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
