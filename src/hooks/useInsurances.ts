/**
 * Hook para gerenciamento de convênios da clínica
 * Integrado com API via apiService
 */

import { useState, useCallback, useEffect } from 'react'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'

// Interface do banco
export interface InsuranceDB {
  id: string
  clinica_id: string
  nome: string
  cnpj: string | null
  codigo_ans: string | null
  tipo: string
  ativo: boolean
  observacoes: string | null
  created_at: string
}

// Interface formatada para frontend
export interface InsuranceFormatted {
  id: string
  name: string
  cnpj: string | null
  ansCode: string | null
  type: string
  active: boolean
  notes: string | null
}

// Interface para options de select
export interface InsuranceOption {
  value: string
  label: string
  type?: string
}

function formatInsurance(insurance: InsuranceDB): InsuranceFormatted {
  return {
    id: insurance.id,
    name: insurance.nome,
    cnpj: insurance.cnpj,
    ansCode: insurance.codigo_ans,
    type: insurance.tipo,
    active: insurance.ativo,
    notes: insurance.observacoes,
  }
}

interface UseInsurancesOptions {
  autoFetch?: boolean
  activeOnly?: boolean
}

interface UseInsurancesReturn {
  insurances: InsuranceFormatted[]
  insurancesOptions: InsuranceOption[]
  isLoading: boolean
  error: string | null
  fetchInsurances: () => Promise<void>
  getInsuranceById: (id: string) => InsuranceFormatted | undefined
  refresh: () => Promise<void>
}

export function useInsurances(options: UseInsurancesOptions = {}): UseInsurancesReturn {
  const { autoFetch = true, activeOnly = true } = options
  const { currentClinica } = useAuth()

  const [insurances, setInsurances] = useState<InsuranceFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsurances = useCallback(async () => {
    // SEGURANÇA: clinica_id é obrigatório para evitar vazamento de dados
    if (!currentClinica?.id) {
      setInsurances([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiService.getInsurances(currentClinica.id)

      if (result.error) {
        setError(result.error)
        return
      }

      let insurancesList = result.data || []

      // Filtro de apenas ativos (aplicado no frontend)
      if (activeOnly) {
        insurancesList = insurancesList.filter(i => i.ativo)
      }

      const formatted = (insurancesList as InsuranceDB[]).map(formatInsurance)
      setInsurances(formatted)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar convênios'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, activeOnly])

  const getInsuranceById = useCallback((id: string): InsuranceFormatted | undefined => {
    return insurances.find(i => i.id === id)
  }, [insurances])

  const refresh = useCallback(async () => {
    await fetchInsurances()
  }, [fetchInsurances])

  // Converte para options de select
  const insurancesOptions: InsuranceOption[] = insurances.map(i => ({
    value: i.id,
    label: i.name,
    type: i.type,
  }))

  useEffect(() => {
    if (autoFetch) {
      fetchInsurances()
    }
  }, [autoFetch, currentClinica?.id, fetchInsurances])

  return {
    insurances,
    insurancesOptions,
    isLoading,
    error,
    fetchInsurances,
    getInsuranceById,
    refresh,
  }
}
