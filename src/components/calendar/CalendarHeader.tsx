import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { CalendarView, Professional, CalendarEvent } from '@/types'

interface CalendarHeaderProps {
  currentDate: Date
  selectedProfessional: string
  professionals: Professional[]
  view: CalendarView
  selectedTypes: CalendarEvent['type'][]
  selectedStatuses: CalendarEvent['status'][]
  onProfessionalChange: (id: string) => void
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onTypesChange: (types: CalendarEvent['type'][]) => void
  onStatusesChange: (statuses: CalendarEvent['status'][]) => void
}

const viewOptions = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
]

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
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
  { value: 'completed', label: 'Concluído' },
]

const typeSelectOptions = [
  { value: '', label: 'Todos' },
  ...TYPE_OPTIONS.map(t => ({ value: t.value, label: t.label })),
]

const statusSelectOptions = [
  { value: '', label: 'Todos' },
  ...STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label })),
]

export function CalendarHeader({
  currentDate,
  selectedProfessional,
  professionals,
  view,
  selectedTypes,
  selectedStatuses,
  onProfessionalChange,
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
    } else {
      setShowFilters(!showFilters)
    }
  }

  // Valores atuais para os selects (array → valor único)
  const currentType = selectedTypes.length === 1 ? selectedTypes[0] : ''
  const currentStatus = selectedStatuses.length === 1 ? selectedStatuses[0] : ''

  const handleTypeChange = (value: string) => {
    if (value === '') {
      onTypesChange([])
    } else {
      onTypesChange([value as CalendarEvent['type']])
    }
  }

  const handleStatusChange = (value: string) => {
    if (value === '') {
      onStatusesChange([])
    } else {
      onStatusesChange([value as CalendarEvent['status']])
    }
  }

  const handleProfessionalFilterChange = (value: string) => {
    onProfessionalChange(value)
  }

  const handleClearFilters = () => {
    onProfessionalChange('')
    onTypesChange([])
    onStatusesChange([])
  }

  const professionalOptions = [
    { value: '', label: 'Todos' },
    ...professionals.map((p) => ({
      value: p.id,
      label: p.name,
    })),
  ]

  const hasActiveFilters = selectedProfessional !== '' || selectedTypes.length > 0 || selectedStatuses.length > 0
  const activeFilterCount = (selectedProfessional ? 1 : 0) + (selectedTypes.length > 0 ? 1 : 0) + (selectedStatuses.length > 0 ? 1 : 0)

  // Componente de filtros (reutilizado em desktop e bottom sheet)
  const FiltersContent = () => (
    <div className={cn(
      "flex flex-wrap items-end gap-4",
      isMobile && "flex-col items-stretch"
    )}>
      <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[180px]")}>
        <label className="text-xs font-medium text-muted-foreground">Profissional</label>
        <Select
          options={professionalOptions}
          value={selectedProfessional}
          onChange={handleProfessionalFilterChange}
          placeholder="Todos"
        />
      </div>
      <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[140px]")}>
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select
          options={statusSelectOptions}
          value={currentStatus}
          onChange={handleStatusChange}
          placeholder="Todos"
        />
      </div>
      <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[160px]")}>
        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
        <Select
          options={typeSelectOptions}
          value={currentType}
          onChange={handleTypeChange}
          placeholder="Todos"
        />
      </div>
      {!isMobile && hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="rounded-full ml-auto"
        >
          <X className="w-4 h-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-3 mb-6">
      {/* Linha 1: Agenda + Navegação + Hoje | View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-foreground">Agenda</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <span className="text-sm md:text-base font-semibold text-foreground min-w-[150px] text-center">
              {monthYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="rounded-full text-primary border-primary/30 hover:bg-primary/10 font-medium"
          >
            Hoje
          </Button>
        </div>

        <SegmentedControl
          options={viewOptions}
          value={view}
          onChange={(v) => onViewChange(v as CalendarView)}
        />
      </div>

      {/* Linha 2: Legenda de tipos | Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Legenda de tipos */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-foreground uppercase tracking-wide">Tipo:</span>
          {TYPE_OPTIONS.map((item) => (
            <div key={item.value} className="flex items-center gap-1.5">
              <span className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
              <span className="text-muted-foreground text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Botão Filtrar */}
        <Button
          variant="outline"
          size={isMobile ? 'icon' : 'default'}
          onClick={handleToggleFilters}
          className={cn(
            'rounded-full border-border-light text-primary relative',
            hasActiveFilters && 'bg-primary/10 border-primary',
            !isMobile && 'gap-1'
          )}
        >
          <Filter className={cn('text-primary', isMobile ? 'w-4 h-4' : 'w-5 h-5')} />
          {!isMobile && (
            <>
              Filtrar
              {activeFilterCount > 0 && (
                <span className="ml-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </>
          )}
          {isMobile && activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filtros Desktop (colapsáveis inline) */}
      {!isMobile && showFilters && (
        <div className="px-6 py-4 bg-muted/20 border-b border-border/20">
          <FiltersContent />
        </div>
      )}

      {/* Filtros Mobile (Bottom Sheet) */}
      {isMobile && (
        <BottomSheet
          open={mobileFiltersOpen}
          onOpenChange={setMobileFiltersOpen}
          title="Filtros"
        >
          <FiltersContent />
          <BottomSheetFooter className="flex gap-2">
            {hasActiveFilters && (
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
