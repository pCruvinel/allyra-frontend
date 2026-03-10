/**
 * Serviço para comunicação com a API do módulo Metas Stand-alone
 *
 * NOTA: Seção PACIENTES removida na unificação SSOT.
 * Pacientes agora são gerenciados exclusivamente pela tabela global `pacientes`
 * e consumidos via `usePatients` hook.
 */

import { apiService } from './api.service'

// =====================================================
// TIPOS - Atendimentos Stand-alone
// =====================================================

export interface StandaloneAttendance {
  id: string
  clinica_id: string
  paciente_id: string
  data: string
  horario?: string
  tipo: 'presente' | 'ausente' | 'remarcado' | 'cancelado'
  observacoes?: string
  profissional_id?: string
  is_test_data?: boolean
  created_at: string
  created_by?: string
  paciente?: {
    id: string
    nome: string
  }
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
  }
}

export interface CreateStandaloneAttendanceInput {
  clinica_id: string
  paciente_id: string
  data: string
  horario?: string
  tipo: 'presente' | 'ausente' | 'remarcado' | 'cancelado'
  observacoes?: string
  profissional_id?: string
}

// =====================================================
// TIPOS - Configurações
// =====================================================

export interface MetasClinicConfig {
  id?: string
  clinica_id: string
  modo_standalone: boolean
  config: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

// =====================================================
// TIPOS - Estatísticas
// =====================================================

export interface PatientStats {
  total: number
  presentes: number
  ausentes: number
  remarcados: number
  cancelados: number
  taxaPresenca: number
}

// =====================================================
// SERVICE
// =====================================================

export const metasStandaloneService = {
  // =====================================================
  // ATENDIMENTOS
  // =====================================================

  /**
   * Lista atendimentos
   */
  async listAttendances(
    clinicaId: string,
    filters?: {
      paciente_id?: string
      data_inicio?: string
      data_fim?: string
      tipo?: string
    }
  ): Promise<{ data: StandaloneAttendance[]; count: number }> {
    const params = new URLSearchParams({ clinica_id: clinicaId })

    if (filters?.paciente_id) params.append('paciente_id', filters.paciente_id)
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.tipo) params.append('tipo', filters.tipo)

    return apiService.get<{ data: StandaloneAttendance[]; count: number }>(
      `/api/metas-standalone/attendance?${params.toString()}`
    )
  },

  /**
   * Busca atendimento por ID
   */
  async getAttendanceById(
    id: string,
    clinicaId: string
  ): Promise<{ data: StandaloneAttendance }> {
    return apiService.get<{ data: StandaloneAttendance }>(
      `/api/metas-standalone/attendance/${id}?clinica_id=${clinicaId}`
    )
  },

  /**
   * Registra atendimento
   */
  async createAttendance(
    input: CreateStandaloneAttendanceInput
  ): Promise<{ data: StandaloneAttendance }> {
    return apiService.post<{ data: StandaloneAttendance }>(
      '/api/metas-standalone/attendance',
      input
    )
  },

  /**
   * Atualiza atendimento
   */
  async updateAttendance(
    id: string,
    clinicaId: string,
    updates: Partial<Omit<CreateStandaloneAttendanceInput, 'clinica_id' | 'paciente_id'>>
  ): Promise<{ data: StandaloneAttendance }> {
    return apiService.put<{ data: StandaloneAttendance }>(
      `/api/metas-standalone/attendance/${id}`,
      { clinica_id: clinicaId, ...updates }
    )
  },

  /**
   * Remove atendimento
   */
  async deleteAttendance(
    id: string,
    clinicaId: string
  ): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(
      `/api/metas-standalone/attendance/${id}?clinica_id=${clinicaId}`
    )
  },

  /**
   * Obtém estatísticas de um paciente
   */
  async getPatientStats(
    pacienteId: string,
    clinicaId: string
  ): Promise<{ data: PatientStats }> {
    return apiService.get<{ data: PatientStats }>(
      `/api/metas-standalone/attendance/stats/${pacienteId}?clinica_id=${clinicaId}`
    )
  },

  // =====================================================
  // CONFIGURAÇÕES
  // =====================================================

  /**
   * Obtém configurações do módulo
   */
  async getConfig(clinicaId: string): Promise<{ data: MetasClinicConfig }> {
    return apiService.get<{ data: MetasClinicConfig }>(
      `/api/metas-standalone/config?clinica_id=${clinicaId}`
    )
  },

  /**
   * Atualiza configurações
   */
  async updateConfig(
    clinicaId: string,
    updates: { modo_standalone?: boolean; config?: Record<string, unknown> }
  ): Promise<{ data: MetasClinicConfig }> {
    return apiService.put<{ data: MetasClinicConfig }>(
      '/api/metas-standalone/config',
      { clinica_id: clinicaId, ...updates }
    )
  },

  /**
   * Alterna modo stand-alone
   */
  async toggleMode(clinicaId: string): Promise<{ data: MetasClinicConfig }> {
    return apiService.patch<{ data: MetasClinicConfig }>(
      '/api/metas-standalone/config/toggle-mode',
      { clinica_id: clinicaId }
    )
  },
}
