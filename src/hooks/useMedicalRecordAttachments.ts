/**
 * Hook para gerenciamento de anexos de prontuário
 * Upload, listagem e exclusão de anexos
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  medicalRecordAttachmentsService,
  type AttachmentFormatted,
  type UploadAttachmentInput,
  type AttachmentType,
} from '@/services/medical-record-attachments.service'
import { useAuth } from '@/contexts/AuthContext'

interface UseMedicalRecordAttachmentsOptions {
  prontuarioId?: string
  autoFetch?: boolean
}

interface UseMedicalRecordAttachmentsReturn {
  // Dados
  attachments: AttachmentFormatted[]

  // Estado
  isLoading: boolean
  isUploading: boolean
  error: string | null

  // Métodos
  fetchAttachments: (prontuarioId: string) => Promise<AttachmentFormatted[]>
  uploadAttachment: (
    input: Omit<UploadAttachmentInput, 'prontuarioId' | 'clinicaId'> & {
      prontuarioId?: string
    }
  ) => Promise<AttachmentFormatted | null>
  deleteAttachment: (prontuarioId: string, attachmentId: string) => Promise<boolean>
  downloadAttachment: (prontuarioId: string, attachment: AttachmentFormatted) => Promise<void>
  viewAttachment: (attachment: AttachmentFormatted) => void
  refresh: () => Promise<void>
}

export function useMedicalRecordAttachments(
  options: UseMedicalRecordAttachmentsOptions = {}
): UseMedicalRecordAttachmentsReturn {
  const { prontuarioId, autoFetch = true } = options
  const { currentClinica } = useAuth()

  const [attachments, setAttachments] = useState<AttachmentFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAttachments = useCallback(
    async (pId: string): Promise<AttachmentFormatted[]> => {
      if (!currentClinica?.id) {
        setError('Clínica não selecionada')
        return []
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await medicalRecordAttachmentsService.getAttachments(pId, currentClinica.id)

        if (result.error) {
          setError(result.error.message)
          toast.error(result.error.message)
          return []
        }

        setAttachments(result.data || [])
        return result.data || []
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar anexos'
        setError(message)
        toast.error(message)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [currentClinica?.id]
  )

  const uploadAttachment = useCallback(
    async (
      input: Omit<UploadAttachmentInput, 'prontuarioId' | 'clinicaId'> & {
        prontuarioId?: string
      }
    ): Promise<AttachmentFormatted | null> => {
      const pId = input.prontuarioId || prontuarioId
      if (!currentClinica?.id) {
        toast.error('Clínica não selecionada')
        return null
      }

      if (!pId) {
        toast.error('Prontuário não especificado')
        return null
      }

      setIsUploading(true)
      try {
        const result = await medicalRecordAttachmentsService.uploadAttachment({
          ...input,
          prontuarioId: pId,
          clinicaId: currentClinica.id,
        })

        if (result.error) {
          toast.error(result.error.message)
          return null
        }

        toast.success('Anexo enviado com sucesso!')
        setAttachments((prev) => [result.data!, ...prev])
        return result.data!
      } catch {
        toast.error('Erro ao enviar anexo')
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [currentClinica?.id, prontuarioId]
  )

  const deleteAttachment = useCallback(
    async (pId: string, attachmentId: string): Promise<boolean> => {
      if (!currentClinica?.id) {
        toast.error('Clínica não selecionada')
        return false
      }

      setIsLoading(true)
      try {
        const result = await medicalRecordAttachmentsService.deleteAttachment(
          pId,
          attachmentId,
          currentClinica.id
        )

        if (result.error) {
          toast.error(result.error.message)
          return false
        }

        toast.success('Anexo removido!')
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
        return true
      } catch {
        toast.error('Erro ao remover anexo')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [currentClinica?.id]
  )

  const downloadAttachment = useCallback(
    async (pId: string, attachment: AttachmentFormatted): Promise<void> => {
      if (!currentClinica?.id) {
        toast.error('Clínica não selecionada')
        return
      }

      try {
        const result = await medicalRecordAttachmentsService.getDownloadUrl(
          pId,
          attachment.id,
          currentClinica.id
        )

        if (result.error) {
          // Fallback para URL direta se falhar
          if (attachment.url) {
            const link = document.createElement('a')
            link.href = attachment.url
            link.download = attachment.nomeArquivo
            link.click()
          } else {
            toast.error(result.error.message)
          }
          return
        }

        const link = document.createElement('a')
        link.href = result.data!
        link.download = attachment.nomeArquivo
        link.click()
      } catch {
        toast.error('Erro ao baixar anexo')
      }
    },
    [currentClinica?.id]
  )

  const viewAttachment = useCallback((attachment: AttachmentFormatted): void => {
    if (attachment.url) {
      window.open(attachment.url, '_blank')
    }
  }, [])

  const refresh = useCallback(async () => {
    if (prontuarioId) {
      await fetchAttachments(prontuarioId)
    }
  }, [prontuarioId, fetchAttachments])

  // Auto-fetch quando o prontuarioId mudar
  useEffect(() => {
    if (autoFetch && prontuarioId) {
      fetchAttachments(prontuarioId)
    }
  }, [autoFetch, prontuarioId, fetchAttachments])

  return {
    attachments,
    isLoading,
    isUploading,
    error,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    viewAttachment,
    refresh,
  }
}

// Re-export types for convenience
export type { AttachmentFormatted, AttachmentType }
