/**
 * Hook useDataService
 *
 * Hook React para operações de dados com controle automático de is_test_data.
 *
 * Comportamento:
 * - VITE_IS_PRODUCTION = false → dados inseridos com is_test_data = true
 * - VITE_IS_PRODUCTION = true → dados inseridos com is_test_data = false,
 *   e consultas filtram registros de teste
 */

import { useState, useCallback } from 'react'
import { supabase, isProduction, isSupabaseConfigured } from '@/lib/supabase'
import {
  dataService,
  hasTestDataColumn,
  prepareInsertData,
} from '@/lib/data-service'

interface UseDataServiceOptions {
  table: string
}

interface DataState<T> {
  data: T[] | null
  loading: boolean
  error: string | null
}

/**
 * Hook para operações CRUD com controle automático de dados de teste
 */
export function useDataService<T extends Record<string, unknown>>(
  options: UseDataServiceOptions
) {
  const { table } = options
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  /**
   * Busca registros (filtra dados de teste em produção)
   */
  const fetchAll = useCallback(
    async (columns = '*') => {
      if (!isSupabaseConfigured || !supabase) {
        setState({ data: null, loading: false, error: 'Supabase não configurado' })
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const { data, error } = await dataService.select(table, columns)

        if (error) {
          setState({ data: null, loading: false, error: error.message })
          return
        }

        setState({ data: data as unknown as T[], loading: false, error: null })
      } catch (err) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        })
      }
    },
    [table]
  )

  /**
   * Insere um registro (com is_test_data automático)
   */
  const insert = useCallback(
    async (record: Omit<T, 'id' | 'created_at' | 'updated_at' | 'is_test_data'>) => {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase não configurado' }
      }

      try {
        const preparedData = prepareInsertData(table, record as Record<string, unknown>)
        const { data, error } = await supabase.from(table).insert(preparedData).select()

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, data: data?.[0] as T }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        }
      }
    },
    [table]
  )

  /**
   * Atualiza um registro
   */
  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase não configurado' }
      }

      try {
        // Remove is_test_data do update
        const { is_test_data: _testDataFlag, ...safeUpdates } = updates as Partial<T> & {
          is_test_data?: boolean
        }
        void _testDataFlag // Ignorar intencionalmente

        const { data, error } = await supabase
          .from(table)
          .update(safeUpdates)
          .eq('id', id)
          .select()

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, data: data?.[0] as T }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        }
      }
    },
    [table]
  )

  /**
   * Deleta um registro
   */
  const remove = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase não configurado' }
      }

      try {
        const { error } = await supabase.from(table).delete().eq('id', id)

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        }
      }
    },
    [table]
  )

  return {
    ...state,
    fetchAll,
    insert,
    update,
    remove,
    isProduction,
    hasTestDataColumn: hasTestDataColumn(table),
  }
}

/**
 * Hook para informações do ambiente
 */
export function useEnvironment() {
  return {
    isProduction,
    isSupabaseConfigured,
    testDataMode: isProduction ? 'filtered' : 'included',
    insertBehavior: isProduction
      ? 'Dados são inseridos como produção (is_test_data = false)'
      : 'Dados são inseridos como teste (is_test_data = true)',
  }
}

export default useDataService
