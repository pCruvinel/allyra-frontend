import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScheduleType = 'atendimento' | 'pausa' | 'ferias' | 'treinamento'

interface ScheduleBlockProps {
  id: string
  timeRange: string
  type: ScheduleType
  recurrent?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const TYPE_STYLES: Record<ScheduleType, { bg: string; text: string; border: string; label: string }> = {
  atendimento: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    label: 'Atendimento',
  },
  pausa: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Pausa',
  },
  ferias: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    label: 'Férias',
  },
  treinamento: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    label: 'Treinamento',
  },
}

export function ScheduleBlock({
  id,
  timeRange,
  type,
  recurrent,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: ScheduleBlockProps) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.atendimento

  return (
    <div
      className={cn(
        'group relative rounded-lg border px-2.5 py-1.5 transition-all',
        style.bg,
        style.border,
        (canEdit || canDelete) && 'cursor-pointer hover:shadow-md',
      )}
      onClick={() => canEdit && onEdit?.(id)}
      title={`${style.label} — ${timeRange}${recurrent ? ' (Recorrente)' : ''}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs font-semibold leading-tight', style.text)}>
            {timeRange}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn('text-[10px] leading-tight', style.text, 'opacity-75')}>
              {style.label}
            </span>
            {recurrent && (
              <RefreshCw className={cn('h-2.5 w-2.5', style.text, 'opacity-50')} />
            )}
          </div>
        </div>

        {/* Action buttons — appear on hover */}
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {canEdit && (
              <button
                type="button"
                className={cn(
                  'rounded p-0.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10',
                  style.text,
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(id)
                }}
                title="Editar"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="rounded p-0.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(id)
                }}
                title="Excluir"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { TYPE_STYLES }
export type { ScheduleType }
