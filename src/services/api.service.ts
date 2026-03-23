/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Serviço de comunicação com a Allyra API
 *
 * Este serviço substitui as chamadas diretas ao Supabase SDK,
 * que estava travando no navegador.
 *
 * Uso:
 * ```typescript
 * import { apiService } from '@/services/api.service'
 *
 * // Login
 * const { user, session } = await apiService.login(email, password)
 *
 * // Buscar dados
 * const { data, count } = await apiService.getPatients(clinicaId)
 * ```
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type {
  PatientEngagementResponse,
  ProfessionalWorkloadSummary,
} from '@/types/clinical-intelligence'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Flag para suprimir erros durante redirecionamento para login
let isRedirectingToLogin = false

// ============================================================
// TIPOS
// ============================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  count?: number
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    perfil_tipo: string
    telefone?: string
    cpf?: string
    is_master?: boolean
    data_nascimento?: string
    endereco?: string
    registro_profissional?: string
    especialidade?: string
    bio?: string
    created_at?: string
  }
  clinicas: Array<{
    id: string
    name: string
    permissoes: any
  }>
  session: {
    access_token: string
    refresh_token: string
  }
}

export interface UserWithClinicsResponse {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    perfil_tipo: string
    telefone?: string
    cpf?: string
    is_master?: boolean
    data_nascimento?: string
    endereco?: string
    registro_profissional?: string
    especialidade?: string
    bio?: string
    created_at?: string
  }
  clinicas: Array<{
    id: string
    name: string
    permissoes: any
  }>
}

export interface Patient {
  id: string
  nome_completo: string
  email?: string
  telefone?: string
  cpf?: string
  data_nascimento?: string
  pacientes_convenios?: Array<{
    id: string
    numero_carteirinha: string
    convenio: {
      id: string
      nome: string
    }
  }>
}

export interface Appointment {
  id: string
  data_hora_inicio: string
  data_hora_fim: string
  data_chegada?: string | null
  data_inicio_atendimento?: string | null
  data_fim_atendimento?: string | null
  status: string
  observacoes?: string
  paciente?: {
    id: string
    nome_completo: string
  }
  profissional?: {
    id: string
    especialidades: string[]
    usuario: {
      nome_completo: string
    }
  }
  servico?: {
    id: string
    nome: string
  }
  convenio?: {
    id: string
    nome: string
  }
}

interface ApiErrorPayload {
  error?: string
  code?: string
  details?: unknown
  pendingGoals?: unknown
  data?: unknown
  [key: string]: unknown
}

export class ApiRequestError extends Error {
  status: number
  code?: string
  details?: unknown
  payload?: ApiErrorPayload

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
    payload?: ApiErrorPayload,
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
    this.payload = payload
  }
}

// ============================================================
// HELPERS PRIVADOS
// ============================================================

/**
 * Tenta renovar o token usando o refresh token
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('allyra_refresh_token')
  if (!refreshToken || !supabase) {
    logger.debug('API', 'Sem refresh token ou supabase, forçando logout')
    return false
  }

  try {
    logger.debug('API', 'Tentando renovar token...')
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    })

    if (error || !data.session) {
      logger.error('API', 'Erro ao renovar token:', error?.message)
      return false
    }

    // Salva os novos tokens
    localStorage.setItem('allyra_access_token', data.session.access_token)
    localStorage.setItem('allyra_refresh_token', data.session.refresh_token)
    logger.debug('API', 'Token renovado com sucesso!')
    return true
  } catch (err) {
    logger.error('API', 'Erro ao renovar token:', err)
    return false
  }
}

/**
 * Força logout e redireciona para login
 * Retorna uma Promise que nunca resolve para evitar que código subsequente execute
 */
function forceLogout(): Promise<never> {
  // Seta flag para suprimir toasts de erro durante redirect
  isRedirectingToLogin = true

  logger.debug('API', 'Forçando logout por token expirado')
  localStorage.removeItem('allyra_access_token')
  localStorage.removeItem('allyra_refresh_token')
  localStorage.removeItem('allyra_user')
  window.location.href = '/login'

  // Retorna Promise que nunca resolve - o redirect vai acontecer
  // Isso evita que código subsequente (como toast.error) execute
  return new Promise(() => {})
}

