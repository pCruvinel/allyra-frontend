/**
 * Hook para gerenciamento de pacientes
 * Encapsula chamadas à API e gerencia estado
 * Suporta multi-tenant via clinica_id do AuthContext
 *
 * MIGRADO: Usa apiService (HTTP) ao invés de Supabase SDK
 * REALTIME: Pode usar dados do DataContext para sincronização automática
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import type { PatientListItem, PatientFull, PatientStatus } from '@/types/patient'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'

// Tipos para input (aceita ambos formatos: snake_case da API e camelCase do frontend)
export type CreatePatientInput = {
  nome_completo?: string
  name?: string
  email?: string
  telefone?: string
  phone?: string
  cpf?: string
  data_nascimento?: string
  birthDate?: string
  insurance?: string // nome do convênio
}

export type UpdatePatientInput = Partial<CreatePatientInput>

interface QueryOptions {
  filters?: {
    search?: string
    status?: string
    insurance?: string
    clinicaId?: string
  }
}

interface UsePatientsOptions {
  autoFetch?: boolean
  initialFilters?: QueryOptions['filters']
  /** Se true, usa dados do DataContext (sincronizado via Realtime) */
  useRealtime?: boolean
}

interface UsePatientsReturn {
  // Estado
  patients: PatientListItem[]
  isLoading: boolean
  error: string | null
  total: number

  // Ações
  fetchPatients: (options?: QueryOptions) => Promise<void>
  createPatient: (data: CreatePatientInput) => Promise<PatientListItem | null>
  updatePatient: (id: string, data: UpdatePatientInput) => Promise<PatientListItem | null>
  deletePatient: (id: string) => Promise<boolean>
  changeStatus: (id: string, status: PatientStatus) => Promise<boolean>

  // Filtros
  setSearch: (search: string) => void
  setStatusFilter: (status: string) => void
  setInsuranceFilter: (insurance: string) => void
  refresh: () => Promise<void>
}

