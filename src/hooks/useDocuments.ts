/**
 * Hook para gerenciamento de documentos do paciente
 * Upload, download e exclusão de documentos
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  documentsService,
  type DocumentFormatted,
  type UploadDocumentInput,
  type ConsentUpdateInput,
} from '@/services/documents.service'
import { useAuth } from '@/contexts/AuthContext'

interface UseDocumentsOptions {
  patientId?: string
  type?: DocumentFormatted['type']
  autoFetch?: boolean
}

interface UseDocumentsReturn {
  // Dados
  documents: DocumentFormatted[]

  // Estado
  isLoading: boolean
  isUploading: boolean
  error: string | null

  // Métodos
  fetchDocuments: (patientId: string, type?: DocumentFormatted['type']) => Promise<DocumentFormatted[]>
  uploadDocument: (input: Omit<UploadDocumentInput, 'patientId'> & { patientId?: string }) => Promise<DocumentFormatted | null>
  deleteDocument: (documentId: string) => Promise<boolean>
  downloadDocument: (doc: DocumentFormatted) => Promise<void>
  viewDocument: (doc: DocumentFormatted) => void
  updateConsent: (patientId: string, data: ConsentUpdateInput) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const { patientId, type, autoFetch = true } = options
  const { currentClinica } = useAuth()

  const [documents, setDocuments] = useState<DocumentFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async (
    pId: string,
    docType?: DocumentFormatted['type']
  ): Promise<DocumentFormatted[]> => {
    if (!currentClinica?.id) {
      setError('Clínica não selecionada')
      return []
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await documentsService.getDocuments(pId, currentClinica.id, docType)

      if (result.error) {
        setError(result.error.message)
        toast.error(result.error.message)
        return []
      }

      setDocuments(result.data || [])
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar documentos'
      setError(message)
      toast.error(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const uploadDocument = useCallback(async (
    input: Omit<UploadDocumentInput, 'patientId'> & { patientId?: string }
  ): Promise<DocumentFormatted | null> => {
    const pId = input.patientId || patientId
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    if (!pId) {
      toast.error('Paciente não especificado')
      return null
    }

    setIsUploading(true)
    try {
      const result = await documentsService.uploadDocument(currentClinica.id, {
        ...input,
        patientId: pId,
      })

      if (result.error) {
        toast.error(result.error.message)
        return null
      }

      toast.success('Documento enviado com sucesso!')
      setDocuments(prev => [result.data!, ...prev])
      return result.data!
    } catch {
      toast.error('Erro ao enviar documento')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [currentClinica?.id, patientId])

  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não identificada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await documentsService.deleteDocument(documentId, currentClinica.id)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Documento removido!')
      setDocuments(prev => prev.filter(d => d.id !== documentId))
      return true
    } catch {
      toast.error('Erro ao remover documento')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const downloadDocument = useCallback(async (doc: DocumentFormatted): Promise<void> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return
    }

    try {
      // Usar URL assinada via API
      const result = await documentsService.getDownloadUrl(doc.id, currentClinica.id)
      if (result.error) {
        // Fallback para URL direta se falhar
        if (doc.url) {
          const link = document.createElement('a')
          link.href = doc.url
          link.download = doc.name
          link.click()
        } else {
          toast.error(result.error.message)
        }
        return
      }

      const link = document.createElement('a')
      link.href = result.data!
      link.download = doc.name
      link.click()
    } catch {
      toast.error('Erro ao baixar documento')
    }
  }, [currentClinica?.id])

  const viewDocument = useCallback((doc: DocumentFormatted): void => {
    if (doc.url) {
      window.open(doc.url, '_blank')
    }
  }, [])

  const updateConsent = useCallback(async (
    pId: string,
    data: ConsentUpdateInput
  ): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await documentsService.updateConsent(pId, currentClinica.id, data)

      if (result.error) {
        toast.error(result.error.message)
        return false
      }

      toast.success('Consentimentos atualizados!')
      return true
    } catch {
      toast.error('Erro ao atualizar consentimentos')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const refresh = useCallback(async () => {
    if (patientId) {
      await fetchDocuments(patientId, type)
    }
  }, [patientId, type, fetchDocuments])

  // Auto-fetch quando o patientId mudar
  useEffect(() => {
    if (autoFetch && patientId) {
      fetchDocuments(patientId, type)
    }
  }, [autoFetch, patientId, type, fetchDocuments])

  return {
    documents,
    isLoading,
    isUploading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    viewDocument,
    updateConsent,
    refresh,
  }
}
