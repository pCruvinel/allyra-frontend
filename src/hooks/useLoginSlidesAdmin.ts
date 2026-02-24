/**
 * Hook para administração de slides do login
 *
 * Requer autenticação. Disponível apenas para:
 * - admin_master: gerencia slides globais e de todas as clínicas
 * - desenvolvedor: gerencia slides globais e de todas as clínicas
 * - administrador_total: gerencia apenas slides da própria clínica
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  loginSlidesService,
  type LoginSlide,
  type LoginSlidesAdminResponse,
  type CreateSlideData,
  type UpdateSlideData,
} from '@/services/login-slides.service'

interface UseLoginSlidesAdminOptions {
  /** Se definido, filtra slides por clínica. NULL = globais */
  clinicaId?: string | null
  /** Se true, busca dados ao montar o hook */
  autoFetch?: boolean
}

// Tipo de config retornado pela API admin
type AdminConfig = LoginSlidesAdminResponse['config']

interface UseLoginSlidesAdminReturn {
  // Estado
  slides: LoginSlide[]
  config: AdminConfig
  isLoading: boolean
  error: Error | null

  // CRUD
  createSlide: (data: CreateSlideData) => Promise<LoginSlide | null>
  updateSlide: (id: string, data: UpdateSlideData) => Promise<LoginSlide | null>
  deleteSlide: (id: string) => Promise<boolean>
  toggleSlideActive: (id: string, ativo: boolean) => Promise<boolean>

  // Ordenação
  reorderSlides: (orderedIds: string[]) => Promise<boolean>
  moveSlideUp: (id: string) => void
  moveSlideDown: (id: string) => void

  // Configuração
  updateConfig: (config: Partial<NonNullable<AdminConfig>>) => Promise<boolean>

  // Utilitários
  refetch: () => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isReordering: boolean
}