export function usePatients(options: UsePatientsOptions = {}): UsePatientsReturn {
  const { autoFetch = true, initialFilters, useRealtime = true } = options

  // Multi-tenant: obtém clínica atual do contexto de autenticação
  const { currentClinica } = useAuth()

  // DataContext para dados sincronizados via Realtime
  const dataContext = useData()

  const [localPatients, setLocalPatients] = useState<PatientListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localTotal, setLocalTotal] = useState(0)

  // Usa dados do DataContext se useRealtime=true, senão usa estado local
  const patients = useRealtime ? dataContext.patients : localPatients
  const total = useRealtime ? dataContext.patients.length : localTotal

  // Estado dos filtros (inclui clinica_id automaticamente) - mantido para compatibilidade futura
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_filters, setFilters] = useState<QueryOptions['filters']>(initialFilters || {})

  // Busca pacientes via API (filtra por clinica_id)
  // Se useRealtime=true, delega para DataContext
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchPatients = useCallback(async (_queryOptions?: QueryOptions) => {
    // Se usando Realtime, delega para DataContext
    if (useRealtime) {
      await dataContext.refreshPatients()
      return
    }

    // SEGURANÇA: clinica_id é obrigatório para evitar vazamento de dados
    if (!currentClinica?.id) {
      // Limpa dados mas não define erro para não travar loading
      setLocalPatients([])
      setLocalTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Usa apiService ao invés de Supabase SDK
      const result = await apiService.getPatients(currentClinica.id)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        // Mapeia dados da API para formato esperado pelo componente (PatientListItem)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedPatients: PatientListItem[] = (result.data || []).map((p: any) => {
          // Pegar primeiro convênio como principal
          const primaryInsurance = p.pacientes_convenios?.[0]
          return {
            id: p.id,
            name: p.nome_completo,
            email: p.email || '',
            cpf: p.cpf || '',
            phone: p.telefone,
            birthDate: p.data_nascimento,
            status: (p.status as PatientStatus) || 'active',
            insurance: primaryInsurance?.convenio?.nome || 'Particular',
            insuranceId: primaryInsurance?.convenio?.id,
          }
        })
        setLocalPatients(mappedPatients)
        setLocalTotal(result.count || mappedPatients.length)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar pacientes'

      // Se erro de sessão expirada, não mostra toast (apiService já faz redirect)
      if (message.includes('JWT') || message.includes('expired') || message.includes('Sessão')) {
        return
      }

      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, useRealtime, dataContext])

  // Cria paciente via API
  const createPatient = useCallback(async (data: CreatePatientInput): Promise<PatientListItem | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      // Normaliza campos para formato da API (snake_case)
      const apiData = {
        nome_completo: data.nome_completo || data.name,
        email: data.email,
        telefone: data.telefone || data.phone,
        cpf: data.cpf,
        data_nascimento: data.data_nascimento || data.birthDate,
      }

      const result = await apiService.createPatient(apiData, currentClinica.id)

      if (result.error) {
        toast.error(result.error)
        return null
      }

      toast.success('Paciente cadastrado com sucesso!')
      await fetchPatients()

      // Mapeia resposta para PatientListItem
      const p = result.data
      if (!p) return null
      return {
        id: p.id,
        name: p.nome_completo,
        email: p.email || '',
        cpf: p.cpf || '',
        phone: p.telefone,
        insurance: data.insurance || 'Particular',
        status: 'active' as PatientStatus,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar paciente'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchPatients, currentClinica?.id])

  // Atualiza paciente via API
  const updatePatient = useCallback(async (
    id: string,
    data: UpdatePatientInput
  ): Promise<PatientListItem | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)

    try {
      // Normaliza campos para formato da API (snake_case)
      const apiData = {
        nome_completo: data.nome_completo || data.name,
        email: data.email,
        telefone: data.telefone || data.phone,
        cpf: data.cpf,
        data_nascimento: data.data_nascimento || data.birthDate,
      }

      const result = await apiService.updatePatient(id, apiData, currentClinica.id)

      if (result.error) {
        toast.error(result.error)
        return null
      }

      toast.success('Paciente atualizado com sucesso!')
      await fetchPatients()

      // Mapeia resposta para PatientListItem
      const p = result.data
      if (!p) return null
      return {
        id: p.id,
        name: p.nome_completo,
        email: p.email || '',
        cpf: p.cpf || '',
        phone: p.telefone,
        insurance: data.insurance || 'Particular',
        status: 'active' as PatientStatus,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar paciente'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchPatients, currentClinica?.id])

  // Deleta paciente via API
  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    setIsLoading(true)

    try {
      const result = await apiService.deletePatient(id, currentClinica.id)

      if (!result.success) {
        toast.error('Erro ao remover paciente')
        return false
      }

      toast.success('Paciente removido com sucesso!')
      await fetchPatients()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover paciente'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [fetchPatients, currentClinica?.id])

  // Altera status via API (usa updatePatient)
  const changeStatus = useCallback(async (id: string, status: PatientStatus): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return false
    }

    try {
      const result = await apiService.updatePatient(id, { status }, currentClinica.id)

      if (result.error) {
        toast.error(result.error)
        return false
      }

      const statusLabels: Record<PatientStatus, string> = {
        active: 'ativado',
        inactive: 'inativado',
        blocked: 'bloqueado',
      }

      toast.success(`Paciente ${statusLabels[status]} com sucesso!`)
      await fetchPatients()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status'
      toast.error(message)
      return false
    }
  }, [fetchPatients, currentClinica?.id])

  // Helpers para filtros
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setInsuranceFilter = useCallback((insurance: string) => {
    setFilters(prev => ({ ...prev, insurance }))
  }, [])

  const refresh = useCallback(async () => {
    await fetchPatients()
  }, [fetchPatients])

  // Auto-fetch ao montar ou quando clínica muda
  // Se useRealtime=true, DataContext já carrega os dados automaticamente
  useEffect(() => {
    if (autoFetch && currentClinica?.id && !useRealtime) {
      fetchPatients()
    }
  }, [autoFetch, currentClinica?.id, fetchPatients, useRealtime])

  // Usar isLoading do DataContext quando useRealtime=true
  const effectiveIsLoading = useRealtime ? dataContext.isLoading : isLoading

  return {
    patients,
    isLoading: effectiveIsLoading,
    error,
    total,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    changeStatus,
    setSearch,
    setStatusFilter,
    setInsuranceFilter,
    refresh,
  }
}

/**
 * Hook para buscar detalhes de um paciente
 * Usa o endpoint GET /api/patients/:id
 */
export function usePatientDetails(patientId: string | undefined) {
  const { currentClinica } = useAuth()
  const [patient, setPatient] = useState<PatientFull | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatient = useCallback(async () => {
    if (!patientId || !currentClinica?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiService.getPatientById(patientId, currentClinica.id)

      if (result.error) {
        setError(result.error)
        setPatient(null)
      } else if (result.data) {
        // Mapeia dados da API para PatientFull
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = result.data as any
        const primaryInsurance = p.pacientes_convenios?.[0]
        const primaryResponsible = p.responsaveis_pacientes?.[0]

        const mapped: PatientFull = {
          personal: {
            id: p.id,
            name: p.nome_completo || '',
            cpf: p.cpf || '',
            birthDate: p.data_nascimento || '',
            gender: p.sexo || 'Outro',
            maritalStatus: p.estado_civil || 'Não informado',
            avatar: undefined,
          },
          contact: {
            email: p.email || '',
            phone: p.telefone || '',
            familyResponsible: primaryResponsible ? {
              cpf: primaryResponsible.cpf || '',
              name: primaryResponsible.nome_completo || '',
              relationship: primaryResponsible.parentesco || '',
            } : undefined,
          },
          address: {
            street: p.endereco?.logradouro || '',
            number: p.endereco?.numero || '',
            complement: p.endereco?.complemento,
            neighborhood: p.endereco?.bairro || '',
            city: p.endereco?.cidade || '',
            state: p.endereco?.estado || '',
            zipCode: p.endereco?.cep || '',
          },
          insurance: {
            insuranceName: primaryInsurance?.convenio?.nome || 'Particular',
            cardNumber: primaryInsurance?.numero_carteirinha || '',
            validUntil: primaryInsurance?.validade || '',
            sessionsCompleted: 0, // TODO: calcular com base em agendamentos
          },
          documents: [], // TODO: buscar documentos do paciente
          consent: {
            termsOfUse: false,
            privacyPolicy: false,
            contract: false,
          },
          status: (p.status as PatientStatus) || 'active',
        }

        setPatient(mapped)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar paciente'

      // Se erro de sessão expirada, não mostra na UI
      // O apiService já está redirecionando para /login
      if (message.includes('JWT') || message.includes('expired') || message.includes('Sessão')) {
        return // Não setar erro, deixar redirect acontecer silenciosamente
      }

      setError(message)
      setPatient(null)
    } finally {
      setIsLoading(false)
    }
  }, [patientId, currentClinica?.id])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  return {
    patient,
    isLoading,
    error,
    refresh: fetchPatient,
  }
}
