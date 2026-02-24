/**
 * Serviço de Faturamento
 * Busca dados de faturamentos via API centralizada
 */

import { apiService } from './api.service'
import { success, error } from './base.service'
import type { ServiceResponse, QueryOptions } from './types'

// Status de fatura
export type FaturaStatusDB = 'emitida' | 'enviada' | 'paga' | 'cancelada' | 'vencida'

// Interface do banco - Faturamento
export interface FaturamentoDB {
  id: string
  clinica_id: string
  numero_fatura: string
  tipo_fatura: string
  paciente_id: string | null
  convenio_id: string | null
  valor_total: number
  data_emissao: string
  data_vencimento: string | null
  status: FaturaStatusDB
  observacoes: string | null
  emitido_por_id: string
  numero_lote: string | null
  created_at: string
  // Joins
  paciente?: {
    id: string
    nome_completo: string
  } | null
  convenio?: {
    id: string
    nome: string
  } | null
  emitido_por?: {
    id: string
    nome_completo: string
  }
}

// Interface formatada para frontend - Faturamento
export interface FaturamentoFormatted {
  id: string
  invoiceNumber: string
  type: string
  patientId: string | null
  patientName: string | null
  insuranceId: string | null
  insuranceName: string | null
  totalValue: number
  issueDate: string
  issueDateFormatted: string
  dueDate: string | null
  dueDateFormatted: string | null
  status: FaturaStatusDB
  notes: string | null
  batchNumber: string | null
  issuedBy: string
}

export const faturaStatusLabels: Record<FaturaStatusDB, string> = {
  emitida: 'Emitida',
  enviada: 'Enviada',
  paga: 'Paga',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
}

export const faturaStatusColors: Record<FaturaStatusDB, string> = {
  emitida: 'bg-blue-100 text-blue-800',
  enviada: 'bg-yellow-100 text-yellow-800',
  paga: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-800',
  vencida: 'bg-red-100 text-red-800',
}

// Interface do banco - Item de faturamento (pré-faturamento)
export interface FaturamentoItemDB {
  id: string
  faturamento_id: string | null
  agendamento_id: string
  profissional_id: string
  servico_id: string
  valor: number
  observacoes: string | null
  created_at: string
  // Joins do agendamento
  agendamento?: {
    id: string
    data_hora_inicio: string
    paciente?: {
      id: string
      nome_completo: string
    }
    convenio?: {
      id: string
      nome: string
    } | null
  }
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
  }
  servico?: {
    id: string
    nome: string
  }
}

// Interface formatada para frontend - Item de faturamento (pré-faturamento)
export interface PreFaturamentoFormatted {
  id: string
  faturamentoId: string | null
  agendamentoId: string
  patientId: string
  patientName: string
  insuranceId: string | null
  insuranceName: string | null
  professionalId: string
  professionalName: string
  serviceId: string
  serviceName: string
  date: string
  dateFormatted: string
  value: number
  isOpen: boolean
  notes: string | null
}

// Filtros de faturamento
export interface BillingFilters {
  search?: string
  status?: FaturaStatusDB | ''
  dateFrom?: string
  dateTo?: string
  clinicaId?: string
  patientId?: string
  insuranceId?: string
  [key: string]: unknown
}

// Conversões
function formatFaturamento(fat: FaturamentoDB): FaturamentoFormatted {
  const issueDate = new Date(fat.data_emissao)
  const dueDate = fat.data_vencimento ? new Date(fat.data_vencimento) : null

  return {
    id: fat.id,
    invoiceNumber: fat.numero_fatura,
    type: fat.tipo_fatura,
    patientId: fat.paciente_id,
    patientName: fat.paciente?.nome_completo || null,
    insuranceId: fat.convenio_id,
    insuranceName: fat.convenio?.nome || null,
    totalValue: Number(fat.valor_total),
    issueDate: fat.data_emissao,
    issueDateFormatted: issueDate.toLocaleDateString('pt-BR'),
    dueDate: fat.data_vencimento,
    dueDateFormatted: dueDate?.toLocaleDateString('pt-BR') || null,
    status: fat.status,
    notes: fat.observacoes,
    batchNumber: fat.numero_lote,
    issuedBy: fat.emitido_por?.nome_completo || 'Usuário',
  }
}

function formatPreFaturamento(item: FaturamentoItemDB): PreFaturamentoFormatted {
  const date = item.agendamento?.data_hora_inicio
    ? new Date(item.agendamento.data_hora_inicio)
    : new Date()

  return {
    id: item.id,
    faturamentoId: item.faturamento_id,
    agendamentoId: item.agendamento_id,
    patientId: item.agendamento?.paciente?.id || '',
    patientName: item.agendamento?.paciente?.nome_completo || 'Paciente não encontrado',
    insuranceId: item.agendamento?.convenio?.id || null,
    insuranceName: item.agendamento?.convenio?.nome || null,
    professionalId: item.profissional_id,
    professionalName: item.profissional?.usuario?.nome_completo || 'Profissional não encontrado',
    serviceId: item.servico_id,
    serviceName: item.servico?.nome || 'Serviço não encontrado',
    date: date.toISOString().split('T')[0],
    dateFormatted: date.toLocaleDateString('pt-BR'),
    value: Number(item.valor),
    isOpen: item.faturamento_id === null,
    notes: item.observacoes,
  }
}

