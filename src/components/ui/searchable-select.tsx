import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  required?: boolean
  className?: string
  disabled?: boolean
  /** Número máximo de itens a exibir na lista (default: 50) */
  maxDisplayItems?: number
  /** Número mínimo de opções para mostrar campo de busca (default: 10) */
  minOptionsForSearch?: number
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  searchPlaceholder = 'Buscar...',
  label,
  required,
  className,
  disabled,
  maxDisplayItems = 50,
  minOptionsForSearch = 10,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Mostra busca apenas se tiver muitas opções
  const showSearch = options.length >= minOptionsForSearch

  // Filtra opções baseado na busca
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options.slice(0, maxDisplayItems)
    }

    const query = searchQuery.toLowerCase().trim()
    return options
      .filter((opt) => opt.label.toLowerCase().includes(query))
      .slice(0, maxDisplayItems)
  }, [options, searchQuery, maxDisplayItems])

  // Conta total de resultados (para mostrar "+X mais")
  const totalMatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return options.length
    }
    const query = searchQuery.toLowerCase().trim()
    return options.filter((opt) => opt.label.toLowerCase().includes(query)).length
  }, [options, searchQuery])

  const hasMoreResults = totalMatches > maxDisplayItems

  // Calcular posição do dropdown quando abrir
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 320 // altura aproximada máxima do dropdown

      // Verifica se cabe abaixo, senão abre acima
      const spaceBelow = viewportHeight - rect.bottom
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

      setDropdownPosition({
        top: openAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      // Foca no campo de busca quando abrir
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)

      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition, true)
      return () => {
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition, true)
      }
    } else {
      // Limpa busca ao fechar
      setSearchQuery('')
    }
  }, [isOpen, updateDropdownPosition])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement
        if (!target.closest('[data-searchable-select-dropdown]')) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
    setSearchQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm bg-background border border-border rounded-lg transition-colors',
            'hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-primary/50 ring-1 ring-primary/30'
          )}
        >
          <span className={cn(selectedOption ? 'text-foreground truncate' : 'text-muted-foreground')}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-muted"
                title="Limpar seleção"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown via Portal */}
        {isOpen && createPortal(
          <div
            data-searchable-select-dropdown
            className="fixed z-[9999] bg-background border border-border rounded-lg shadow-lg flex flex-col"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: '320px',
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Campo de busca */}
            {showSearch && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lista de opções */}
            <div className="overflow-auto flex-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Nenhum resultado encontrado
                </div>
              ) : (
                <>
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                        value === option.value && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}

                  {/* Indicador de mais resultados */}
                  {hasMoreResults && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border bg-muted/30">
                      Mostrando {maxDisplayItems} de {totalMatches} resultados. Refine a busca para ver mais.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
