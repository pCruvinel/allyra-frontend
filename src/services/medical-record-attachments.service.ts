/**
 * Serviço de Anexos de Prontuário
 * Gerencia upload, listagem e download de anexos via API
 */

import { apiService } from './api.service'
import type { ServiceResponse, ServiceError } from './types'

// =====================================================
// TIPOS
// =====================================================

export type AttachmentType = 'exame' | 'receita' | 'laudo' | 'imagem' | 'outros'

export interface AttachmentDB {
  id: string
  prontuario_id: string
  tipo_arquivo: AttachmentType
  nome_arquivo: string
  url_arquivo: string
  tamanho_bytes: number | null
  descricao: string | null
  uploaded_por_id: string
  created_at: string
}

export interface AttachmentFormatted {
  id: string
  prontuarioId: string
  tipoArquivo: AttachmentType
  nomeArquivo: string
  url: string
  tamanhoBytes: number | null
  descricao: string | null
  uploadedPorId: string
  uploadedPorNome: string
  createdAt: string
}

export interface UploadAttachmentInput {
  file: File
  prontuarioId: string
  clinicaId: string
  tipo?: AttachmentType
  descricao?: string
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
      const base64Data = result.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Valida o arquivo
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use: PDF, JPG, PNG, GIF, DOC ou DOCX',
    }
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Máximo: 10MB',
    }
  }

  return { valid: true }
}

/**
 * Formata tamanho do arquivo para exibição
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Retorna ícone baseado no tipo de arquivo
 */
export function getFileTypeIcon(tipo: AttachmentType): string {
  const icons: Record<AttachmentType, string> = {
    exame: '🔬',
    receita: '💊',
    laudo: '📋',
    imagem: '🖼️',
    outros: '📎',
  }
  return icons[tipo] || '📎'
}

/**
 * Retorna label do tipo de anexo
 */
export function getAttachmentTypeLabel(tipo: AttachmentType): string {
  const labels: Record<AttachmentType, string> = {
    exame: 'Exame',
    receita: 'Receita',
    laudo: 'Laudo',
    imagem: 'Imagem',
    outros: 'Outros',
  }
  return labels[tipo] || 'Outros'
}

// =====================================================
// SERVIÇO
// =====================================================

class MedicalRecordAttachmentsService {
  /**
   * Lista anexos de um prontuário
   */
  async getAttachments(
    prontuarioId: string,
    clinicaId: string
  ): Promise<ServiceResponse<AttachmentFormatted[]>> {
    try {
      const response = await apiService.get<{ data: AttachmentFormatted[]; count: number }>(
        `/api/medical-records/${prontuarioId}/attachments?clinica_id=${clinicaId}`
      )

      return { data: response.data || [], error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar anexos'),
      }
    }
  }

  /**
   * Upload de anexo
   */
  async uploadAttachment(
    input: UploadAttachmentInput
  ): Promise<ServiceResponse<AttachmentFormatted>> {
    // Validar arquivo
    const validation = validateFile(input.file)
    if (!validation.valid) {
      return { data: null, error: createError(validation.error || 'Arquivo inválido') }
    }

    try {
      // Converter para Base64
      const fileData = await fileToBase64(input.file)

      // Enviar para API
      const response = await apiService.post<{ data: AttachmentFormatted }>(
        `/api/medical-records/${input.prontuarioId}/attachments`,
        {
          fileData,
          mimeType: input.file.type,
          fileName: input.file.name,
          clinicaId: input.clinicaId,
          tipo: input.tipo || 'outros',
          descricao: input.descricao,
        }
      )

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao fazer upload'),
      }
    }
  }

  /**
   * Deletar anexo
   */
  async deleteAttachment(
    prontuarioId: string,
    attachmentId: string,
    clinicaId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.delete<{ success: boolean }>(
        `/api/medical-records/${prontuarioId}/attachments/${attachmentId}?clinica_id=${clinicaId}`
      )

      return { data: true, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao deletar anexo'),
      }
    }
  }

  /**
   * Download de anexo (retorna URL assinada)
   */
  async getDownloadUrl(
    prontuarioId: string,
    attachmentId: string,
    clinicaId: string
  ): Promise<ServiceResponse<string>> {
    try {
      const response = await apiService.get<{ data: { url: string; expiresIn: number } }>(
        `/api/medical-records/${prontuarioId}/attachments/${attachmentId}/download?clinica_id=${clinicaId}`
      )

      return { data: response.data?.url || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao gerar URL de download'),
      }
    }
  }
}

// Singleton
export const medicalRecordAttachmentsService = new MedicalRecordAttachmentsService()