class BillingService {
  // =====================================================
  // FATURAMENTOS (Faturas Emitidas)
  // =====================================================

  async getFaturamentos(options?: QueryOptions & { filters?: BillingFilters }): Promise<ServiceResponse<FaturamentoFormatted[]>> {
    try {
      const clinicaId = options?.filters?.clinicaId
      if (!clinicaId) {
        return error('ID da clínica é obrigatório', 'MISSING_CLINIC_ID')
      }

      // Montar query params
      const params = new URLSearchParams({ clinica_id: clinicaId })

      if (options?.filters?.status) {
        params.append('status', options.filters.status)
      }
      if (options?.filters?.patientId) {
        params.append('paciente_id', options.filters.patientId)
      }
      if (options?.filters?.insuranceId) {
        params.append('convenio_id', options.filters.insuranceId)
      }

      const response = await apiService.get<{ data: FaturamentoDB[]; count: number }>(
        `/api/invoices?${params.toString()}`
      )

      let result = (response.data || []).map(formatFaturamento)

      // Filtro de busca por texto (frontend)
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = result.filter(f =>
          f.invoiceNumber.toLowerCase().includes(searchLower) ||
          (f.patientName?.toLowerCase().includes(searchLower) ?? false) ||
          (f.insuranceName?.toLowerCase().includes(searchLower) ?? false) ||
          (f.batchNumber?.toLowerCase().includes(searchLower) ?? false)
        )
      }

      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar faturamentos', 'UNKNOWN_ERROR')
    }
  }

  async getFaturamentosSummary(clinicaId?: string): Promise<ServiceResponse<{
    total: number
    issued: number
    paid: number
    pending: number
    cancelled: number
  }>> {
    try {
      if (!clinicaId) {
        return error('ID da clínica é obrigatório', 'MISSING_CLINIC_ID')
      }

      const response = await apiService.get<{ data: { total: number; issued: number; paid: number; pending: number; cancelled: number } }>(
        `/api/invoices/summary?clinica_id=${clinicaId}`
      )

      return success(response.data!)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar resumo de faturamentos', 'UNKNOWN_ERROR')
    }
  }

  async updateFaturaStatus(id: string, status: FaturaStatusDB): Promise<ServiceResponse<FaturamentoFormatted>> {
    try {
      const response = await apiService.put<{ data: FaturamentoDB }>(`/api/invoices/${id}`, { status })

      return success(formatFaturamento(response.data!))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar status', 'UNKNOWN_ERROR')
    }
  }

  // =====================================================
  // PRÉ-FATURAMENTOS (Itens não faturados)
  // =====================================================

  async getPreFaturamentos(options?: QueryOptions & { filters?: BillingFilters }): Promise<ServiceResponse<PreFaturamentoFormatted[]>> {
    try {
      const clinicaId = options?.filters?.clinicaId
      if (!clinicaId) {
        return error('ID da clínica é obrigatório', 'MISSING_CLINIC_ID')
      }

      // Montar query params
      const params = new URLSearchParams({ clinica_id: clinicaId })

      if (options?.filters?.status) {
        params.append('status', options.filters.status)
      }

      const response = await apiService.get<{ data: FaturamentoItemDB[]; count: number }>(
        `/api/pre-billing?${params.toString()}`
      )

      let result = (response.data || []).map(formatPreFaturamento)

      // Filtro de busca por texto (frontend)
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = result.filter(p =>
          p.patientName.toLowerCase().includes(searchLower) ||
          p.professionalName.toLowerCase().includes(searchLower) ||
          p.serviceName.toLowerCase().includes(searchLower) ||
          (p.insuranceName?.toLowerCase().includes(searchLower) ?? false)
        )
      }

      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar pré-faturamentos', 'UNKNOWN_ERROR')
    }
  }

  async getPreFaturamentosSummary(clinicaId?: string): Promise<ServiceResponse<{
    count: number
    totalValue: number
  }>> {
    const result = await this.getPreFaturamentos({ filters: { clinicaId } })

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const items = result.data || []
    const summary = {
      count: items.length,
      totalValue: items.reduce((sum, i) => sum + i.value, 0),
    }

    return success(summary)
  }

  // Criar faturamento a partir de itens selecionados
  async createFaturamento(input: {
    clinica_id: string
    paciente_id?: string
    convenio_id?: string
    tipo_fatura: string
    itemIds: string[]
    emitido_por_id: string
    observacoes?: string
  }): Promise<ServiceResponse<FaturamentoFormatted>> {
    try {
      const response = await apiService.post<{ data: FaturamentoDB }>('/api/invoices/from-items', {
        clinica_id: input.clinica_id,
        tipo_fatura: input.tipo_fatura,
        item_ids: input.itemIds,
        paciente_id: input.paciente_id,
        convenio_id: input.convenio_id,
        observacoes: input.observacoes,
      })

      return success(formatFaturamento(response.data!))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar faturamento', 'UNKNOWN_ERROR')
    }
  }
}

// Singleton
export const billingService = new BillingService()
