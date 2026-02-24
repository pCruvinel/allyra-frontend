/**
 * Serviço de Clientes (Clínicas)
 * Busca dados de clínicas do Supabase
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { success, error, simulateDelay } from './base.service'
import type { ServiceResponse, QueryOptions } from './types'

// Status da clínica no banco
export type ClientStatusDB = 'ativa' | 'inativa' | 'bloqueada' | 'suspensa'

// Interface do banco - clinicas
export interface ClientDB {
  id: string
  cnpj: string
  nome_fantasia: string
  razao_social: string
  email: string
  telefone: string
  endereco_completo: string | null
  cidade: string | null
  estado: string | null
  status: ClientStatusDB
  plano: string
  modulos_ativos: string[]
  is_test_data: boolean
  created_at: string
  updated_at: string
}

// Interface do banco - métricas
export interface ClientMetricsDB {
  id: string
  clinica_id: string
  usuarios_ativos: number
  usuarios_totais: number
  valor_mensal: number
  armazenamento_usado_gb: number
  armazenamento_total_gb: number
  agendamentos_mes: number
  pacientes_ativos: number
  ultimo_acesso: string | null
  is_test_data: boolean
}

// Interface formatada para frontend
export interface ClientFormatted {
  id: string
  code: string
  fantasyName: string
  companyName: string
  cnpj: string
  email: string
  phone: string
  address: string | null
  city: string | null
  state: string | null
  status: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Suspenso'
  statusDB: ClientStatusDB
  plan: string
  modules: string[]
  createdAt: string
}

export interface ClientMetricsFormatted {
  clientId: string
  activeUsers: number
  totalUsers: number
  monthlyValue: number
  storageUsed: number
  storageTotal: number
  appointmentsMonth: number
  activePatients: number
  lastAccess: string | null
}

// Mapear status do banco para frontend
const statusMap: Record<ClientStatusDB, ClientFormatted['status']> = {
  ativa: 'Ativo',
  inativa: 'Inativo',
  bloqueada: 'Bloqueado',
  suspensa: 'Suspenso',
}

// Mapear status frontend para banco
export const statusMapReverse: Record<ClientFormatted['status'], ClientStatusDB> = {
  Ativo: 'ativa',
  Inativo: 'inativa',
  Bloqueado: 'bloqueada',
  Suspenso: 'suspensa',
}

// Gerar código do cliente baseado no ID
function generateClientCode(id: string): string {
  // Usar os primeiros 4 caracteres do UUID para gerar um código
  const numericPart = parseInt(id.replace(/-/g, '').substring(0, 8), 16) % 10000
  return `CLIN-${numericPart.toString().padStart(3, '0')}`
}

// Conversão
function formatClient(client: ClientDB): ClientFormatted {
  return {
    id: client.id,
    code: generateClientCode(client.id),
    fantasyName: client.nome_fantasia,
    companyName: client.razao_social,
    cnpj: client.cnpj,
    email: client.email,
    phone: client.telefone,
    address: client.endereco_completo,
    city: client.cidade,
    state: client.estado,
    status: statusMap[client.status] || 'Ativo',
    statusDB: client.status,
    plan: client.plano,
    modules: Array.isArray(client.modulos_ativos) ? client.modulos_ativos : [],
    createdAt: client.created_at,
  }
}

function formatMetrics(metrics: ClientMetricsDB): ClientMetricsFormatted {
  return {
    clientId: metrics.clinica_id,
    activeUsers: metrics.usuarios_ativos,
    totalUsers: metrics.usuarios_totais,
    monthlyValue: metrics.valor_mensal,
    storageUsed: metrics.armazenamento_usado_gb,
    storageTotal: metrics.armazenamento_total_gb,
    appointmentsMonth: metrics.agendamentos_mes,
    activePatients: metrics.pacientes_ativos,
    lastAccess: metrics.ultimo_acesso,
  }
}

// Filtros
export interface ClientFilters {
  search?: string
  status?: ClientStatusDB | ''
  plan?: string
  [key: string]: unknown
}

// Input para criar cliente
export interface CreateClientInput {
  cnpj: string
  nome_fantasia: string
  razao_social: string
  email: string
  telefone: string
  endereco_completo?: string
  cidade?: string
  estado?: string
  cep?: string
  bairro?: string
  plano?: string
  modulos_ativos?: string[]
}

// Input para atualizar cliente
export interface UpdateClientInput {
  nome_fantasia?: string
  razao_social?: string
  email?: string
  telefone?: string
  endereco_completo?: string
  cidade?: string
  estado?: string
  cep?: string
  bairro?: string
  plano?: string
  modulos_ativos?: string[]
}

class ClientsService {
  async getAll(options?: QueryOptions & { filters?: ClientFilters }): Promise<ServiceResponse<ClientFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('clinicas')
        .select('*')
        .order('created_at', { ascending: false })

      if (options?.filters) {
        const { status, plan } = options.filters

        if (status) {
          query = query.eq('status', status)
        }

        if (plan) {
          query = query.eq('plano', plan)
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

      let result = (data as ClientDB[]).map(formatClient)

      // Filtro de busca por texto (frontend)
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = result.filter(client =>
          client.fantasyName.toLowerCase().includes(searchLower) ||
          client.companyName.toLowerCase().includes(searchLower) ||
          client.cnpj.includes(searchLower) ||
          client.code.toLowerCase().includes(searchLower)
        )
      }

      return success(result, count ?? result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar clientes', 'UNKNOWN_ERROR')
    }
  }

  async getById(id: string): Promise<ServiceResponse<ClientFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', id)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatClient(data as ClientDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar cliente', 'UNKNOWN_ERROR')
    }
  }

  async getMetrics(clientId: string): Promise<ServiceResponse<ClientMetricsFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('clinicas_metricas')
        .select('*')
        .eq('clinica_id', clientId)
        .single()

      if (dbError) {
        // Se não encontrar métricas, retornar valores padrão
        if (dbError.code === 'PGRST116') {
          return success({
            clientId,
            activeUsers: 0,
            totalUsers: 0,
            monthlyValue: 0,
            storageUsed: 0,
            storageTotal: 10,
            appointmentsMonth: 0,
            activePatients: 0,
            lastAccess: null,
          })
        }
        return error(dbError.message, dbError.code)
      }

      return success(formatMetrics(data as ClientMetricsDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar métricas', 'UNKNOWN_ERROR')
    }
  }

  async getAllWithMetrics(): Promise<ServiceResponse<(ClientFormatted & { metrics: ClientMetricsFormatted })[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      // Buscar clientes
      const { data: clients, error: clientsError } = await supabase
        .from('clinicas')
        .select('*')
        .order('created_at', { ascending: false })

      if (clientsError) {
        return error(clientsError.message, clientsError.code)
      }

      // Buscar métricas
      const { data: metrics, error: metricsError } = await supabase
        .from('clinicas_metricas')
        .select('*')

      if (metricsError && metricsError.code !== 'PGRST116') {
        return error(metricsError.message, metricsError.code)
      }

      const metricsMap = new Map<string, ClientMetricsDB>()
      if (metrics) {
        (metrics as ClientMetricsDB[]).forEach(m => {
          metricsMap.set(m.clinica_id, m)
        })
      }

      const result = (clients as ClientDB[]).map(client => {
        const clientFormatted = formatClient(client)
        const clientMetrics = metricsMap.get(client.id)

        return {
          ...clientFormatted,
          metrics: clientMetrics
            ? formatMetrics(clientMetrics)
            : {
                clientId: client.id,
                activeUsers: 0,
                totalUsers: 0,
                monthlyValue: 0,
                storageUsed: 0,
                storageTotal: 10,
                appointmentsMonth: 0,
                activePatients: 0,
                lastAccess: null,
              },
        }
      })

      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar clientes com métricas', 'UNKNOWN_ERROR')
    }
  }

  async create(input: CreateClientInput): Promise<ServiceResponse<ClientFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('clinicas')
        .insert({
          cnpj: input.cnpj,
          nome_fantasia: input.nome_fantasia,
          razao_social: input.razao_social,
          email: input.email,
          telefone: input.telefone,
          endereco_completo: input.endereco_completo || null,
          cidade: input.cidade || null,
          estado: input.estado || null,
          plano: input.plano || 'Básico',
          modulos_ativos: input.modulos_ativos || [],
          status: 'ativa',
          is_test_data: import.meta.env.VITE_IS_PRODUCTION !== 'true',
        })
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatClient(data as ClientDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar cliente', 'UNKNOWN_ERROR')
    }
  }

  async update(id: string, input: UpdateClientInput): Promise<ServiceResponse<ClientFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('clinicas')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatClient(data as ClientDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar cliente', 'UNKNOWN_ERROR')
    }
  }

  async updateStatus(id: string, status: ClientStatusDB): Promise<ServiceResponse<ClientFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('clinicas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatClient(data as ClientDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar status', 'UNKNOWN_ERROR')
    }
  }

  async getSummary(): Promise<ServiceResponse<{
    total: number
    active: number
    inactive: number
    blocked: number
  }>> {
    const result = await this.getAll()

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const clients = result.data || []
    const summary = {
      total: clients.length,
      active: clients.filter(c => c.status === 'Ativo').length,
      inactive: clients.filter(c => c.status === 'Inativo').length,
      blocked: clients.filter(c => c.status === 'Bloqueado').length,
    }

    return success(summary)
  }
}

// Singleton
export const clientsService = new ClientsService()
