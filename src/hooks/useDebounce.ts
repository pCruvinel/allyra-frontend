import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook para debounce de valores
 * Útil para evitar chamadas excessivas em inputs de busca
 *
 * @param value - Valor a ser debounced
 * @param delay - Tempo de espera em ms (padrão: 300ms)
 * @returns Valor debounced
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 *
 * useEffect(() => {
 *   // Só executa quando debouncedSearch muda
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debounce de callbacks
 * Útil para evitar execuções excessivas de funções
 *
 * @param callback - Função a ser debounced
 * @param delay - Tempo de espera em ms (padrão: 300ms)
 * @returns Função debounced
 *
 * @example
 * const handleSearch = useDebouncedCallback((term: string) => {
 *   fetchResults(term)
 * }, 300)
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Manter referência atualizada do callback
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}
