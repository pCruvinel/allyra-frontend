// Service para gerenciar slides de login
import { apiService } from './api.service'

// Tipos
export interface LoginSlide {
  id: string
  clinica_id: string | null
  titulo: string
  descricao: string | null
  imagem_url: string | null
  imagem_storage_path: string | null
  botao_texto: string | null
  botao_link: string | null
  ordem: number
  ativo: boolean
  tipo: 'promocao' | 'noticia' | 'feature' | 'aviso' | 'custom'
  data_inicio: string | null
  data_fim: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface LoginSlidePublic {
  id: string
  titulo: string
  descricao: string | null
  imagem_url: string | null
  botao_texto: string | null
  botao_link: string | null
  tipo: string
}

export interface LoginSlidesConfig {
  intervalo_rotacao: number
}

export interface LoginSlidesPublicResponse {
  slides: LoginSlidePublic[]
  config: LoginSlidesConfig
}

export interface LoginSlideAdmin extends LoginSlide {
  can_edit: boolean
  can_delete: boolean
  is_global: boolean
}

export interface LoginSlidesAdminResponse {
  slides: LoginSlideAdmin[]
  config: {
    clinica_id: string
    usar_slides_globais: boolean
    usar_slides_proprios: boolean
    prioridade: string
    intervalo_rotacao: number
  } | null
  permissions: {
    can_create_global: boolean
    can_create_clinic: boolean
    user_clinica_id: string | null
  }
}

export interface CreateSlideData {
  clinica_id?: string | null
  titulo: string
  descricao?: string
  imagem_url?: string
  imagem_storage_path?: string
  botao_texto?: string
  botao_link?: string
  tipo?: 'promocao' | 'noticia' | 'feature' | 'aviso' | 'custom'
  data_inicio?: string
  data_fim?: string
  ativo?: boolean
}

export interface UpdateSlideData {
  titulo?: string
  descricao?: string | null
  imagem_url?: string | null
  imagem_storage_path?: string | null
  botao_texto?: string | null
  botao_link?: string | null
  tipo?: 'promocao' | 'noticia' | 'feature' | 'aviso' | 'custom'
  data_inicio?: string | null
  data_fim?: string | null
  ativo?: boolean
}

export interface ReorderSlidesData {
  slides: Array<{
    id: string
    ordem: number
  }>
}

class LoginSlidesService {
  private baseUrl = '/api/login-slides'

  /**
   * Lista slides públicos para exibição na tela de login
   * Este endpoint NÃO requer autenticação
   */
  async getPublicSlides(clinicaId?: string): Promise<LoginSlidesPublicResponse> {
    const params = new URLSearchParams()
    if (clinicaId) {
      params.append('clinica_id', clinicaId)
    }

    const url = params.toString()
      ? `${this.baseUrl}?${params.toString()}`
      : this.baseUrl

    // Fazer fetch diretamente sem passar pelo apiService (que exige auth)
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${apiUrl}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao buscar slides')
    }

    return response.json()
  }

  /**
   * Lista slides para administração (requer autenticação)
   */
  async getAdminSlides(options?: {
    clinicaId?: string
    incluirGlobais?: boolean
    apenasAtivos?: boolean
  }): Promise<LoginSlidesAdminResponse> {
    const params = new URLSearchParams()
    if (options?.clinicaId) {
      params.append('clinica_id', options.clinicaId)
    }
    if (options?.incluirGlobais !== undefined) {
      params.append('incluir_globais', String(options.incluirGlobais))
    }
    if (options?.apenasAtivos !== undefined) {
      params.append('apenas_ativos', String(options.apenasAtivos))
    }

    const url = params.toString()
      ? `${this.baseUrl}/admin?${params.toString()}`
      : `${this.baseUrl}/admin`

    const response = await apiService.get<LoginSlidesAdminResponse>(url)
    return response
  }

  /**
   * Criar novo slide
   */
  async createSlide(data: CreateSlideData): Promise<LoginSlide> {
    const response = await apiService.post<{ data: LoginSlide }>(this.baseUrl, data)
    return response.data
  }

  /**
   * Atualizar slide existente
   */
  async updateSlide(id: string, data: UpdateSlideData): Promise<LoginSlide> {
    const response = await apiService.put<{ data: LoginSlide }>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Deletar slide
   */
  async deleteSlide(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Reordenar slides
   */
  async reorderSlides(data: ReorderSlidesData): Promise<void> {
    await apiService.post(`${this.baseUrl}/reorder`, data)
  }
}

export const loginSlidesService = new LoginSlidesService()
