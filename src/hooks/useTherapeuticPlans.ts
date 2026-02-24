/**
 * Hook para gerenciamento de Planos Terapêuticos
 * Encapsula chamadas à API e gerencia estado
 * Suporta multi-tenant via clinica_id do AuthContext
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { goalsService } from '@/services/goals.service'
import { useAuth } from '@/contexts/AuthContext'
import type {
  TherapeuticPlan,
  CreatePlanInput,
  UpdatePlanInput,
  PlanStatus,
} from '@/types/goals'

interface UsePlansOptions {
  autoFetch?: boolean
  pacienteId?: string
  status?: PlanStatus
}

interface UsePlansReturn {
  // Estado
  plans: TherapeuticPlan[]
  isLoading: boolean
  error: string | null
  total: number

  // Ações
  fetchPlans: () => Promise<void>
  getPlanById: (planId: string) => Promise<TherapeuticPlan | null>
  createPlan: (data: Omit<CreatePlanInput, 'clinica_id'>) => Promise<TherapeuticPlan | null>
  updatePlan: (planId: string, data: UpdatePlanInput) => Promise<TherapeuticPlan | null>
  deletePlan: (planId: string) => Promise<boolean>
  changePlanStatus: (planId: string, status: PlanStatus) => Promise<boolean>

  // Helpers
  refresh: () => Promise<void>
}

export function useTherapeuticPlans(options: UsePlansOptions = {}): UsePlansReturn {
  const { autoFetch = true, pacienteId, status } = options
  const { currentClinica } = useAuth()

  const [plans, setPlans] = useState<TherapeuticPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Busca planos da clínica/paciente
  const fetchPlans = useCallback(async () => {
    if (!currentClinica?.id) {
      setPlans([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await goalsService.getPlans(currentClinica.id, {
        pacienteId,
        status,
      })

      if (result.error) {
        setError(result.error.message)
        toast.error(result.error.message)
      } else {
        setPlans(result.data || [])
        setTotal(result.data?.length || 0)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar planos'
      if (!message.includes('JWT') && !message.includes('expired')) {
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, pacienteId, status])

  // Busca plano por ID
  const getPlanById = useCallback(async (planId: string): Promise<TherapeuticPlan | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    try {
      const result = await goalsService.getPlanById(planId, currentClinica.id)

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar plano'
      toast.error(message)
      return null
    }
  }, [currentClinica?.id])

  // Cria plano
  const createPlan = useCallback(async (
    data: Omit<CreatePlanInput, 'clinica_id'>
  ): Promise<TherapeuticPlan | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await goalsService.createPlan({
        ...data,
        clinica_id: currentClinica.id,
      })

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      toast.success('Plano terapêutico criado com sucesso!')
      await fetchPlans()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar plano'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, fetchPlans])

  // Atualiza plano
  const updatePlan = useCallback(async (
    planId: string,
    data: UpdatePlanInput
  ): Promise<TherapeuticPlan | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await goalsService.updatePlan(planId, currentClinica.id, data)

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      toast.success('Plano atualizado com sucesso!')
      await fetchPlans()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar plano'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, fetchPlans])

  // Remove plano
  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)

    try {
      const result = await goalsService.deletePlan(planId, currentClinica.id)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Plano removido com sucesso!')
      await fetchPlans()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover plano'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, fetchPlans])

  // Altera status do plano
  const changePlanStatus = useCallback(async (
    planId: string,
    newStatus: PlanStatus
  ): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    try {
      const result = await goalsService.updatePlan(planId, currentClinica.id, {
        status: newStatus,
      })

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      const statusLabels: Record<PlanStatus, string> = {
        ativo: 'ativado',
        concluido: 'concluído',
        cancelado: 'cancelado',
      }

      toast.success(`Plano ${statusLabels[newStatus]} com sucesso!`)
      await fetchPlans()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status'
      toast.error(message)
      return false
    }
  }, [currentClinica?.id, fetchPlans])

  // Refresh helper
  const refresh = useCallback(async () => {
    await fetchPlans()
  }, [fetchPlans])

  // Auto-fetch ao montar ou quando clínica/filtros mudam
  useEffect(() => {
    if (autoFetch && currentClinica?.id) {
      fetchPlans()
    }
  }, [autoFetch, currentClinica?.id, fetchPlans])

  return {
    plans,
    isLoading,
    error,
    total,
    fetchPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    changePlanStatus,
    refresh,
  }
}

/**
 * Hook para buscar planos de um paciente específico
 */
export function usePatientPlans(pacienteId: string | undefined) {
  return useTherapeuticPlans({
    autoFetch: !!pacienteId,
    pacienteId,
  })
}
