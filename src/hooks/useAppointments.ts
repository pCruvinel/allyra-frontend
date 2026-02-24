/**
 * Hook para gerenciamento de agendamentos
 * Encapsula chamadas à API e gerencia estado
 * Suporta multi-tenant via clinica_id do AuthContext
 *
 * MIGRADO: Usa apiService (HTTP) ao invés de Supabase SDK
 * REALTIME: Pode usar dados do DataContext para sincronização automática
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import type {
  AppointmentStatusDB,
  AppointmentFormatted,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentFilters,
} from '@/types/appointments'

// Re-export para backward compatibility
export type { AppointmentStatusDB, AppointmentFormatted, CreateAppointmentInput, UpdateAppointmentInput, AppointmentFilters }

interface UseAppointmentsOptions {
  autoFetch?: boolean
  initialFilters?: AppointmentFilters
  mode?: 'all' | 'today' | 'week' | 'month'
  year?: number
  month?: number
  /** Se true, usa dados do DataContext (sincronizado via Realtime) */
  useRealtime?: boolean
}

interface UseAppointmentsReturn {
  // Estado
  appointments: AppointmentFormatted[]
  isLoading: boolean
  error: string | null
  total: number

  // Ações
  fetchAppointments: () => Promise<void>
  createAppointment: (data: Omit<CreateAppointmentInput, 'clinica_id' | 'criado_por_id'>) => Promise<AppointmentFormatted | null>
  updateAppointment: (id: string, data: UpdateAppointmentInput) => Promise<AppointmentFormatted | null>
  deleteAppointment: (id: string) => Promise<boolean>
  changeStatus: (id: string, status: AppointmentStatusDB) => Promise<boolean>
  confirmAppointment: (id: string) => Promise<boolean>
  registerArrival: (id: string) => Promise<boolean>
  cancelAppointment: (id: string) => Promise<boolean>
  registerNoShow: (id: string) => Promise<boolean>

  // Filtros
  setSearch: (search: string) => void
  setStatusFilter: (status: AppointmentStatusDB | '') => void
  setProfessionalFilter: (professionalId: string) => void
  setDateRange: (from: string, to: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>

  // Estatísticas
  stats: {
    total: number
    confirmed: number
    waiting: number
    completed: number
    cancelled: number
    noShow: number
    inProgress: number
  }
}

const emptyStats = {
  total: 0,
  confirmed: 0,
  waiting: 0,
  completed: 0,
  cancelled: 0,
  noShow: 0,
  inProgress: 0,
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const {
    autoFetch = true,
    initialFilters,
    mode = 'all',
    useRealtime = true,
  } = options

  // Multi-tenant: obtém clínica atual e usuário do contexto de autenticação
  const { currentClinica, user } = useAuth()

  // DataContext para dados sincronizados via Realtime
  const dataContext = useData()

  const [localAppointments, setLocalAppointments] = useState<AppointmentFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localTotal, setLocalTotal] = useState(0)

  // Usa dados do DataContext se useRealtime=true, senão usa estado local
  // Para mode='today', filtra os agendamentos do DataContext
  const appointments = useMemo(() => {
    if (!useRealtime) return localAppointments

    const allAppointments = dataContext.appointments
    if (mode === 'today') {
      // Usa formato local para evitar bug de timezone
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const today = `${year}-${month}-${day}`
      return allAppointments.filter(a => a.date === today)
    }
    return allAppointments
  }, [useRealtime, localAppointments, dataContext.appointments, mode])

  const total = useRealtime ? appointments.length : localTotal

  // Estado dos filtros - mantido para compatibilidade futura
  const [, setFilters] = useState<AppointmentFilters>(initialFilters || {})