/**
 * Faz requisição HTTP com tratamento de erros e refresh automático de token
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnExpired = true
): Promise<T> {
  // Se já está redirecionando para login, não faz nada
  // Isso evita múltiplas requisições durante o processo de logout
  if (isRedirectingToLogin) {
    return new Promise(() => {}) as Promise<T>
  }

  const url = `${API_URL}${endpoint}`

  try {
    // Para Edge Functions, usar Authorization Bearer com anon_key se não houver token específico
    const providedHeaders = (options.headers as Record<string, string> | undefined) || {}
    const authHeader = providedHeaders.Authorization
    const hasBody = options.body !== undefined && options.body !== null
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': authHeader || `Bearer ${SUPABASE_ANON_KEY}`,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...providedHeaders,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' })) as ApiErrorPayload
      const errorMessage = error.error || `HTTP ${response.status}`

      // Se recebeu 401 (não autorizado), tenta renovar o token
      // Isso inclui: token expirado, token inválido, token não fornecido
      const isUnauthorized = response.status === 401
      const shouldRetry = isUnauthorized && retryOnExpired

      if (shouldRetry) {
        logger.debug('API', `Erro 401 em ${endpoint}: ${errorMessage}. Tentando renovar token...`)
        const refreshed = await tryRefreshToken()

        if (refreshed) {
          // Atualiza o header com o novo token e refaz a requisição
          const newToken = localStorage.getItem('allyra_access_token')
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          }
          return fetchAPI<T>(endpoint, newOptions, false) // Não tenta novamente
        } else {
          // Não conseguiu renovar, força logout
          // forceLogout() retorna Promise<never> que nunca resolve
          // O redirect acontece e essa linha nunca é alcançada
          return forceLogout()
        }
      }

      throw new ApiRequestError(
        errorMessage,
        response.status,
        error.code,
        error.details ?? error.pendingGoals ?? error.data ?? null,
        error,
      )
    }

    // 204 No Content or empty body — return safe default
    if (response.status === 204) {
      return { success: true } as unknown as T
    }

    const text = await response.text()
    if (!text) {
      return { success: true } as unknown as T
    }

    return JSON.parse(text) as T
  } catch (error) {
    logger.error('API', `Erro em ${endpoint}:`, error)
    throw error
  }
}

/**
 * Obtém o token de acesso do localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('allyra_access_token')
}

/**
 * Salva o token de acesso no localStorage e sincroniza com Supabase em background
 * A sincronização com Supabase é necessária para Realtime, mas não bloqueia o login
 */
function setAccessToken(token: string, refreshToken?: string): void {
  localStorage.setItem('allyra_access_token', token)
  if (refreshToken) {
    localStorage.setItem('allyra_refresh_token', refreshToken)
  }

  // Sincroniza a sessão com o Supabase client em BACKGROUND (não bloqueia)
  // Isso é necessário apenas para Realtime funcionar com RLS
  if (supabase) {
    supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken || token,
    }).then(({ error }) => {
      if (error) {
        logger.warn('API', 'Erro ao sincronizar sessão Supabase:', error.message)
      } else {
        logger.debug('API', 'Sessão Supabase sincronizada para Realtime')
      }
    }).catch(err => {
      logger.warn('API', 'Erro ao sincronizar sessão Supabase:', err)
    })
  }
}

/**
 * Remove o token de acesso do localStorage e limpa sessão Supabase
 */
async function clearAccessToken(): Promise<void> {
  localStorage.removeItem('allyra_access_token')
  localStorage.removeItem('allyra_refresh_token')

  // Limpa sessão do Supabase
  if (supabase) {
    try {
      await supabase.auth.signOut()
      logger.debug('API', 'Sessão Supabase encerrada')
    } catch (err) {
      logger.warn('API', 'Erro ao encerrar sessão Supabase:', err)
    }
  }
}

