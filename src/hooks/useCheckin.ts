/**
 * useCheckin — Hook para gerenciamento do fluxo de check-in multimodal
 * Encapsula seleção de método, captura de evidência e chamada à API
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import { useAppointments } from '@/hooks/useAppointments'

export type CheckinMethod = 'fotografia' | 'assinatura' | 'manual'

interface UseCheckinReturn {
  // State
  selectedMethod: CheckinMethod | null
  setSelectedMethod: (m: CheckinMethod | null) => void
  justificativa: string
  setJustificativa: (j: string) => void
  capturedFile: File | null
  setCapturedFile: (f: File | null) => void
  isSubmitting: boolean

  // Actions
  submitCheckin: (appointmentId: string) => Promise<boolean>
  reset: () => void

  // Validation
  isValid: boolean
}

export function useCheckin(): UseCheckinReturn {
  const [selectedMethod, setSelectedMethod] = useState<CheckinMethod | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { refresh } = useAppointments({ autoFetch: false })

  const isValid = (() => {
    if (!selectedMethod) return false

    switch (selectedMethod) {
      case 'fotografia':
      case 'assinatura':
        return capturedFile !== null
      case 'manual':
        return justificativa.trim().length >= 10
      default:
        return false
    }
  })()

  const reset = useCallback(() => {
    setSelectedMethod(null)
    setJustificativa('')
    setCapturedFile(null)
    setIsSubmitting(false)
  }, [])

  const submitCheckin = useCallback(async (appointmentId: string): Promise<boolean> => {
    if (!selectedMethod || !isValid) {
      toast.error('Preencha todos os campos obrigatórios')
      return false
    }

    setIsSubmitting(true)

    try {
      await apiService.checkInAppointment(appointmentId, {
        metodo_checkin: selectedMethod,
        evidencia_file: capturedFile || undefined,
        justificativa_manual: selectedMethod === 'manual' ? justificativa.trim() : undefined,
      })

      const labels: Record<CheckinMethod, string> = {
        fotografia: 'Check-in por fotografia realizado!',
        assinatura: 'Check-in por assinatura realizado!',
        manual: 'Check-in manual registrado!',
      }

      toast.success(labels[selectedMethod])
      await refresh()
      reset()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao realizar check-in'
      toast.error(message)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedMethod, isValid, capturedFile, justificativa, refresh, reset])

  return {
    selectedMethod,
    setSelectedMethod,
    justificativa,
    setJustificativa,
    capturedFile,
    setCapturedFile,
    isSubmitting,
    submitCheckin,
    reset,
    isValid,
  }
}
