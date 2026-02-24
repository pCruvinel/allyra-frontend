/**
 * Hook para gerenciamento de dados médicos
 * Prontuários, evoluções, anamnese e anexos
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  medicalService,
  type ProntuarioFormatted,
  type EvolucaoClinicaFormatted,
  type TratamentoHistoricoFormatted,
  type AnamneseFormatted,
  type AnexoMedicoFormatted,
  type PatientMedicalDataFormatted,
} from '@/services/medical.service'
import { useAuth } from '@/contexts/AuthContext'

interface UseMedicalDataOptions {
  patientId?: string
  autoFetch?: boolean
}

// Tipos para input de criação/atualização
interface SaveAnamneseInput {
  hasHereditaryDisease: boolean
  hereditaryDiseaseDetails?: string
  usesMedication: boolean
  medicationDetails?: string
  allergies?: string
  surgeries?: string
  familyHistory?: string
}

interface CreateEvolucaoInput {
  title: string
  profissionalId?: string
}

interface CreateEtapaInput {
  description: string
  date?: string
  time?: string
  status?: 'Concluído' | 'Pendente'
}

interface CreateProntuarioInput {
  diagnosis: string
  complaint: string
  diseaseHistory?: string
  prescription?: string
  privateNotes?: string
  profissionalId?: string
}

interface CreateAnexoInput {
  name: string
  url: string
  code?: string
  type?: 'exame' | 'receita' | 'laudo' | 'outros'
  prontuarioId?: string
}

interface UseMedicalDataReturn {
  // Dados
  records: ProntuarioFormatted[]
  evolutions: EvolucaoClinicaFormatted[]
  treatmentHistory: TratamentoHistoricoFormatted[]
  anamnesis: AnamneseFormatted | null
  attachments: AnexoMedicoFormatted[]

  // Estado
  isLoading: boolean
  error: string | null

  // Métodos de leitura
  fetchMedicalData: (patientId: string) => Promise<PatientMedicalDataFormatted | null>
  fetchProntuarios: (patientId: string) => Promise<ProntuarioFormatted[]>
  fetchEvolucoes: (patientId: string) => Promise<EvolucaoClinicaFormatted[]>
  fetchTratamentos: (patientId: string) => Promise<TratamentoHistoricoFormatted[]>
  fetchAnamnese: (patientId: string) => Promise<AnamneseFormatted | null>
  fetchAnexos: (patientId: string) => Promise<AnexoMedicoFormatted[]>
  refresh: () => Promise<void>

  // Métodos de escrita
  saveAnamnese: (patientId: string, data: SaveAnamneseInput) => Promise<AnamneseFormatted | null>
  createEvolucao: (patientId: string, data: CreateEvolucaoInput) => Promise<EvolucaoClinicaFormatted | null>
  createEvolucaoEtapa: (evolucaoId: string, data: CreateEtapaInput) => Promise<boolean>
  createProntuario: (patientId: string, data: CreateProntuarioInput) => Promise<ProntuarioFormatted | null>
  createAnexo: (patientId: string, data: CreateAnexoInput) => Promise<AnexoMedicoFormatted | null>
  deleteAnexo: (anexoId: string) => Promise<boolean>
}

export function useMedicalData(options: UseMedicalDataOptions = {}): UseMedicalDataReturn {
  const { patientId, autoFetch = true } = options
  const { currentClinica } = useAuth()

  const [records, setRecords] = useState<ProntuarioFormatted[]>([])
  const [evolutions, setEvolutions] = useState<EvolucaoClinicaFormatted[]>([])
  const [treatmentHistory, setTreatmentHistory] = useState<TratamentoHistoricoFormatted[]>([])
  const [anamnesis, setAnamnesis] = useState<AnamneseFormatted | null>(null)
  const [attachments, setAttachments] = useState<AnexoMedicoFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMedicalData = useCallback(async (pId: string): Promise<PatientMedicalDataFormatted | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await medicalService.getPatientMedicalData(pId, currentClinica?.id)

      if (result.error) {
        setError(result.error.message)
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return null
      }

      const data = result.data!
      setRecords(data.records)
      setEvolutions(data.evolutions)
      setTreatmentHistory(data.treatmentHistory)
      setAnamnesis(data.anamnesis)
      setAttachments(data.attachments)

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar dados médicos'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const fetchProntuarios = useCallback(async (pId: string): Promise<ProntuarioFormatted[]> => {
    try {
      const result = await medicalService.getProntuarios(pId, currentClinica?.id)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      setRecords(result.data || [])
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar prontuários'
      toast.error(message)
      return []
    }
  }, [currentClinica?.id])

  const fetchEvolucoes = useCallback(async (pId: string): Promise<EvolucaoClinicaFormatted[]> => {
    try {
      const result = await medicalService.getEvolucoes(pId, currentClinica?.id)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      setEvolutions(result.data || [])
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar evoluções'
      toast.error(message)
      return []
    }
  }, [currentClinica?.id])

  const fetchTratamentos = useCallback(async (pId: string): Promise<TratamentoHistoricoFormatted[]> => {
    try {
      const result = await medicalService.getTratamentos(pId, currentClinica?.id)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      setTreatmentHistory(result.data || [])
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar tratamentos'
      toast.error(message)
      return []
    }
  }, [currentClinica?.id])

  const fetchAnamnese = useCallback(async (pId: string): Promise<AnamneseFormatted | null> => {
    try {
      const result = await medicalService.getAnamnese(pId, currentClinica?.id)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return null
      }
      setAnamnesis(result.data || null)
      return result.data || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar anamnese'
      toast.error(message)
      return null
    }
  }, [currentClinica?.id])

  const fetchAnexos = useCallback(async (pId: string): Promise<AnexoMedicoFormatted[]> => {
    try {
      const result = await medicalService.getAnexos(pId, currentClinica?.id)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      setAttachments(result.data || [])
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar anexos'
      toast.error(message)
      return []
    }
  }, [currentClinica?.id])

  const refresh = useCallback(async () => {
    if (patientId) {
      await fetchMedicalData(patientId)
    }
  }, [patientId, fetchMedicalData])

  // =====================================================
  // MÉTODOS DE ESCRITA
  // =====================================================

  const saveAnamnese = useCallback(async (
    pId: string,
    data: SaveAnamneseInput
  ): Promise<AnamneseFormatted | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.upsertAnamnese(pId, currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      toast.success('Anamnese salva com sucesso!')
      setAnamnesis(result.data!)
      return result.data!
    } catch {
      toast.error('Erro ao salvar anamnese')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const createEvolucao = useCallback(async (
    pId: string,
    data: CreateEvolucaoInput
  ): Promise<EvolucaoClinicaFormatted | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.createEvolucao(pId, currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      toast.success('Evolução clínica criada!')
      setEvolutions(prev => [result.data!, ...prev])
      return result.data!
    } catch {
      toast.error('Erro ao criar evolução')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const createEvolucaoEtapa = useCallback(async (
    evolucaoId: string,
    data: CreateEtapaInput
  ): Promise<boolean> => {
    setIsLoading(true)
    try {
      const result = await medicalService.createEvolucaoEtapa(evolucaoId, data)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Etapa adicionada!')
      // Atualizar a evolução no estado
      if (patientId) {
        await fetchEvolucoes(patientId)
      }
      return true
    } catch {
      toast.error('Erro ao criar etapa')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [patientId, fetchEvolucoes])

  const createProntuario = useCallback(async (
    pId: string,
    data: CreateProntuarioInput
  ): Promise<ProntuarioFormatted | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.createProntuario(pId, currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      toast.success('Prontuário criado com sucesso!')
      setRecords(prev => [result.data!, ...prev])
      return result.data!
    } catch {
      toast.error('Erro ao criar prontuário')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const createAnexo = useCallback(async (
    pId: string,
    data: CreateAnexoInput
  ): Promise<AnexoMedicoFormatted | null> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.createAnexo(pId, currentClinica.id, data)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      toast.success('Anexo adicionado com sucesso!')
      setAttachments(prev => [result.data!, ...prev])
      return result.data!
    } catch {
      toast.error('Erro ao adicionar anexo')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const deleteAnexo = useCallback(async (anexoId: string): Promise<boolean> => {
    if (!currentClinica?.id) {
      toast.error('Clínica não identificada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await medicalService.deleteAnexo(anexoId, currentClinica.id)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success('Anexo removido!')
      setAttachments(prev => prev.filter(a => a.id !== anexoId))
      return true
    } catch {
      toast.error('Erro ao remover anexo')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  // Auto-fetch quando o patientId mudar
  useEffect(() => {
    if (autoFetch && patientId) {
      fetchMedicalData(patientId)
    }
  }, [autoFetch, patientId, fetchMedicalData])

  return {
    records,
    evolutions,
    treatmentHistory,
    anamnesis,
    attachments,
    isLoading,
    error,
    fetchMedicalData,
    fetchProntuarios,
    fetchEvolucoes,
    fetchTratamentos,
    fetchAnamnese,
    fetchAnexos,
    refresh,
    // Métodos de escrita
    saveAnamnese,
    createEvolucao,
    createEvolucaoEtapa,
    createProntuario,
    createAnexo,
    deleteAnexo,
  }
}
