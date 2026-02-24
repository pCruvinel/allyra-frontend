/**
 * Hook para gerenciar seleção múltipla com busca
 * Baseado em PatientSearchDemo.jsx
 */

import { useState, useCallback, useMemo, useEffect } from 'react'

// Hook de debounce genérico
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export interface UseMultiSelectOptions<T> {
  /** Lista de itens disponíveis para seleção */
  items: T[]
  /** Seleção inicial */
  initialSelection?: T[]
  /** Mínimo de itens para seleção válida (default: 0) */
  minSelection?: number
  /** Máximo de itens selecionáveis (default: Infinity) */
  maxSelection?: number
  /** Campos do objeto para filtrar na busca */
  searchFields?: (keyof T)[]
  /** Callback quando seleção muda */
  onSelectionChange?: (items: T[]) => void
  /** Função para obter ID único do item */
  getItemId: (item: T) => string
  /** Função para obter texto pesquisável do item */
  getSearchableText?: (item: T) => string
}

export interface UseMultiSelectReturn<T> {
  /** Query de busca atual */
  searchQuery: string
  /** Atualizar query de busca */
  setSearchQuery: (query: string) => void
  /** Itens filtrados pela busca */
  filteredItems: T[]
  /** Itens selecionados */
  selectedItems: T[]
  /** Adicionar/remover item da seleção */
  toggleItem: (item: T) => void
  /** Remover item específico */
  removeItem: (item: T) => void
  /** Limpar toda a seleção */
  clearSelection: () => void
  /** Verificar se item está selecionado */
  isSelected: (item: T) => boolean
  /** Pode selecionar mais itens? */
  canSelectMore: boolean
  /** Mínimo de seleção foi atingido? */
  isMinimumMet: boolean
  /** Quantidade atual de selecionados */
  selectionCount: number
  /** Atualizar seleção diretamente */
  setSelectedItems: (items: T[]) => void
}

export function useMultiSelect<T>({
  items,
  initialSelection = [],
  minSelection = 0,
  maxSelection = Infinity,
  searchFields,
  onSelectionChange,
  getItemId,
  getSearchableText,
}: UseMultiSelectOptions<T>): UseMultiSelectReturn<T> {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItemsInternal] = useState<T[]>(initialSelection)

  // Debounce da busca para performance
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Filtrar itens pela busca
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items

    const query = debouncedQuery.toLowerCase().trim()

    return items.filter((item) => {
      // Se tem função customizada de texto pesquisável
      if (getSearchableText) {
        return getSearchableText(item).toLowerCase().includes(query)
      }

      // Se tem campos específicos para busca
      if (searchFields && searchFields.length > 0) {
        return searchFields.some((field) => {
          const value = item[field]
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query)
          }
          return false
        })
      }

      // Busca em todas as propriedades string do objeto
      return Object.values(item as Record<string, unknown>).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query)
        }
        return false
      })
    })
  }, [items, debouncedQuery, searchFields, getSearchableText])

  // Verificar se item está selecionado
  const isSelected = useCallback(
    (item: T) => selectedItems.some((selected) => getItemId(selected) === getItemId(item)),
    [selectedItems, getItemId]
  )

  // Cálculos de estado
  const canSelectMore = selectedItems.length < maxSelection
  const isMinimumMet = selectedItems.length >= minSelection
  const selectionCount = selectedItems.length

  // Atualizar seleção com callback
  const updateSelection = useCallback(
    (newSelection: T[]) => {
      setSelectedItemsInternal(newSelection)
      onSelectionChange?.(newSelection)
    },
    [onSelectionChange]
  )

  // Toggle item (adicionar ou remover)
  const toggleItem = useCallback(
    (item: T) => {
      const alreadySelected = selectedItems.some(
        (selected) => getItemId(selected) === getItemId(item)
      )

      if (alreadySelected) {
        updateSelection(selectedItems.filter((selected) => getItemId(selected) !== getItemId(item)))
      } else if (canSelectMore) {
        updateSelection([...selectedItems, item])
      }
    },
    [selectedItems, canSelectMore, updateSelection, getItemId]
  )

  // Remover item específico
  const removeItem = useCallback(
    (item: T) => {
      updateSelection(selectedItems.filter((selected) => getItemId(selected) !== getItemId(item)))
    },
    [selectedItems, updateSelection, getItemId]
  )

  // Limpar seleção
  const clearSelection = useCallback(() => {
    updateSelection([])
  }, [updateSelection])

  // Atualizar seleção diretamente
  const setSelectedItems = useCallback(
    (items: T[]) => {
      updateSelection(items)
    },
    [updateSelection]
  )

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    selectedItems,
    toggleItem,
    removeItem,
    clearSelection,
    isSelected,
    canSelectMore,
    isMinimumMet,
    selectionCount,
    setSelectedItems,
  }
}
