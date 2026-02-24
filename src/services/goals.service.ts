/**
 * Serviço de Metas Terapêuticas (M10)
 * Gerencia planos, metas, progresso e portal do paciente via API
 */

import { apiService } from './api.service'
import type { ServiceResponse, ServiceError } from './types'
import type {
  TherapeuticPlan,
  CreatePlanInput,
  UpdatePlanInput,
  TherapeuticGoal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalProgress,
  CreateProgressInput,
  GoalReport,
  PortalToken,
  GenerateTokenInput,
  PortalValidationResult,
  PortalData,
} from '@/types/goals'

// =====================================================
// HELPERS
// =====================================================

/**
 * Cria um ServiceError a partir de uma mensagem
 */
function createError(message: string): ServiceError {
  return { message }
}

// =====================================================
// SERVIÇO
// =====================================================

class GoalsService {
  // =====================================================
  // PLANOS TERAPÊUTICOS
  // =====================================================

  /**
   * Lista planos terapêuticos de uma clínica
   */
  async getPlans(
    clinicaId: string,
    filters?: { pacienteId?: string; status?: string }
  ): Promise<ServiceResponse<TherapeuticPlan[]>> {
    try {
      let url = `/api/goals/plans?clinica_id=${clinicaId}`
      if (filters?.pacienteId) {
        url += `&paciente_id=${filters.pacienteId}`
      }
      if (filters?.status) {
        url += `&status=${filters.status}`
      }

      const response = await apiService.get<{ data: TherapeuticPlan[]; count: number }>(url)

      return { data: response.data || [], error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar planos'),
      }
    }
  }

  /**
   * Busca plano por ID
   */
  async getPlanById(
    planId: string,
    clinicaId: string
  ): Promise<ServiceResponse<TherapeuticPlan>> {
    try {
      const response = await apiService.get<{ data: TherapeuticPlan }>(
        `/api/goals/plans/${planId}?clinica_id=${clinicaId}`
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar plano'),
      }
    }
  }

  /**
   * Lista planos de um paciente específico
   */
  async getPlansByPatient(
    pacienteId: string,
    clinicaId: string
  ): Promise<ServiceResponse<TherapeuticPlan[]>> {
    return this.getPlans(clinicaId, { pacienteId })
  }

  /**
   * Cria novo plano terapêutico
   */
  async createPlan(input: CreatePlanInput): Promise<ServiceResponse<TherapeuticPlan>> {
    try {
      const response = await apiService.post<{ data: TherapeuticPlan }>(
        '/api/goals/plans',
        input
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao criar plano'),
      }
    }
  }

  /**
   * Atualiza plano terapêutico
   */
  async updatePlan(
    planId: string,
    clinicaId: string,
    updates: UpdatePlanInput
  ): Promise<ServiceResponse<TherapeuticPlan>> {
    try {
      const response = await apiService.put<{ data: TherapeuticPlan }>(
        `/api/goals/plans/${planId}`,
        { clinica_id: clinicaId, ...updates }
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao atualizar plano'),
      }
    }
  }

  /**
   * Remove plano terapêutico
   */
  async deletePlan(planId: string, clinicaId: string): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.delete<{ success: boolean }>(
        `/api/goals/plans/${planId}?clinica_id=${clinicaId}`
      )

