/**
 * DataContext - Gerenciamento Centralizado de Dados
 *
 * Este contexto:
 * 1. Pré-carrega dados essenciais após login
 * 2. Usa Supabase Realtime para detectar mudanças em tempo real
 * 3. Quando detectar mudança, chama apiService para buscar dados atualizados
 * 4. Expõe dados para todos os componentes via hook useData()
 *
 * Abordagem híbrida:
 * - Realtime apenas para notificações (leve, só detecta INSERT/UPDATE/DELETE)
 * - Quando detectar mudança → chama apiService para buscar dados atualizados
 * - Mantém compatibilidade com HTTP API (evita problema do SDK travando)
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { apiService } from '@/services/api.service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import { getLocalDateString, formatTimeString } from '@/utils/appointment-helpers'
import type { PatientListItem } from '@/types/patient'
import type { AppointmentFormatted, AppointmentStatusDB } from '@/hooks/useAppointments'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Flag para habilitar/desabilitar Realtime via variável de ambiente
// Para habilitar: VITE_ENABLE_REALTIME=true no .env
const REALTIME_ENABLED = import.meta.env.VITE_ENABLE_REALTIME === 'true'

// Timeout para loading (15 segundos) - evita loading infinito
const LOADING_TIMEOUT_MS = 15000

if (!REALTIME_ENABLED) {
  logger.debug('DataContext', 'Realtime DESABILITADO via VITE_ENABLE_REALTIME')
}

// ============================================================
// TIPOS
// ============================================================

interface DataState {
  patients: PatientListItem[]
  appointments: AppointmentFormatted[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  professionals: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insurances: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[]
}

interface DataContextType extends DataState {
  isLoading: boolean
  loadError: string | null
  lastUpdated: Date | null
  isRealtimeConnected: boolean

  // Refresh
  refresh: () => Promise<void>
  refreshPatients: () => Promise<void>
  refreshAppointments: () => Promise<void>
  refreshProfessionals: () => Promise<void>
  refreshInsurances: () => Promise<void>
  refreshServices: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// ============================================================
// HELPERS
// ============================================================

/**
 * Mapeia dados da API para PatientListItem
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPatient(p: any): PatientListItem {
  return {
    id: p.id,
    name: p.nome_completo,
    email: p.email || '',
    cpf: p.cpf || '',
    phone: p.telefone,
    birthDate: p.data_nascimento,
    status: p.status || 'active',
    insurance: p.pacientes_convenios?.[0]?.convenio?.nome || 'Particular',
    insuranceId: p.pacientes_convenios?.[0]?.convenio?.id,
  }
}

// getLocalDateString and formatTimeString are imported from @/utils/appointment-helpers

/**
 * Mapeia dados da API para AppointmentFormatted
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAppointment(a: any): AppointmentFormatted {
  const startDate = new Date(a.data_hora_inicio)
  const endDate = new Date(a.data_hora_fim)
  // Usa funcao local para evitar bug de timezone com toISOString()
  const dateStr = getLocalDateString(startDate)
  const timeStr = formatTimeString(startDate)
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)

  return {
    id: a.id,
    data_hora_inicio: a.data_hora_inicio,
    data_hora_fim: a.data_hora_fim,
    data_chegada: a.data_chegada ?? null,
    data_inicio_atendimento: a.data_inicio_atendimento ?? null,
    data_fim_atendimento: a.data_fim_atendimento ?? null,
    status: (a.status || 'agendado') as AppointmentStatusDB,
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
    // Campos de compatibilidade
    patientId: a.paciente?.id || '',
    patientName: a.paciente?.nome_completo || 'Paciente não informado',
    date: dateStr,
    dateStr,
    time: timeStr,
    duration: durationMinutes,
    type: a.servico?.nome || 'Consulta',
    professionalId: a.profissional?.id || '',
    professionalName: a.profissional?.usuario?.nome_completo || 'Profissional',
    serviceName: a.servico?.nome || 'Serviço',
    insuranceName: a.convenio?.nome || 'Particular',
  }
}

// ============================================================
// PROVIDER
// ============================================================

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentClinica, isAuthenticated } = useAuth()

  // Estado dos dados
  const [data, setData] = useState<DataState>({
    patients: [],
    appointments: [],
    professionals: [],
    insurances: [],
    services: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  // Ref para timeout de loading
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ref para o channel Realtime
  const channelRef = useRef<RealtimeChannel | null>(null)
  // Flag para evitar carregamento duplicado
  const isLoadingRef = useRef(false)

  // Carrega todos os dados via API
  const loadAllData = useCallback(async () => {
    if (!currentClinica?.id) return
    if (isLoadingRef.current) return // Evita carregamentos duplicados

    logger.debug('DataContext', 'Carregando todos os dados...')
    isLoadingRef.current = true
    setIsLoading(true)
    setLoadError(null)

    // Configura timeout de segurança para evitar loading infinito
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        logger.warn('DataContext', 'Timeout de carregamento atingido (15s)')
        setLoadError('Tempo limite atingido. Verifique sua conexão e tente novamente.')
        setIsLoading(false)
        isLoadingRef.current = false
      }
    }, LOADING_TIMEOUT_MS)

    try {
      // Usa Promise.allSettled para que falha em uma requisição não afete as outras
      const results = await Promise.allSettled([
        apiService.getPatients(currentClinica.id),
        // Busca agendamentos com mode='all' para ter dados do mês para Agenda
        apiService.getAppointments(currentClinica.id, undefined, 'all'),
        apiService.getProfessionals(currentClinica.id),
        apiService.getInsurances(currentClinica.id),
        apiService.getServices(currentClinica.id),
      ])

      // Limpa timeout se carregou (mesmo com erros parciais)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }

      // Processa resultados individualmente - falha em um não afeta os outros
      const patientsRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] }
      const appointmentsRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] }
      const professionalsRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] }
      const insurancesRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] }
      const servicesRes = results[4].status === 'fulfilled' ? results[4].value : { data: [] }

      // Log de erros parciais (não bloqueia carregamento)
      const errors: string[] = []
      if (results[0].status === 'rejected') {
        logger.warn('DataContext', 'Erro ao carregar pacientes:', results[0].reason)
        errors.push('pacientes')
      }
      if (results[1].status === 'rejected') {
        logger.warn('DataContext', 'Erro ao carregar agendamentos:', results[1].reason)
        errors.push('agendamentos')
      }
      if (results[2].status === 'rejected') {
        logger.warn('DataContext', 'Erro ao carregar profissionais:', results[2].reason)
        errors.push('profissionais')
      }
      if (results[3].status === 'rejected') {
        logger.warn('DataContext', 'Erro ao carregar convênios:', results[3].reason)
        errors.push('convênios')
      }
      if (results[4].status === 'rejected') {
        logger.warn('DataContext', 'Erro ao carregar serviços:', results[4].reason)
        errors.push('serviços')
      }

      const patients = (patientsRes.data || []).map(mapPatient)
      const appointments = (appointmentsRes.data || []).map(mapAppointment)

      setData({
        patients,
        appointments,
        professionals: professionalsRes.data || [],
        insurances: insurancesRes.data || [],
        services: servicesRes.data || [],
      })
      setLastUpdated(new Date())

      // Se houve erros parciais, mostra aviso (mas dados parciais foram carregados)
      if (errors.length > 0 && errors.length < 5) {
        setLoadError(`Alguns dados não carregaram: ${errors.join(', ')}. Tente novamente.`)
      } else if (errors.length === 5) {
        setLoadError('Erro ao carregar dados. Verifique sua conexão.')
      } else {
        setLoadError(null)
      }

      logger.debug('DataContext', 'Dados carregados:', {
        patients: patients.length,
        appointments: appointments.length,
        professionals: (professionalsRes.data || []).length,
        insurances: (insurancesRes.data || []).length,
        services: (servicesRes.data || []).length,
        errors: errors.length > 0 ? errors : 'nenhum',
      })
    } catch (error) {
      // Limpa timeout em caso de erro crítico
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados'
      logger.error('DataContext', 'Erro crítico ao carregar dados:', error)
      setLoadError(errorMessage)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [currentClinica?.id])

  // Refresh individual para pacientes
  const refreshPatients = useCallback(async () => {
    if (!currentClinica?.id) return
    logger.debug('DataContext', 'Atualizando pacientes...')
    try {
      const res = await apiService.getPatients(currentClinica.id)
      if (res.data) {
        setData(prev => ({ ...prev, patients: res.data!.map(mapPatient) }))
        setLastUpdated(new Date())
      }
    } catch (error) {
      logger.error('DataContext', 'Erro ao atualizar pacientes:', error)
    }
  }, [currentClinica?.id])

  // Refresh individual para agendamentos
  const refreshAppointments = useCallback(async () => {
    if (!currentClinica?.id) return
    logger.debug('DataContext', 'Atualizando agendamentos...')
    try {
      // Busca agendamentos com mode='all' para ter dados completos
      const res = await apiService.getAppointments(currentClinica.id, undefined, 'all')
      if (res.data) {
        const mapped = res.data.map(mapAppointment)
        setData(prev => ({ ...prev, appointments: mapped }))
        setLastUpdated(new Date())
      }
    } catch (error) {
      logger.error('DataContext', 'Erro ao atualizar agendamentos:', error)
    }
  }, [currentClinica?.id])

  // Refresh individual para profissionais
  const refreshProfessionals = useCallback(async () => {
    if (!currentClinica?.id) return
    logger.debug('DataContext', 'Atualizando profissionais...')
    try {
      const res = await apiService.getProfessionals(currentClinica.id)
      if (res.data) {
        setData(prev => ({ ...prev, professionals: res.data! }))
        setLastUpdated(new Date())
      }
    } catch (error) {
      logger.error('DataContext', 'Erro ao atualizar profissionais:', error)
    }
  }, [currentClinica?.id])

  // Refresh individual para convênios
  const refreshInsurances = useCallback(async () => {
    if (!currentClinica?.id) return
    logger.debug('DataContext', 'Atualizando convênios...')
    try {
      const res = await apiService.getInsurances(currentClinica.id)
      if (res.data) {
        setData(prev => ({ ...prev, insurances: res.data! }))
        setLastUpdated(new Date())
      }
    } catch (error) {
      logger.error('DataContext', 'Erro ao atualizar convênios:', error)
    }
  }, [currentClinica?.id])

  // Refresh individual para serviços
  const refreshServices = useCallback(async () => {
    if (!currentClinica?.id) return
    logger.debug('DataContext', 'Atualizando serviços...')
    try {
      const res = await apiService.getServices(currentClinica.id)
      if (res.data) {
        setData(prev => ({ ...prev, services: res.data! }))
        setLastUpdated(new Date())
      }
    } catch (error) {
      logger.error('DataContext', 'Erro ao atualizar serviços:', error)
    }
  }, [currentClinica?.id])

  // Refs para as funções de refresh (mantém referência estável)
  const refreshPatientsRef = useRef(refreshPatients)
  const refreshAppointmentsRef = useRef(refreshAppointments)
  const refreshProfessionalsRef = useRef(refreshProfessionals)

  // Atualiza refs quando as funções mudam
  useEffect(() => {
    refreshPatientsRef.current = refreshPatients
  }, [refreshPatients])

  useEffect(() => {
    refreshAppointmentsRef.current = refreshAppointments
  }, [refreshAppointments])

  useEffect(() => {
    refreshProfessionalsRef.current = refreshProfessionals
  }, [refreshProfessionals])

  // Debounce timers (refs para persistir entre renders)
  const patientsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appointmentsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const professionalsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Funções debounced estáveis
  const debouncedRefreshPatients = useCallback(() => {
    if (patientsTimerRef.current) clearTimeout(patientsTimerRef.current)
    patientsTimerRef.current = setTimeout(() => {
      logger.debug('DataContext', 'Executando refresh de pacientes...')
      refreshPatientsRef.current()
    }, 500)
  }, [])

  const debouncedRefreshAppointments = useCallback(() => {
    if (appointmentsTimerRef.current) clearTimeout(appointmentsTimerRef.current)
    appointmentsTimerRef.current = setTimeout(() => {
      logger.debug('DataContext', 'Executando refresh de agendamentos...')
      refreshAppointmentsRef.current()
    }, 500)
  }, [])

  const debouncedRefreshProfessionals = useCallback(() => {
    if (professionalsTimerRef.current) clearTimeout(professionalsTimerRef.current)
    professionalsTimerRef.current = setTimeout(() => {
      logger.debug('DataContext', 'Executando refresh de profissionais...')
      refreshProfessionalsRef.current()
    }, 500)
  }, [])

  // Setup Supabase Realtime
  useEffect(() => {
    // Se não autenticado ou sem clínica, limpa tudo
    if (!isAuthenticated || !currentClinica?.id) {
      setData({
        patients: [],
        appointments: [],
        professionals: [],
        insurances: [],
        services: [],
      })
      setLastUpdated(null)
      // Reseta flag para permitir novo carregamento
      isLoadingRef.current = false

      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsRealtimeConnected(false)
      }
      return
    }

    // Reseta flag antes de carregar para permitir carregamento da nova clínica
    isLoadingRef.current = false

    // Carrega dados iniciais
    loadAllData()

    // Se Realtime está desabilitado, não configura subscriptions
    if (!REALTIME_ENABLED) {
      logger.debug('DataContext', 'Realtime desabilitado, pulando configuração de subscriptions')
      return
    }

    // Se Supabase não está configurado, não tenta Realtime
    if (!supabase) {
      logger.warn('DataContext', 'Supabase não configurado, Realtime desabilitado')
      return
    }

    // Configura Realtime subscription
    // NOTA: Removemos o filtro clinica_id para testar se o Realtime está funcionando
    // O filtro será aplicado no lado do cliente (já que RLS garante segurança)
    logger.debug('DataContext', 'Configurando Realtime para clínica:', currentClinica.id)

    const channel = supabase
      .channel(`clinic_${currentClinica.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pacientes',
          // Filtro removido temporariamente - RLS já filtra por clínica
        },
        (payload) => {
          logger.debug('Realtime', `Mudança em pacientes: ${payload.eventType}`, payload)
          // Verifica se é da clínica correta (filtro client-side)
          const record = (payload.new || payload.old) as { clinica_id?: string } | null
          if (record && record.clinica_id === currentClinica.id) {
            logger.debug('Realtime', 'Paciente da clínica atual, atualizando...')
            debouncedRefreshPatients()
          } else {
            logger.debug('Realtime', 'Paciente de outra clínica, ignorando')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos',
          // Filtro removido temporariamente - RLS já filtra por clínica
        },
        (payload) => {
          logger.debug('Realtime', `Mudança em agendamentos: ${payload.eventType}`, payload)
          const record = (payload.new || payload.old) as { clinica_id?: string } | null
          if (record && record.clinica_id === currentClinica.id) {
            logger.debug('Realtime', 'Agendamento da clínica atual, atualizando...')
            debouncedRefreshAppointments()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profissionais',
          // Filtro removido temporariamente - RLS já filtra por clínica
        },
        (payload) => {
          logger.debug('Realtime', `Mudança em profissionais: ${payload.eventType}`, payload)
          const record = (payload.new || payload.old) as { clinica_id?: string } | null
          if (record && record.clinica_id === currentClinica.id) {
            logger.debug('Realtime', 'Profissional da clínica atual, atualizando...')
            debouncedRefreshProfessionals()
          }
        }
      )
      .subscribe((status, err) => {
        logger.debug('Realtime', `Status: ${status}`, err ? `Erro: ${err}` : '')
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      logger.debug('Realtime', 'Desconectando...')
      if (supabase && channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [isAuthenticated, currentClinica?.id, loadAllData, debouncedRefreshPatients, debouncedRefreshAppointments, debouncedRefreshProfessionals])

  const value: DataContextType = {
    ...data,
    isLoading,
    loadError,
    lastUpdated,
    isRealtimeConnected,
    refresh: loadAllData,
    refreshPatients,
    refreshAppointments,
    refreshProfessionals,
    refreshInsurances,
    refreshServices,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

// ============================================================
// HOOK
// ============================================================

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
