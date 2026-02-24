/**
 * Hook para gerenciar pacientes no modo stand-alone
 * Usa API como fonte primária, com fallback para localStorage
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { metasStandaloneService, StandalonePatient } from '@/services/metas-standalone.service'
import { STORAGE_KEYS } from '../types/standalone'

// Tipo para formulário do paciente
export interface StandalonePatientFormData {
  nome: string
  dataNascimento?: string
  idade?: number
  responsavel?: string
  telefone?: string
  email?: string
  observacoes?: string
}

// Calcula idade a partir da data de nascimento
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Carrega pacientes do localStorage (fallback)
function loadPatientsFromStorage(): StandalonePatient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PATIENTS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Silently fail
  }
  return []
}

// Salva pacientes no localStorage (cache local)
function savePatientsToStorage(patients: StandalonePatient[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients))
  } catch {
    // Silently fail
  }
}

export function useStandalonePatients() {
  const { currentClinica } = useAuth()
  const clinicaId = currentClinica?.id || ''

  const [patients, setPatients] = useState<StandalonePatient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carrega pacientes da API ou localStorage
  const loadPatients = useCallback(async () => {
    if (!clinicaId) {
      setPatients([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await metasStandaloneService.listPatients(clinicaId)
      const apiPatients = response.data || []
      setPatients(apiPatients)
      savePatientsToStorage(apiPatients) // Cache local
    } catch (err) {
      console.warn('[useStandalonePatients] Falha ao carregar da API, usando localStorage:', err)
      // Fallback para localStorage
      const localPatients = loadPatientsFromStorage()
      setPatients(localPatients)
      setError('Modo offline - usando dados locais')
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // Carrega pacientes ao montar ou quando clínica muda
  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  // Cria um novo paciente
  const createPatient = useCallback(async (data: StandalonePatientFormData): Promise<StandalonePatient | null> => {
    if (!clinicaId) {
      toast.error('Selecione uma clínica primeiro')
      return null
    }

    try {
      const response = await metasStandaloneService.createPatient({
        clinica_id: clinicaId,
        nome: data.nome,
        data_nascimento: data.dataNascimento,
        idade: data.dataNascimento ? calculateAge(data.dataNascimento) : data.idade,
        responsavel: data.responsavel,
        telefone: data.telefone,
        email: data.email,
        observacoes: data.observacoes,
        status: 'ativo',
      })

      const newPatient = response.data
      setPatients(prev => {
        const updated = [...prev, newPatient]
        savePatientsToStorage(updated)
        return updated
      })

      toast.success('Paciente cadastrado com sucesso!')
      return newPatient
    } catch (err: unknown) {
      console.error('[useStandalonePatients] Erro ao criar paciente:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar paciente')
      return null
    }
  }, [clinicaId])

  // Atualiza um paciente existente
  const updatePatient = useCallback(async (id: string, data: Partial<StandalonePatientFormData>): Promise<boolean> => {
    if (!clinicaId) {
      toast.error('Selecione uma clínica primeiro')
      return false
    }

    try {
      const response = await metasStandaloneService.updatePatient(id, clinicaId, {
        nome: data.nome,
        data_nascimento: data.dataNascimento,
        idade: data.dataNascimento ? calculateAge(data.dataNascimento) : data.idade,
        responsavel: data.responsavel,
        telefone: data.telefone,
        email: data.email,
        observacoes: data.observacoes,
      })

      const updatedPatient = response.data
      setPatients(prev => {
        const updated = prev.map(p => p.id === id ? updatedPatient : p)
        savePatientsToStorage(updated)
        return updated
      })

      toast.success('Paciente atualizado com sucesso!')
      return true
    } catch (err: unknown) {
      console.error('[useStandalonePatients] Erro ao atualizar paciente:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar paciente')
      return false
    }
  }, [clinicaId])

  // Remove um paciente
  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    if (!clinicaId) {
      toast.error('Selecione uma clínica primeiro')
      return false
    }

    try {
      await metasStandaloneService.deletePatient(id, clinicaId)

      setPatients(prev => {
        const updated = prev.filter(p => p.id !== id)
        savePatientsToStorage(updated)
        return updated
      })

      toast.success('Paciente removido com sucesso!')
      return true
    } catch (err: unknown) {
      console.error('[useStandalonePatients] Erro ao remover paciente:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao remover paciente')
      return false
    }
  }, [clinicaId])

  // Alterna status do paciente (ativo/inativo)
  const togglePatientStatus = useCallback(async (id: string): Promise<boolean> => {
    if (!clinicaId) {
      toast.error('Selecione uma clínica primeiro')
      return false
    }

    try {
      const response = await metasStandaloneService.togglePatientStatus(id, clinicaId)

      const updatedPatient = response.data
      setPatients(prev => {
        const updated = prev.map(p => p.id === id ? updatedPatient : p)
        savePatientsToStorage(updated)
        return updated
      })

      toast.success('Status atualizado!')
      return true
    } catch (err: unknown) {
      console.error('[useStandalonePatients] Erro ao alternar status:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status')
      return false
    }
  }, [clinicaId])

  // Busca um paciente por ID
  const getPatientById = useCallback((id: string): StandalonePatient | undefined => {
    return patients.find(p => p.id === id)
  }, [patients])

  // Recarrega pacientes da API
  const refetch = useCallback(() => {
    return loadPatients()
  }, [loadPatients])

  // Pacientes ativos
  const activePatients = patients.filter(p => p.status === 'ativo')

  return {
    patients,
    activePatients,
    isLoading,
    error,
    createPatient,
    updatePatient,
    deletePatient,
    togglePatientStatus,
    getPatientById,
    refetch,
  }
}
