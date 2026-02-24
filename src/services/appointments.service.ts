/**
 * @deprecated Este serviço usa Supabase SDK diretamente.
 * Use `useAppointments()` hook que já utiliza apiService (HTTP).
 * Arquivo mantido apenas para backward compatibility dos tipos exportados.
 * Planeja-se remoção completa na próxima Sprint de cleanup.
 *
 * Serviço de Agendamentos (Legacy)
 * Busca dados reais do Supabase via SDK direto
 */

import { supabase, isSupabaseConfigured, withTestDataFlag } from '@/lib/supabase'
import { success, error, simulateDelay } from './base.service'
import type { ServiceResponse, QueryOptions } from './types'

// Status de agendamento do banco
export type AppointmentStatusDB =
  | 'agendado'
  | 'confirmado'
  | 'aguardando'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | 'falta'
  | 'reagendado'

// Interface do agendamento vindo do banco
export interface AppointmentDB {
  id: string
  clinica_id: string
  paciente_id: string
  profissional_id: string
  servico_id: string
  convenio_id: string | null
  sala_id: string | null
  data_hora_inicio: string
  data_hora_fim: string
  duracao_minutos: number
  status: AppointmentStatusDB
  tipo: string
  valor: number | null
  observacoes: string | null
  confirmado: boolean
  data_confirmacao: string | null
  data_chegada: string | null
  created_at: string
  updated_at: string
  // Joins
  paciente?: {
    id: string
    nome_completo: string
  }
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
    especialidades?: string[] | null
  }
  servico?: {
    id: string
    nome: string
  }
  convenio?: {
    id: string
    nome: string
  } | null
}

// Interface formatada para uso no frontend
export interface AppointmentFormatted {
  id: string
  patientId: string
  patientName: string
  professionalId: string
  professionalName: string
  specialty: string
  serviceId: string
  serviceName: string
  insuranceId: string | null
  insuranceName: string | null
  date: Date
  dateStr: string
  time: string
  duration: number
  status: AppointmentStatusDB
  type: string
  value: number | null
  notes: string | null
  confirmed: boolean
}

// Converte status do banco para label em português
export const appointmentStatusLabels: Record<AppointmentStatusDB, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  falta: 'Falta',
  reagendado: 'Reagendado',
}

// Cores para cada status
export const appointmentStatusColors: Record<AppointmentStatusDB, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  aguardando: 'bg-yellow-100 text-yellow-800',
  em_atendimento: 'bg-purple-100 text-purple-800',
  concluido: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
  falta: 'bg-orange-100 text-orange-800',
  reagendado: 'bg-cyan-100 text-cyan-800',
}

// Input para criar agendamento
export interface CreateAppointmentInput {
  clinica_id: string
  paciente_id: string
  profissional_id: string
  servico_id: string
  convenio_id?: string | null
  sala_id?: string | null
  data_hora_inicio: string
  data_hora_fim: string
  duracao_minutos: number
  tipo?: string
  valor?: number | null
  observacoes?: string | null
  criado_por_id: string
}

// Input para atualizar agendamento
export interface UpdateAppointmentInput {
  paciente_id?: string
  profissional_id?: string
  servico_id?: string
  convenio_id?: string | null
  sala_id?: string | null
  data_hora_inicio?: string
  data_hora_fim?: string
  duracao_minutos?: number
  status?: AppointmentStatusDB
  tipo?: string
  valor?: number | null
  observacoes?: string | null
  confirmado?: boolean
  data_confirmacao?: string | null
  data_chegada?: string | null
}

// Filtros específicos de agendamentos
export interface AppointmentFilters {
  search?: string
  status?: AppointmentStatusDB | ''
  professionalId?: string
  dateFrom?: string
  dateTo?: string
  clinicaId?: string
  [key: string]: unknown
}

