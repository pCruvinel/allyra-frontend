import { createContext, useCallback, useContext, useState } from 'react'
import type { Appointment } from '@/types'

export type ModalType = 'arrival' | 'appointment' | 'payment' | 'absence' | 'patient' | null

interface ModalState {
  type: ModalType
  appointment: Appointment | null
  initialPatientId?: string
  initialProfessionalId?: string
}

interface ModalContextType {
  modalState: ModalState
  openModal: (
    type: ModalType,
    appointment?: Appointment,
    initialPatientId?: string,
    initialProfessionalId?: string,
  ) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    appointment: null,
    initialPatientId: undefined,
    initialProfessionalId: undefined,
  })

  const openModal = useCallback((
    type: ModalType,
    appointment?: Appointment,
    initialPatientId?: string,
    initialProfessionalId?: string,
  ) => {
    setModalState({
      type,
      appointment: appointment || null,
      // Se não passou initialPatientId explícito, usa o patientId do appointment
      initialPatientId: initialPatientId || appointment?.patientId,
      initialProfessionalId,
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState({
      type: null,
      appointment: null,
      initialPatientId: undefined,
      initialProfessionalId: undefined,
    })
  }, [])

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
