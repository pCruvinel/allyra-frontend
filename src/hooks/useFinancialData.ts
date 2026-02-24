/**
 * Hook para gerenciamento de dados financeiros
 * Contas a receber, repasses e notas fiscais
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  financialService,
  type ContaReceberFormatted,
  type RepasseFormatted,
  type NotaFiscalFormatted,
  type RepasseDetalheFormatted,
  type RepasseItemFormatted,
  type ContaReceberStatusDB,
  type RepasseStatusDB,
  type FinancialFilters,
} from '@/services/financial.service'
import type { QueryOptions } from '@/services/types'
import { useAuth } from '@/contexts/AuthContext'

// =====================================================
// HOOK: useContasReceber
// =====================================================

interface UseContasReceberOptions {
  autoFetch?: boolean
  initialFilters?: FinancialFilters
}

interface UseContasReceberReturn {
  contas: ContaReceberFormatted[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    total: number
    received: number
    toReceive: number
    overdue: number
  }
  fetchContas: (options?: QueryOptions & { filters?: FinancialFilters }) => Promise<void>
  getContaById: (id: string) => Promise<ContaReceberFormatted | null>
  getContasByPatient: (patientId: string) => Promise<ContaReceberFormatted[]>
  registerPayment: (id: string, data: { valor_pago: number; forma_pagamento: string }) => Promise<boolean>
  setSearch: (search: string) => void
  setStatusFilter: (status: ContaReceberStatusDB | '') => void
  setDateRange: (from: string, to: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function useContasReceber(options: UseContasReceberOptions = {}): UseContasReceberReturn {
  const { autoFetch = true, initialFilters } = options
  const { currentClinica } = useAuth()

  const [contas, setContas] = useState<ContaReceberFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    total: 0,
    received: 0,
    toReceive: 0,
    overdue: 0,
  })
  const [filters, setFilters] = useState<FinancialFilters>(initialFilters || {})

  const fetchContas = useCallback(async (queryOptions?: QueryOptions & { filters?: FinancialFilters }) => {
    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: FinancialFilters = {
        ...filters,
        ...queryOptions?.filters,
        clinicaId: currentClinica?.id,
      }

      const [contasResult, summaryResult] = await Promise.all([
        financialService.getContasReceber({ ...queryOptions, filters: combinedFilters }),
        financialService.getContasReceberSummary(currentClinica?.id),
      ])

      if (contasResult.error) {
        setError(contasResult.error.message)
        if (contasResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(contasResult.error.message)
        }
      } else {
        setContas(contasResult.data || [])
        setTotal(contasResult.count || 0)
      }

      if (summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar contas a receber'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentClinica?.id])

  const getContaById = useCallback(async (id: string): Promise<ContaReceberFormatted | null> => {
    try {
      const result = await financialService.getContaReceberById(id)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return null
      }
      return result.data || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar conta a receber'
      toast.error(message)
      return null
    }
  }, [])

  const getContasByPatient = useCallback(async (patientId: string): Promise<ContaReceberFormatted[]> => {
    try {
      const result = await financialService.getContasReceber({
        filters: { patientId, clinicaId: currentClinica?.id }
      })
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar contas do paciente'
      toast.error(message)
      return []
    }
  }, [currentClinica?.id])

  const registerPayment = useCallback(async (
    id: string,
    data: { valor_pago: number; forma_pagamento: string }
  ): Promise<boolean> => {
    try {
      const result = await financialService.registerPayment(id, data)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Pagamento registrado com sucesso!')
      await fetchContas()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar pagamento'
      toast.error(message)
      return false
    }
  }, [fetchContas])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: ContaReceberStatusDB | '') => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchContas()
  }, [fetchContas])

  useEffect(() => {
    if (autoFetch) {
      fetchContas()
    }
  }, [autoFetch, filters, currentClinica?.id, fetchContas])

  return {
    contas,
    isLoading,
    error,
    total,
    summary,
    fetchContas,
    getContaById,
    getContasByPatient,
    registerPayment,
    setSearch,
    setStatusFilter,
    setDateRange,
    clearFilters,
    refresh,
  }
}

// =====================================================
// HOOK: useRepasses
// =====================================================

interface UseRepassesOptions {
  autoFetch?: boolean
  initialFilters?: FinancialFilters
}

interface UseRepassesReturn {
  repasses: RepasseFormatted[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    total: number
    paid: number
    pending: number
    approved: number
  }
  fetchRepasses: (options?: QueryOptions & { filters?: FinancialFilters }) => Promise<void>
  getRepasseDetails: (repasseId: string) => Promise<RepasseDetalheFormatted[]>
  getRepasseItems: (detalheId: string) => Promise<RepasseItemFormatted[]>
  approveRepasse: (id: string) => Promise<boolean>
  payRepasse: (id: string) => Promise<boolean>
  setSearch: (search: string) => void
  setStatusFilter: (status: RepasseStatusDB | '') => void
  setProfessionalFilter: (professionalId: string) => void
  setDateRange: (from: string, to: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function useRepasses(options: UseRepassesOptions = {}): UseRepassesReturn {
  const { autoFetch = true, initialFilters } = options
  const { currentClinica } = useAuth()

  const [repasses, setRepasses] = useState<RepasseFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    approved: 0,
  })
  const [filters, setFilters] = useState<FinancialFilters>(initialFilters || {})

  const fetchRepasses = useCallback(async (queryOptions?: QueryOptions & { filters?: FinancialFilters }) => {
    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: FinancialFilters = {
        ...filters,
        ...queryOptions?.filters,
        clinicaId: currentClinica?.id,
      }

      const [repassesResult, summaryResult] = await Promise.all([
        financialService.getRepasses({ ...queryOptions, filters: combinedFilters }),
        financialService.getRepassesSummary(currentClinica?.id),
      ])

      if (repassesResult.error) {
        setError(repassesResult.error.message)
        if (repassesResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(repassesResult.error.message)
        }
      } else {
        setRepasses(repassesResult.data || [])
        setTotal(repassesResult.count || 0)
      }

      if (summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar repasses'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentClinica?.id])

  const getRepasseDetails = useCallback(async (repasseId: string): Promise<RepasseDetalheFormatted[]> => {
    try {
      const result = await financialService.getRepasseDetails(repasseId)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar detalhes do repasse'
      toast.error(message)
      return []
    }
  }, [])

  const getRepasseItems = useCallback(async (detalheId: string): Promise<RepasseItemFormatted[]> => {
    try {
      const result = await financialService.getRepasseItems(detalheId)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar itens do repasse'
      toast.error(message)
      return []
    }
  }, [])

  const approveRepasse = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await financialService.approveRepasse(id)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Repasse aprovado com sucesso!')
      await fetchRepasses()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aprovar repasse'
      toast.error(message)
      return false
    }
  }, [fetchRepasses])

  const payRepasse = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await financialService.payRepasse(id)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Repasse pago com sucesso!')
      await fetchRepasses()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao pagar repasse'
      toast.error(message)
      return false
    }
  }, [fetchRepasses])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: RepasseStatusDB | '') => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setProfessionalFilter = useCallback((professionalId: string) => {
    setFilters(prev => ({ ...prev, professionalId }))
  }, [])

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchRepasses()
  }, [fetchRepasses])

  useEffect(() => {
    if (autoFetch) {
      fetchRepasses()
    }
  }, [autoFetch, filters, currentClinica?.id, fetchRepasses])

  return {
    repasses,
    isLoading,
    error,
    total,
    summary,
    fetchRepasses,
    getRepasseDetails,
    getRepasseItems,
    approveRepasse,
    payRepasse,
    setSearch,
    setStatusFilter,
    setProfessionalFilter,
    setDateRange,
    clearFilters,
    refresh,
  }
}

// =====================================================
// HOOK: useNotasFiscais
// =====================================================

interface UseNotasFiscaisOptions {
  autoFetch?: boolean
  initialFilters?: FinancialFilters
}

interface UseNotasFiscaisReturn {
  notas: NotaFiscalFormatted[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    total: number
    issued: number
    cancelled: number
  }
  fetchNotas: (options?: QueryOptions & { filters?: FinancialFilters }) => Promise<void>
  setSearch: (search: string) => void
  setStatusFilter: (status: string) => void
  setDateRange: (from: string, to: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function useNotasFiscais(options: UseNotasFiscaisOptions = {}): UseNotasFiscaisReturn {
  const { autoFetch = true, initialFilters } = options
  const { currentClinica } = useAuth()

  const [notas, setNotas] = useState<NotaFiscalFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    total: 0,
    issued: 0,
    cancelled: 0,
  })
  const [filters, setFilters] = useState<FinancialFilters>(initialFilters || {})

  const fetchNotas = useCallback(async (queryOptions?: QueryOptions & { filters?: FinancialFilters }) => {
    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: FinancialFilters = {
        ...filters,
        ...queryOptions?.filters,
        clinicaId: currentClinica?.id,
      }

      const [notasResult, summaryResult] = await Promise.all([
        financialService.getNotasFiscais({ ...queryOptions, filters: combinedFilters }),
        financialService.getNotasFiscaisSummary(currentClinica?.id),
      ])

      if (notasResult.error) {
        setError(notasResult.error.message)
        if (notasResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(notasResult.error.message)
        }
      } else {
        setNotas(notasResult.data || [])
        setTotal(notasResult.count || 0)
      }

      if (summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar notas fiscais'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentClinica?.id])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchNotas()
  }, [fetchNotas])

  useEffect(() => {
    if (autoFetch) {
      fetchNotas()
    }
  }, [autoFetch, filters, currentClinica?.id, fetchNotas])

  return {
    notas,
    isLoading,
    error,
    total,
    summary,
    fetchNotas,
    setSearch,
    setStatusFilter,
    setDateRange,
    clearFilters,
    refresh,
  }
}