      return { data: true, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao remover plano'),
      }
    }
  }

  // =====================================================
  // METAS TERAPÊUTICAS
  // =====================================================

  /**
   * Lista metas de um plano
   */
  async getGoals(planoId: string): Promise<ServiceResponse<TherapeuticGoal[]>> {
    try {
      const response = await apiService.get<{ data: TherapeuticGoal[]; count: number }>(
        `/api/goals/plans/${planoId}/goals`
      )

      return { data: response.data || [], error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar metas'),
      }
    }
  }

  /**
   * Cria nova meta em um plano
   */
  async createGoal(
    planoId: string,
    input: Omit<CreateGoalInput, 'plano_id'>
  ): Promise<ServiceResponse<TherapeuticGoal>> {
    try {
      const response = await apiService.post<{ data: TherapeuticGoal }>(
        `/api/goals/plans/${planoId}/goals`,
        input
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao criar meta'),
      }
    }
  }

  /**
   * Atualiza uma meta
   */
  async updateGoal(
    goalId: string,
    updates: UpdateGoalInput
  ): Promise<ServiceResponse<TherapeuticGoal>> {
    try {
      const response = await apiService.put<{ data: TherapeuticGoal }>(
        `/api/goals/${goalId}`,
        updates
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao atualizar meta'),
      }
    }
  }

  /**
   * Remove uma meta
   */
  async deleteGoal(goalId: string): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.delete<{ success: boolean }>(
        `/api/goals/${goalId}`
      )

      return { data: true, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao remover meta'),
      }
    }
  }

  // =====================================================
  // REGISTRO DE PROGRESSO
  // =====================================================

  /**
   * Lista registros de progresso de uma meta
   */
  async getProgress(goalId: string): Promise<ServiceResponse<GoalProgress[]>> {
    try {
      const response = await apiService.get<{ data: GoalProgress[]; count: number }>(
        `/api/goals/${goalId}/progress`
      )

      return { data: response.data || [], error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar progresso'),
      }
    }
  }

  /**
   * Registra progresso em uma meta
   */
  async registerProgress(
    goalId: string,
    input: Omit<CreateProgressInput, 'meta_id'>
  ): Promise<ServiceResponse<GoalProgress>> {
    try {
      const response = await apiService.post<{ data: GoalProgress }>(
        `/api/goals/${goalId}/progress`,
        input
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao registrar progresso'),
      }
    }
  }

  /**
   * Busca histórico de progresso de um plano
   */
  async getProgressHistory(
    planoId: string,
    filters?: { dataInicio?: string; dataFim?: string }
  ): Promise<ServiceResponse<GoalProgress[]>> {
    try {
      let url = `/api/goals/plans/${planoId}/progress-history`
      const params = new URLSearchParams()
      if (filters?.dataInicio) params.set('data_inicio', filters.dataInicio)
      if (filters?.dataFim) params.set('data_fim', filters.dataFim)
      if (params.toString()) url += `?${params.toString()}`

      const response = await apiService.get<{ data: GoalProgress[] }>(url)

      return { data: response.data || [], error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar histórico'),
      }
    }
  }

  // =====================================================
  // RELATÓRIOS
  // =====================================================

  /**
   * Gera dados de relatório de um plano
   */
  async getReportData(
    planoId: string,
    clinicaId: string
  ): Promise<ServiceResponse<GoalReport>> {
    try {
      const response = await apiService.get<{ data: GoalReport }>(
        `/api/goals/plans/${planoId}/report?clinica_id=${clinicaId}`
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao gerar relatório'),
      }
    }
  }

  // =====================================================
  // PORTAL DO PACIENTE
  // =====================================================

  /**
   * Gera token de compartilhamento para portal do paciente
   */
  async generateShareLink(
    planoId: string,
    input: Omit<GenerateTokenInput, 'plano_id'>
  ): Promise<ServiceResponse<PortalToken>> {
    try {
      const response = await apiService.post<{ data: PortalToken }>(
        `/api/goals/plans/${planoId}/share`,
        input
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao gerar link'),
      }
    }
  }

  /**
   * Valida token do portal (rota pública)
   */
  async validatePortalToken(token: string): Promise<ServiceResponse<PortalValidationResult>> {
    try {
      const response = await apiService.get<{ data: PortalValidationResult }>(
        `/api/portal/${token}/validate`
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Token inválido ou expirado'),
      }
    }
  }

  /**
   * Busca dados do portal do paciente (rota pública)
   */
  async getPortalData(token: string): Promise<ServiceResponse<PortalData>> {
    try {
      const response = await apiService.get<{ data: PortalData }>(
        `/api/portal/${token}`
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar dados do portal'),
      }
    }
  }

  /**
   * Revoga um token de compartilhamento
   */
  async revokeToken(tokenId: string, clinicaId: string): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.delete<{ success: boolean }>(
        `/api/goals/tokens/${tokenId}?clinica_id=${clinicaId}`
      )

      return { data: true, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao revogar token'),
      }
    }
  }
}

// Singleton
export const goalsService = new GoalsService()