// Converte dados do banco para formato do frontend
function formatAppointment(apt: AppointmentDB): AppointmentFormatted {
  const date = new Date(apt.data_hora_inicio)

  return {
    id: apt.id,
    patientId: apt.paciente_id,
    patientName: apt.paciente?.nome_completo || 'Paciente não encontrado',
    professionalId: apt.profissional_id,
    professionalName: apt.profissional?.usuario?.nome_completo || 'Profissional não encontrado',
    specialty: apt.profissional?.especialidades?.[0] || '',
    serviceId: apt.servico_id,
    serviceName: apt.servico?.nome || 'Serviço não encontrado',
    insuranceId: apt.convenio_id,
    insuranceName: apt.convenio?.nome || null,
    date,
    dateStr: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    duration: apt.duracao_minutos,
    status: apt.status,
    type: apt.tipo,
    value: apt.valor,
    notes: apt.observacoes,
    confirmed: apt.confirmado,
  }
}

class AppointmentsService {
  // Busca todos os agendamentos com filtros
  async getAll(options?: QueryOptions & { filters?: AppointmentFilters }): Promise<ServiceResponse<AppointmentFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('agendamentos')
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          profissional:profissionais(id, especialidades, usuario:usuarios(nome_completo)),
          servico:servicos(id, nome),
          convenio:convenios(id, nome)
        `)
        .order('data_hora_inicio', { ascending: true })

      // Aplicar filtros
      if (options?.filters) {
        const { status, professionalId, dateFrom, dateTo, clinicaId } = options.filters

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
          query = query.gte('data_hora_inicio', `${dateFrom}T00:00:00`)
        }

        if (dateTo) {
          query = query.lte('data_hora_inicio', `${dateTo}T23:59:59`)
        }
      }

      // Aplicar paginação
      if (options?.pagination) {
        const { page = 1, limit = 10, offset } = options.pagination
        const start = offset ?? (page - 1) * limit
        query = query.range(start, start + limit - 1)
      }

      const { data, error: dbError, count } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      // Converter para formato do frontend
      const formatted = (data as AppointmentDB[]).map(formatAppointment)

      // Aplicar busca por texto no frontend (nome do paciente)
      let result = formatted
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = formatted.filter(apt =>
          apt.patientName.toLowerCase().includes(searchLower) ||
          apt.professionalName.toLowerCase().includes(searchLower) ||
          apt.serviceName.toLowerCase().includes(searchLower) ||
          (apt.insuranceName?.toLowerCase().includes(searchLower) ?? false)
        )
      }

      return success(result, count ?? result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar agendamentos', 'UNKNOWN_ERROR')
    }
  }

  // Busca agendamentos de hoje
  async getToday(clinicaId?: string): Promise<ServiceResponse<AppointmentFormatted[]>> {
    const today = new Date().toISOString().split('T')[0]
    return this.getAll({
      filters: {
        dateFrom: today,
        dateTo: today,
        clinicaId,
      },
    })
  }

  // Busca agendamentos da semana
  async getWeek(clinicaId?: string): Promise<ServiceResponse<AppointmentFormatted[]>> {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return this.getAll({
      filters: {
        dateFrom: startOfWeek.toISOString().split('T')[0],
        dateTo: endOfWeek.toISOString().split('T')[0],
        clinicaId,
      },
    })
  }

  // Busca agendamentos do mês
  async getMonth(year: number, month: number, clinicaId?: string): Promise<ServiceResponse<AppointmentFormatted[]>> {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)

    return this.getAll({
      filters: {
        dateFrom: startOfMonth.toISOString().split('T')[0],
        dateTo: endOfMonth.toISOString().split('T')[0],
        clinicaId,
      },
    })
  }

  // Busca um agendamento por ID
  async getById(id: string): Promise<ServiceResponse<AppointmentFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          profissional:profissionais(id, especialidades, usuario:usuarios(nome_completo)),
          servico:servicos(id, nome),
          convenio:convenios(id, nome)
        `)
        .eq('id', id)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatAppointment(data as AppointmentDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar agendamento', 'UNKNOWN_ERROR')
    }
  }

  // Cria novo agendamento
  async create(input: CreateAppointmentInput): Promise<ServiceResponse<AppointmentFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const dataWithFlag = withTestDataFlag(input as unknown as Record<string, unknown>)

      const { data, error: dbError } = await supabase
        .from('agendamentos')
        .insert(dataWithFlag)
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          profissional:profissionais(id, especialidades, usuario:usuarios(nome_completo)),
          servico:servicos(id, nome),
          convenio:convenios(id, nome)
        `)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatAppointment(data as AppointmentDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar agendamento', 'UNKNOWN_ERROR')
    }
  }

  // Atualiza agendamento
  // IMPORTANTE: clinicaId é OBRIGATÓRIO para validação multi-tenant e conformidade RLS
  async update(id: string, input: UpdateAppointmentInput, clinicaId: string): Promise<ServiceResponse<AppointmentFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('agendamentos')
        .update(input)
        .eq('id', id)
        .eq('clinica_id', clinicaId)
        .select(`
          *,
          paciente:pacientes(id, nome_completo),
          profissional:profissionais(id, especialidades, usuario:usuarios(nome_completo)),
          servico:servicos(id, nome),
          convenio:convenios(id, nome)
        `)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatAppointment(data as AppointmentDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar agendamento', 'UNKNOWN_ERROR')
    }
  }

  // Altera status do agendamento
  // IMPORTANTE: clinicaId é OBRIGATÓRIO para validação multi-tenant e conformidade RLS
  async changeStatus(id: string, status: AppointmentStatusDB, clinicaId: string): Promise<ServiceResponse<AppointmentFormatted>> {
    const updates: UpdateAppointmentInput = { status }

    // Registra datas específicas baseado no status
    const now = new Date().toISOString()
    if (status === 'confirmado') {
      updates.confirmado = true
      updates.data_confirmacao = now
    } else if (status === 'aguardando') {
      updates.data_chegada = now
    }

    return this.update(id, updates, clinicaId)
  }

  // Confirma agendamento
  async confirm(id: string, clinicaId: string): Promise<ServiceResponse<AppointmentFormatted>> {
    return this.changeStatus(id, 'confirmado', clinicaId)
  }

  // Registra chegada do paciente
  async registerArrival(id: string, clinicaId: string): Promise<ServiceResponse<AppointmentFormatted>> {
    return this.changeStatus(id, 'aguardando', clinicaId)
  }

  // Cancela agendamento
  async cancel(id: string, clinicaId: string): Promise<ServiceResponse<AppointmentFormatted>> {
    return this.changeStatus(id, 'cancelado', clinicaId)
  }

  // Registra falta
  async registerNoShow(id: string, clinicaId: string): Promise<ServiceResponse<AppointmentFormatted>> {
    return this.changeStatus(id, 'falta', clinicaId)
  }

  // Deleta agendamento
  // IMPORTANTE: clinicaId é OBRIGATÓRIO para validação multi-tenant e conformidade RLS
  async delete(id: string, clinicaId: string): Promise<ServiceResponse<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { error: dbError } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id)
        .eq('clinica_id', clinicaId)

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(true)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao deletar agendamento', 'UNKNOWN_ERROR')
    }
  }

  // Busca estatísticas do dia
  async getDayStats(clinicaId?: string, date?: string): Promise<ServiceResponse<{
    total: number
    confirmed: number
    waiting: number
    completed: number
    cancelled: number
    noShow: number
    inProgress: number
  }>> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const result = await this.getAll({
      filters: {
        dateFrom: targetDate,
        dateTo: targetDate,
        clinicaId,
      },
    })

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const appointments = result.data || []
    const stats = {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status === 'confirmado').length,
      waiting: appointments.filter(a => a.status === 'aguardando').length,
      completed: appointments.filter(a => a.status === 'concluido').length,
      cancelled: appointments.filter(a => a.status === 'cancelado').length,
      noShow: appointments.filter(a => a.status === 'falta').length,
      inProgress: appointments.filter(a => a.status === 'em_atendimento').length,
    }

    return success(stats)
  }
}

// Singleton
export const appointmentsService = new AppointmentsService()
