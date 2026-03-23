import { useMemo } from 'react'
import { CalendarClock } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecurrenceData {
  /** Which recurrence mode is active */
  mode: 'diasSemana' | 'intervalo'
  /** Days of the week (1=Mon..6=Sat) — used when mode='diasSemana' */
  diasSemana: number[]
  /** Interval frequency — used when mode='intervalo' */
  intervaloTipo?: 'semanal' | 'quinzenal' | 'mensal'
  /** Start date for the recurrence range (YYYY-MM-DD) */
  startDate: string
  /** End date for the recurrence range (YYYY-MM-DD) */
  endDate: string
  /** Time for every occurrence (HH:MM) */
  time: string
}

interface RecurrenceSectionProps {
  data: RecurrenceData
  /** Time slot options from the hook */
  timeOptions: { value: string; label: string }[]
  /** Called when any recurrence field changes */
  onChange: (update: Partial<RecurrenceData>) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEKDAYS = [
  { day: 1, label: 'Seg', ariaLabel: 'Segunda-feira' },
  { day: 2, label: 'Ter', ariaLabel: 'Terça-feira' },
  { day: 3, label: 'Qua', ariaLabel: 'Quarta-feira' },
  { day: 4, label: 'Qui', ariaLabel: 'Quinta-feira' },
  { day: 5, label: 'Sex', ariaLabel: 'Sexta-feira' },
  { day: 6, label: 'Sáb', ariaLabel: 'Sábado' },
] as const

const FREQUENCY_OPTIONS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Computes min end date (start + 7 days) */
function getMinEndDate(startDate: string): string {
  if (!startDate) return ''
  const d = new Date(`${startDate}T00:00:00`)
  d.setDate(d.getDate() + 7)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Estimates how many appointments a recurrence config will generate */
function estimateRecurrenceCount(
  startDate: string,
  endDate: string,
  mode: 'diasSemana' | 'intervalo',
  diasSemana: number[],
  intervaloTipo?: 'semanal' | 'quinzenal' | 'mensal',
): number {
  if (!startDate || !endDate) return 0

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)
  if (end <= start) return 0

  if (mode === 'intervalo') {
    if (!intervaloTipo) return 0
    const diffMs = end.getTime() - start.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    switch (intervaloTipo) {
      case 'semanal': return Math.floor(diffDays / 7) + 1
      case 'quinzenal': return Math.floor(diffDays / 14) + 1
      case 'mensal': {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
        return Math.max(1, months + 1)
      }
      default: return 0
    }
  }

  // mode === 'diasSemana'
  if (diasSemana.length === 0) return 0

  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const jsDay = cursor.getDay() // 0=Sun, 1=Mon, ... 6=Sat
    const isoDay = jsDay === 0 ? 7 : jsDay // Convert to 1=Mon..7=Sun
    if (diasSemana.includes(isoDay)) {
      count++
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Recurrence configuration panel for the "Recorrente" tab.
 *
 * Provides two mutually exclusive modes via a segmented radio:
 * - **Dias da semana**: Pick specific days (Mon, Wed, Fri, etc.)
 * - **Intervalo**: Pick a frequency (Weekly, Biweekly, Monthly)
 *
 * Both modes share: time slot, start date, end date, and a preview counter.
 */
export function RecurrenceSection({ data, timeOptions, onChange }: RecurrenceSectionProps) {
  const { mode, diasSemana, intervaloTipo, startDate, endDate, time } = data

  const minEndDate = useMemo(() => getMinEndDate(startDate), [startDate])

  const recurrenceCount = useMemo(
    () => estimateRecurrenceCount(startDate, endDate, mode, diasSemana, intervaloTipo),
    [startDate, endDate, mode, diasSemana, intervaloTipo],
  )

  const handleToggleDay = (day: number) => {
    const next = diasSemana.includes(day)
      ? diasSemana.filter(d => d !== day)
      : [...diasSemana, day].sort((a, b) => a - b)
    onChange({ diasSemana: next })
  }

  const handleModeChange = (newMode: 'diasSemana' | 'intervalo') => {
    // Reset the mode-specific fields when switching
    if (newMode === 'diasSemana') {
      onChange({ mode: 'diasSemana', intervaloTipo: undefined })
    } else {
      onChange({ mode: 'intervalo', diasSemana: [] })
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Horário ── */}
      <Select
        label="Horário da série"
        required
        options={timeOptions}
        value={time}
        onChange={value => onChange({ time: value })}
        placeholder="Escolha o horário"
      />

      {/* ── Segmented radio: mode selector ── */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Tipo de repetição
        </label>
        <div
          role="radiogroup"
          aria-label="Tipo de repetição"
          className="inline-flex rounded-lg border border-border p-1 bg-muted/30"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'diasSemana'}
            onClick={() => handleModeChange('diasSemana')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              mode === 'diasSemana'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Dias da semana
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'intervalo'}
            onClick={() => handleModeChange('intervalo')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              mode === 'intervalo'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Intervalo
          </button>
        </div>
      </div>

      {/* ── Mode: Dias da semana ── */}
      {mode === 'diasSemana' && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Dias <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(campo obrigatório)</span>
          </label>
          <div
            role="group"
            aria-label="Selecione os dias da semana"
            className="flex flex-wrap gap-2"
          >
            {WEEKDAYS.map(({ day, label, ariaLabel }) => {
              const selected = diasSemana.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={ariaLabel}
                  onClick={() => handleToggleDay(day)}
                  className={cn(
                    'min-w-[2.75rem] h-10 rounded-full text-sm font-medium transition-all border',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30',
                    selected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border hover:bg-muted hover:border-primary/50 text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Mode: Intervalo ── */}
      {mode === 'intervalo' && (
        <Select
          label="Frequência"
          required
          options={FREQUENCY_OPTIONS}
          value={intervaloTipo || ''}
          onChange={value => onChange({ intervaloTipo: value as RecurrenceData['intervaloTipo'] })}
          placeholder="Selecione a frequência"
        />
      )}

      {/* ── Date range ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="recurrence-start-date" className="text-sm font-medium text-foreground">
            Data início <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(campo obrigatório)</span>
          </label>
          <input
            id="recurrence-start-date"
            type="date"
            value={startDate}
            onChange={e => onChange({ startDate: e.target.value })}
            className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="recurrence-end-date" className="text-sm font-medium text-foreground">
            Repetir até <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(campo obrigatório)</span>
          </label>
          <input
            id="recurrence-end-date"
            type="date"
            min={minEndDate}
            value={endDate}
            onChange={e => onChange({ endDate: e.target.value })}
            className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* ── Preview count badge ── */}
      {recurrenceCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
          <CalendarClock className="h-4 w-4 flex-shrink-0" />
          <span>
            ~{recurrenceCount} agendamento{recurrenceCount !== 1 ? 's' : ''}{' '}
            será{recurrenceCount !== 1 ? 'ão' : ''} criado{recurrenceCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
