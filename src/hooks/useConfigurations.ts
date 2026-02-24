/**
 * Hook para gerenciamento de configurações da clínica
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  configurationsService,
  type ConfiguracaoFormatted,
  type UpdatePadraoInput,
  type UpdateOperacionalInput,
  type UpdateComunicacaoInput,
  type UpdateFaturamentoInput,
  type UpdateAparenciaInput,
  type UpdatePermissoesInput,
  type UpdateCadastroRapidoInput,
} from '@/services/configurations.service'
import { useAuth } from '@/contexts/AuthContext'

interface UseConfigurationsOptions {
  autoFetch?: boolean
}

interface UseConfigurationsReturn {
  // Dados
  configurations: ConfiguracaoFormatted | null

  // Estado
  isLoading: boolean
  error: string | null

  // Métodos
  fetchConfigurations: () => Promise<ConfiguracaoFormatted | null>
  updatePadrao: (data: UpdatePadraoInput) => Promise<boolean>
  updateOperacional: (data: UpdateOperacionalInput) => Promise<boolean>
  updateComunicacao: (data: UpdateComunicacaoInput) => Promise<boolean>
  updateFaturamento: (data: UpdateFaturamentoInput) => Promise<boolean>
  updateAparencia: (data: UpdateAparenciaInput) => Promise<boolean>
  updatePermissoes: (data: UpdatePermissoesInput) => Promise<boolean>
  updateCadastroRapido: (data: UpdateCadastroRapidoInput) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useConfigurations(options: UseConfigurationsOptions = {}): UseConfigurationsReturn {
  const { autoFetch = true } = options
  const { currentClinica } = useAuth()

  const [configurations, setConfigurations] = useState<ConfiguracaoFormatted | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigurations = useCallback(async (): Promise<ConfiguracaoFormatted | null> => {
    if (!currentClinica?.id) return null

    setIsLoading(true)
    setError(null)

    try {
      const result = await configurationsService.getConfigurations(currentClinica.id)

      if (result.error) {
        setError(result.error.message)
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return null
      }

      setConfigurations(result.data!)
      return result.data!
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar configurações'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const updatePadrao = useCallback(async (data: UpdatePadraoInput): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await configurationsService.updatePadrao(currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Configurações salvas!')
      setConfigurations(result.data!)
      return true
    } catch {
      toast.error('Erro ao salvar configurações')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const updateOperacional = useCallback(async (data: UpdateOperacionalInput): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await configurationsService.updateOperacional(currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Configurações operacionais salvas!')
      setConfigurations(result.data!)
      return true
    } catch {
      toast.error('Erro ao salvar configurações')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const updateComunicacao = useCallback(async (data: UpdateComunicacaoInput): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await configurationsService.updateComunicacao(currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Configurações de comunicação salvas!')
      setConfigurations(result.data!)
      return true
    } catch {
      toast.error('Erro ao salvar configurações')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const updateFaturamento = useCallback(async (data: UpdateFaturamentoInput): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await configurationsService.updateFaturamento(currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Configurações de faturamento salvas!')
      setConfigurations(result.data!)
      return true
    } catch {
      toast.error('Erro ao salvar configurações')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const updateAparencia = useCallback(async (data: UpdateAparenciaInput): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await configurationsService.updateAparencia(currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Configurações de aparência salvas!')
      return true
    } catch {
      toast.error('Erro ao salvar configurações')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const updatePermissoes = useCallback(async (data: UpdatePermissoesInput): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await configurationsService.updatePermissoes(currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Permissões salvas!')
      return true
    } catch {
      toast.error('Erro ao salvar permissões')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const updateCadastroRapido = useCallback(async (data: UpdateCadastroRapidoInput): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await configurationsService.updateCadastroRapido(currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Configurações de cadastro salvas!')
      setConfigurations(result.data!)
      return true
    } catch {
      toast.error('Erro ao salvar configurações')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const refresh = useCallback(async () => {
    await fetchConfigurations()
  }, [fetchConfigurations])

  // Auto-fetch
  useEffect(() => {
    if (autoFetch && currentClinica?.id) {
      fetchConfigurations()
    }
  }, [autoFetch, currentClinica?.id, fetchConfigurations])

  return {
    configurations,
    isLoading,
    error,
    fetchConfigurations,
    updatePadrao,
    updateOperacional,
    updateComunicacao,
    updateFaturamento,
    updateAparencia,
    updatePermissoes,
    updateCadastroRapido,
    refresh,
  }
}
