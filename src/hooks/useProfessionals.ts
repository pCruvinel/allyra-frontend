/**
 * Hook para gerenciamento de profissionais
 * Integrado com API via apiService
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'

// Interface para options de select
export interface ProfessionalOption {
  value: string
  label: string
  specialties?: string[]
}

// Interface do banco
export interface ProfessionalDB {
  id: string
  usuario_id: string
  clinica_id: string
  conselho_classe: string
  numero_registro: string
  uf_registro: string
  especialidades: string[]
  tipo_contrato: string
  valor_hora: number | null
  carga_horaria_semanal: number | null
  data_admissao: string | null
  // Joins
  usuario?: {
    id: string
    nome_completo: string
    email: string
    foto_url: string | null
  }
}

// Interface formatada para frontend
export interface ProfessionalFormatted {
  id: string
  userId: string
  name: string
  email: string
  avatar: string | null
  council: string
  registrationNumber: string
  state: string
  specialties: string[]
  contractType: string
  hourlyRate: number | null
  weeklyHours: number | null
  admissionDate: string | null
}

function formatProfessional(prof: ProfessionalDB): ProfessionalFormatted {
  return {
    id: prof.id,
    userId: prof.usuario_id,
    name: prof.usuario?.nome_completo || 'Profissional',
    email: prof.usuario?.email || '',
    avatar: prof.usuario?.foto_url || null,
    council: prof.conselho_classe,
    registrationNumber: prof.numero_registro,
    state: prof.uf_registro,
    specialties: prof.especialidades || [],
    contractType: prof.tipo_contrato,
    hourlyRate: prof.valor_hora,
    weeklyHours: prof.carga_horaria_semanal,
    admissionDate: prof.data_admissao,
  }
}

interface UseProfessionalsOptions {
  autoFetch?: boolean
}

interface UseProfessionalsReturn {
  professionals: ProfessionalFormatted[]
  professionalsOptions: ProfessionalOption[]
  isLoading: boolean
  error: string | null
  total: number
  fetchProfessionals: () => Promise<void>
  getProfessionalById: (id: string) => ProfessionalFormatted | undefined
  refresh: () => Promise<void>
}

export function useProfessionals(options: UseProfessionalsOptions = {}): UseProfessionalsReturn {
  const { autoFetch = true } = options
  const { currentClinica } = useAuth()

  const [professionals, setProfessionals] = useState<ProfessionalFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchProfessionals = useCallback(async () => {
    // SEGURANÇA: clinica_id é obrigatório para evitar vazamento de dados
    if (!currentClinica?.id) {
      setProfessionals([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiService.getProfessionals(currentClinica.id)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      const formatted = (result.data || []).map(formatProfessional)
      setProfessionals(formatted)
      setTotal(result.count ?? formatted.length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar profissionais'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const getProfessionalById = useCallback((id: string): ProfessionalFormatted | undefined => {
    return professionals.find(p => p.id === id)
  }, [professionals])

  const refresh = useCallback(async () => {
    await fetchProfessionals()
  }, [fetchProfessionals])

  // Computed options para selects (consistente com useServices e useInsurances)
  const professionalsOptions = useMemo<ProfessionalOption[]>(() =>
    professionals.map(p => ({
      value: p.id,
      label: p.name,
      specialties: p.specialties,
    })),
    [professionals]
  )

  useEffect(() => {
    if (autoFetch) {
      fetchProfessionals()
    }
  }, [autoFetch, currentClinica?.id, fetchProfessionals])

  return {
    professionals,
    professionalsOptions,
    isLoading,
    error,
    total,
    fetchProfessionals,
    getProfessionalById,
    refresh,
  }
}
