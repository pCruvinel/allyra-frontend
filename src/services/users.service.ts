/**
 * Serviço de Usuários do Sistema
 * Busca dados de usuários via API centralizada
 */

import { apiService } from './api.service'
import { success, error } from './base.service'
import type { ServiceResponse, QueryOptions } from './types'
import type { UserStatus, PermissionLevel } from '@/types/user'

// Tipo de perfil no banco
export type PerfilTipoDB = 'super_admin' | 'admin_clinica' | 'profissional' | 'recepcionista' | 'financeiro' | 'visualizador'

// Interface do banco - usuarios
export interface UserDB {
  id: string
  email: string
  nome_completo: string
  cpf: string | null
  telefone: string | null
  foto_url: string | null
  perfil_tipo: PerfilTipoDB
  ativo: boolean
  is_test_data: boolean
  created_at: string
  updated_at: string
}

// Interface formatada para frontend
export interface SystemUserFormatted {
  id: string
  clientId: string
  clientCode: string
  clientName: string
  name: string
  email: string
  phone: string | null
  permissionLevel: PermissionLevel
  status: UserStatus
  lastAccess: string | null
  createdAt: string
}

// Filtros
export interface UserFilters {
  search?: string
  status?: UserStatus | ''
  clientId?: string
  permissionLevel?: PermissionLevel | ''
  [key: string]: unknown
}

// Input para criar usuário
export interface CreateUserInput {
  email: string
  nome_completo: string
  telefone?: string
  clinica_id: string
  perfil_tipo?: PerfilTipoDB
  permissao_nivel?: PermissionLevel
}

class UsersService {
  async getAll(options?: QueryOptions & { filters?: UserFilters }): Promise<ServiceResponse<SystemUserFormatted[]>> {
    try {
      const clinicaId = options?.filters?.clientId
      if (!clinicaId) {
        return error('ID da clínica é obrigatório', 'MISSING_CLINIC_ID')
      }

      // Montar query params
      const params = new URLSearchParams({ clinica_id: clinicaId })

      if (options?.filters?.search) {
        params.append('search', options.filters.search)
      }
      if (options?.filters?.status) {
        params.append('status', options.filters.status)
      }
      if (options?.filters?.permissionLevel) {
        params.append('permissionLevel', options.filters.permissionLevel)
      }

      const response = await apiService.get<{ data: SystemUserFormatted[]; count: number }>(
        `/api/users?${params.toString()}`
      )

      return success(response.data || [], response.count || 0)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar usuários', 'UNKNOWN_ERROR')
    }
  }

  async getByClientId(clientId: string): Promise<ServiceResponse<SystemUserFormatted[]>> {
    return this.getAll({ filters: { clientId } })
  }

  async getById(id: string): Promise<ServiceResponse<SystemUserFormatted>> {
    try {
      const response = await apiService.get<{ data: SystemUserFormatted }>(`/api/users/${id}`)

      return success(response.data!)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar usuário', 'UNKNOWN_ERROR')
    }
  }

  async create(input: CreateUserInput): Promise<ServiceResponse<SystemUserFormatted>> {
    try {
      const response = await apiService.post<{ data: SystemUserFormatted }>('/api/users', {
        clinica_id: input.clinica_id,
        email: input.email,
        nome_completo: input.nome_completo,
        telefone: input.telefone,
        perfil_tipo: input.perfil_tipo,
        permissao_nivel: input.permissao_nivel,
      })

      return success(response.data!)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar usuário', 'UNKNOWN_ERROR')
    }
  }

  async updateStatus(id: string, ativo: boolean): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.put<{ success: boolean }>(`/api/users/${id}/status`, { ativo })

      return success(true)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar status', 'UNKNOWN_ERROR')
    }
  }

  /**
   * Atualiza perfil do usuário (nome, telefone, foto e dados profissionais)
   */
  async updateProfile(userId: string, data: {
    nome_completo?: string
    telefone?: string
    foto_url?: string
    data_nascimento?: string
    endereco?: string
    registro_profissional?: string
    especialidade?: string
    bio?: string
  }): Promise<ServiceResponse<UserDB>> {
    try {
      const response = await apiService.put<{ data: UserDB }>(`/api/users/${userId}`, data)

      return success(response.data!)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar perfil', 'UNKNOWN_ERROR')
    }
  }

  async getSummary(clientId?: string): Promise<ServiceResponse<{
    total: number
    active: number
    inactive: number
    blocked: number
  }>> {
    try {
      const params = clientId ? `?clinica_id=${clientId}` : ''
      const response = await apiService.get<{ data: { total: number; active: number; inactive: number; blocked: number } }>(
        `/api/users/summary${params}`
      )

      return success(response.data!)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar resumo', 'UNKNOWN_ERROR')
    }
  }
}

// Singleton
export const usersService = new UsersService()
