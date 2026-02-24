/**
 * Serviço de Documentos
 * Gerencia upload, download e exclusão de documentos via API
 */

import { apiService } from './api.service'
import type { ServiceResponse, ServiceError } from './types'

// =====================================================
// TIPOS
// =====================================================

export interface DocumentDB {
  id: string
  paciente_id: string
  clinica_id: string
  tipo: 'documento_administrativo' | 'termo_consentimento' | 'contrato'
  nome: string
  codigo?: string
  url: string
  storage_path?: string
  created_at: string
  updated_at: string
}

export interface DocumentFormatted {
  id: string
  patientId: string
  clinicaId: string
  type: 'documento_administrativo' | 'termo_consentimento' | 'contrato'
  name: string
  code?: string
  url: string
  storagePath?: string
  uploadedAt: string
  updatedAt: string
}

export interface UploadDocumentInput {
  file: File
  patientId: string
  type: 'documento_administrativo' | 'termo_consentimento' | 'contrato'
  name?: string
  code?: string
}

export interface ConsentUpdateInput {
  termsOfUse?: boolean
  privacyPolicy?: boolean
  contract?: boolean
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
      // Remover prefixo "data:xxx;base64," para enviar apenas os dados
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

// =====================================================
// SERVIÇO
// =====================================================

class DocumentsService {
  /**
   * Buscar documentos do paciente
   */
  async getDocuments(
    patientId: string,
    clinicaId: string,
    type?: DocumentFormatted['type']
  ): Promise<ServiceResponse<DocumentFormatted[]>> {
    try {
      let url = `/api/documents?clinica_id=${clinicaId}&patient_id=${patientId}`
      if (type) {
        url += `&type=${type}`
      }

      const response = await apiService.get<{ data: DocumentFormatted[]; count: number }>(url)

      return { data: response.data || [], error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao buscar documentos'),
      }
    }
  }

  /**
   * Upload de documento
   */
  async uploadDocument(
    clinicaId: string,
    input: UploadDocumentInput
  ): Promise<ServiceResponse<DocumentFormatted>> {
    // Validar arquivo
    const validation = validateFile(input.file)
    if (!validation.valid) {
      return { data: null, error: createError(validation.error || 'Arquivo inválido') }
    }

    try {
      // Converter para Base64
      const fileData = await fileToBase64(input.file)

      // Enviar para API
      const response = await apiService.post<{ data: DocumentFormatted }>('/api/documents', {
        fileData,
        mimeType: input.file.type,
        fileName: input.file.name,
        patientId: input.patientId,
        clinicaId,
        type: input.type,
        name: input.name,
        code: input.code,
      })

      return { data: response.data || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao fazer upload'),
      }
    }
  }

  /**
   * Deletar documento
   */
  async deleteDocument(documentId: string, clinicaId: string): Promise<ServiceResponse<boolean>> {
    try {
      await apiService.delete<{ success: boolean }>(
        `/api/documents/${documentId}?clinica_id=${clinicaId}`
      )

      return { data: true, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao deletar documento'),
      }
    }
  }

  /**
   * Download de documento (retorna URL assinada)
   * @param documentId ID do documento
   * @param clinicaId ID da clínica
   */
  async getDownloadUrl(documentId: string, clinicaId: string): Promise<ServiceResponse<string>> {
    try {
      const response = await apiService.get<{ data: { url: string; expiresIn: number } }>(
        `/api/documents/${documentId}/download?clinica_id=${clinicaId}`
      )

      return { data: response.data?.url || null, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao gerar URL de download'),
      }
    }
  }

  /**
   * Atualizar consentimentos do paciente
   */
  async updateConsent(
    patientId: string,
    clinicaId: string,
    data: ConsentUpdateInput
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Converter para formato do banco
      const updateData: Record<string, boolean> = {}

      if (data.termsOfUse !== undefined) {
        updateData.aceite_termos_uso = data.termsOfUse
      }
      if (data.privacyPolicy !== undefined) {
        updateData.aceite_politica_privacidade = data.privacyPolicy
      }
      if (data.contract !== undefined) {
        updateData.aceite_contrato = data.contract
      }

      // Usar endpoint de atualização de paciente
      await apiService.put<{ data: unknown }>(
        `/api/patients/${patientId}?clinica_id=${clinicaId}`,
        updateData
      )

      return { data: true, error: null }
    } catch (err) {
      return {
        data: null,
        error: createError(err instanceof Error ? err.message : 'Erro ao atualizar consentimentos'),
      }
    }
  }
}

// Singleton
export const documentsService = new DocumentsService()
