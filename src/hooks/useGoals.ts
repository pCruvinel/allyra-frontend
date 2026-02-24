/**
 * Hook para gerenciamento de Metas Terapêuticas
 * Encapsula chamadas à API e gerencia estado
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { goalsService } from '@/services/goals.service'
import type {
  TherapeuticGoal,
  CreateGoalInput,
  UpdateGoalInput,
} from '@/types/goals'

interface UseGoalsOptions {
  autoFetch?: boolean
  planoId?: string
}

interface UseGoalsReturn {
  // Estado
  goals: TherapeuticGoal[]
  isLoading: boolean
  error: string | null
  total: number

  // Ações
  fetchGoals: () => Promise<void>
  createGoal: (data: Omit<CreateGoalInput, 'plano_id'>) => Promise<TherapeuticGoal | null>
  updateGoal: (goalId: string, data: UpdateGoalInput) => Promise<TherapeuticGoal | null>
  deleteGoal: (goalId: string) => Promise<boolean>
  toggleGoalActive: (goalId: string, ativo: boolean) => Promise<boolean>

  // Helpers
  refresh: () => Promise<void>
  setPlanoId: (planoId: string) => void
}

export function useGoals(options: UseGoalsOptions = {}): UseGoalsReturn {
  const { autoFetch = true, planoId: initialPlanoId } = options

  const [planoId, setPlanoId] = useState<string | undefined>(initialPlanoId)
  const [goals, setGoals] = useState<TherapeuticGoal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Busca metas do plano
  const fetchGoals = useCallback(async () => {
    if (!planoId) {
      setGoals([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await goalsService.getGoals(planoId)

      if (result.error) {
        setError(result.error.message)
        toast.error(result.error.message)
      } else {
        setGoals(result.data || [])
        setTotal(result.data?.length || 0)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar metas'
      if (!message.includes('JWT') && !message.includes('expired')) {
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [planoId])

  // Cria meta
  const createGoal = useCallback(async (
    data: Omit<CreateGoalInput, 'plano_id'>
  ): Promise<TherapeuticGoal | null> => {
    if (!planoId) {
      toast.error('Plano não selecionado')
      return null
    }

    setIsLoading(true)

    try {
      const result = await goalsService.createGoal(planoId, data)

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      toast.success('Meta criada com sucesso!')
      await fetchGoals()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar meta'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [planoId, fetchGoals])

  // Atualiza meta
  const updateGoal = useCallback(async (
    goalId: string,
    data: UpdateGoalInput
  ): Promise<TherapeuticGoal | null> => {
    setIsLoading(true)

    try {
      const result = await goalsService.updateGoal(goalId, data)

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      toast.success('Meta atualizada com sucesso!')
      await fetchGoals()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar meta'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchGoals])

  // Remove meta
  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const result = await goalsService.deleteGoal(goalId)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Meta removida com sucesso!')
      await fetchGoals()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover meta'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [fetchGoals])

  // Toggle ativo/inativo
  const toggleGoalActive = useCallback(async (
    goalId: string,
    ativo: boolean
  ): Promise<boolean> => {
    try {
      const result = await goalsService.updateGoal(goalId, { ativo })

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success(`Meta ${ativo ? 'ativada' : 'desativada'} com sucesso!`)
      await fetchGoals()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar meta'
      toast.error(message)
      return false
    }
  }, [fetchGoals])

  // Refresh helper
  const refresh = useCallback(async () => {
    await fetchGoals()
  }, [fetchGoals])

  // Auto-fetch ao montar ou quando planoId muda
  useEffect(() => {
    if (autoFetch && planoId) {
      fetchGoals()
    }
  }, [autoFetch, planoId, fetchGoals])

  // Atualiza planoId quando prop muda
  useEffect(() => {
    if (initialPlanoId !== planoId) {
      setPlanoId(initialPlanoId)
    }
  }, [initialPlanoId, planoId])

  return {
    goals,
    isLoading,
    error,
    total,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoalActive,
    refresh,
    setPlanoId,
  }
}

/**
 * Hook para buscar metas de um plano específico (shorthand)
 */
export function usePlanGoals(planoId: string | undefined) {
  return useGoals({
    autoFetch: !!planoId,
    planoId,
  })
}
