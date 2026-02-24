/**
 * Hook para gerenciamento de dados de faturamento
 * Faturamentos emitidos e pré-faturamentos
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  billingService,
  type FaturamentoFormatted,
  type PreFaturamentoFormatted,
  type FaturaStatusDB,
  type BillingFilters,
} from '@/services/billing.service'
import type { QueryOptions } from '@/services/types'
import { useAuth } from '@/contexts/AuthContext'

// =====================================================
// HOOK: useFaturamentos
// =====================================================

interface UseFaturamentosOptions {
  autoFetch?: boolean
  initialFilters?: BillingFilters
}

interface UseFaturamentosReturn {
  faturamentos: FaturamentoFormatted[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    total: number
    issued: number
    paid: number
    pending: number
    cancelled: number
  }
  fetchFaturamentos: (options?: QueryOptions & { filters?: BillingFilters }) => Promise<void>
  updateStatus: (id: string, status: FaturaStatusDB) => Promise<boolean>
  setSearch: (search: string) => void
  setStatusFilter: (status: FaturaStatusDB | '') => void
  setDateRange: (from: string, to: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function useFaturamentos(options: UseFaturamentosOptions = {}): UseFaturamentosReturn {
  const { autoFetch = true, initialFilters } = options
  const { currentClinica } = useAuth()

  const [faturamentos, setFaturamentos] = useState<FaturamentoFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    total: 0,
    issued: 0,
    paid: 0,
    pending: 0,
    cancelled: 0,
  })
  const [filters, setFilters] = useState<BillingFilters>(initialFilters || {})

  const fetchFaturamentos = useCallback(async (queryOptions?: QueryOptions & { filters?: BillingFilters }) => {
    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: BillingFilters = {
        ...filters,
        ...queryOptions?.filters,
        clinicaId: currentClinica?.id,
      }

      const [faturamentosResult, summaryResult] = await Promise.all([
        billingService.getFaturamentos({ ...queryOptions, filters: combinedFilters }),
        billingService.getFaturamentosSummary(currentClinica?.id),
      ])

      if (faturamentosResult.error) {
        setError(faturamentosResult.error.message)
        if (faturamentosResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(faturamentosResult.error.message)
        }
      } else {
        setFaturamentos(faturamentosResult.data || [])
        setTotal(faturamentosResult.count || 0)
      }

      if (summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar faturamentos'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentClinica?.id])

  const updateStatus = useCallback(async (id: string, status: FaturaStatusDB): Promise<boolean> => {
    try {
      const result = await billingService.updateFaturaStatus(id, status)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      const statusLabels: Record<FaturaStatusDB, string> = {
        emitida: 'marcada como emitida',
        enviada: 'enviada',
        paga: 'marcada como paga',
        cancelada: 'cancelada',
        vencida: 'marcada como vencida',
      }

      toast.success(`Fatura ${statusLabels[status]}!`)
      await fetchFaturamentos()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status'
      toast.error(message)
      return false
    }
  }, [fetchFaturamentos])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: FaturaStatusDB | '') => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchFaturamentos()
  }, [fetchFaturamentos])

  useEffect(() => {
    if (autoFetch) {
      fetchFaturamentos()
    }
  }, [autoFetch, filters, currentClinica?.id, fetchFaturamentos])

  return {
    faturamentos,
    isLoading,
    error,
    total,
    summary,
    fetchFaturamentos,
    updateStatus,
    setSearch,
    setStatusFilter,
    setDateRange,
    clearFilters,
    refresh,
  }
}

// =====================================================
// HOOK: usePreFaturamentos
// =====================================================

interface UsePreFaturamentosOptions {
  autoFetch?: boolean
  initialFilters?: BillingFilters
}

interface UsePreFaturamentosReturn {
  preFaturamentos: PreFaturamentoFormatted[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    count: number
    totalValue: number
  }
  fetchPreFaturamentos: (options?: QueryOptions & { filters?: BillingFilters }) => Promise<void>
  createFaturamento: (itemIds: string[], tipo: string, observacoes?: string) => Promise<FaturamentoFormatted | null>
  setSearch: (search: string) => void
  setDateRange: (from: string, to: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function usePreFaturamentos(options: UsePreFaturamentosOptions = {}): UsePreFaturamentosReturn {
  const { autoFetch = true, initialFilters } = options
  const { currentClinica, user } = useAuth()

  const [preFaturamentos, setPreFaturamentos] = useState<PreFaturamentoFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    count: 0,
    totalValue: 0,
  })
  const [filters, setFilters] = useState<BillingFilters>(initialFilters || {})

  const fetchPreFaturamentos = useCallback(async (queryOptions?: QueryOptions & { filters?: BillingFilters }) => {
    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: BillingFilters = {
        ...filters,
        ...queryOptions?.filters,
        clinicaId: currentClinica?.id,
      }

      const [preResult, summaryResult] = await Promise.all([
        billingService.getPreFaturamentos({ ...queryOptions, filters: combinedFilters }),
        billingService.getPreFaturamentosSummary(currentClinica?.id),
      ])

      if (preResult.error) {
        setError(preResult.error.message)
        if (preResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(preResult.error.message)
        }
      } else {
        setPreFaturamentos(preResult.data || [])
        setTotal(preResult.count || 0)
      }

      if (summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar pré-faturamentos'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentClinica?.id])

  const createFaturamento = useCallback(async (
    itemIds: string[],
    tipo: string,
    observacoes?: string
  ): Promise<FaturamentoFormatted | null> => {
    if (!currentClinica?.id || !user?.id) {
      toast.error('Clínica ou usuário não identificado')
      return null
    }

    if (itemIds.length === 0) {
      toast.error('Selecione ao menos um item para faturar')
      return null
    }

    setIsLoading(true)

    try {
      const result = await billingService.createFaturamento({
        clinica_id: currentClinica.id,
        tipo_fatura: tipo,
        itemIds,
        emitido_por_id: user.id,
        observacoes,
      })

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      toast.success('Faturamento criado com sucesso!')
      await fetchPreFaturamentos()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar faturamento'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, user?.id, fetchPreFaturamentos])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchPreFaturamentos()
  }, [fetchPreFaturamentos])

  useEffect(() => {
    if (autoFetch) {
      fetchPreFaturamentos()
    }
  }, [autoFetch, filters, currentClinica?.id, fetchPreFaturamentos])

  return {
    preFaturamentos,
    isLoading,
    error,
    total,
    summary,
    fetchPreFaturamentos,
    createFaturamento,
    setSearch,
    setDateRange,
    clearFilters,
    refresh,
  }
}
