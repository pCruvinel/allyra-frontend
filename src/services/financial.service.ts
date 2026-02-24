/**
 * Serviço Financeiro
 * Busca dados de contas a receber, repasses e notas fiscais do Supabase
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { success, error, simulateDelay } from './base.service'
import type { ServiceResponse, QueryOptions } from './types'

// =====================================================
// CONTAS A RECEBER
// =====================================================

// Status de conta a receber
export type ContaReceberStatusDB = 'aberto' | 'vencido' | 'pago' | 'cancelado' | 'acordo'

// Interface do banco
export interface ContaReceberDB {
  id: string
  clinica_id: string
  faturamento_id: string
  paciente_id: string | null
  convenio_id: string | null
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  valor_pago: number | null
  forma_pagamento: string | null
  status: ContaReceberStatusDB
  boleto_url: string | null
  pix_codigo: string | null
  observacoes: string | null
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
  faturamento?: {
    id: string
    numero_fatura: string | null
  }
}

// Interface formatada para frontend
export interface ContaReceberFormatted {
  id: string
  faturamentoId: string
  loteNumber: string | null
  patientId: string | null
  patientName: string | null
  insuranceId: string | null
  insuranceName: string | null
  value: number
  dueDate: string
  dueDateFormatted: string
  paymentDate: string | null
  paidValue: number | null
  paymentMethod: string | null
  status: ContaReceberStatusDB
  boletoUrl: string | null
  pixCode: string | null
  notes: string | null
  isOverdue: boolean
}

export const contaReceberStatusLabels: Record<ContaReceberStatusDB, string> = {
  aberto: 'Aberto',
  vencido: 'Vencido',
  pago: 'Pago',
  cancelado: 'Cancelado',
  acordo: 'Em Acordo',
}

export const contaReceberStatusColors: Record<ContaReceberStatusDB, string> = {
  aberto: 'bg-blue-100 text-blue-800',
  vencido: 'bg-red-100 text-red-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
  acordo: 'bg-yellow-100 text-yellow-800',
}

// =====================================================
// REPASSES
// =====================================================

// Status de repasse
export type RepasseStatusDB = 'gerado' | 'aprovado' | 'pago' | 'cancelado'

// Interface do banco
export interface RepasseDB {
  id: string
  clinica_id: string
  profissional_id: string
  periodo_inicio: string
  periodo_fim: string
  valor_total: number
  quantidade_atendimentos: number
  status: RepasseStatusDB
  data_pagamento: string | null
  nota_fiscal_url: string | null
  observacoes: string | null
  gerado_por_id: string
  pago_por_id: string | null
  created_at: string
  // Joins
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
    especialidades?: string[] | null
  }
}

// Interface formatada para frontend
export interface RepasseFormatted {
  id: string
  professionalId: string
  professionalName: string
  specialty: string
  periodStart: string
  periodEnd: string
  periodFormatted: string
  totalValue: number
  appointmentsCount: number
  status: RepasseStatusDB
  paymentDate: string | null
  invoiceUrl: string | null
  notes: string | null
}

export const repasseStatusLabels: Record<RepasseStatusDB, string> = {
  gerado: 'Gerado',
  aprovado: 'Aprovado',
  pago: 'Pago',
  cancelado: 'Cancelado',
}

export const repasseStatusColors: Record<RepasseStatusDB, string> = {
  gerado: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
}

// =====================================================
// NOTAS FISCAIS
// =====================================================

// Interface do banco
export interface NotaFiscalDB {
  id: string
  clinica_id: string
  faturamento_id: string | null
  numero: string
  serie: string
  data_emissao: string
  valor_total: number
  tipo: string
  status: string
  xml_url: string | null
  pdf_url: string | null
  chave_acesso: string | null
  paciente_id: string | null
  convenio_id: string | null
  is_test_data: boolean
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
}

// Interface formatada para frontend
export interface NotaFiscalFormatted {
  id: string
  number: string
  series: string
  issueDate: string
  issueDateFormatted: string
  totalValue: number
  type: string
  status: string
  xmlUrl: string | null
  pdfUrl: string | null
  accessKey: string | null
  patientId: string | null
  patientName: string | null
  insuranceId: string | null
  insuranceName: string | null
}

// =====================================================
// FILTROS
// =====================================================

export interface FinancialFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  clinicaId?: string
  patientId?: string
  professionalId?: string
  [key: string]: unknown
}

// =====================================================
// CONVERSÕES
// =====================================================

function formatContaReceber(conta: ContaReceberDB): ContaReceberFormatted {
  const dueDate = new Date(conta.data_vencimento)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return {
    id: conta.id,
    faturamentoId: conta.faturamento_id,
    loteNumber: conta.faturamento?.numero_fatura || null,
    patientId: conta.paciente_id,
    patientName: conta.paciente?.nome_completo || null,
    insuranceId: conta.convenio_id,
    insuranceName: conta.convenio?.nome || null,
    value: Number(conta.valor),
    dueDate: conta.data_vencimento,
    dueDateFormatted: dueDate.toLocaleDateString('pt-BR'),
    paymentDate: conta.data_pagamento,
    paidValue: conta.valor_pago ? Number(conta.valor_pago) : null,
    paymentMethod: conta.forma_pagamento,
    status: conta.status,
    boletoUrl: conta.boleto_url,
    pixCode: conta.pix_codigo,
    notes: conta.observacoes,
    isOverdue: conta.status === 'aberto' && dueDate < today,
  }
}

function formatRepasse(repasse: RepasseDB): RepasseFormatted {
  const startDate = new Date(repasse.periodo_inicio)
  const endDate = new Date(repasse.periodo_fim)

  return {
    id: repasse.id,
    professionalId: repasse.profissional_id,
    professionalName: repasse.profissional?.usuario?.nome_completo || 'Profissional não encontrado',
    specialty: repasse.profissional?.especialidades?.[0] || '',
    periodStart: repasse.periodo_inicio,
    periodEnd: repasse.periodo_fim,
    periodFormatted: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
    totalValue: Number(repasse.valor_total),
    appointmentsCount: repasse.quantidade_atendimentos,
    status: repasse.status,
    paymentDate: repasse.data_pagamento,
    invoiceUrl: repasse.nota_fiscal_url,
    notes: repasse.observacoes,
  }
}

function formatNotaFiscal(nf: NotaFiscalDB): NotaFiscalFormatted {
  const issueDate = new Date(nf.data_emissao)

  return {
    id: nf.id,
    number: nf.numero,
    series: nf.serie,
    issueDate: nf.data_emissao,
    issueDateFormatted: issueDate.toLocaleDateString('pt-BR'),
    totalValue: Number(nf.valor_total),
    type: nf.tipo,
    status: nf.status,
    xmlUrl: nf.xml_url,
    pdfUrl: nf.pdf_url,
    accessKey: nf.chave_acesso,
    patientId: nf.paciente_id,
    patientName: nf.paciente?.nome_completo || null,
    insuranceId: nf.convenio_id,
    insuranceName: nf.convenio?.nome || null,
  }
}

// =====================================================
// SERVIÇO
// =====================================================

class FinancialService {
  // =====================================================
  // CONTAS A RECEBER
  // =====================================================

  async getContasReceber(options?: QueryOptions & { filters?: FinancialFilters }): Promise<ServiceResponse<ContaReceberFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('contas_receber')
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          convenio:convenios(id, nome),
          faturamento:faturamentos(id, numero_fatura)
        `)
        .order('data_vencimento', { ascending: true })

      if (options?.filters) {
        const { status, dateFrom, dateTo, clinicaId, patientId } = options.filters

        if (clinicaId) {
          query = query.eq('clinica_id', clinicaId)
        }

        if (status) {
          query = query.eq('status', status)
        }

        if (patientId) {
          query = query.eq('paciente_id', patientId)
        }

        if (dateFrom) {
          query = query.gte('data_vencimento', dateFrom)
        }

        if (dateTo) {
          query = query.lte('data_vencimento', dateTo)
        }
      }

      if (options?.pagination) {
        const { page = 1, limit = 10, offset } = options.pagination
        const start = offset ?? (page - 1) * limit
        query = query.range(start, start + limit - 1)
      }

      const { data, error: dbError, count } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      let result = (data as ContaReceberDB[]).map(formatContaReceber)

      // Filtro de busca por texto
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = result.filter(c =>
          (c.patientName?.toLowerCase().includes(searchLower) ?? false) ||
          (c.insuranceName?.toLowerCase().includes(searchLower) ?? false) ||
          (c.loteNumber?.toLowerCase().includes(searchLower) ?? false)
        )
      }

      return success(result, count ?? result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar contas a receber', 'UNKNOWN_ERROR')
    }
  }

  async getContasReceberSummary(clinicaId?: string): Promise<ServiceResponse<{
    total: number
    received: number
    toReceive: number
    overdue: number
  }>> {
    const result = await this.getContasReceber({ filters: { clinicaId } })

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const contas = result.data || []
    const summary = {
      total: contas.reduce((sum, c) => sum + c.value, 0),
      received: contas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.paidValue || c.value), 0),
      toReceive: contas.filter(c => c.status === 'aberto' || c.status === 'vencido').reduce((sum, c) => sum + c.value, 0),
      overdue: contas.filter(c => c.isOverdue).reduce((sum, c) => sum + c.value, 0),
    }

    return success(summary)
  }

  async getContaReceberById(id: string): Promise<ServiceResponse<ContaReceberFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('contas_receber')
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          convenio:convenios(id, nome),
          faturamento:faturamentos(id, numero_fatura)
        `)
        .eq('id', id)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatContaReceber(data as ContaReceberDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar conta a receber', 'UNKNOWN_ERROR')
    }
  }

  async registerPayment(id: string, data: {
    valor_pago: number
    forma_pagamento: string
    data_pagamento?: string
  }): Promise<ServiceResponse<ContaReceberFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data: result, error: dbError } = await supabase
        .from('contas_receber')
        .update({
          valor_pago: data.valor_pago,
          forma_pagamento: data.forma_pagamento,
          data_pagamento: data.data_pagamento || new Date().toISOString().split('T')[0],
          status: 'pago',
        })
        .eq('id', id)
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          convenio:convenios(id, nome),
          faturamento:faturamentos(id, numero_fatura)
        `)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatContaReceber(result as ContaReceberDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao registrar pagamento', 'UNKNOWN_ERROR')
    }
  }

  // =====================================================
  // REPASSES
  // =====================================================

  async getRepasses(options?: QueryOptions & { filters?: FinancialFilters }): Promise<ServiceResponse<RepasseFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('repasses')
        .select(`
          *,
          profissional:profissionais(id, especialidades, usuario:usuarios(nome_completo))
        `)
        .order('created_at', { ascending: false })

      if (options?.filters) {
        const { status, dateFrom, dateTo, clinicaId, professionalId } = options.filters

        if (clinicaId) {
          query = query.eq('clinica_id', clinicaId)
        }

        if (status) {
          query = query.eq('status', status)
        }

        if (professionalId) {
          query = query.eq('profissional_id', professionalId)
        }

        if (dateFrom) {
          query = query.gte('periodo_inicio', dateFrom)
        }

        if (dateTo) {
          query = query.lte('periodo_fim', dateTo)
        }
      }

      if (options?.pagination) {
        const { page = 1, limit = 10, offset } = options.pagination
        const start = offset ?? (page - 1) * limit
        query = query.range(start, start + limit - 1)
      }

      const { data, error: dbError, count } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      let result = (data as RepasseDB[]).map(formatRepasse)

      // Filtro de busca por texto
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = result.filter(r =>
          r.professionalName.toLowerCase().includes(searchLower) ||
          r.specialty.toLowerCase().includes(searchLower)
        )
      }

      return success(result, count ?? result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar repasses', 'UNKNOWN_ERROR')
    }
  }

  async getRepassesSummary(clinicaId?: string): Promise<ServiceResponse<{
    total: number
    paid: number
    pending: number
    approved: number
  }>> {
    const result = await this.getRepasses({ filters: { clinicaId } })

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const repasses = result.data || []
    const summary = {
      total: repasses.reduce((sum, r) => sum + r.totalValue, 0),
      paid: repasses.filter(r => r.status === 'pago').reduce((sum, r) => sum + r.totalValue, 0),
      pending: repasses.filter(r => r.status === 'gerado').reduce((sum, r) => sum + r.totalValue, 0),
      approved: repasses.filter(r => r.status === 'aprovado').reduce((sum, r) => sum + r.totalValue, 0),
    }

    return success(summary)
  }

  async approveRepasse(id: string): Promise<ServiceResponse<RepasseFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('repasses')
        .update({ status: 'aprovado' })
        .eq('id', id)
        .select(`
          *,
          profissional:profissionais(id, especialidades, usuario:usuarios(nome_completo))
        `)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatRepasse(data as RepasseDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao aprovar repasse', 'UNKNOWN_ERROR')
    }
  }

  async payRepasse(id: string, paymentDate?: string): Promise<ServiceResponse<RepasseFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('repasses')
        .update({
          status: 'pago',
          data_pagamento: paymentDate || new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select(`
          *,
          profissional:profissionais(id, especialidades, usuario:usuarios(nome_completo))
        `)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatRepasse(data as RepasseDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao pagar repasse', 'UNKNOWN_ERROR')
    }
  }

  // =====================================================
  // NOTAS FISCAIS
  // =====================================================

  async getNotasFiscais(options?: QueryOptions & { filters?: FinancialFilters }): Promise<ServiceResponse<NotaFiscalFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('notas_fiscais')
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          convenio:convenios(id, nome)
        `)
        .order('data_emissao', { ascending: false })

      if (options?.filters) {
        const { status, dateFrom, dateTo, clinicaId, patientId } = options.filters

        if (clinicaId) {
          query = query.eq('clinica_id', clinicaId)
        }

        if (status) {
          query = query.eq('status', status)
        }

        if (patientId) {
          query = query.eq('paciente_id', patientId)
        }

        if (dateFrom) {
          query = query.gte('data_emissao', dateFrom)
        }

        if (dateTo) {
          query = query.lte('data_emissao', dateTo)
        }
      }

      if (options?.pagination) {
        const { page = 1, limit = 10, offset } = options.pagination
        const start = offset ?? (page - 1) * limit
        query = query.range(start, start + limit - 1)
      }

      const { data, error: dbError, count } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      let result = (data as NotaFiscalDB[]).map(formatNotaFiscal)

      // Filtro de busca por texto
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = result.filter(nf =>
          nf.number.toLowerCase().includes(searchLower) ||
          (nf.patientName?.toLowerCase().includes(searchLower) ?? false) ||
          (nf.insuranceName?.toLowerCase().includes(searchLower) ?? false)
        )
      }

      return success(result, count ?? result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar notas fiscais', 'UNKNOWN_ERROR')
    }
  }

  async getNotasFiscaisSummary(clinicaId?: string): Promise<ServiceResponse<{
    total: number
    issued: number
    cancelled: number
  }>> {
    const result = await this.getNotasFiscais({ filters: { clinicaId } })

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const notas = result.data || []
    const summary = {
      total: notas.reduce((sum, nf) => sum + nf.totalValue, 0),
      issued: notas.filter(nf => nf.status === 'emitida').reduce((sum, nf) => sum + nf.totalValue, 0),
      cancelled: notas.filter(nf => nf.status === 'cancelada').reduce((sum, nf) => sum + nf.totalValue, 0),
    }

    return success(summary)
  }

  // =====================================================
  // DETALHES E ITENS DE REPASSE
  // =====================================================

  async getRepasseDetails(repasseId: string): Promise<ServiceResponse<RepasseDetalheFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('repasses_detalhes')
        .select(`
          *,
          profissional:profissionais(id, usuario:usuarios(nome_completo))
        `)
        .eq('repasse_id', repasseId)
        .order('created_at', { ascending: true })

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      const result: RepasseDetalheFormatted[] = (data || []).map((d: RepasseDetalheDB) => ({
        id: d.id,
        repasseId: d.repasse_id,
        profissionalId: d.profissional_id,
        profissionalName: (d.profissional as unknown as { usuario: { nome_completo: string } })?.usuario?.nome_completo || 'Profissional',
        valor: Number(d.valor),
        quantidadeAtendimentos: d.quantidade_atendimentos,
        status: d.status as 'Total' | 'Parcial' | 'Pendente',
      }))

      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar detalhes do repasse', 'UNKNOWN_ERROR')
    }
  }

  async getRepasseItems(detalheId: string): Promise<ServiceResponse<RepasseItemFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('repasses_itens')
        .select(`
          *,
          paciente:pacientes(id, nome_completo)
        `)
        .eq('repasse_detalhe_id', detalheId)
        .order('data_atendimento', { ascending: false })

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      const result: RepasseItemFormatted[] = (data || []).map((item: RepasseItemDB) => ({
        id: item.id,
        repasseDetalheId: item.repasse_detalhe_id,
        dataAtendimento: item.data_atendimento,
        dataAtendimentoFormatted: new Date(item.data_atendimento).toLocaleDateString('pt-BR'),
        numeroFatura: item.numero_fatura || '-',
        pacienteId: item.paciente_id,
        pacienteName: (item.paciente as unknown as { nome_completo: string })?.nome_completo || 'Paciente',
        servico: item.servico,
        valorRepasse: Number(item.valor_repasse),
        regraAplicada: item.regra_aplicada || '-',
      }))

      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar itens do repasse', 'UNKNOWN_ERROR')
    }
  }
}

// Interfaces adicionais para detalhes e itens
export interface RepasseDetalheDB {
  id: string
  repasse_id: string
  profissional_id: string
  valor: number
  quantidade_atendimentos: number
  status: string
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
  }
}

export interface RepasseDetalheFormatted {
  id: string
  repasseId: string
  profissionalId: string
  profissionalName: string
  valor: number
  quantidadeAtendimentos: number
  status: 'Total' | 'Parcial' | 'Pendente'
}

export interface RepasseItemDB {
  id: string
  repasse_detalhe_id: string
  data_atendimento: string
  numero_fatura: string | null
  paciente_id: string | null
  servico: string
  valor_repasse: number
  regra_aplicada: string | null
  paciente?: {
    id: string
    nome_completo: string
  }
}

export interface RepasseItemFormatted {
  id: string
  repasseDetalheId: string
  dataAtendimento: string
  dataAtendimentoFormatted: string
  numeroFatura: string
  pacienteId: string | null
  pacienteName: string
  servico: string
  valorRepasse: number
  regraAplicada: string
}

// Singleton
export const financialService = new FinancialService()
