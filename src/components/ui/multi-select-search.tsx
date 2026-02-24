/**
 * MultiSelectSearch - Componente de seleção múltipla com busca
 * Baseado em PatientSearchDemo.jsx
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2, AlertCircle, UserX, ChevronDown, Check, User, X, Users } from 'lucide-react'
import { useMultiSelect } from '@/hooks/useMultiSelect'
import { cn } from '@/lib/utils'

export interface MultiSelectSearchProps<T> {
  /** Lista de itens disponíveis */
  items: T[]
  /** Itens selecionados */
  value: T[]
  /** Callback quando seleção muda */
  onChange: (items: T[]) => void
  /** Mínimo de itens para seleção válida */
  minSelection?: number
  /** Máximo de itens selecionáveis */
  maxSelection?: number
  /** Placeholder do campo de busca */
  searchPlaceholder?: string
  /** Mensagem quando não há resultados */
  emptyMessage?: string
  /** Função para obter ID único */
  getItemId: (item: T) => string
  /** Função para obter label do item */
  getItemLabel: (item: T) => string
  /** Função para obter descrição (opcional) */
  getItemDescription?: (item: T) => string
  /** Estado de carregamento */
  isLoading?: boolean
  /** Desabilitado */
  disabled?: boolean
  /** Label do campo */
  label?: string
  /** Campo obrigatório */
  required?: boolean
  /** Mensagem de erro */
  error?: string
  /** Classe CSS adicional */
  className?: string
  /** Máximo de chips exibidos */
  maxDisplayChips?: number
}

// Componente de Item Individual
function SelectItem<T>({
  item,
  isSelected,
  onToggle,
  disabled,
  getItemLabel,
  getItemDescription,
}: {
  item: T
  isSelected: boolean
  onToggle: (item: T) => void
  disabled: boolean
  getItemLabel: (item: T) => string
  getItemDescription?: (item: T) => string
}) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onToggle(item)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && onToggle(item)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150',
        'hover:bg-muted focus:outline-none focus:bg-muted border-b border-border last:border-b-0',
        isSelected && 'bg-primary/10 hover:bg-primary/15',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Checkbox visual */}
      <div
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-150',
          'flex items-center justify-center',
          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'
        )}
      >
        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
      </div>

      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
          isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <User className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isSelected ? 'text-primary' : 'text-foreground'
          )}
        >
          {getItemLabel(item)}
        </p>
        {getItemDescription && (
          <p className="text-xs text-muted-foreground truncate">{getItemDescription(item)}</p>
        )}
      </div>

      {/* Badge de selecionado */}
      {isSelected && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Selecionado
        </span>
      )}
    </div>
  )
}

// Componente de Chips dos Selecionados
function SelectedChips<T>({
  items,
  onRemove,
  getItemId,
  getItemLabel,
  maxDisplay = 3,
}: {
  items: T[]
  onRemove: (item: T) => void
  getItemId: (item: T) => string
  getItemLabel: (item: T) => string
  maxDisplay?: number
}) {
  if (items.length === 0) return null

  const displayedItems = items.slice(0, maxDisplay)
  const remainingCount = items.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
        <Users className="w-4 h-4" />
        <span className="font-medium">{items.length}</span>
      </div>

      {displayedItems.map((item) => (
        <span
          key={getItemId(item)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-primary/10 text-primary text-sm font-medium transition-all duration-150 hover:bg-primary/20"
        >
          <span className="max-w-[120px] truncate">
            {getItemLabel(item).split(' ')[0]}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item)
            }}
            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
              hover:bg-primary/30 transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1"
            aria-label={`Remover ${getItemLabel(item)}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
          +{remainingCount} mais
        </span>
      )}
    </div>
  )
}

// Componente Principal
export function MultiSelectSearch<T>({
  items,
  value,
  onChange,
  minSelection = 0,
  maxSelection = Infinity,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhum item encontrado',
  getItemId,
  getItemLabel,
  getItemDescription,
  isLoading = false,
  disabled = false,
  label,
  required = false,
  error,
  className,
  maxDisplayChips = 4,
}: MultiSelectSearchProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    searchQuery,
    setSearchQuery,
    filteredItems,
    selectedItems,
    toggleItem,
    removeItem,
    isSelected,
    canSelectMore,
    isMinimumMet,
    selectionCount,
    setSelectedItems,
  } = useMultiSelect({
    items,
    initialSelection: value,
    minSelection,
    maxSelection,
    getItemId,
    getSearchableText: (item) => {
      const label = getItemLabel(item)
      const description = getItemDescription?.(item) || ''
      return `${label} ${description}`
    },
    onSelectionChange: onChange,
  })

  // Sincronizar value externo com estado interno
  useEffect(() => {
    if (JSON.stringify(value.map(getItemId)) !== JSON.stringify(selectedItems.map(getItemId))) {
      setSelectedItems(value)
    }
  }, [value, getItemId, selectedItems, setSelectedItems])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Simular loading durante busca
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    if (newValue.length > 0) {
      setIsSearching(true)
      setTimeout(() => setIsSearching(false), 300)
    }
  }, [setSearchQuery])

  const showLoading = isLoading || isSearching

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      {/* Header com label e contador */}
      {(label || maxSelection < Infinity) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="text-sm font-medium text-foreground">
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
              {minSelection > 0 && (
                <span className="text-muted-foreground font-normal ml-1">
                  (mínimo {minSelection})
                </span>
              )}
            </label>
          )}
          {maxSelection < Infinity && (
            <div
              className={cn(
                'text-sm font-medium px-2.5 py-1 rounded-full transition-colors',
                selectionCount >= minSelection
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              )}
            >
              {selectionCount}/{maxSelection}
            </div>
          )}
        </div>
      )}

      {/* Chips dos selecionados */}
      {selectedItems.length > 0 && (
        <div className="mb-3">
          <SelectedChips
            items={selectedItems}
            onRemove={removeItem}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            maxDisplay={maxDisplayChips}
          />
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-150 bg-background',
            isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-input hover:border-muted-foreground/50',
            error && 'border-destructive',
            disabled && 'opacity-50 cursor-not-allowed bg-muted'
          )}
        >
          {showLoading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />

          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen)
                if (!isOpen) inputRef.current?.focus()
              }
            }}
            disabled={disabled}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div
            className="absolute z-50 w-full mt-1 bg-popover rounded-lg border border-border
              shadow-lg max-h-64 overflow-auto"
            role="listbox"
            aria-multiselectable="true"
          >
            {/* Mensagem de limite atingido */}
            {!canSelectMore && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm border-b border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Limite máximo de {maxSelection} atingido</span>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            )}

            {/* Lista de itens */}
            {!isLoading && filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <SelectItem
                  key={getItemId(item)}
                  item={item}
                  isSelected={isSelected(item)}
                  onToggle={toggleItem}
                  disabled={!isSelected(item) && !canSelectMore}
                  getItemLabel={getItemLabel}
                  getItemDescription={getItemDescription}
                />
              ))
            ) : !isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <UserX className="w-10 h-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm">{emptyMessage}</p>
                {searchQuery && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Tente buscar por outro termo
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Mensagem de validação */}
      {!isMinimumMet && selectionCount > 0 && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          Selecione pelo menos {minSelection} para continuar
        </p>
      )}

      {/* Mensagem de erro */}
      {error && (
        <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}
