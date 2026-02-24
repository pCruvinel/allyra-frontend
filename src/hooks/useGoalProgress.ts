/**
 * Hook para gerenciamento de Progresso de Metas
 * Encapsula chamadas à API e gerencia estado
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { goalsService } from '@/services/goals.service'
import { useAuth } from '@/contexts/AuthContext'
import type {
  GoalProgress,
  CreateProgressInput,
  GoalReport,
  PortalToken,
  GenerateTokenInput,
  PortalData,
} from '@/types/goals'

// =====================================================
// HOOK: useGoalProgress - Progresso de uma meta
// =====================================================

interface UseProgressOptions {
  autoFetch?: boolean
  goalId?: string
}

interface UseProgressReturn {
  progress: GoalProgress[]
  isLoading: boolean
  error: string | null
  total: number
  fetchProgress: () => Promise<void>
  registerProgress: (data: Omit<CreateProgressInput, 'meta_id' | 'clinica_id'>) => Promise<GoalProgress | null>
  refresh: () => Promise<void>
  setGoalId: (goalId: string) => void
}

export function useGoalProgress(options: UseProgressOptions = {}): UseProgressReturn {
  const { autoFetch = true, goalId: initialGoalId } = options
  const { currentClinica } = useAuth()

  const [goalId, setGoalId] = useState<string | undefined>(initialGoalId)
  const [progress, setProgress] = useState<GoalProgress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Busca progresso da meta
  const fetchProgress = useCallback(async () => {
    if (!goalId) {
      setProgress([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await goalsService.getProgress(goalId)

      if (result.error) {
        setError(result.error.message)
        toast.error(result.error.message)
      } else {
        setProgress(result.data || [])
        setTotal(result.data?.length || 0)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar progresso'
      if (!message.includes('JWT') && !message.includes('expired')) {
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [goalId])

  // Registra progresso
  const registerProgress = useCallback(async (
    data: Omit<CreateProgressInput, 'meta_id' | 'clinica_id'>
  ): Promise<GoalProgress | null> => {
    if (!goalId) {
      toast.error('Meta não selecionada')
      return null
    }

    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await goalsService.registerProgress(goalId, {
        ...data,
        clinica_id: currentClinica.id,
      })

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      toast.success('Progresso registrado com sucesso!')
      await fetchProgress()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar progresso'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [goalId, currentClinica?.id, fetchProgress])

  // Refresh helper
  const refresh = useCallback(async () => {
    await fetchProgress()
  }, [fetchProgress])

  // Auto-fetch
  useEffect(() => {
    if (autoFetch && goalId) {
      fetchProgress()
    }
  }, [autoFetch, goalId, fetchProgress])

  // Atualiza goalId quando prop muda
  useEffect(() => {
    if (initialGoalId !== goalId) {
      setGoalId(initialGoalId)
    }
  }, [initialGoalId, goalId])

  return {
    progress,
    isLoading,
    error,
    total,
    fetchProgress,
    registerProgress,
    refresh,
    setGoalId,
  }
}

// =====================================================
// HOOK: usePlanProgressHistory - Histórico de um plano
// =====================================================

interface UseHistoryOptions {
  autoFetch?: boolean
  planoId?: string
  dataInicio?: string
  dataFim?: string
}

interface UseHistoryReturn {
  history: GoalProgress[]
  isLoading: boolean
  error: string | null
  fetchHistory: (filters?: { dataInicio?: string; dataFim?: string }) => Promise<void>
  refresh: () => Promise<void>
}

export function usePlanProgressHistory(options: UseHistoryOptions = {}): UseHistoryReturn {
  const { autoFetch = true, planoId, dataInicio, dataFim } = options

  const [history, setHistory] = useState<GoalProgress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async (
    filters?: { dataInicio?: string; dataFim?: string }
  ) => {
    if (!planoId) {
      setHistory([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await goalsService.getProgressHistory(planoId, {
        dataInicio: filters?.dataInicio || dataInicio,
        dataFim: filters?.dataFim || dataFim,
      })

      if (result.error) {
        setError(result.error.message)
        toast.error(result.error.message)
      } else {
        setHistory(result.data || [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar histórico'
      if (!message.includes('JWT') && !message.includes('expired')) {
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [planoId, dataInicio, dataFim])

  const refresh = useCallback(async () => {
    await fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (autoFetch && planoId) {
      fetchHistory()
    }
  }, [autoFetch, planoId, fetchHistory])

  return {
    history,
    isLoading,
    error,
    fetchHistory,
    refresh,
  }
}

// =====================================================
// HOOK: useGoalReport - Relatório de um plano
// =====================================================

interface UseReportOptions {
  autoFetch?: boolean
  planoId?: string
}

interface UseReportReturn {
  report: GoalReport | null
  isLoading: boolean
  error: string | null
  fetchReport: () => Promise<void>
  refresh: () => Promise<void>
}

export function useGoalReport(options: UseReportOptions = {}): UseReportReturn {
  const { autoFetch = true, planoId } = options
  const { currentClinica } = useAuth()

  const [report, setReport] = useState<GoalReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    if (!planoId || !currentClinica?.id) {
      setReport(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await goalsService.getReportData(planoId, currentClinica.id)

      if (result.error) {
        setError(result.error.message)
        toast.error(result.error.message)
      } else {
        setReport(result.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar relatório'
      if (!message.includes('JWT') && !message.includes('expired')) {
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [planoId, currentClinica?.id])

  const refresh = useCallback(async () => {
    await fetchReport()
  }, [fetchReport])

  useEffect(() => {
    if (autoFetch && planoId && currentClinica?.id) {
      fetchReport()
    }
  }, [autoFetch, planoId, currentClinica?.id, fetchReport])

  return {
    report,
    isLoading,
    error,
    fetchReport,
    refresh,
  }
}

// =====================================================
// HOOK: usePortalShare - Compartilhamento
// =====================================================

interface UseShareReturn {
  isLoading: boolean
  error: string | null
  generateLink: (
    planoId: string,
    options?: Omit<GenerateTokenInput, 'plano_id' | 'clinica_id' | 'paciente_id'>
  ) => Promise<PortalToken | null>
  revokeToken: (tokenId: string) => Promise<boolean>
}

export function usePortalShare(): UseShareReturn {
  const { currentClinica } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateLink = useCallback(async (
    planoId: string,
    options?: Omit<GenerateTokenInput, 'plano_id' | 'clinica_id' | 'paciente_id'>
  ): Promise<PortalToken | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Primeiro precisamos buscar o paciente_id do plano
      const planResult = await goalsService.getPlanById(planoId, currentClinica.id)
      if (planResult.error || !planResult.data) {
        toast.error('Plano não encontrado')
        return null
      }

      const result = await goalsService.generateShareLink(planoId, {
        clinica_id: currentClinica.id,
        paciente_id: planResult.data.paciente_id,
        ...options,
      })

      if (result.error) {
        setError(result.error.message)
        toast.error(result.error.message)
        return null
      }

      toast.success('Link de compartilhamento gerado!')
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar link'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const revokeToken = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)

    try {
      const result = await goalsService.revokeToken(tokenId, currentClinica.id)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Link revogado com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao revogar link'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  return {
    isLoading,
    error,
    generateLink,
    revokeToken,
  }
}

// =====================================================
// HOOK: usePortalData - Dados públicos do portal
// =====================================================

interface UsePortalDataReturn {
  data: PortalData | null
  isLoading: boolean
  error: string | null
  isValid: boolean
  fetchData: () => Promise<void>
}

export function usePortalData(token: string | undefined): UsePortalDataReturn {
  const [data, setData] = useState<PortalData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) {
      setData(null)
      setIsValid(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await goalsService.getPortalData(token)

      if (result.error) {
        setError(result.error.message)
        setIsValid(false)
        setData(null)
      } else {
        setData(result.data)
        setIsValid(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token inválido ou expirado'
      setError(message)
      setIsValid(false)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token, fetchData])

  return {
    data,
    isLoading,
    error,
    isValid,
    fetchData,
  }
}
