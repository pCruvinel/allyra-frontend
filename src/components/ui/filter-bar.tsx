import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { SelectOption } from '@/lib/constants'

type FilterType = 'text' | 'date' | 'select'

interface FilterConfig {
  id: string
  label: string
  type: FilterType
  placeholder?: string
  options?: SelectOption[]
  value: string
  onChange: (value: string) => void
  width?: string
}

interface FilterBarProps {
  filters: FilterConfig[]
  onFilter: () => void
  onReset?: () => void
  className?: string
}

export function FilterBar({
  filters,
  onFilter,
  onReset,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-4', className)}>
      <div className="flex items-center gap-4 flex-wrap">
        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filter.label}</span>
            {filter.type === 'select' ? (
              <Select
                options={filter.options || []}
                value={filter.value}
                onChange={filter.onChange}
                placeholder={filter.placeholder || 'Selecione'}
                className={filter.width || 'w-32'}
              />
            ) : (
              <Input
                type={filter.type}
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={filter.width || 'w-32'}
              />
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onFilter} className="rounded-full">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
          {onReset && (
            <Button variant="ghost" onClick={onReset} className="rounded-full">
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
