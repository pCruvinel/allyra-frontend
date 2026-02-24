/**
 * Hook para gerenciamento de clientes (clínicas)
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  clientsService,
  type ClientFormatted,
  type ClientMetricsFormatted,
  type ClientStatusDB,
  type ClientFilters,
  type CreateClientInput,
  type UpdateClientInput,
} from '@/services/clients.service'
import type { QueryOptions } from '@/services/types'

interface UseClientsOptions {
  autoFetch?: boolean
  initialFilters?: ClientFilters
  withMetrics?: boolean
}

interface UseClientsReturn {
  clients: ClientFormatted[]
  clientsWithMetrics: (ClientFormatted & { metrics: ClientMetricsFormatted })[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    total: number
    active: number
    inactive: number
    blocked: number
  }
  fetchClients: (options?: QueryOptions & { filters?: ClientFilters }) => Promise<void>
  getClientById: (id: string) => Promise<ClientFormatted | null>
  getClientMetrics: (clientId: string) => Promise<ClientMetricsFormatted | null>
  createClient: (data: CreateClientInput) => Promise<ClientFormatted | null>
  updateClient: (id: string, data: UpdateClientInput) => Promise<ClientFormatted | null>
  updateClientStatus: (id: string, status: ClientStatusDB) => Promise<boolean>
  setSearch: (search: string) => void
  setStatusFilter: (status: ClientStatusDB | '') => void
  setPlanFilter: (plan: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function useClients(options: UseClientsOptions = {}): UseClientsReturn {
  const { autoFetch = true, initialFilters, withMetrics = false } = options

  const [clients, setClients] = useState<ClientFormatted[]>([])
  const [clientsWithMetrics, setClientsWithMetrics] = useState<(ClientFormatted & { metrics: ClientMetricsFormatted })[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
  })
  const [filters, setFilters] = useState<ClientFilters>(initialFilters || {})

  const fetchClients = useCallback(async (queryOptions?: QueryOptions & { filters?: ClientFilters }) => {
    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: ClientFilters = {
        ...filters,
        ...queryOptions?.filters,
      }

      if (withMetrics) {
        const [clientsResult, summaryResult] = await Promise.all([
          clientsService.getAllWithMetrics(),
          clientsService.getSummary(),
        ])

        if (clientsResult.error) {
          setError(clientsResult.error.message)
          if (clientsResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
            toast.error(clientsResult.error.message)
          }
        } else {
          let result = clientsResult.data || []

          // Aplicar filtros no frontend
          if (combinedFilters.search) {
            const searchLower = combinedFilters.search.toLowerCase()
            result = result.filter(c =>
              c.fantasyName.toLowerCase().includes(searchLower) ||
              c.companyName.toLowerCase().includes(searchLower) ||
              c.cnpj.includes(searchLower) ||
              c.code.toLowerCase().includes(searchLower)
            )
          }

          if (combinedFilters.status) {
            const statusMap: Record<ClientStatusDB, string> = {
              ativa: 'Ativo',
              inativa: 'Inativo',
              bloqueada: 'Bloqueado',
              suspensa: 'Suspenso',
            }
            result = result.filter(c => c.status === statusMap[combinedFilters.status as ClientStatusDB])
          }

          setClientsWithMetrics(result)
          setClients(result)
          setTotal(clientsResult.count || result.length)
        }

        if (summaryResult.data) {
          setSummary(summaryResult.data)
        }
      } else {
        const [clientsResult, summaryResult] = await Promise.all([
          clientsService.getAll({ ...queryOptions, filters: combinedFilters }),
          clientsService.getSummary(),
        ])

        if (clientsResult.error) {
          setError(clientsResult.error.message)
          if (clientsResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
            toast.error(clientsResult.error.message)
          }
        } else {
          setClients(clientsResult.data || [])
          setTotal(clientsResult.count || 0)
        }

        if (summaryResult.data) {
          setSummary(summaryResult.data)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar clientes'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, withMetrics])

  const getClientById = useCallback(async (id: string): Promise<ClientFormatted | null> => {
    try {
      const result = await clientsService.getById(id)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar cliente'
      toast.error(message)
      return null
    }
  }, [])

  const getClientMetrics = useCallback(async (clientId: string): Promise<ClientMetricsFormatted | null> => {
    try {
      const result = await clientsService.getMetrics(clientId)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar métricas'
      toast.error(message)
      return null
    }
  }, [])

  const createClient = useCallback(async (data: CreateClientInput): Promise<ClientFormatted | null> => {
    setIsLoading(true)
    try {
      const result = await clientsService.create(data)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      toast.success('Cliente criado com sucesso!')
      await fetchClients()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar cliente'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchClients])

  const updateClient = useCallback(async (id: string, data: UpdateClientInput): Promise<ClientFormatted | null> => {
    setIsLoading(true)
    try {
      const result = await clientsService.update(id, data)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      toast.success('Cliente atualizado com sucesso!')
      await fetchClients()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar cliente'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchClients])

  const updateClientStatus = useCallback(async (id: string, status: ClientStatusDB): Promise<boolean> => {
    try {
      const result = await clientsService.updateStatus(id, status)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Status atualizado com sucesso')
      await fetchClients()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status'
      toast.error(message)
      return false
    }
  }, [fetchClients])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: ClientStatusDB | '') => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setPlanFilter = useCallback((plan: string) => {
    setFilters(prev => ({ ...prev, plan }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchClients()
  }, [fetchClients])

  useEffect(() => {
    if (autoFetch) {
      fetchClients()
    }
  }, [autoFetch, filters, fetchClients])

  return {
    clients,
    clientsWithMetrics,
    isLoading,
    error,
    total,
    summary,
    fetchClients,
    getClientById,
    getClientMetrics,
    createClient,
    updateClient,
    updateClientStatus,
    setSearch,
    setStatusFilter,
    setPlanFilter,
    clearFilters,
    refresh,
  }
}
