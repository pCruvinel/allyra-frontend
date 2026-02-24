/**
 * Hook para gerenciamento de logs de auditoria
 * Integrado com API via apiService
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import {
  type AuditLogFormatted,
  type AuditActionDB,
  type AuditFilters,
  auditActionLabels,
} from '@/services/audit.service'
import type { QueryOptions } from '@/services/types'
import { useAuth } from '@/contexts/AuthContext'
import type { PerfilTipo } from '@/config/permissions'

// Perfis com acesso global (todas as clínicas)
const GLOBAL_ACCESS_PROFILES: PerfilTipo[] = ['admin_master', 'desenvolvedor']

// Interface do banco (para compatibilidade)
interface AuditLogDB {
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
  usuario?: {
    id: string
    nome_completo: string
    email: string
  } | null
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
}

// Parser de user agent simples
function parseUserAgent(userAgent: string | null): { browser: string | null; device: string | null } {
  if (!userAgent) return { browser: null, device: null }

  let browser = 'Desconhecido'
  let device = 'Desconhecido'

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge'
  }

  if (userAgent.includes('Windows')) {
    device = 'Windows'
  } else if (userAgent.includes('Mac OS')) {
    device = 'macOS'
  } else if (userAgent.includes('Linux')) {
    device = 'Linux'
  } else if (userAgent.includes('iPhone')) {
    device = 'iPhone'
  } else if (userAgent.includes('Android')) {
    device = 'Android'
  }

  return { browser, device }
}

// Conversão de log do banco para formato frontend
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

interface UseAuditLogsOptions {
  autoFetch?: boolean
  initialFilters?: AuditFilters
}

interface UseAuditLogsReturn {
  logs: AuditLogFormatted[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    totalLogs: number
    logins: number
    creates: number
    updates: number
    deletes: number
    exports: number
  }
  fetchLogs: (options?: QueryOptions & { filters?: AuditFilters }) => Promise<void>
  getLogById: (id: string) => Promise<AuditLogFormatted | null>
  getLogsByUser: (userId: string) => Promise<AuditLogFormatted[]>
  getLogsByTable: (table: string, recordId?: string) => Promise<AuditLogFormatted[]>
  setSearch: (search: string) => void
  setActionFilter: (action: AuditActionDB | '') => void
  setTableFilter: (table: string) => void
  setUserFilter: (userId: string) => void
  setDateRange: (from: string, to: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
  const { autoFetch = true, initialFilters } = options
  const { currentClinica, user } = useAuth()

  // Verifica se usuário tem acesso global (admin_master ou desenvolvedor)
  const hasGlobalAccess = user?.perfil_tipo && GLOBAL_ACCESS_PROFILES.includes(user.perfil_tipo)

  const [logs, setLogs] = useState<AuditLogFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    totalLogs: 0,
    logins: 0,
    creates: 0,
    updates: 0,
    deletes: 0,
    exports: 0,
  })
  const [filters, setFilters] = useState<AuditFilters>(initialFilters || {})

  const fetchLogs = useCallback(async (queryOptions?: QueryOptions & { filters?: AuditFilters }) => {
    // SEGURANÇA: clinica_id obrigatório apenas para usuários sem acesso global
    if (!hasGlobalAccess && !currentClinica?.id) {
      setLogs([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: AuditFilters = {
        ...filters,
        ...queryOptions?.filters,
      }

      // Preparar parâmetros da API
      // Para admin_master/desenvolvedor: não filtra por clínica (vê tudo)
      // Para outros perfis: filtra pela clínica atual
      const apiParams = {
        clinicaId: hasGlobalAccess ? undefined : currentClinica?.id,
        action: combinedFilters.action || undefined,
        table: combinedFilters.table || undefined,
        userId: combinedFilters.userId || undefined,
        dateFrom: combinedFilters.dateFrom || undefined,
        dateTo: combinedFilters.dateTo || undefined,
        page: queryOptions?.pagination?.page,
        limit: queryOptions?.pagination?.limit,
      }

      const [logsResult, summaryResult] = await Promise.all([
        apiService.getAuditLogs(apiParams),
        apiService.getAuditLogsSummary(hasGlobalAccess ? undefined : currentClinica?.id),
      ])

      if (logsResult.error) {
        setError(logsResult.error)
        toast.error(logsResult.error)
      } else {
        let result = (logsResult.data || []).map(formatAuditLog)

        // Filtro de busca por texto (aplicado no frontend)
        if (combinedFilters.search) {
          const searchLower = combinedFilters.search.toLowerCase()
          result = result.filter(log =>
            (log.userName?.toLowerCase().includes(searchLower) ?? false) ||
            (log.userEmail?.toLowerCase().includes(searchLower) ?? false) ||
            log.actionLabel.toLowerCase().includes(searchLower) ||
            log.tableLabel.toLowerCase().includes(searchLower) ||
            (log.ipAddress?.includes(searchLower) ?? false)
          )
        }

        setLogs(result)
        setTotal(logsResult.count || result.length)
      }

      if (summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar logs de auditoria'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentClinica?.id, hasGlobalAccess])

  const getLogById = useCallback(async (id: string): Promise<AuditLogFormatted | null> => {
    try {
      const result = await apiService.getAuditLogById(id)
      if (result.error) {
        toast.error(result.error)
        return null
      }
      return result.data ? formatAuditLog(result.data) : null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar log'
      toast.error(message)
      return null
    }
  }, [])

  const getLogsByUser = useCallback(async (userId: string): Promise<AuditLogFormatted[]> => {
    if (!hasGlobalAccess && !currentClinica?.id) return []

    try {
      const result = await apiService.getAuditLogs({
        clinicaId: hasGlobalAccess ? undefined : currentClinica?.id,
        userId,
        limit: 50,
      })
      if (result.error) {
        toast.error(result.error)
        return []
      }
      return (result.data || []).map(formatAuditLog)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar logs do usuário'
      toast.error(message)
      return []
    }
  }, [currentClinica?.id, hasGlobalAccess])

  const getLogsByTable = useCallback(async (table: string, recordId?: string): Promise<AuditLogFormatted[]> => {
    if (!hasGlobalAccess && !currentClinica?.id) return []

    try {
      // TODO: Se precisar filtrar por recordId, adicionar suporte no backend
      const result = await apiService.getAuditLogs({
        clinicaId: hasGlobalAccess ? undefined : currentClinica?.id,
        table,
        limit: 100,
      })
      if (result.error) {
        toast.error(result.error)
        return []
      }

      let logs = (result.data || []).map(formatAuditLog)

      // Filtrar por recordId no frontend (temporário até adicionar no backend)
      if (recordId) {
        logs = logs.filter(log => log.recordId === recordId)
      }

      return logs
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar logs da tabela'
      toast.error(message)
      return []
    }
  }, [currentClinica?.id, hasGlobalAccess])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setActionFilter = useCallback((action: AuditActionDB | '') => {
    setFilters(prev => ({ ...prev, action }))
  }, [])

  const setTableFilter = useCallback((table: string) => {
    setFilters(prev => ({ ...prev, table }))
  }, [])

  const setUserFilter = useCallback((userId: string) => {
    setFilters(prev => ({ ...prev, userId }))
  }, [])

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (autoFetch) {
      fetchLogs()
    }
  }, [autoFetch, filters, currentClinica?.id, hasGlobalAccess, fetchLogs])

  return {
    logs,
    isLoading,
    error,
    total,
    summary,
    fetchLogs,
    getLogById,
    getLogsByUser,
    getLogsByTable,
    setSearch,
    setActionFilter,
    setTableFilter,
    setUserFilter,
    setDateRange,
    clearFilters,
    refresh,
  }
}
