import { useMemo } from 'react'
import { Clock3 } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'

interface WorkloadRow {
  id: string
  professionalName: string
  allocatedHours: number
  attendedHours: number
  utilization: number
}

interface WorkloadTableProps {
  data: WorkloadRow[]
  isLoading: boolean
  onSearch: (query: string) => void
}

function formatHours(value: number): string {
  return `${value.toFixed(1)}h`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function WorkloadTable({ data, isLoading, onSearch }: WorkloadTableProps) {
  const columns = useMemo<Column<WorkloadRow>[]>(() => [
    {
      key: 'professionalName',
      header: 'Profissional',
      width: 'min-w-[220px] flex-[1.4]',
      truncate: true,
      mobilePriority: 1,
    },
    {
      key: 'allocatedHours',
      header: 'Horas alocadas',
      width: 'min-w-[140px] flex-1',
      mobilePriority: 2,
      render: (row) => (
        <span className="text-xs font-semibold">{formatHours(row.allocatedHours)}</span>
      ),
    },
    {
      key: 'attendedHours',
      header: 'Horas atendidas',
      width: 'min-w-[140px] flex-1',
      mobilePriority: 3,
      render: (row) => (
        <span className="text-xs font-semibold">{formatHours(row.attendedHours)}</span>
      ),
    },
    {
      key: 'utilization',
      header: 'Utilização',
      width: 'min-w-[200px] flex-[1.2]',
      mobilePriority: 4,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(row.utilization * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-primary tabular-nums min-w-[48px] text-right">
            {formatPercent(row.utilization)}
          </span>
        </div>
      ),
    },
  ], [])

  return (
    <DataTable
      title="Carga horária consolidada"
      columns={columns}
      data={data}
      keyExtractor={(row) => row.id}
      isLoading={isLoading}
      onSearch={onSearch}
      emptyState={{
        icon: Clock3,
        title: 'Nenhum dado de carga horária',
        description: 'Não houve alocação de atendimento no período selecionado.',
      }}
    />
  )
}

export type { WorkloadRow }
