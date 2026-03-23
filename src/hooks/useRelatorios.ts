/**
 * Hook para geracao de relatorios
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { relatorioService } from '@/services/relatorio.service'
import type { TipoRelatorio, FormatoExportacao, FiltrosRelatorio } from '@/types/relatorio'

interface UseRelatoriosOptions {
  onSuccess?: (filename: string) => void
  onError?: (error: Error) => void
}

export interface PreviewData {
  dados: Record<string, unknown>[]
  totais?: Record<string, number>
  colunas: { key: string; label: string }[]
  geradoEm: string
}

export function useRelatorios(options: UseRelatoriosOptions = {}) {
  const { currentClinica } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const gerar = useCallback(
    async (
      tipo: TipoRelatorio,
      formato: FormatoExportacao,
      filtros: Omit<FiltrosRelatorio, 'tipo'>
    ) => {
      if (!currentClinica?.id) {
        toast.error('Selecione uma clinica para gerar o relatorio')
        return
      }

      if (!filtros.dateFrom || !filtros.dateTo) {
        toast.error('Selecione o periodo para gerar o relatorio')
        return
      }

      setIsGenerating(true)
      setError(null)

      try {
        const blob = await relatorioService.downloadRelatorio(
          { tipo, formato, filtros },
          currentClinica.id
        )

        const extension = formato === 'pdf' ? 'pdf' : 'xlsx'
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `relatorio-${tipo}-${timestamp}.${extension}`

        relatorioService.downloadBlob(blob, filename)

        toast.success('Relatorio gerado com sucesso!')
        options.onSuccess?.(filename)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatorio'
        setError(errorMessage)
        toast.error(errorMessage)
        options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      } finally {
        setIsGenerating(false)
      }
    },
    [currentClinica?.id, options]
  )

  const gerarPdf = useCallback(
    (tipo: TipoRelatorio, filtros: Omit<FiltrosRelatorio, 'tipo'>) => {
      return gerar(tipo, 'pdf', filtros)
    },
    [gerar]
  )

  const gerarExcel = useCallback(
    (tipo: TipoRelatorio, filtros: Omit<FiltrosRelatorio, 'tipo'>) => {
      return gerar(tipo, 'excel', filtros)
    },
    [gerar]
  )

  const getPreview = useCallback(
    async (tipo: TipoRelatorio, filtros: Omit<FiltrosRelatorio, 'tipo'>) => {
      if (!currentClinica?.id) {
        toast.error('Selecione uma clinica')
        return null
      }

      if (!filtros.dateFrom || !filtros.dateTo) {
        toast.error('Selecione o periodo')
        return null
      }

      setIsLoadingPreview(true)
      setError(null)

      try {
        const response = await relatorioService.getPreviewData(
          { tipo, formato: 'pdf', filtros },
          currentClinica.id
        )

        const colunas = response.colunas && response.colunas.length > 0
          ? response.colunas
          : getColunasRelatorio(tipo)

        const data: PreviewData = {
          dados: response.dados,
          totais: response.totais,
          colunas,
          geradoEm: response.geradoEm,
        }

        setPreviewData(data)
        return data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar preview'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      } finally {
        setIsLoadingPreview(false)
      }
    },
    [currentClinica?.id]
  )

  const clearPreview = useCallback(() => {
    setPreviewData(null)
  }, [])

  return {
    gerar,
    gerarPdf,
    gerarExcel,
    getPreview,
    clearPreview,
    previewData,
    isGenerating,
    isLoadingPreview,
    error,
  }
}

function getColunasRelatorio(tipo: TipoRelatorio): { key: string; label: string }[] {
  switch (tipo) {
    case 'agenda':
      return [
        { key: 'data', label: 'Data' },
        { key: 'hora', label: 'Hora' },
        { key: 'paciente', label: 'Paciente' },
        { key: 'profissional', label: 'Profissional' },
        { key: 'servico', label: 'Servico' },
        { key: 'status', label: 'Status' },
      ]
    case 'escalas':
      return [
        { key: 'profissional', label: 'Profissional' },
        { key: 'horas_alocadas', label: 'Horas alocadas' },
        { key: 'horas_atendidas', label: 'Horas atendidas' },
        { key: 'utilizacao', label: 'Utilizacao (%)' },
      ]
    case 'financeiro':
      return [
        { key: 'data', label: 'Data' },
        { key: 'descricao', label: 'Descricao' },
        { key: 'paciente', label: 'Paciente' },
        { key: 'valor', label: 'Valor' },
        { key: 'status', label: 'Status' },
      ]
    case 'comissao':
      return [
        { key: 'profissional', label: 'Profissional' },
        { key: 'atendimentos', label: 'Atendimentos' },
        { key: 'valor_bruto', label: 'Valor Bruto' },
        { key: 'comissao', label: 'Comissao' },
        { key: 'valor_liquido', label: 'Valor Liquido' },
      ]
    case 'paciente':
      return [
        { key: 'nome', label: 'Nome' },
        { key: 'cpf', label: 'CPF' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'email', label: 'E-mail' },
        { key: 'status', label: 'Status' },
      ]
    default:
      return [{ key: 'mensagem', label: 'Mensagem' }]
  }
}
