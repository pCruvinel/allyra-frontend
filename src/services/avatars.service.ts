/**
 * Serviço de Avatars
 * Gerencia upload, download e remoção de fotos de perfil via API
 */

import { apiService } from './api.service'
import type { ServiceResponse, ServiceError } from './types'

// =====================================================
// TIPOS
// =====================================================

export interface AvatarUploadResponse {
  url: string
  path: string
}

export interface AvatarResponse {
  url: string | null
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Cria um ServiceError a partir de uma mensagem
 */
function createError(message: string): ServiceError {
  return { message }
}

/**
 * Converte um File para Base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remover prefixo "data:image/xxx;base64," para enviar apenas os dados
      const base64Data = result.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Valida o arquivo de imagem
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Use: JPG, PNG, GIF ou WebP`,
    }
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: 5MB`,
    }
  }

  return { valid: true }
}

// =====================================================
// SERVIÇO
// =====================================================

class AvatarsService {
  /**
   * Faz upload do avatar do usuário autenticado
   * @param file Arquivo de imagem
   * @returns URL pública do avatar
   */
  async uploadAvatar(file: File): Promise<ServiceResponse<AvatarUploadResponse>> {
    // Validar arquivo
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return {
        data: null,
        error: createError(validation.error || 'Arquivo inválido'),
      }
    }

    try {
      // Converter para Base64
      const imageData = await fileToBase64(file)

      // Enviar para API - retorna { data: AvatarUploadResponse }
      const response = await apiService.post<{ data: AvatarUploadResponse }>('/api/users/avatar', {
        imageData,
        mimeType: file.type,
        fileName: file.name,
      })

      return {
        data: response.data || null,
        error: null,
      }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao fazer upload do avatar'),
      }
    }
  }

  /**
   * Remove o avatar do usuário autenticado
   */
  async deleteAvatar(): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.delete<{ success: boolean }>('/api/users/avatar')

      return {
        data: true,
        error: null,
      }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao remover avatar'),
      }
    }
  }

  /**
   * Obtém a URL do avatar de um usuário
   * @param userId ID do usuário
   * @returns URL do avatar ou null
   */
  async getAvatarUrl(userId: string): Promise<ServiceResponse<string | null>> {
    try {
      const response = await apiService.get<{ data: AvatarResponse }>(`/api/users/avatar/${userId}`)

      return {
        data: response.data?.url || null,
        error: null,
      }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar avatar'),
      }
    }
  }
}

// Singleton
export const avatarsService = new AvatarsService()
