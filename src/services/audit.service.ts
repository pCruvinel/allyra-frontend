/**
 * Serviço de Auditoria
 * Busca logs de auditoria do Supabase
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { success, error, simulateDelay } from './base.service'
import type { ServiceResponse, QueryOptions } from './types'

// Tipos de ação de auditoria
export type AuditActionDB =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'acesso_prontuario'
  | 'assinatura_digital'
  | 'exportacao_dados'

// Interface do banco
export interface AuditLogDB {
  id: string
  clinica_id: string | null
  usuario_id: string | null
  acao: AuditActionDB
  tabela: string
  registro_id: string | null
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Joins
  usuario?: {
    id: string
    nome_completo: string
    email: string
  } | null
}

// Interface formatada para frontend
export interface AuditLogFormatted {
  id: string
  clinicaId: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  action: AuditActionDB
  actionLabel: string
  table: string
  tableLabel: string
  recordId: string | null
  previousData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  browser: string | null
  device: string | null
  timestamp: string
  timestampFormatted: string
}

// Labels para ações
export const auditActionLabels: Record<AuditActionDB, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  login: 'Login',
  logout: 'Logout',
  acesso_prontuario: 'Acesso a Prontuário',
  assinatura_digital: 'Assinatura Digital',
  exportacao_dados: 'Exportação de Dados',
}

// Labels para tabelas
const tableLabels: Record<string, string> = {
  usuarios: 'Usuários',
  pacientes: 'Pacientes',
  agendamentos: 'Agendamentos',
  faturamentos: 'Faturamentos',
  prontuarios: 'Prontuários',
  convenios: 'Convênios',
  profissionais: 'Profissionais',
  servicos: 'Serviços',
  clinicas: 'Clínicas',
  repasses: 'Repasses',
  contas_receber: 'Contas a Receber',
  notas_fiscais: 'Notas Fiscais',
}

// Cores para ações
export const auditActionColors: Record<AuditActionDB, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  acesso_prontuario: 'bg-yellow-100 text-yellow-800',
  assinatura_digital: 'bg-cyan-100 text-cyan-800',
  exportacao_dados: 'bg-orange-100 text-orange-800',
}

// Filtros de auditoria
export interface AuditFilters {
  search?: string
  action?: AuditActionDB | ''
  table?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  clinicaId?: string
  [key: string]: unknown
}

// Parser de user agent simples
function parseUserAgent(userAgent: string | null): { browser: string | null; device: string | null } {
  if (!userAgent) return { browser: null, device: null }

  let browser = 'Desconhecido'
  let device = 'Desconhecido'

  // Detectar navegador
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/)
    browser = match ? `Chrome ${match[1]}` : 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/)
    browser = match ? `Firefox ${match[1]}` : 'Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/)
    browser = match ? `Safari ${match[1]}` : 'Safari'
  } else if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/)
    browser = match ? `Edge ${match[1]}` : 'Edge'
  }

  // Detectar dispositivo
  if (userAgent.includes('Windows')) {
    device = userAgent.includes('Windows NT 10') ? 'Windows 10/11' : 'Windows'
  } else if (userAgent.includes('Mac OS')) {
    device = 'macOS'
  } else if (userAgent.includes('Linux')) {
    device = 'Linux'
  } else if (userAgent.includes('iPhone')) {
    device = 'iPhone'
  } else if (userAgent.includes('iPad')) {
    device = 'iPad'
  } else if (userAgent.includes('Android')) {
    device = 'Android'
  }

  return { browser, device }
}

// Conversão
function formatAuditLog(log: AuditLogDB): AuditLogFormatted {
  const timestamp = new Date(log.created_at)
  const { browser, device } = parseUserAgent(log.user_agent)

  return {
    id: log.id,
    clinicaId: log.clinica_id,
    userId: log.usuario_id,
    userName: log.usuario?.nome_completo || null,
    userEmail: log.usuario?.email || null,
    action: log.acao,
    actionLabel: auditActionLabels[log.acao] || log.acao,
    table: log.tabela,
    tableLabel: tableLabels[log.tabela] || log.tabela,
    recordId: log.registro_id,
    previousData: log.dados_anteriores,
    newData: log.dados_novos,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    browser,
    device,
    timestamp: log.created_at,
    timestampFormatted: timestamp.toLocaleString('pt-BR'),
  }
}

class AuditService {
  async getLogs(options?: QueryOptions & { filters?: AuditFilters }): Promise<ServiceResponse<AuditLogFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuario:usuarios(id, nome_completo, email)
        `)
        .order('created_at', { ascending: false })

      if (options?.filters) {
        const { action, table, userId, dateFrom, dateTo, clinicaId } = options.filters

        if (clinicaId) {
          query = query.eq('clinica_id', clinicaId)
        }

        if (action) {
          query = query.eq('acao', action)
        }

        if (table) {
          query = query.eq('tabela', table)
        }

        if (userId) {
          query = query.eq('usuario_id', userId)
        }

        if (dateFrom) {
          query = query.gte('created_at', `${dateFrom}T00:00:00`)
        }

        if (dateTo) {
          query = query.lte('created_at', `${dateTo}T23:59:59`)
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

      let result = (data as AuditLogDB[]).map(formatAuditLog)

      // Filtro de busca por texto
      if (options?.filters?.search) {
        const searchLower = options.filters.search.toLowerCase()
        result = result.filter(log =>
          (log.userName?.toLowerCase().includes(searchLower) ?? false) ||
          (log.userEmail?.toLowerCase().includes(searchLower) ?? false) ||
          log.actionLabel.toLowerCase().includes(searchLower) ||
          log.tableLabel.toLowerCase().includes(searchLower) ||
          (log.ipAddress?.includes(searchLower) ?? false)
        )
      }

      return success(result, count ?? result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar logs de auditoria', 'UNKNOWN_ERROR')
    }
  }

  async getLogById(id: string): Promise<ServiceResponse<AuditLogFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuario:usuarios(id, nome_completo, email)
        `)
        .eq('id', id)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatAuditLog(data as AuditLogDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar log', 'UNKNOWN_ERROR')
    }
  }

  async getLogsByUser(userId: string, limit = 50): Promise<ServiceResponse<AuditLogFormatted[]>> {
    return this.getLogs({
      filters: { userId },
      pagination: { limit },
    })
  }

  async getLogsByTable(table: string, recordId?: string): Promise<ServiceResponse<AuditLogFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuario:usuarios(id, nome_completo, email)
        `)
        .eq('tabela', table)
        .order('created_at', { ascending: false })
        .limit(100)

      if (recordId) {
        query = query.eq('registro_id', recordId)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success((data as AuditLogDB[]).map(formatAuditLog))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar logs', 'UNKNOWN_ERROR')
    }
  }

  async getSummary(clinicaId?: string): Promise<ServiceResponse<{
    totalLogs: number
    logins: number
    creates: number
    updates: number
    deletes: number
    exports: number
  }>> {
    const result = await this.getLogs({
      filters: { clinicaId },
      pagination: { limit: 1000 },
    })

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const logs = result.data || []
    const summary = {
      totalLogs: logs.length,
      logins: logs.filter(l => l.action === 'login').length,
      creates: logs.filter(l => l.action === 'create').length,
      updates: logs.filter(l => l.action === 'update').length,
      deletes: logs.filter(l => l.action === 'delete').length,
      exports: logs.filter(l => l.action === 'exportacao_dados').length,
    }

    return success(summary)
  }
}

// Singleton
export const auditService = new AuditService()
