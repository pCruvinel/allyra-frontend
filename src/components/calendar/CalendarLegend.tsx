import { cn } from '@/lib/utils'

interface LegendItem {
  color: string
  label: string
  type: 'type' | 'status'
}

const typeItems: LegendItem[] = [
  { color: 'bg-emerald-500', label: 'Consulta', type: 'type' },
  { color: 'bg-blue-500', label: 'Retorno', type: 'type' },
  { color: 'bg-amber-500', label: 'Exame', type: 'type' },
  { color: 'bg-purple-500', label: 'Procedimento', type: 'type' },
]

const statusItems: LegendItem[] = [
  { color: 'bg-muted ring-1 ring-border', label: 'Agendado', type: 'status' },
  { color: 'bg-green-500', label: 'Confirmado', type: 'status' },
  { color: 'bg-orange-500', label: 'Aguardando', type: 'status' },
  { color: 'bg-red-500', label: 'Cancelado', type: 'status' },
  { color: 'bg-slate-400', label: 'Concluído', type: 'status' },
]

interface CalendarLegendProps {
  className?: string
  showStatus?: boolean
}

export function CalendarLegend({ className, showStatus = true }: CalendarLegendProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2 text-sm', className)}>
      {/* Legenda de Tipos */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-foreground uppercase tracking-wide">Tipo:</span>
        {typeItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
            <span className="text-muted-foreground text-xs">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Separador */}
      {showStatus && <div className="hidden sm:block w-px h-4 bg-border" />}

      {/* Legenda de Status */}
      {showStatus && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-foreground uppercase tracking-wide">Status:</span>
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
              <span className="text-muted-foreground text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
