import { Button } from '@/components/ui/button'
import { DateInput } from '@/components/ui/date-input'
import { Select } from '@/components/ui/select'
import { WorkloadStats, type WorkloadStatsData } from './WorkloadStats'
import { WorkloadTable, type WorkloadRow } from './WorkloadTable'

interface FilterOption {
  value: string
  label: string
}

interface WorkloadDashboardProps {
  // Filters
  professionalOptions: FilterOption[]
  selectedProfessionalId: string
  onProfessionalChange: (value: string) => void
  workloadStart: string
  onWorkloadStartChange: (value: string) => void
  workloadEnd: string
  onWorkloadEndChange: (value: string) => void

  // Data
  stats: WorkloadStatsData
  rows: WorkloadRow[]
  isLoading: boolean
  onSearch: (query: string) => void

  // Export
  canExport: boolean
  isGenerating: boolean
  onExport: (format: 'pdf' | 'excel') => void
}

export function WorkloadDashboard({
  professionalOptions,
  selectedProfessionalId,
  onProfessionalChange,
  workloadStart,
  onWorkloadStartChange,
  workloadEnd,
  onWorkloadEndChange,
  stats,
  rows,
  isLoading,
  onSearch,
  canExport,
  isGenerating,
  onExport,
}: WorkloadDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Filter Row */}
      <section className="rounded-2xl border border-border/40 bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="min-w-[200px]">
              <Select
                options={professionalOptions}
                value={selectedProfessionalId}
                onChange={onProfessionalChange}
                placeholder="Todos os profissionais"
                label="Profissional"
              />
            </div>
            <DateInput
              label="Período inicial"
              value={workloadStart}
              onChange={onWorkloadStartChange}
            />
            <DateInput
              label="Período final"
              value={workloadEnd}
              onChange={onWorkloadEndChange}
            />
          </div>

          {canExport && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onExport('pdf')}
                disabled={isGenerating || !workloadStart || !workloadEnd}
              >
                Exportar PDF
              </Button>
              <Button
                type="button"
                onClick={() => onExport('excel')}
                disabled={isGenerating || !workloadStart || !workloadEnd}
              >
                Exportar Excel
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Stat Cards */}
      <WorkloadStats stats={stats} isLoading={isLoading} />

      {/* Workload Table */}
      <WorkloadTable data={rows} isLoading={isLoading} onSearch={onSearch} />
    </div>
  )
}
