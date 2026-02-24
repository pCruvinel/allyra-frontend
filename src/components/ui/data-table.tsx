import { useState } from 'react'
import { Filter, UserPlus, X, ChevronDown, ChevronUp, FileSearch, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { SearchInput } from './search-input'
import { Pagination } from './pagination'
import { Button } from './button'
import { Input } from './input'
import { Select } from './select'
import { SkeletonTable, SkeletonList } from './skeleton'
import { EmptyState } from './empty-state'
import { BottomSheet, BottomSheetFooter } from './bottom-sheet'

export interface Column<T> {
  key: keyof T | string
  header: string
  /** Largura mínima da coluna (ex: 'min-w-[200px]'). Usar min-width evita sobreposição. */
  width?: string
  /** Se true, trunca o texto com ellipsis quando muito longo */
  truncate?: boolean
  render?: (item: T) => React.ReactNode
  /** Se true, esta coluna será mostrada no card mobile */
  showOnMobile?: boolean
  /** Prioridade no card mobile (1 = título principal, 2 = subtítulo, etc) */
  mobilePriority?: number
}

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  dateFrom?: boolean
  dateTo?: boolean
  status?: FilterOption[]
  professional?: FilterOption[]
  service?: FilterOption[]
  insurance?: FilterOption[]
  type?: FilterOption[]
}

export interface FilterValues {
  dateFrom: string
  dateTo: string
  status: string
  professional: string
  service: string
  insurance: string
  type: string
}

interface EmptyStateConfig {
  icon?: LucideIcon
  title?: string
  description?: string
  actionLabel?: string
}

interface DataTableProps<T> {
  title: string
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  rowActions?: (item: T) => React.ReactNode
  onSearch?: (query: string) => void
  onFilter?: () => void
  onApplyFilters?: (filters: FilterValues) => void
  filterConfig?: FilterConfig
  onNewItem?: () => void
  newItemLabel?: string
  defaultItemsPerPage?: number
  className?: string
  isLoading?: boolean
  emptyState?: EmptyStateConfig
  /** Callback ao clicar em um item (útil para mobile) */
  onItemClick?: (item: T) => void
}