/**
 * Cria headers com autenticação
 */
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken()
  if (!token) {
    throw new Error('Token de acesso não encontrado')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

// ============================================================
// SERVIÇO PÚBLICO
// ============================================================

export const apiService = {
  /**
   * Faz login e retorna dados do usuário + token
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // retryOnExpired = false: não tentar refresh de token em login (usuário ainda não logado)
    const response = await fetchAPI<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false)

    // Salvar token no localStorage (sincronização Supabase em background)
    if (response.session?.access_token) {
      setAccessToken(response.session.access_token, response.session.refresh_token)
    }

    return response
  },

  /**
   * Faz logout (limpa token local e sessão Supabase)
   */
  async logout(): Promise<void> {
    await clearAccessToken()
  },

  /**
   * Busca dados do usuário com clínicas vinculadas
   */
  async getUserWithClinics(): Promise<UserWithClinicsResponse> {
    return await fetchAPI<UserWithClinicsResponse>('/api/auth/user-with-clinics', {
      headers: getAuthHeaders(),
    })
  },

  /**
   * Busca pacientes de uma clínica
   */
  async getPatients(clinicaId: string): Promise<ApiResponse<Patient[]>> {
    return await fetchAPI<ApiResponse<Patient[]>>(
      `/api/patients?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca paciente por ID
   */
  async getPatientById(id: string, clinicaId: string): Promise<ApiResponse<Patient>> {
    return await fetchAPI<ApiResponse<Patient>>(
      `/api/patients/${id}?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca mÃ©tricas de engajamento e pacientes sinalizados
   */
  async getPatientEngagement(clinicaId: string): Promise<ApiResponse<PatientEngagementResponse>> {
    return await fetchAPI<ApiResponse<PatientEngagementResponse>>(
      `/api/patients/engagement?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca agendamentos de uma clínica
   * @param clinicaId - ID da clínica
   * @param date - Data específica (opcional, formato YYYY-MM-DD)
   * @param mode - Modo de busca: 'today', 'week', 'month', 'all' (padrão: 'today')
   */
  async getAppointments(
    clinicaId: string,
    date?: string,
    mode?: 'today' | 'day' | 'week' | 'month' | 'all'
  ): Promise<ApiResponse<Appointment[]>> {
    const queryParams = new URLSearchParams({ clinica_id: clinicaId })
    if (date) {
      queryParams.append('date', date)
    }
    if (mode) {
      queryParams.append('mode', mode === 'today' ? 'day' : mode)
    }

    return await fetchAPI<ApiResponse<Appointment[]>>(
      `/api/appointments?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Cadastra novo usuário
   */
  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    // retryOnExpired = false: não tentar refresh de token em registro (usuário ainda não logado)
    const response = await fetchAPI<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }, false)

    // Salvar token no localStorage (sincronização Supabase em background)
    if (response.session?.access_token) {
      setAccessToken(response.session.access_token, response.session.refresh_token)
    }

    return response
  },

  /**
   * Solicita reset de senha via email
   */
  async resetPassword(email: string): Promise<{ message: string }> {
    // retryOnExpired = false: não tentar refresh de token em reset de senha (endpoint público)
    return await fetchAPI<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false)
  },

  /**
   * Cria novo paciente
   */
  async createPatient(data: any, clinicaId: string): Promise<ApiResponse<Patient>> {
    return await fetchAPI<ApiResponse<Patient>>('/api/patients', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, clinica_id: clinicaId }),
    })
  },

  /**
   * Atualiza paciente existente
   */
  async updatePatient(id: string, data: any, clinicaId: string): Promise<ApiResponse<Patient>> {
    return await fetchAPI<ApiResponse<Patient>>(`/api/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, clinica_id: clinicaId }),
    })
  },

  /**
   * Remove paciente
   */
  async deletePatient(id: string, clinicaId: string): Promise<{ success: boolean }> {
    return await fetchAPI<{ success: boolean }>(
      `/api/patients/${id}?clinica_id=${clinicaId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Verifica conflitos de horário antes de criar o agendamento
   */
  async checkAppointmentConflicts(data: {
    clinica_id: string
    profissional_id: string
    data_hora_inicio: string
    data_hora_fim: string
    sala_id?: string
    exclude_appointment_id?: string
  }): Promise<ApiResponse<{
    hasConflict: boolean,
    conflicts: Array<{
      type: string
      appointment_id: string
      resource_name: string
      data_hora_inicio: string
      data_hora_fim: string
      paciente_nome: string
    }>
  }>> {
    return await fetchAPI('/api/appointments/check-conflicts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Cria novo agendamento
   */
  async createAppointment(data: any, clinicaId: string): Promise<ApiResponse<Appointment>> {
    return await fetchAPI<ApiResponse<Appointment>>('/api/appointments', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, clinica_id: clinicaId }),
    })
  },

  /**
   * Cria série de agendamentos recorrentes
   */
  async createRecurrentAppointment(data: any, clinicaId: string): Promise<ApiResponse<{ success: boolean; criados: number; conflitos: number; conflitos_detalhes: any[]; serie_recorrencia_id: string }>> {
    return await fetchAPI<ApiResponse<{ success: boolean; criados: number; conflitos: number; conflitos_detalhes: any[]; serie_recorrencia_id: string }>>('/api/appointments/recurrent', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, clinica_id: clinicaId }),
    })
  },

  /**
   * Edita agendamentos futuros de uma série recorrente
   */
  async editSeriesAppointments(serieId: string, applyFrom: string, changes: Record<string, unknown>): Promise<ApiResponse<{ success: boolean; updated: number }>> {
    return await fetchAPI<ApiResponse<{ success: boolean; updated: number }>>(`/api/appointments/series/${serieId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ apply_from: applyFrom, changes }),
    })
  },

  /**
   * Cancela agendamentos futuros de uma série recorrente
   */
  async cancelSeriesAppointments(serieId: string, cancelFrom: string, motivo?: string): Promise<ApiResponse<{ success: boolean; cancelled: number }>> {
    return await fetchAPI<ApiResponse<{ success: boolean; cancelled: number }>>(`/api/appointments/series/${serieId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cancel_from: cancelFrom, motivo }),
    })
  },

  /**
   * Atualiza agendamento existente
   */
  async updateAppointment(id: string, data: any): Promise<ApiResponse<Appointment>> {
    return await fetchAPI<ApiResponse<Appointment>>(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Registra check-in formal do agendamento na recepção
   * Suporta 3 métodos: fotografia (multipart), assinatura (multipart), manual (JSON)
   */
  async checkInAppointment(
    id: string,
    data: {
      metodo_checkin: 'fotografia' | 'assinatura' | 'manual'
      evidencia_file?: File
      justificativa_manual?: string
    }
  ): Promise<ApiResponse<any>> {
    const token = getAccessToken()
    if (!token) throw new Error('Token de acesso não encontrado')

    if (data.metodo_checkin === 'manual') {
      // JSON body for manual check-in
      return await fetchAPI<ApiResponse<any>>(`/api/appointments/${id}/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          metodo_checkin: data.metodo_checkin,
          justificativa_manual: data.justificativa_manual,
        }),
      })
    }

    // Multipart for fotografia/assinatura
    const formData = new FormData()
    formData.append('metodo_checkin', data.metodo_checkin)
    if (data.evidencia_file) {
      formData.append('evidencia_file', data.evidencia_file)
    }

    const url = `${API_URL}/api/appointments/${id}/checkin`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Do NOT set Content-Type — browser auto-sets it with boundary for FormData
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    return await response.json()
  },

  /**
   * Registra o início formal do atendimento
   */
  async startAttendance(id: string): Promise<ApiResponse<Appointment>> {
    return await fetchAPI<ApiResponse<Appointment>>(`/api/appointments/${id}/start-attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
  },

  /**
   * Registra a conclusão formal do atendimento
   */
  async completeAttendance(id: string): Promise<ApiResponse<Appointment>> {
    return await fetchAPI<ApiResponse<Appointment>>(`/api/appointments/${id}/complete-attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
  },

  /**
   * Remove agendamento
   */
  async deleteAppointment(id: string, clinicaId: string): Promise<{ success: boolean; error?: string }> {
    return await fetchAPI<{ success: boolean; error?: string }>(
      `/api/appointments/${id}?clinica_id=${clinicaId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Registra pagamento de um agendamento
   * Cria faturamento, conta a receber e registra o pagamento
   */
  async payAppointment(
    appointmentId: string,
    data: {
      valor: number
      forma_pagamento: string
      parcelas?: number
      desconto?: number
      observacoes?: string
    }
  ): Promise<ApiResponse<{
    success: boolean
    data: {
      faturamento_id: string
      numero_fatura: string
      conta_receber_id: string
      valor_pago: number
      forma_pagamento: string
      parcelas: number
    }
  }>> {
    return await fetchAPI(`/api/appointments/${appointmentId}/pay`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * Busca profissionais de uma clínica
   */
  async getProfessionals(clinicaId: string): Promise<ApiResponse<any[]>> {
    return await fetchAPI<ApiResponse<any[]>>(
      `/api/professionals?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca escalas de profissionais
   */
  async getSchedules(
    clinicaId: string,
    options?: { profissionalId?: string; vigenciaData?: string }
  ): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams({ clinica_id: clinicaId })
    if (options?.profissionalId) {
      queryParams.append('profissional_id', options.profissionalId)
    }
    if (options?.vigenciaData) {
      queryParams.append('vigencia_data', options.vigenciaData)
    }

    return await fetchAPI<ApiResponse<any[]>>(
      `/api/schedules?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Cria nova escala
   */
  async createSchedule(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>('/api/schedules', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Atualiza escala existente
   */
  async updateSchedule(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>(`/api/schedules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Remove escala
   */
  async deleteSchedule(id: string): Promise<{ success: boolean }> {
    return await fetchAPI<{ success: boolean }>(`/api/schedules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },

  /**
   * Busca carga horÃ¡ria consolidada por profissional/perÃ­odo
   */
  async getSchedulesWorkload(
    clinicaId: string,
    dataInicio: string,
    dataFim: string,
    profissionalId?: string
  ): Promise<ApiResponse<ProfessionalWorkloadSummary[]>> {
    const queryParams = new URLSearchParams({
      clinica_id: clinicaId,
      data_inicio: dataInicio,
      data_fim: dataFim,
    })
    if (profissionalId) {
      queryParams.append('profissional_id', profissionalId)
    }

    return await fetchAPI<ApiResponse<ProfessionalWorkloadSummary[]>>(
      `/api/schedules/workload?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Cria novo profissional
   */
  async createProfessional(data: any, clinicaId: string): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>('/api/professionals', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, clinica_id: clinicaId }),
    })
  },

  /**
   * Atualiza profissional existente
   */
  async updateProfessional(id: string, data: any): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>(`/api/professionals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Remove profissional
   */
  async deleteProfessional(id: string, clinicaId: string): Promise<{ success: boolean }> {
    return await fetchAPI<{ success: boolean }>(
      `/api/professionals/${id}?clinica_id=${clinicaId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca convênios de uma clínica
   */
  async getInsurances(clinicaId: string): Promise<ApiResponse<any[]>> {
    return await fetchAPI<ApiResponse<any[]>>(
      `/api/insurances?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Cria novo convênio
   */
  async createInsurance(data: any, clinicaId: string): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>('/api/insurances', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, clinica_id: clinicaId }),
    })
  },

  /**
   * Atualiza convênio existente
   */
  async updateInsurance(id: string, data: any): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>(`/api/insurances/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Remove convênio
   */
  async deleteInsurance(id: string, clinicaId: string): Promise<{ success: boolean }> {
    return await fetchAPI<{ success: boolean }>(
      `/api/insurances/${id}?clinica_id=${clinicaId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca salas de uma clínica
   */
  async getRooms(clinicaId: string): Promise<ApiResponse<any[]>> {
    return await fetchAPI<ApiResponse<any[]>>(
      `/api/rooms?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca serviços de uma clínica
   */
  async getServices(clinicaId: string): Promise<ApiResponse<any[]>> {
    return await fetchAPI<ApiResponse<any[]>>(
      `/api/services?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Cria novo serviço
   */
  async createService(data: any, clinicaId: string): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>('/api/services', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, clinica_id: clinicaId }),
    })
  },

  /**
   * Atualiza serviço existente
   */
  async updateService(id: string, data: any): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>(`/api/services/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Remove serviço
   */
  async deleteService(id: string, clinicaId: string): Promise<{ success: boolean }> {
    return await fetchAPI<{ success: boolean }>(
      `/api/services/${id}?clinica_id=${clinicaId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca notificações do usuário
   */
  async getNotifications(
    clinicaId: string,
    usuarioId: string,
    limit = 100
  ): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams({
      clinica_id: clinicaId,
      usuario_id: usuarioId,
      limit: limit.toString(),
    })

    return await fetchAPI<ApiResponse<any[]>>(
      `/api/notifications?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca logs de auditoria com filtros
   * Para admin_master/desenvolvedor: clinicaId é opcional (vê todos os logs)
   */
  async getAuditLogs(params: {
    clinicaId?: string
    action?: string
    table?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams()

    // clinicaId agora é opcional - RLS cuida da segurança
    if (params.clinicaId) queryParams.append('clinica_id', params.clinicaId)
    if (params.action) queryParams.append('action', params.action)
    if (params.table) queryParams.append('table', params.table)
    if (params.userId) queryParams.append('userId', params.userId)
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    return await fetchAPI<ApiResponse<any[]>>(
      `/api/audit-logs?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Busca log de auditoria por ID
   */
  async getAuditLogById(id: string): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>(`/api/audit-logs/${id}`, {
      headers: getAuthHeaders(),
    })
  },

  /**
   * Busca resumo de logs de auditoria
   * Para admin_master/desenvolvedor: clinicaId é opcional (resumo global)
   */
  async getAuditLogsSummary(clinicaId?: string): Promise<ApiResponse<{
    totalLogs: number
    logins: number
    creates: number
    updates: number
    deletes: number
    exports: number
  }>> {
    const url = clinicaId
      ? `/api/audit-logs/summary?clinica_id=${clinicaId}`
      : `/api/audit-logs/summary`

    return await fetchAPI<ApiResponse<any>>(url, {
      headers: getAuthHeaders(),
    })
  },

  /**
   * Busca configurações da clínica
   */
  async getClinicSettings(clinicaId: string): Promise<ApiResponse<{
    id: string
    clinica_id: string
    itens_por_pagina: number
    horario_funcionamento: any
    tempo_antecedencia_agendamento: number
    tempo_cancelamento: number
    permite_agendamento_online: boolean
    notificacao_lembrete_horas: number
    notificacao_confirmacao_dias: number
    campos_obrigatorios_paciente: any
    configuracoes_whatsapp: any
    configuracoes_email: any
  }>> {
    return await fetchAPI<ApiResponse<any>>(
      `/api/clinic-settings?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Marca uma notificação como lida
   */
  async markNotificationAsRead(id: string): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'lida',
        data_leitura: new Date().toISOString(),
      }),
    })
  },

  /**
   * Marca todas as notificações como lidas
   */
  async markAllNotificationsAsRead(
    clinicaId: string,
    usuarioId: string
  ): Promise<ApiResponse<{ success: boolean; count: number }>> {
    return await fetchAPI<ApiResponse<{ success: boolean; count: number }>>(
      '/api/notifications/mark-all-read',
      {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinica_id: clinicaId,
          usuario_id: usuarioId,
        }),
      }
    )
  },

  /**
   * Remove notificações lidas
   */
  async deleteReadNotifications(
    clinicaId: string,
    usuarioId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    const queryParams = new URLSearchParams({
      clinica_id: clinicaId,
      usuario_id: usuarioId,
    })

    return await fetchAPI<ApiResponse<{ success: boolean }>>(
      `/api/notifications/read?${queryParams.toString()}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    )
  },

  // ============================================================
  // LISTA DE ESPERA (WAITLIST)
  // ============================================================

  /**
   * Busca lista de espera de uma clínica
   */
  async getWaitlist(
    clinicaId: string,
    status?: string
  ): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams({ clinica_id: clinicaId })
    if (status) {
      queryParams.append('status', status)
    }

    return await fetchAPI<ApiResponse<any[]>>(
      `/api/waitlist?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },

  /**
   * Adiciona paciente à lista de espera
   */
  async addToWaitlist(data: {
    clinica_id: string
    paciente_id: string
    profissional_id?: string
    servico_id?: string
    data_preferencia_inicio?: string
    data_preferencia_fim?: string
    horario_preferencia?: string
    dias_semana_preferidos?: number[]
    prioridade?: number
    motivo?: string
    observacoes?: string
  }): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>('/api/waitlist', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Atualiza entrada na lista de espera
   */
  async updateWaitlistEntry(id: string, data: {
    profissional_id?: string | null
    servico_id?: string | null
    data_preferencia_inicio?: string | null
    data_preferencia_fim?: string | null
    horario_preferencia?: string
    dias_semana_preferidos?: number[] | null
    prioridade?: number
    motivo?: string | null
    observacoes?: string | null
    status?: string
    agendamento_id?: string | null
  }): Promise<ApiResponse<any>> {
    return await fetchAPI<ApiResponse<any>>(`/api/waitlist/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
  },

  /**
   * Remove entrada da lista de espera
   */
  async removeFromWaitlist(id: string): Promise<{ success: boolean }> {
    return await fetchAPI<{ success: boolean }>(`/api/waitlist/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },

  // ============================================================
  // MÉTODOS GENÉRICOS HTTP
  // ============================================================

  /**
   * Método GET genérico para endpoints customizados
   */
  async get<T>(url: string): Promise<T> {
    return await fetchAPI<T>(url, {
      headers: getAuthHeaders(),
    })
  },

  /**
   * Método POST genérico para endpoints customizados
   */
  async post<T>(url: string, data?: unknown): Promise<T> {
    return await fetchAPI<T>(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Método PUT genérico para endpoints customizados
   */
  async put<T>(url: string, data?: unknown): Promise<T> {
    return await fetchAPI<T>(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Método DELETE genérico para endpoints customizados
   */
  async delete<T = void>(url: string): Promise<T> {
    return await fetchAPI<T>(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },

  /**
   * Método PATCH genérico para endpoints customizados
   */
  async patch<T>(url: string, data?: unknown): Promise<T> {
    return await fetchAPI<T>(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Verifica se há token salvo
   */
  hasToken(): boolean {
    return !!getAccessToken()
  },

  /**
   * Obtém o token atual
   */
  getToken(): string | null {
    return getAccessToken()
  },

  /**
   * Sincroniza a sessão do Supabase com o token salvo (não-bloqueante)
   * Deve ser chamado na inicialização da aplicação se já houver token
   */
  syncSupabaseSession(): void {
    const token = getAccessToken()
    const refreshToken = localStorage.getItem('allyra_refresh_token')

    if (!token || !supabase) {
      logger.debug('API', 'Sem token ou Supabase não configurado, ignorando sync')
      return
    }

    // Sincroniza em background para não bloquear a inicialização
    supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken || token,
    }).then(({ error }) => {
      if (error) {
        logger.warn('API', 'Erro ao sincronizar sessão Supabase na inicialização:', error.message)
      } else {
        logger.debug('API', 'Sessão Supabase sincronizada na inicialização')
      }
    }).catch(err => {
      logger.warn('API', 'Erro ao sincronizar sessão Supabase:', err)
    })
  },

  /**
   * Pré-carrega dados do dashboard em background (bootstrap)
   * Retorna todos os dados necessários para o dashboard em uma única request
   * Usa cache em memória no servidor (TTL 60s)
   */
  async getBootstrapData(clinicaId: string): Promise<ApiResponse<{
    appointments: any[]
    patients: any[]
    professionals: any[]
    insurances: any[]
    services: any[]
    summary: any
    _meta: {
      cachedAt: string
      ttl: number
    }
  }>> {
    return await fetchAPI<ApiResponse<any>>(
      `/api/dashboard/bootstrap?clinica_id=${clinicaId}`,
      {
        headers: getAuthHeaders(),
      }
    )
  },
}
