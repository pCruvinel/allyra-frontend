/**
 * SingleSelectSearch - Componente de seleção única com busca
 * Versão simplificada do MultiSelectSearch
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, Loader2, UserX, ChevronDown, Check, User, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useMultiSelect'
import { cn } from '@/lib/utils'

export interface SingleSelectSearchProps<T> {
  /** Lista de itens disponíveis */
  items: T[]
  /** Item selecionado (ID) */
  value: string
  /** Callback quando seleção muda */
  onChange: (value: string) => void
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
  /** Permitir limpar seleção */
  clearable?: boolean
}

// Componente de Item Individual
function SelectItem<T>({
  item,
  isSelected,
  onSelect,
  getItemLabel,
  getItemDescription,
}: {
  item: T
  isSelected: boolean
  onSelect: (item: T) => void
  getItemLabel: (item: T) => string
  getItemDescription?: (item: T) => string
}) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150',
        'hover:bg-muted focus:outline-none focus:bg-muted border-b border-border last:border-b-0',
        isSelected && 'bg-primary/10 hover:bg-primary/15'
      )}
    >
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

      {/* Check icon */}
      {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
    </div>
  )
}

// Componente Principal
export function SingleSelectSearch<T>({
  items,
  value,
  onChange,
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
  clearable = true,
}: SingleSelectSearchProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce da busca
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Item selecionado
  const selectedItem = useMemo(
    () => items.find((item) => getItemId(item) === value),
    [items, value, getItemId]
  )

  // Filtrar itens
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items

    const query = debouncedQuery.toLowerCase().trim()
    return items.filter((item) => {
      const label = getItemLabel(item).toLowerCase()
      const description = getItemDescription?.(item)?.toLowerCase() || ''
      return label.includes(query) || description.includes(query)
    })
  }, [items, debouncedQuery, getItemLabel, getItemDescription])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
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
  }, [])

  // Selecionar item
  const handleSelect = useCallback(
    (item: T) => {
      onChange(getItemId(item))
      setIsOpen(false)
      setSearchQuery('')
    },
    [onChange, getItemId]
  )

  // Limpar seleção
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange('')
    },
    [onChange]
  )

  const showLoading = isLoading || isSearching

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      {/* Campo de seleção */}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-150 bg-background cursor-pointer',
            isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-input hover:border-muted-foreground/50',
            error && 'border-destructive',
            disabled && 'opacity-50 cursor-not-allowed bg-muted'
          )}
        >
          {/* Ícone ou Avatar do selecionado */}
          {selectedItem ? (
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              <User className="w-3.5 h-3.5" />
            </div>
          ) : showLoading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}

          {/* Input ou texto selecionado */}
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              autoFocus
              disabled={disabled}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
            />
          ) : (
            <span
              className={cn(
                'flex-1 text-sm truncate',
                selectedItem ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {selectedItem ? getItemLabel(selectedItem) : searchPlaceholder}
            </span>
          )}

          {/* Botão limpar ou dropdown */}
          {selectedItem && clearable && !isOpen ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Limpar seleção"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : (
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div
            className="absolute z-50 w-full mt-1 bg-popover rounded-lg border border-border
              shadow-lg max-h-64 overflow-auto"
            role="listbox"
          >
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
                  isSelected={getItemId(item) === value}
                  onSelect={handleSelect}
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

      {/* Mensagem de erro */}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