export function useLoginSlidesAdmin(
  options: UseLoginSlidesAdminOptions = {}
): UseLoginSlidesAdminReturn {
  const { clinicaId, autoFetch = true } = options

  // Estado principal
  const [slides, setSlides] = useState<LoginSlide[]>([])
  const [config, setConfig] = useState<AdminConfig>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Estados de operação
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  // Buscar slides
  const fetchSlides = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await loginSlidesService.getAdminSlides(
        clinicaId ? { clinicaId } : undefined
      )
      setSlides(response.slides ?? [])
      setConfig(response.config ?? null)
    } catch (err) {
      console.error('[useLoginSlidesAdmin] Erro ao buscar slides:', err)
      setError(err instanceof Error ? err : new Error('Erro ao buscar slides'))
      toast.error('Erro ao carregar slides')
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // Auto-fetch ao montar
  useEffect(() => {
    if (autoFetch) {
      fetchSlides()
    }
  }, [autoFetch, fetchSlides])

  // Criar slide
  const createSlide = useCallback(
    async (data: CreateSlideData): Promise<LoginSlide | null> => {
      setIsCreating(true)
      try {
        const newSlide = await loginSlidesService.createSlide(data)
        setSlides((prev) => [...prev, newSlide])
        toast.success('Slide criado com sucesso')
        return newSlide
      } catch (err) {
        console.error('[useLoginSlidesAdmin] Erro ao criar slide:', err)
        toast.error('Erro ao criar slide')
        return null
      } finally {
        setIsCreating(false)
      }
    },
    []
  )

  // Atualizar slide
  const updateSlide = useCallback(
    async (id: string, data: UpdateSlideData): Promise<LoginSlide | null> => {
      setIsUpdating(true)
      try {
        const updatedSlide = await loginSlidesService.updateSlide(id, data)
        setSlides((prev) => prev.map((s) => (s.id === id ? updatedSlide : s)))
        toast.success('Slide atualizado com sucesso')
        return updatedSlide
      } catch (err) {
        console.error('[useLoginSlidesAdmin] Erro ao atualizar slide:', err)
        toast.error('Erro ao atualizar slide')
        return null
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  // Deletar slide
  const deleteSlide = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true)
    try {
      await loginSlidesService.deleteSlide(id)
      setSlides((prev) => prev.filter((s) => s.id !== id))
      toast.success('Slide excluído com sucesso')
      return true
    } catch (err) {
      console.error('[useLoginSlidesAdmin] Erro ao excluir slide:', err)
      toast.error('Erro ao excluir slide')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // Toggle ativo/inativo
  const toggleSlideActive = useCallback(
    async (id: string, ativo: boolean): Promise<boolean> => {
      setIsUpdating(true)
      try {
        const updatedSlide = await loginSlidesService.updateSlide(id, { ativo })
        setSlides((prev) => prev.map((s) => (s.id === id ? updatedSlide : s)))
        toast.success(ativo ? 'Slide ativado' : 'Slide desativado')
        return true
      } catch (err) {
        console.error('[useLoginSlidesAdmin] Erro ao alterar status:', err)
        toast.error('Erro ao alterar status do slide')
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  // Reordenar slides (enviar para API)
  const reorderSlides = useCallback(async (orderedIds: string[]): Promise<boolean> => {
    setIsReordering(true)
    try {
      const slidesData = orderedIds.map((id, index) => ({ id, ordem: index }))
      await loginSlidesService.reorderSlides({ slides: slidesData })

      // Atualizar ordem local
      setSlides((prev) => {
        const slideMap = new Map(prev.map((s) => [s.id, s]))
        return orderedIds
          .map((id, index) => {
            const slide = slideMap.get(id)
            return slide ? { ...slide, ordem: index } : null
          })
          .filter((s): s is LoginSlide => s !== null)
      })

      toast.success('Ordem atualizada')
      return true
    } catch (err) {
      console.error('[useLoginSlidesAdmin] Erro ao reordenar:', err)
      toast.error('Erro ao reordenar slides')
      return false
    } finally {
      setIsReordering(false)
    }
  }, [])

  // Mover slide para cima (local, depois salva)
  const moveSlideUp = useCallback(
    (id: string) => {
      setSlides((prev) => {
        const index = prev.findIndex((s) => s.id === id)
        if (index <= 0) return prev

        const newSlides = [...prev]
        ;[newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]]

        // Atualizar ordem na API
        const orderedIds = newSlides.map((s) => s.id)
        reorderSlides(orderedIds)

        return newSlides
      })
    },
    [reorderSlides]
  )

  // Mover slide para baixo (local, depois salva)
  const moveSlideDown = useCallback(
    (id: string) => {
      setSlides((prev) => {
        const index = prev.findIndex((s) => s.id === id)
        if (index < 0 || index >= prev.length - 1) return prev

        const newSlides = [...prev]
        ;[newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]]

        // Atualizar ordem na API
        const orderedIds = newSlides.map((s) => s.id)
        reorderSlides(orderedIds)

        return newSlides
      })
    },
    [reorderSlides]
  )

  // Atualizar configuração
  const updateConfig = useCallback(
    async (newConfig: Partial<NonNullable<AdminConfig>>): Promise<boolean> => {
      if (!config) {
        toast.error('Configuração requer uma clínica selecionada')
        return false
      }

      try {
        // Aqui precisaríamos de um endpoint para atualizar config
        // Por enquanto, atualizamos localmente
        setConfig((prev) => (prev ? { ...prev, ...newConfig } : prev))
        toast.success('Configuração atualizada')
        return true
      } catch (err) {
        console.error('[useLoginSlidesAdmin] Erro ao atualizar config:', err)
        toast.error('Erro ao atualizar configuração')
        return false
      }
    },
    [config]
  )

  return {
    // Estado
    slides,
    config,
    isLoading,
    error,

    // CRUD
    createSlide,
    updateSlide,
    deleteSlide,
    toggleSlideActive,

    // Ordenação
    reorderSlides,
    moveSlideUp,
    moveSlideDown,

    // Configuração
    updateConfig,

    // Utilitários
    refetch: fetchSlides,
    isCreating,
    isUpdating,
    isDeleting,
    isReordering,
  }
}
