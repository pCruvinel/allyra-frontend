/**
 * Service para geração de relatórios
 */

import { apiService } from './api.service'
import type { GerarRelatorioRequest, RelatorioResponse } from '@/types/relatorio'

class RelatorioService {
  /**
   * Gera um relatório e retorna a URL para download
   */
  async gerarRelatorio(
    request: GerarRelatorioRequest,
    clinicaId: string
  ): Promise<{ url: string; filename: string }> {
    const response = await apiService.post<{ url: string; filename: string }>(
      `/api/relatorios/gerar?clinica_id=${clinicaId}`,
      request
    )
    return response
  }

  /**
   * Busca dados do relatório para preview (sem gerar arquivo)
   */
  async getPreviewData(
    request: GerarRelatorioRequest,
    clinicaId: string
  ): Promise<RelatorioResponse> {
    const response = await apiService.post<RelatorioResponse>(
      `/api/relatorios/preview?clinica_id=${clinicaId}`,
      request
    )
    return response
  }

  /**
   * Faz download direto do relatório (para uso com blob)
   */
  async downloadRelatorio(
    request: GerarRelatorioRequest,
    clinicaId: string
  ): Promise<Blob> {
    const token = apiService.getToken()
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/relatorios/download?clinica_id=${clinicaId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      throw new Error('Erro ao gerar relatório')
    }

    return response.blob()
  }

  /**
   * Helper para fazer download do blob como arquivo
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const relatorioService = new RelatorioService()
