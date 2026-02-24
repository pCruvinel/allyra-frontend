/**
 * Hook para gerenciamento de orçamentos
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { orcamentoService } from '@/services/orcamento.service'
import type {
  Orcamento,
  OrcamentoStatus,
  CreateOrcamentoInput,
  UpdateOrcamentoInput,
  ConverterAgendamentoInput,
} from '@/types/orcamento'

interface UseOrcamentosOptions {
  autoFetch?: boolean
  pacienteId?: string
  status?: OrcamentoStatus
}

interface UseOrcamentosReturn {
  orcamentos: Orcamento[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    total: number
    pendentes: number
    aprovados: number
    convertidos: number
    valorTotal: number
  }
  fetchOrcamentos: () => Promise<void>
  getOrcamentoById: (id: string) => Promise<Orcamento | null>
  createOrcamento: (data: Omit<CreateOrcamentoInput, 'clinica_id'>) => Promise<Orcamento | null>
  updateOrcamento: (id: string, data: UpdateOrcamentoInput) => Promise<Orcamento | null>
  deleteOrcamento: (id: string) => Promise<boolean>
  aprovarOrcamento: (id: string) => Promise<Orcamento | null>
  converterParaAgendamento: (
    id: string,
    data: Omit<ConverterAgendamentoInput, 'clinica_id'>
  ) => Promise<{ orcamento: Orcamento; agendamentoId: string } | null>
  setStatusFilter: (status: OrcamentoStatus | '') => void
  refresh: () => Promise<void>
}

export function useOrcamentos(options: UseOrcamentosOptions = {}): UseOrcamentosReturn {
  const { autoFetch = true, pacienteId, status: initialStatus } = options
  const { currentClinica } = useAuth()

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<OrcamentoStatus | ''>(initialStatus || '')
  const [summary, setSummary] = useState({
    total: 0,
    pendentes: 0,
    aprovados: 0,
    convertidos: 0,
    valorTotal: 0,
  })

  const clinicaId = currentClinica?.id

  const fetchOrcamentos = useCallback(async () => {
    if (!clinicaId) return

    setIsLoading(true)
    setError(null)

    try {
      const filterOptions: { status?: OrcamentoStatus; pacienteId?: string } = {}

      if (statusFilter) {
        filterOptions.status = statusFilter
      }
      if (pacienteId) {
        filterOptions.pacienteId = pacienteId
      }

      const result = await orcamentoService.list(clinicaId, filterOptions)

      if (result.data) {
        setOrcamentos(result.data)
        setTotal(result.data.length)

        // Calcular summary
        const pendentes = result.data.filter(o => o.status === 'pendente').length
        const aprovados = result.data.filter(o => o.status === 'aprovado').length
        const convertidos = result.data.filter(o => o.status === 'convertido').length
        const valorTotal = result.data.reduce((sum, o) => sum + o.valorFinal, 0)

        setSummary({
          total: result.data.length,
          pendentes,
          aprovados,
          convertidos,
          valorTotal,
        })
      } else {
        setError(result.error?.message || 'Erro ao buscar orçamentos')
      }
    } catch (err) {
      console.error('[useOrcamentos] Erro:', err)
      setError('Erro ao buscar orçamentos')
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, statusFilter, pacienteId])

  const getOrcamentoById = useCallback(async (id: string): Promise<Orcamento | null> => {
    if (!clinicaId) return null

    try {
      const result = await orcamentoService.getById(id, clinicaId)

      if (result.data) {
        return result.data
      }
      return null
    } catch (err) {
      console.error('[useOrcamentos] Erro ao buscar orçamento:', err)
      return null
    }
  }, [clinicaId])

  const createOrcamento = useCallback(async (
    data: Omit<CreateOrcamentoInput, 'clinica_id'>
  ): Promise<Orcamento | null> => {
    if (!clinicaId) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await orcamentoService.create({
        ...data,
        clinica_id: clinicaId,
      })

      if (result.data) {
        toast.success('Orçamento criado com sucesso!')
        await fetchOrcamentos()
        return result.data
      }

      toast.error(result.error?.message || 'Erro ao criar orçamento')
      return null
    } catch (err) {
      console.error('[useOrcamentos] Erro ao criar:', err)
      toast.error('Erro ao criar orçamento')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, fetchOrcamentos])

  const updateOrcamento = useCallback(async (
    id: string,
    data: UpdateOrcamentoInput
  ): Promise<Orcamento | null> => {
    if (!clinicaId) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await orcamentoService.update(id, clinicaId, data)

      if (result.data) {
        toast.success('Orçamento atualizado com sucesso!')
        await fetchOrcamentos()
        return result.data
      }

      toast.error(result.error?.message || 'Erro ao atualizar orçamento')
      return null
    } catch (err) {
      console.error('[useOrcamentos] Erro ao atualizar:', err)
      toast.error('Erro ao atualizar orçamento')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, fetchOrcamentos])

  const deleteOrcamento = useCallback(async (id: string): Promise<boolean> => {
    if (!clinicaId) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)

    try {
      const result = await orcamentoService.delete(id, clinicaId)

      if (result.data) {
        toast.success('Orçamento removido com sucesso!')
        await fetchOrcamentos()
        return true
      }

      toast.error(result.error?.message || 'Erro ao remover orçamento')
      return false
    } catch (err) {
      console.error('[useOrcamentos] Erro ao remover:', err)
      toast.error('Erro ao remover orçamento')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, fetchOrcamentos])

  const aprovarOrcamento = useCallback(async (id: string): Promise<Orcamento | null> => {
    if (!clinicaId) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await orcamentoService.aprovar(id, clinicaId)

      if (result.data) {
        toast.success('Orçamento aprovado com sucesso!')
        await fetchOrcamentos()
        return result.data
      }

      toast.error(result.error?.message || 'Erro ao aprovar orçamento')
      return null
    } catch (err) {
      console.error('[useOrcamentos] Erro ao aprovar:', err)
      toast.error('Erro ao aprovar orçamento')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, fetchOrcamentos])

  const converterParaAgendamento = useCallback(async (
    id: string,
    data: Omit<ConverterAgendamentoInput, 'clinica_id'>
  ): Promise<{ orcamento: Orcamento; agendamentoId: string } | null> => {
    if (!clinicaId) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await orcamentoService.converterParaAgendamento(id, {
        ...data,
        clinica_id: clinicaId,
      })

      if (result.data) {
        toast.success('Orçamento convertido em agendamento!')
        await fetchOrcamentos()
        return result.data
      }

      toast.error(result.error?.message || 'Erro ao converter orçamento')
      return null
    } catch (err) {
      console.error('[useOrcamentos] Erro ao converter:', err)
      toast.error('Erro ao converter orçamento')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, fetchOrcamentos])

  const refresh = useCallback(async () => {
    await fetchOrcamentos()
  }, [fetchOrcamentos])

  // Auto-fetch inicial
  useEffect(() => {
    if (autoFetch && clinicaId) {
      fetchOrcamentos()
    }
  }, [autoFetch, clinicaId, fetchOrcamentos])

  return {
    orcamentos,
    isLoading,
    error,
    total,
    summary,
    fetchOrcamentos,
    getOrcamentoById,
    createOrcamento,
    updateOrcamento,
    deleteOrcamento,
    aprovarOrcamento,
    converterParaAgendamento,
    setStatusFilter,
    refresh,
  }
}