  // Estatísticas calculadas dos dados carregados
  const stats = useMemo(() => {
    if (appointments.length === 0) return emptyStats

    return {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status === 'confirmado').length,
      waiting: appointments.filter(a => a.status === 'aguardando').length,
      completed: appointments.filter(a => a.status === 'concluido').length,
      cancelled: appointments.filter(a => a.status === 'cancelado').length,
      noShow: appointments.filter(a => a.status === 'falta').length,
      inProgress: appointments.filter(a => a.status === 'em_atendimento').length,
    }
  }, [appointments])

  // Busca agendamentos via API
  // Se useRealtime=true, delega para DataContext
  const fetchAppointments = useCallback(async () => {
    // Se usando Realtime, delega para DataContext
    if (useRealtime) {
      await dataContext.refreshAppointments()
      return
    }

    // SEGURANÇA: clinica_id é obrigatório para evitar vazamento de dados
    if (!currentClinica?.id) {
      console.log('[useAppointments] Sem clínica selecionada, retornando vazio')
      setLocalAppointments([])
      setLocalTotal(0)
      return
    }

    console.log('[useAppointments] Buscando agendamentos para clínica:', currentClinica.id, 'mode:', mode)

    setIsLoading(true)
    setError(null)

    try {
      // Determina data baseado no mode
      let date: string | undefined
      if (mode === 'today') {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        date = `${year}-${month}-${day}`
      }

      // Usa apiService ao invés de Supabase SDK
      const result = await apiService.getAppointments(currentClinica.id, date)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        // Mapeia dados da API para formato esperado pelo componente
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedAppointments: AppointmentFormatted[] = (result.data || []).map((a: any) => {
          // Extrair data e hora do datetime
          const startDate = new Date(a.data_hora_inicio)
          const endDate = new Date(a.data_hora_fim)
          // Usa formato local para evitar bug de timezone com toISOString()
          const year = startDate.getFullYear()
          const month = String(startDate.getMonth() + 1).padStart(2, '0')
          const day = String(startDate.getDate()).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`
          const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)

          return {
            id: a.id,
            data_hora_inicio: a.data_hora_inicio,
            data_hora_fim: a.data_hora_fim,
            status: a.status || 'agendado',
            observacoes: a.observacoes,
            paciente: a.paciente ? {
              id: a.paciente.id,
              nome_completo: a.paciente.nome_completo,
            } : undefined,
            profissional: a.profissional ? {
              id: a.profissional.id,
              especialidades: a.profissional.especialidades || [],
              usuario: {
                nome_completo: a.profissional.usuario?.nome_completo || 'Profissional',
              },
            } : undefined,
            servico: a.servico ? {
              id: a.servico.id,
              nome: a.servico.nome,
            } : undefined,
            convenio: a.convenio ? {
              id: a.convenio.id,
              nome: a.convenio.nome,
            } : undefined,
            // Campos de compatibilidade (obrigatórios com valores padrão)
            patientId: a.paciente?.id || '',
            patientName: a.paciente?.nome_completo || 'Paciente não informado',
            date: dateStr,
            dateStr: dateStr,
            time: timeStr,
            duration: durationMinutes,
            type: a.servico?.nome || 'Consulta',
            professionalId: a.profissional?.id || '',
            professionalName: a.profissional?.usuario?.nome_completo || 'Profissional',
            serviceName: a.servico?.nome || 'Serviço',
            insuranceName: a.convenio?.nome || 'Particular',
          }
        })
        setLocalAppointments(mappedAppointments)
        setLocalTotal(result.count || mappedAppointments.length)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar agendamentos'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, mode, useRealtime, dataContext])

  // Cria agendamento via API
  const createAppointment = useCallback(async (
    data: Omit<CreateAppointmentInput, 'clinica_id' | 'criado_por_id'>
  ): Promise<AppointmentFormatted | null> => {
    if (!currentClinica?.id || !user?.id) {
      toast.error('Clínica ou usuário não identificado')
      return null
    }

    setIsLoading(true)

    try {
      const result = await apiService.createAppointment({
        ...data,
        criado_por_id: user.id,
      }, currentClinica.id)

      if (result.error) {
        toast.error(result.error)
        return null
      }

      toast.success('Agendamento criado com sucesso!')
      await fetchAppointments()
      return result.data as AppointmentFormatted
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar agendamento'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, user?.id, fetchAppointments])

  // Atualiza agendamento via API
  const updateAppointment = useCallback(async (
    id: string,
    data: UpdateAppointmentInput
  ): Promise<AppointmentFormatted | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não identificada')
      return null
    }

    setIsLoading(true)

    try {
      const result = await apiService.updateAppointment(id, data)

      if (result.error || !result.data) {
        toast.error(result.error || 'Erro ao atualizar agendamento')
        return null
      }

      toast.success('Agendamento atualizado com sucesso!')
      await fetchAppointments()
      return result.data as AppointmentFormatted
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar agendamento'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchAppointments, currentClinica?.id])

  // Deleta agendamento via API
  const deleteAppointment = useCallback(async (id: string): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não identificada')
      return false
    }

    setIsLoading(true)

    try {
      const result = await apiService.deleteAppointment(id, currentClinica.id)

      if (!result.success) {
        toast.error(result.error || 'Erro ao remover agendamento')
        return false
      }

      toast.success('Agendamento removido com sucesso!')
      await fetchAppointments()
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao remover agendamento'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [fetchAppointments, currentClinica?.id])

  // Altera status via API (usa updateAppointment)
  const changeStatus = useCallback(async (id: string, status: AppointmentStatusDB): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não identificada')
      return false
    }

    try {
      const result = await apiService.updateAppointment(id, { status })

      if (result.error || !result.data) {
        toast.error(result.error || 'Erro ao alterar status: nenhum dado retornado')
        return false
      }

      const statusLabels: Record<AppointmentStatusDB, string> = {
        agendado: 'marcado como agendado',
        confirmado: 'confirmado',
        aguardando: 'marcado como aguardando',
        em_atendimento: 'iniciado',
        concluido: 'concluído',
        cancelado: 'cancelado',
        falta: 'marcado como falta',
        reagendado: 'reagendado',
      }

      toast.success(`Agendamento ${statusLabels[status]}!`)
      await fetchAppointments()
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status'
      toast.error(message)
      return false
    }
  }, [fetchAppointments, currentClinica?.id])

  // Confirma agendamento
  const confirmAppointment = useCallback(async (id: string): Promise<boolean> => {
    return changeStatus(id, 'confirmado')
  }, [changeStatus])

  // Registra chegada
  const registerArrival = useCallback(async (id: string): Promise<boolean> => {
    return changeStatus(id, 'aguardando')
  }, [changeStatus])

  // Cancela agendamento
  const cancelAppointment = useCallback(async (id: string): Promise<boolean> => {
    return changeStatus(id, 'cancelado')
  }, [changeStatus])

  // Registra falta
  const registerNoShow = useCallback(async (id: string): Promise<boolean> => {
    return changeStatus(id, 'falta')
  }, [changeStatus])

  // Helpers para filtros
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: AppointmentStatusDB | '') => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setProfessionalFilter = useCallback((professionalId: string) => {
    setFilters(prev => ({ ...prev, professionalId }))
  }, [])

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const refresh = useCallback(async () => {
    await fetchAppointments()
  }, [fetchAppointments])

  // Auto-fetch ao montar ou quando clínica muda
  // Se useRealtime=true, DataContext já carrega os dados automaticamente
  useEffect(() => {
    if (autoFetch && currentClinica?.id && !useRealtime) {
      fetchAppointments()
    }
  }, [autoFetch, currentClinica?.id, fetchAppointments, useRealtime])

  // Usar isLoading do DataContext quando useRealtime=true
  const effectiveIsLoading = useRealtime ? dataContext.isLoading : isLoading

  return {
    appointments,
    isLoading: effectiveIsLoading,
    error,
    total,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    changeStatus,
    confirmAppointment,
    registerArrival,
    cancelAppointment,
    registerNoShow,
    setSearch,
    setStatusFilter,
    setProfessionalFilter,
    setDateRange,
    clearFilters,
    refresh,
    stats,
  }
}

/**
 * Hook para buscar detalhes de um agendamento
 */
export function useAppointmentDetails(appointmentId: string | undefined) {
  const [appointment, setAppointment] = useState<AppointmentFormatted | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implementar endpoint de detalhes na API
      // Por enquanto, deixa vazio
      setAppointment(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar agendamento'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    fetchAppointment()
  }, [fetchAppointment])

  return {
    appointment,
    isLoading,
    error,
    refresh: fetchAppointment,
  }
}

/**
 * Hook para estatísticas de agendamentos do dia
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useAppointmentStats(_date?: string) {
  const { currentClinica } = useAuth()
  const [stats, setStats] = useState(emptyStats)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!currentClinica?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // Usa getAppointments para buscar hoje e calcular stats
      const today = new Date().toISOString().split('T')[0]
      const result = await apiService.getAppointments(currentClinica.id, today)

      if (result.error) {
        setError(result.error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const appointments = result.data || [] as any[]
        setStats({
          total: appointments.length,
          confirmed: appointments.filter((a) => a.status === 'confirmado').length,
          waiting: appointments.filter((a) => a.status === 'aguardando').length,
          completed: appointments.filter((a) => a.status === 'concluido').length,
          cancelled: appointments.filter((a) => a.status === 'cancelado').length,
          noShow: appointments.filter((a) => a.status === 'falta').length,
          inProgress: appointments.filter((a) => a.status === 'em_atendimento').length,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar estatísticas'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  }
}