export function DataTable<T>({
  title,
  columns,
  data,
  keyExtractor,
  rowActions,
  onSearch,
  onFilter,
  onApplyFilters,
  filterConfig,
  onNewItem,
  newItemLabel = 'Novo item',
  defaultItemsPerPage = 10,
  className,
  isLoading = false,
  emptyState,
  onItemClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)
  const [showFilters, setShowFilters] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    status: '',
    professional: '',
    service: '',
    insurance: '',
    type: '',
  })

  const isMobile = useIsMobile()

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    onSearch?.(query)
  }

  const handleItemsPerPageChange = (newValue: number) => {
    setItemsPerPage(newValue)
    setCurrentPage(1)
  }

  const handleToggleFilters = () => {
    if (isMobile) {
      setMobileFiltersOpen(true)
    } else {
      setShowFilters(!showFilters)
      onFilter?.()
    }
  }

  // Aplicar filtro automaticamente quando valor muda
  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onApplyFilters?.(newFilters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    const emptyFilters = {
      dateFrom: '',
      dateTo: '',
      status: '',
      professional: '',
      service: '',
      insurance: '',
      type: '',
    }
    setFilters(emptyFilters)
    onApplyFilters?.(emptyFilters)
    setCurrentPage(1)
  }

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.status || filters.professional || filters.service || filters.insurance || filters.type

  // Conta quantos filtros estão ativos
  const activeFiltersCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.professional,
    filters.service,
    filters.insurance,
    filters.type,
  ].filter(Boolean).length

  // Colunas para exibir no card mobile (ordenadas por prioridade)
  const mobileColumns = columns
    .filter(col => col.showOnMobile !== false)
    .sort((a, b) => (a.mobilePriority || 99) - (b.mobilePriority || 99))
    .slice(0, 4) // Máximo 4 campos no card

  // Componente de filtros (reutilizado em desktop e bottom sheet)
  const FiltersContent = () => (
    <div className={cn(
      "flex flex-wrap items-end gap-4",
      isMobile && "flex-col items-stretch"
    )}>
      {filterConfig?.dateFrom && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Data início</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className={isMobile ? "w-full" : "w-40"}
          />
        </div>
      )}
      {filterConfig?.dateTo && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Data fim</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className={isMobile ? "w-full" : "w-40"}
          />
        </div>
      )}
      {filterConfig?.professional && filterConfig.professional.length > 0 && (
        <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[180px]")}>
          <label className="text-xs font-medium text-muted-foreground">Profissional</label>
          <Select
            options={[{ value: '', label: 'Todos' }, ...filterConfig.professional]}
            value={filters.professional}
            onChange={(value) => handleFilterChange('professional', value)}
            placeholder="Todos"
          />
        </div>
      )}
      {filterConfig?.status && filterConfig.status.length > 0 && (
        <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[140px]")}>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            options={[{ value: '', label: 'Todos' }, ...filterConfig.status]}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            placeholder="Todos"
          />
        </div>
      )}
      {filterConfig?.service && filterConfig.service.length > 0 && (
        <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[160px]")}>
          <label className="text-xs font-medium text-muted-foreground">Serviço</label>
          <Select
            options={[{ value: '', label: 'Todos' }, ...filterConfig.service]}
            value={filters.service}
            onChange={(value) => handleFilterChange('service', value)}
            placeholder="Todos"
          />
        </div>
      )}
      {filterConfig?.insurance && filterConfig.insurance.length > 0 && (
        <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[160px]")}>
          <label className="text-xs font-medium text-muted-foreground">Convênio</label>
          <Select
            options={[{ value: '', label: 'Todos' }, ...filterConfig.insurance]}
            value={filters.insurance}
            onChange={(value) => handleFilterChange('insurance', value)}
            placeholder="Todos"
          />
        </div>
      )}
      {filterConfig?.type && filterConfig.type.length > 0 && (
        <div className={cn("flex flex-col gap-1", !isMobile && "min-w-[140px]")}>
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <Select
            options={[{ value: '', label: 'Todos' }, ...filterConfig.type]}
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            placeholder="Todos"
          />
        </div>
      )}
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

  // Renderiza um card para mobile
  const MobileCard = ({ item }: { item: T }) => {
    const primaryCol = mobileColumns[0]
    const secondaryCol = mobileColumns[1]
    const restCols = mobileColumns.slice(2)

    return (
      <div
        className={cn(
          "bg-muted/40 border-l-2 border-primary/70 rounded-r-xl p-3.5 transition-colors",
          onItemClick && "cursor-pointer active:bg-muted/60"
        )}
        onClick={() => onItemClick?.(item)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Campo principal */}
            {primaryCol && (
              <div className="font-semibold text-sm text-foreground truncate">
                {primaryCol.render
                  ? primaryCol.render(item)
                  : String((item as Record<string, unknown>)[primaryCol.key as string] ?? '')
                }
              </div>
            )}
            {/* Campo secundário */}
            {secondaryCol && (
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {secondaryCol.render
                  ? secondaryCol.render(item)
                  : String((item as Record<string, unknown>)[secondaryCol.key as string] ?? '')
                }
              </div>
            )}
          </div>
          {rowActions && (
            <div className="ml-2 flex-shrink-0">
              {rowActions(item)}
            </div>
          )}
        </div>
        {/* Campos adicionais */}
        {restCols.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {restCols.map((col) => (
              <div key={String(col.key)} className="text-xs">
                <span className="text-muted-foreground">{col.header}: </span>
                <span className="font-medium">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key as string] ?? '')
                  }
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('bg-card border border-border/40 rounded-2xl overflow-hidden shadow-soft', className)}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-border/30",
        isMobile ? "px-4 py-3 flex-col gap-3" : "px-6 py-4"
      )}>
        {/* Título e Busca */}
        <div className={cn(
          "flex items-center gap-3",
          isMobile && "w-full"
        )}>
          <h2 className={cn(
            "font-semibold text-foreground",
            isMobile ? "text-sm" : "text-base"
          )}>{title}</h2>
        </div>

        {/* Ações */}
        <div className={cn(
          "flex items-center gap-2",
          isMobile && "w-full"
        )}>
          <SearchInput
            value={searchQuery}
            onChange={handleSearch}
            className={isMobile ? "flex-1" : "w-60"}
          />
          {(onFilter || filterConfig) && (
            <Button
              variant="outline"
              size={isMobile ? "icon" : "default"}
              onClick={handleToggleFilters}
              className={cn(
                "rounded-full border-border-light text-primary relative",
                hasActiveFilters && "bg-primary/10 border-primary",
                !isMobile && "gap-1"
              )}
            >
              <Filter className={cn("text-primary", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              {!isMobile && (
                <>
                  Filtrar
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {activeFiltersCount}
                    </span>
                  )}
                  {showFilters ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </>
              )}
              {isMobile && activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}
          {onNewItem && (
            isMobile ? (
              <Button
                size="icon"
                onClick={onNewItem}
                className="rounded-full"
              >
                <Plus className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={onNewItem}
                className="rounded-full gap-1"
              >
                <UserPlus className="w-5 h-5" />
                {newItemLabel}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Filtros Desktop (colapsáveis) */}
      {!isMobile && showFilters && filterConfig && (
        <div className="px-6 py-4 bg-muted/20 border-b border-border/20">
          <FiltersContent />
        </div>
      )}

      {/* Filtros Mobile (Bottom Sheet) */}
      {isMobile && filterConfig && (
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

      {/* Desktop: Column Headers */}
      {!isMobile && (
        <div className="flex items-start justify-between px-6 py-4">
          {columns.map((column) => (
            <div
              key={String(column.key)}
              className={cn('py-2', column.width || 'flex-1')}
            >
              <div className="text-[10px] font-semibold uppercase text-foreground">
                {column.header}
              </div>
            </div>
          ))}
          {rowActions && (
            <div className="py-2">
              <div className="text-[10px] font-semibold uppercase text-foreground">
                Ações
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex flex-col gap-2 pb-4 min-h-[280px]",
        isMobile ? "px-3 pt-3" : "px-2"
      )}>
        {isLoading ? (
          isMobile ? (
            <SkeletonList items={5} />
          ) : (
            <SkeletonTable rows={5} columns={columns.length} showHeader={false} className="px-4" />
          )
        ) : paginatedData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={emptyState?.icon || FileSearch}
              title={emptyState?.title || "Nenhum item encontrado"}
              description={emptyState?.description}
              action={onNewItem && emptyState?.actionLabel ? {
                label: emptyState.actionLabel,
                onClick: onNewItem
              } : undefined}
            />
          </div>
        ) : isMobile ? (
          // Mobile: Cards
          paginatedData.map((item) => (
            <MobileCard key={keyExtractor(item)} item={item} />
          ))
        ) : (
          // Desktop: Table Rows
          paginatedData.map((item) => (
            <div
              key={keyExtractor(item)}
              className="flex items-center justify-between h-12 px-4 mx-2 bg-muted/30 border-l-2 border-primary/70 rounded-r-xl overflow-hidden hover:bg-muted/50 transition-colors"
            >
              {columns.map((column) => (
                <div
                  key={String(column.key)}
                  className={cn(
                    'flex-shrink-0',
                    column.width || 'flex-1 min-w-0',
                    column.truncate && 'overflow-hidden'
                  )}
                >
                  {column.render ? (
                    <div className={cn(column.truncate && 'truncate')}>
                      {column.render(item)}
                    </div>
                  ) : (
                    <div className={cn(
                      "text-xs font-semibold text-foreground",
                      column.truncate && 'truncate'
                    )}>
                      {String((item as Record<string, unknown>)[column.key as string] ?? '')}
                    </div>
                  )}
                </div>
              ))}
              {rowActions && (
                <div className="w-[35px] flex-shrink-0 flex justify-end">
                  {rowActions(item)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={data.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  )
}
