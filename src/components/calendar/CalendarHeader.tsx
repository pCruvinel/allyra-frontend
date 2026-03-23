import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Filter, X } from 'lucide-react'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { CalendarEvent, CalendarView } from '@/types'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  selectedTypes: CalendarEvent['type'][]
  selectedStatuses: CalendarEvent['status'][]
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onTypesChange: (types: CalendarEvent['type'][]) => void
  onStatusesChange: (statuses: CalendarEvent['status'][]) => void
}

const viewOptions = [
  { value: 'month', label: 'Mes' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
]

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const TYPE_OPTIONS: { value: CalendarEvent['type']; label: string; color: string }[] = [
  { value: 'consulta', label: 'Consulta', color: 'bg-emerald-500' },
  { value: 'retorno', label: 'Retorno', color: 'bg-blue-500' },
  { value: 'exame', label: 'Exame', color: 'bg-amber-500' },
  { value: 'procedimento', label: 'Procedimento', color: 'bg-purple-500' },
]

const STATUS_OPTIONS: { value: CalendarEvent['status']; label: string }[] = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Concluido' },
]

const typeSelectOptions = [
  { value: '', label: 'Todos' },
  ...TYPE_OPTIONS.map((type) => ({ value: type.value, label: type.label })),
]

const statusSelectOptions = [
  { value: '', label: 'Todos' },
  ...STATUS_OPTIONS.map((status) => ({ value: status.value, label: status.label })),
]

export function CalendarHeader({
  currentDate,
  view,
  selectedTypes,
  selectedStatuses,
  onDateChange,
  onViewChange,
  onTypesChange,
  onStatusesChange,
}: CalendarHeaderProps) {
  const isMobile = useIsMobile()
  const [showFilters, setShowFilters] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const monthYear = `${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    onDateChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleToggleFilters = () => {
    if (isMobile) {
      setMobileFiltersOpen(true)
      return
    }

    setShowFilters(!showFilters)
  }

  const currentType = selectedTypes.length === 1 ? selectedTypes[0] : ''
  const currentStatus = selectedStatuses.length === 1 ? selectedStatuses[0] : ''

  const handleTypeChange = (value: string) => {
    if (value === '') {
      onTypesChange([])
      return
    }

    onTypesChange([value as CalendarEvent['type']])
  }

  const handleStatusChange = (value: string) => {
    if (value === '') {
      onStatusesChange([])
      return
    }

    onStatusesChange([value as CalendarEvent['status']])
  }

  const handleClearFilters = () => {
    onTypesChange([])
    onStatusesChange([])
  }

  const hasAdvancedFilters = selectedTypes.length > 0 || selectedStatuses.length > 0
  const activeFilterCount = (selectedTypes.length > 0 ? 1 : 0) + (selectedStatuses.length > 0 ? 1 : 0)

  const FiltersContent = () => (
    <div className={cn('flex flex-wrap items-end gap-4', isMobile && 'flex-col items-stretch')}>
      <div className={cn('flex flex-col gap-1', !isMobile && 'min-w-[140px]')}>
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select
          options={statusSelectOptions}
          value={currentStatus}
          onChange={handleStatusChange}
          placeholder="Todos"
        />
      </div>
      <div className={cn('flex flex-col gap-1', !isMobile && 'min-w-[160px]')}>
        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
        <Select
          options={typeSelectOptions}
          value={currentType}
          onChange={handleTypeChange}
          placeholder="Todos"
        />
      </div>
      {!isMobile && hasAdvancedFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="ml-auto rounded-full"
        >
          <X className="mr-1 h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  )

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground md:text-xl">Agenda</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="rounded p-1 transition-colors hover:bg-muted"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="min-w-[150px] text-center text-sm font-semibold text-foreground md:text-base">
              {monthYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded p-1 transition-colors hover:bg-muted"
              aria-label="Proximo mes"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="rounded-full border-primary/30 font-medium text-primary hover:bg-primary/10"
          >
            Hoje
          </Button>
        </div>

        <SegmentedControl
          options={viewOptions}
          value={view}
          onChange={(nextView) => onViewChange(nextView as CalendarView)}
        />
      </div>

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground">Tipo:</span>
          {TYPE_OPTIONS.map((item) => (
            <div key={item.value} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size={isMobile ? 'icon' : 'default'}
          onClick={handleToggleFilters}
          className={cn(
            'relative rounded-full border-border-light text-primary',
            hasAdvancedFilters && 'border-primary bg-primary/10',
            !isMobile && 'gap-1',
          )}
        >
          <Filter className={cn('text-primary', isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
          {!isMobile && (
            <>
              Filtrar
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </>
          )}
          {isMobile && activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {!isMobile && showFilters && (
        <div className="border-b border-border/20 bg-muted/20 px-6 py-4">
          <FiltersContent />
        </div>
      )}

      {isMobile && (
        <BottomSheet
          open={mobileFiltersOpen}
          onOpenChange={setMobileFiltersOpen}
          title="Filtros"
        >
          <FiltersContent />
          <BottomSheetFooter className="flex gap-2">
            {hasAdvancedFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  handleClearFilters()
                  setMobileFiltersOpen(false)
                }}
                className="flex-1"
              >
                Limpar
              </Button>
            )}
            <Button
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-1"
            >
              Aplicar
            </Button>
          </BottomSheetFooter>
        </BottomSheet>
      )}
    </div>
  )
}
