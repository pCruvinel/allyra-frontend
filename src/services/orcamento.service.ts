/**
 * Serviço de Orçamentos
 * Busca e gerencia dados de orçamentos via API centralizada
 */

import { apiService } from './api.service'
import { success, error } from './base.service'
import type { ServiceResponse } from './types'
import type {
  Orcamento,
  OrcamentoItem,
  OrcamentoStatus,
  CreateOrcamentoInput,
  UpdateOrcamentoInput,
  ConverterAgendamentoInput,
} from '@/types/orcamento'

// Interface do banco - Orçamento
interface OrcamentoDB {
  id: string
  clinica_id: string
  paciente_id: string
  profissional_id: string
  numero: string
  status: OrcamentoStatus
  valor_total: number
  desconto: number
  valor_final: number
  validade: string | null
  observacoes: string | null
  created_at: string
  updated_at: string | null
  // Joins
  paciente?: {
    id: string
    nome_completo: string
    email?: string
    telefone?: string
  }
  profissional?: {
    id: string
    usuario?: {
      id: string
      nome_completo: string
    }
  }
  itens?: OrcamentoItemDB[]
}

interface OrcamentoItemDB {
  id: string
  orcamento_id: string
  servico_id: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  descricao: string | null
  servico?: {
    id: string
    nome: string
  }
}

// Formatadores
function formatOrcamentoItem(item: OrcamentoItemDB): OrcamentoItem {
  return {
    id: item.id,
    servicoId: item.servico_id,
    servicoNome: item.servico?.nome || 'Serviço',
    quantidade: item.quantidade,
    valorUnitario: item.valor_unitario,
    valorTotal: item.valor_total,
    descricao: item.descricao || undefined,
  }
}

function formatOrcamento(orc: OrcamentoDB): Orcamento {
  return {
    id: orc.id,
    clinicaId: orc.clinica_id,
    pacienteId: orc.paciente_id,
    pacienteNome: orc.paciente?.nome_completo || 'Paciente',
    profissionalId: orc.profissional_id,
    profissionalNome: orc.profissional?.usuario?.nome_completo || 'Profissional',
    numero: orc.numero,
    status: orc.status,
    valorTotal: orc.valor_total,
    desconto: orc.desconto,
    valorFinal: orc.valor_final,
    validade: orc.validade || undefined,
    observacoes: orc.observacoes || undefined,
    itens: orc.itens?.map(formatOrcamentoItem) || [],
    createdAt: orc.created_at,
    updatedAt: orc.updated_at || undefined,
  }
}

class OrcamentoService {
  /**
   * Lista orçamentos de uma clínica
   */
  async list(
    clinicaId: string,
    options?: { status?: OrcamentoStatus; pacienteId?: string }
  ): Promise<ServiceResponse<Orcamento[]>> {
    try {
      const params = new URLSearchParams({ clinica_id: clinicaId })

      if (options?.status) {
        params.append('status', options.status)
      }
      if (options?.pacienteId) {
        params.append('paciente_id', options.pacienteId)
      }

      const response = await apiService.get<{ data: OrcamentoDB[]; count: number }>(
        `/api/orcamentos?${params.toString()}`
      )

      const orcamentos = response.data.map(formatOrcamento)
      return success(orcamentos)
    } catch (err) {
      console.error('[OrcamentoService] Erro ao listar orçamentos:', err)
      return error('Erro ao buscar orçamentos')
    }
  }

  /**
   * Busca um orçamento por ID
   */
  async getById(id: string, clinicaId: string): Promise<ServiceResponse<Orcamento>> {
    try {
      const response = await apiService.get<{ data: OrcamentoDB }>(
        `/api/orcamentos/${id}?clinica_id=${clinicaId}`
      )

      return success(formatOrcamento(response.data))
    } catch (err) {
      console.error('[OrcamentoService] Erro ao buscar orçamento:', err)
      return error('Erro ao buscar orçamento')
    }
  }

  /**
   * Cria um novo orçamento
   */
  async create(data: CreateOrcamentoInput): Promise<ServiceResponse<Orcamento>> {
    try {
      const response = await apiService.post<{ data: OrcamentoDB }>(
        '/api/orcamentos',
        data
      )

      return success(formatOrcamento(response.data))
    } catch (err) {
      console.error('[OrcamentoService] Erro ao criar orçamento:', err)
      return error('Erro ao criar orçamento')
    }
  }

  /**
   * Atualiza um orçamento
   */
  async update(
    id: string,
    clinicaId: string,
    data: UpdateOrcamentoInput
  ): Promise<ServiceResponse<Orcamento>> {
    try {
      const response = await apiService.put<{ data: OrcamentoDB }>(
        `/api/orcamentos/${id}`,
        { clinica_id: clinicaId, ...data }
      )

      return success(formatOrcamento(response.data))
    } catch (err) {
      console.error('[OrcamentoService] Erro ao atualizar orçamento:', err)
      return error('Erro ao atualizar orçamento')
    }
  }

  /**
   * Remove um orçamento
   */
  async delete(id: string, clinicaId: string): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.delete(`/api/orcamentos/${id}?clinica_id=${clinicaId}`)
      return success(true)
    } catch (err) {
      console.error('[OrcamentoService] Erro ao remover orçamento:', err)
      return error('Erro ao remover orçamento')
    }
  }

  /**
   * Aprova um orçamento
   */
  async aprovar(id: string, clinicaId: string): Promise<ServiceResponse<Orcamento>> {
    try {
      const response = await apiService.post<{ data: OrcamentoDB }>(
        `/api/orcamentos/${id}/aprovar`,
        { clinica_id: clinicaId }
      )

      return success(formatOrcamento(response.data))
    } catch (err) {
      console.error('[OrcamentoService] Erro ao aprovar orçamento:', err)
      return error('Erro ao aprovar orçamento')
    }
  }

  /**
   * Converte um orçamento aprovado em agendamento
   */
  async converterParaAgendamento(
    id: string,
    data: ConverterAgendamentoInput
  ): Promise<ServiceResponse<{ orcamento: Orcamento; agendamentoId: string }>> {
    try {
      const response = await apiService.post<{ data: OrcamentoDB; agendamento_id: string }>(
        `/api/orcamentos/${id}/converter-agendamento`,
        data
      )

      return success({
        orcamento: formatOrcamento(response.data),
        agendamentoId: response.agendamento_id,
      })
    } catch (err) {
      console.error('[OrcamentoService] Erro ao converter orçamento:', err)
      return error('Erro ao converter orçamento em agendamento')
    }
  }
}

export const orcamentoService = new OrcamentoService()
