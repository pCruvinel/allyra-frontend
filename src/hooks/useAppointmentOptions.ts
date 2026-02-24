/**
 * Hook que consolida todas as options para o modal de agendamento
 * Busca pacientes, profissionais, serviços e convênios da clínica atual
 */

import { useMemo, useCallback } from 'react'
import { usePatients } from './usePatients'
import { useProfessionals } from './useProfessionals'
import { useServices } from './useServices'
import { useInsurances } from './useInsurances'
import { useRooms } from './useRooms'
import { useAuth } from '@/contexts/AuthContext'

// Tipos de options para selects
export interface SelectOption {
  value: string
  label: string
}

export interface PatientOption extends SelectOption {
  defaultInsuranceId?: string
  cpf?: string
  phone?: string
}

export interface ProfessionalOption extends SelectOption {
  specialties?: string[]
}

export interface ServiceOption extends SelectOption {
  durationMinutes?: number
}

export interface InsuranceOption extends SelectOption {
  type?: string
}

interface UseAppointmentOptionsReturn {
  // Options para selects
  patientsOptions: PatientOption[]
  professionalsOptions: ProfessionalOption[]
  servicesOptions: ServiceOption[]
  insurancesOptions: InsuranceOption[]
  roomsOptions: SelectOption[]
  timeOptions: SelectOption[]

  // Estados de loading
  isLoading: boolean
  isPatientsLoading: boolean
  isProfessionalsLoading: boolean
  isServicesLoading: boolean
  isInsurancesLoading: boolean
  isRoomsLoading: boolean

  // Helpers
  getPatientDefaultInsurance: (patientId: string) => string | undefined
  getServiceDuration: (serviceId: string) => number

  // Refresh
  refreshAll: () => Promise<void>

  // Create patient
  createPatient: ReturnType<typeof usePatients>['createPatient']
}

// Horários padrão para agendamento (08:00 às 18:00, intervalos de 30min)
const generateTimeOptions = (): SelectOption[] => {
  const options: SelectOption[] = []
  for (let hour = 8; hour <= 17; hour++) {
    options.push({ value: `${hour.toString().padStart(2, '0')}:00`, label: `${hour.toString().padStart(2, '0')}:00` })
    options.push({ value: `${hour.toString().padStart(2, '0')}:30`, label: `${hour.toString().padStart(2, '0')}:30` })
  }
  options.push({ value: '18:00', label: '18:00' })
  return options
}

export function useAppointmentOptions(): UseAppointmentOptionsReturn {
  // Verifica se há clínica selecionada
  const { currentClinica } = useAuth()

  // Busca dados de cada hook
  const {
    patients,
    isLoading: isPatientsLoading,
    createPatient,
    refresh: refreshPatients,
  } = usePatients({ autoFetch: true })

  const {
    professionals,
    isLoading: isProfessionalsLoading,
    refresh: refreshProfessionals,
  } = useProfessionals({ autoFetch: true })

  const {
    servicesOptions: rawServicesOptions,
    services,
    isLoading: isServicesLoading,
    refresh: refreshServices,
  } = useServices({ autoFetch: true, activeOnly: true })

  const {
    insurancesOptions: rawInsurancesOptions,
    isLoading: isInsurancesLoading,
    refresh: refreshInsurances,
  } = useInsurances({ autoFetch: true, activeOnly: true })

  const {
    roomsOptions: rawRoomsOptions,
    isLoading: isRoomsLoading,
    refresh: refreshRooms,
  } = useRooms({ autoFetch: true, activeOnly: true })

  // Converte pacientes para options
  const patientsOptions = useMemo<PatientOption[]>(() => {
    return patients.map(p => ({
      value: p.id,
      label: p.name,
      defaultInsuranceId: p.insuranceId,
      cpf: p.cpf,
      phone: p.phone,
    }))
  }, [patients])

  // Converte profissionais para options
  const professionalsOptions = useMemo<ProfessionalOption[]>(() => {
    return professionals.map(p => ({
      value: p.id,
      label: p.name,
      specialties: p.specialties,
    }))
  }, [professionals])

  // Serviços já vêm formatados
  const servicesOptions = useMemo<ServiceOption[]>(() => {
    return rawServicesOptions
  }, [rawServicesOptions])

  // Convênios já vêm formatados
  const insurancesOptions = useMemo<InsuranceOption[]>(() => {
    return rawInsurancesOptions
  }, [rawInsurancesOptions])

  // Salas já vêm formatadas
  const roomsOptions = useMemo<SelectOption[]>(() => {
    return rawRoomsOptions
  }, [rawRoomsOptions])

  // Horários disponíveis
  const timeOptions = useMemo(() => generateTimeOptions(), [])

  // Loading geral - só mostra loading se há clínica selecionada
  // Se não há clínica, não há nada para carregar
  const isLoading = currentClinica?.id
    ? (isPatientsLoading || isProfessionalsLoading || isServicesLoading || isInsurancesLoading || isRoomsLoading)
    : false

  // Helper: busca convênio default do paciente
  const getPatientDefaultInsurance = useCallback((patientId: string): string | undefined => {
    const patient = patients.find(p => p.id === patientId)
    return patient?.insuranceId
  }, [patients])

  // Helper: busca duração do serviço
  const getServiceDuration = useCallback((serviceId: string): number => {
    const service = services.find(s => s.id === serviceId)
    return service?.durationMinutes ?? 60 // Default: 60 minutos
  }, [services])

  // Refresh all
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshPatients(),
      refreshProfessionals(),
      refreshServices(),
      refreshInsurances(),
      refreshRooms(),
    ])
  }, [refreshPatients, refreshProfessionals, refreshServices, refreshInsurances, refreshRooms])

  return {
    patientsOptions,
    professionalsOptions,
    servicesOptions,
    insurancesOptions,
    roomsOptions,
    timeOptions,
    isLoading,
    isPatientsLoading,
    isProfessionalsLoading,
    isServicesLoading,
    isInsurancesLoading,
    isRoomsLoading,
    getPatientDefaultInsurance,
    getServiceDuration,
    refreshAll,
    createPatient,
  }
}
