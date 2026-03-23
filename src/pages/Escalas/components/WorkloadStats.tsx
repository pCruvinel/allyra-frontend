import { CalendarDays, ClipboardList, Clock3, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

interface WorkloadStatsData {
  professionals: number
  totalAllocatedHours: number
  totalAttendedHours: number
  utilization: number
}

interface WorkloadStatsProps {
  stats: WorkloadStatsData
  isLoading: boolean
}

function formatHours(value: number): string {
  return `${value.toFixed(1)}h`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function WorkloadStats({ stats, isLoading }: WorkloadStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<ClipboardList className="h-4 w-4" />}
        value={stats.professionals}
        label="Profissionais monitorados"
        subtitle="No período filtrado"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Clock3 className="h-4 w-4" />}
        value={formatHours(stats.totalAllocatedHours)}
        label="Horas alocadas"
        subtitle="Blocos de atendimento"
        isLoading={isLoading}
      />
      <StatCard
        icon={<CalendarDays className="h-4 w-4" />}
        value={formatHours(stats.totalAttendedHours)}
        label="Horas atendidas"
        subtitle="Atendimentos concluídos"
        isLoading={isLoading}
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4" />}
        value={formatPercent(stats.utilization)}
        label="Utilização média"
        subtitle="Horas atendidas / horas alocadas"
        isLoading={isLoading}
      />
    </div>
  )
}

export { formatHours, formatPercent }
export type { WorkloadStatsData }
