/**
 * Hook para gerenciar a Lista de Espera
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api.service'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export interface WaitlistEntry {
  id: string
  clinica_id: string
  paciente_id: string
  profissional_id?: string
  servico_id?: string
  data_preferencia_inicio?: string
  data_preferencia_fim?: string
  horario_preferencia?: string
  dias_semana_preferidos?: number[]
  prioridade: number
  motivo?: string
  observacoes?: string
  status: 'aguardando' | 'agendado' | 'cancelado' | 'expirado'
  agendamento_id?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  paciente?: {
    id: string
    nome_completo: string
  }
  profissional?: {
    id: string
    usuario: {
      nome_completo: string
    }
  }
  servico?: {
    id: string
    nome: string
  }
  criado_por?: {
    id: string
    nome_completo: string
  }
}

export interface AddToWaitlistData {
  paciente_id: string
  profissional_id?: string
  servico_id?: string
  data_preferencia_inicio?: string
  data_preferencia_fim?: string
  horario_preferencia?: string
  dias_semana_preferidos?: number[]
  prioridade?: number
  motivo?: string
  observacoes?: string
}

interface UseWaitlistOptions {
  autoFetch?: boolean
  status?: string
}

export function useWaitlist(options: UseWaitlistOptions = {}) {
  const { autoFetch = true, status } = options
  const { currentClinica } = useAuth()

  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar lista de espera
  const fetchWaitlist = useCallback(async () => {
    if (!currentClinica?.id) return

    setLoading(true)
    setError(null)

    try {
      const result = await apiService.getWaitlist(currentClinica.id, status)

      if (result.error) {
        setError(result.error)
        logger.error('useWaitlist', 'Erro ao buscar lista de espera:', result.error)
        return
      }

      setEntries(result.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      logger.error('useWaitlist', 'Erro ao buscar lista de espera:', err)
    } finally {
      setLoading(false)
    }
  }, [currentClinica?.id, status])

  // Adicionar à lista de espera
  const addToWaitlist = useCallback(async (data: AddToWaitlistData): Promise<WaitlistEntry | null> => {
    if (!currentClinica?.id) {
      toast.error('Selecione uma clínica primeiro')
      return null
    }

    setLoading(true)

    try {
      const result = await apiService.addToWaitlist({
        ...data,
        clinica_id: currentClinica.id,
      })

      if (result.error) {
        toast.error(result.error)
        return null
      }

      toast.success('Paciente adicionado à lista de espera')
      await fetchWaitlist()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar à lista de espera'
      toast.error(message)
      logger.error('useWaitlist', 'Erro ao adicionar à lista de espera:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [currentClinica?.id, fetchWaitlist])

  // Atualizar entrada
  const updateEntry = useCallback(async (
    id: string,
    data: Partial<Omit<WaitlistEntry, 'id' | 'clinica_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    setLoading(true)

    try {
      const result = await apiService.updateWaitlistEntry(id, data)

      if (result.error) {
        toast.error(result.error)
        return false
      }

      toast.success('Registro atualizado')
      await fetchWaitlist()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar registro'
      toast.error(message)
      logger.error('useWaitlist', 'Erro ao atualizar entrada:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchWaitlist])

  // Remover da lista
  const removeFromWaitlist = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)

    try {
      const result = await apiService.removeFromWaitlist(id)

      if (!result.success) {
        toast.error('Erro ao remover da lista de espera')
        return false
      }

      toast.success('Removido da lista de espera')
      setEntries(prev => prev.filter(e => e.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover da lista de espera'
      toast.error(message)
      logger.error('useWaitlist', 'Erro ao remover da lista:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Marcar como agendado (quando conseguir uma vaga)
  const markAsScheduled = useCallback(async (id: string, agendamentoId: string): Promise<boolean> => {
    return await updateEntry(id, {
      status: 'agendado',
      agendamento_id: agendamentoId,
    })
  }, [updateEntry])

  // Cancelar entrada
  const cancelEntry = useCallback(async (id: string): Promise<boolean> => {
    return await updateEntry(id, { status: 'cancelado' })
  }, [updateEntry])

  // Buscar automaticamente ao montar
  useEffect(() => {
    if (autoFetch && currentClinica?.id) {
      fetchWaitlist()
    }
  }, [autoFetch, currentClinica?.id, fetchWaitlist])

  return {
    entries,
    loading,
    error,
    fetchWaitlist,
    addToWaitlist,
    updateEntry,
    removeFromWaitlist,
    markAsScheduled,
    cancelEntry,
    // Contadores úteis
    totalAguardando: entries.filter(e => e.status === 'aguardando').length,
  }
}
