/**
 * Hook para obter configuração de paginação
 * Busca do banco de dados ou usa valor padrão
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api.service'
import { DEFAULT_ITEMS_PER_PAGE } from '@/config/pagination'

interface PaginationConfig {
  itemsPerPage: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// Cache global para evitar múltiplas chamadas
let cachedConfig: { clinicaId: string; itemsPerPage: number } | null = null

export function usePaginationConfig(): PaginationConfig {
  const { currentClinica } = useAuth()
  const [itemsPerPage, setItemsPerPage] = useState<number>(DEFAULT_ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    if (!currentClinica?.id) {
      setItemsPerPage(DEFAULT_ITEMS_PER_PAGE)
      return
    }

    // Usa cache se for a mesma clínica
    if (cachedConfig && cachedConfig.clinicaId === currentClinica.id) {
      setItemsPerPage(cachedConfig.itemsPerPage)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiService.getClinicSettings(currentClinica.id)

      if (result.error) {
        setError(result.error)
        setItemsPerPage(DEFAULT_ITEMS_PER_PAGE)
      } else if (result.data) {
        const configValue = result.data.itens_por_pagina || DEFAULT_ITEMS_PER_PAGE
        setItemsPerPage(configValue)
        // Atualiza cache
        cachedConfig = { clinicaId: currentClinica.id, itemsPerPage: configValue }
      } else {
        // Sem configuração, usa padrão
        setItemsPerPage(DEFAULT_ITEMS_PER_PAGE)
        cachedConfig = { clinicaId: currentClinica.id, itemsPerPage: DEFAULT_ITEMS_PER_PAGE }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar configuração')
      setItemsPerPage(DEFAULT_ITEMS_PER_PAGE)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    itemsPerPage,
    isLoading,
    error,
    refresh: fetchConfig,
  }
}

// Export para uso sem hook (quando valor estático é suficiente)
export { DEFAULT_ITEMS_PER_PAGE }
