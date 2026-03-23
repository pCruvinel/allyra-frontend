import { DateInput } from '@/components/ui/date-input'
import { Select } from '@/components/ui/select'

interface FilterOption {
  value: string
  label: string
}

interface ScheduleFilterBarProps {
  professionalOptions: FilterOption[]
  selectedProfessionalId: string
  onProfessionalChange: (value: string) => void
  vigenciaData: string
  onVigenciaChange: (value: string) => void
}

export function ScheduleFilterBar({
  professionalOptions,
  selectedProfessionalId,
  onProfessionalChange,
  vigenciaData,
  onVigenciaChange,
}: ScheduleFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-[220px]">
        <Select
          options={professionalOptions}
          value={selectedProfessionalId}
          onChange={onProfessionalChange}
          placeholder="Todos os profissionais"
          label="Profissional"
        />
      </div>
      <div className="min-w-[180px]">
        <DateInput
          label="Grade vigente em"
          value={vigenciaData}
          onChange={onVigenciaChange}
        />
      </div>
    </div>
  )
}
