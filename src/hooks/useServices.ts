/**
 * Hook para gerenciamento de serviços da clínica
 * Integrado com API via apiService
 */

import { useState, useCallback, useEffect } from 'react'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'

// Interface do banco
export interface ServiceDB {
  id: string
  clinica_id: string
  nome: string
  codigo: string | null
  duracao_minutos: number
  valor_padrao: number | null
  especialidade: string | null
  ativo: boolean
  cor_agenda: string | null
  created_at: string
}

// Interface formatada para frontend
export interface ServiceFormatted {
  id: string
  name: string
  code: string | null
  durationMinutes: number
  defaultPrice: number | null
  specialty: string | null
  active: boolean
  color: string | null
}

// Interface para options de select
export interface ServiceOption {
  value: string
  label: string
  durationMinutes?: number
}

function formatService(service: ServiceDB): ServiceFormatted {
  return {
    id: service.id,
    name: service.nome,
    code: service.codigo,
    durationMinutes: service.duracao_minutos,
    defaultPrice: service.valor_padrao,
    specialty: service.especialidade,
    active: service.ativo,
    color: service.cor_agenda,
  }
}

interface UseServicesOptions {
  autoFetch?: boolean
  activeOnly?: boolean
}

interface UseServicesReturn {
  services: ServiceFormatted[]
  servicesOptions: ServiceOption[]
  isLoading: boolean
  error: string | null
  fetchServices: () => Promise<void>
  getServiceById: (id: string) => ServiceFormatted | undefined
  refresh: () => Promise<void>
}

export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const { autoFetch = true, activeOnly = true } = options
  const { currentClinica } = useAuth()

  const [services, setServices] = useState<ServiceFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    // SEGURANÇA: clinica_id é obrigatório para evitar vazamento de dados
    if (!currentClinica?.id) {
      setServices([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiService.getServices(currentClinica.id)

      if (result.error) {
        setError(result.error)
        return
      }

      let servicesList = result.data || []

      // Filtro de apenas ativos (aplicado no frontend)
      if (activeOnly) {
        servicesList = servicesList.filter(s => s.ativo)
      }

      const formatted = (servicesList as ServiceDB[]).map(formatService)
      setServices(formatted)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar serviços'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, activeOnly])

  const getServiceById = useCallback((id: string): ServiceFormatted | undefined => {
    return services.find(s => s.id === id)
  }, [services])

  const refresh = useCallback(async () => {
    await fetchServices()
  }, [fetchServices])

  // Converte para options de select
  const servicesOptions: ServiceOption[] = services.map(s => ({
    value: s.id,
    label: s.name,
    durationMinutes: s.durationMinutes,
  }))

  useEffect(() => {
    if (autoFetch) {
      fetchServices()
    }
  }, [autoFetch, currentClinica?.id, fetchServices])

  return {
    services,
    servicesOptions,
    isLoading,
    error,
    fetchServices,
    getServiceById,
    refresh,
  }
}
