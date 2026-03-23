import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  medicalService,
  type AnamneseFormatted,
  type AnexoMedicoFormatted,
  type EvolucaoClinicaFormatted,
  type EvolucaoEtapaFormatted,
  type PatientMedicalDataFormatted,
  type ProntuarioFormatted,
  type TratamentoHistoricoFormatted,
} from '@/services/medical.service'
import type { ServiceResponse } from '@/services/types'
import { useAuth } from '@/contexts/AuthContext'
import type { MedicalAttachmentType, MedicalRecordErrata } from '@/types/medical-record'

interface UseMedicalDataOptions {
  patientId?: string
  autoFetch?: boolean
}

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
  status?: 'Concluido' | 'Pendente' | 'Concluído'
}

interface CreateProntuarioInput {
  agendamentoId: string
  diagnosis: string
  complaint: string
  diseaseHistory?: string
  prescription?: string
  privateNotes?: string
  profissionalId?: string
}

interface CreateAnexoInput {
  file: File
  prontuarioId: string
  type?: MedicalAttachmentType
  description?: string
}

interface UseMedicalDataReturn {
  records: ProntuarioFormatted[]
  evolutions: EvolucaoClinicaFormatted[]
  treatmentHistory: TratamentoHistoricoFormatted[]
  anamnesis: AnamneseFormatted | null
  attachments: AnexoMedicoFormatted[]
  isLoading: boolean
  error: string | null
  fetchMedicalData: (patientId: string) => Promise<PatientMedicalDataFormatted | null>
  fetchProntuarios: (patientId: string) => Promise<ProntuarioFormatted[]>
  fetchEvolucoes: (patientId: string) => Promise<EvolucaoClinicaFormatted[]>
  fetchTratamentos: (patientId: string) => Promise<TratamentoHistoricoFormatted[]>
  fetchAnamnese: (patientId: string) => Promise<AnamneseFormatted | null>
  fetchAnexos: (patientId: string) => Promise<AnexoMedicoFormatted[]>
  refresh: () => Promise<void>
  saveAnamnese: (patientId: string, data: SaveAnamneseInput) => Promise<AnamneseFormatted | null>
  createEvolucao: (patientId: string, data: CreateEvolucaoInput) => Promise<EvolucaoClinicaFormatted | null>
  createEvolucaoEtapa: (evolucaoId: string, data: CreateEtapaInput) => Promise<EvolucaoEtapaFormatted | null>
  createProntuario: (patientId: string, data: CreateProntuarioInput) => Promise<ProntuarioFormatted | null>
  signProntuario: (recordId: string) => Promise<ServiceResponse<ProntuarioFormatted>>
  createErrata: (recordId: string, text: string) => Promise<MedicalRecordErrata | null>
  createAnexo: (patientId: string, data: CreateAnexoInput) => Promise<AnexoMedicoFormatted | null>
  deleteAnexo: (attachmentId: string, prontuarioId: string) => Promise<boolean>
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

  const applyMedicalData = useCallback((data: PatientMedicalDataFormatted) => {
    setRecords(data.records)
    setEvolutions(data.evolutions)
    setTreatmentHistory(data.treatmentHistory)
    setAnamnesis(data.anamnesis)
    setAttachments(data.attachments)
  }, [])

  const fetchMedicalData = useCallback(async (requestedPatientId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await medicalService.getPatientMedicalData(requestedPatientId, currentClinica?.id)

      if (result.error || !result.data) {
        const message = result.error?.message || 'Erro ao buscar dados medicos'
        setError(message)
        toast.error(message)
        return null
      }

      applyMedicalData(result.data)
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar dados medicos'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [applyMedicalData, currentClinica?.id])

  const fetchProntuarios = useCallback(async (requestedPatientId: string) => {
    const result = await medicalService.getProntuarios(requestedPatientId, currentClinica?.id)
    if (result.error) {
      toast.error(result.error.message)
      return []
    }

    const nextRecords = result.data || []
    setRecords(nextRecords)
    return nextRecords
  }, [currentClinica?.id])

  const fetchEvolucoes = useCallback(async (requestedPatientId: string) => {
    const result = await medicalService.getEvolucoes(requestedPatientId, currentClinica?.id)
    if (result.error) {
      toast.error(result.error.message)
      return []
    }

    const nextEvolutions = result.data || []
    setEvolutions(nextEvolutions)
    return nextEvolutions
  }, [currentClinica?.id])

  const fetchTratamentos = useCallback(async (requestedPatientId: string) => {
    const result = await medicalService.getTratamentos(requestedPatientId, currentClinica?.id)
    if (result.error) {
      toast.error(result.error.message)
      return []
    }

    const nextHistory = result.data || []
    setTreatmentHistory(nextHistory)
    return nextHistory
  }, [currentClinica?.id])

  const fetchAnamnese = useCallback(async (requestedPatientId: string) => {
    const result = await medicalService.getAnamnese(requestedPatientId, currentClinica?.id)
    if (result.error) {
      toast.error(result.error.message)
      return null
    }

    const nextAnamnese = result.data || null
    setAnamnesis(nextAnamnese)
    return nextAnamnese
  }, [currentClinica?.id])

  const fetchAnexos = useCallback(async (requestedPatientId: string) => {
    const result = await medicalService.getAnexos(requestedPatientId, currentClinica?.id)
    if (result.error) {
      toast.error(result.error.message)
      return []
    }

    const nextAttachments = result.data || []
    setAttachments(nextAttachments)
    return nextAttachments
  }, [currentClinica?.id])

  const refresh = useCallback(async () => {
    if (!patientId) return
    await fetchMedicalData(patientId)
  }, [fetchMedicalData, patientId])

  const saveAnamnese = useCallback(async (requestedPatientId: string, data: SaveAnamneseInput) => {
    if (!currentClinica?.id) {
      toast.error('Clinica nao selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.upsertAnamnese(requestedPatientId, currentClinica.id, data)
      if (result.error || !result.data) {
        toast.error(result.error?.message || 'Erro ao salvar anamnese')
        return null
      }

      setAnamnesis(result.data)
      toast.success('Anamnese salva com sucesso')
      return result.data
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const createEvolucao = useCallback(async (requestedPatientId: string, data: CreateEvolucaoInput) => {
    if (!currentClinica?.id) {
      toast.error('Clinica nao selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.createEvolucao(requestedPatientId, currentClinica.id, data)
      if (result.error || !result.data) {
        toast.error(result.error?.message || 'Erro ao criar evolucao')
        return null
      }

      setEvolutions((current) => [result.data!, ...current])
      toast.success('Evolucao clinica criada')
      return result.data
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const createEvolucaoEtapa = useCallback(async (evolucaoId: string, data: CreateEtapaInput) => {
    setIsLoading(true)
    try {
      const result = await medicalService.createEvolucaoEtapa(evolucaoId, data)
      if (result.error || !result.data) {
        toast.error(result.error?.message || 'Erro ao criar etapa')
        return null
      }

      setEvolutions((current) =>
        current.map((evolution) =>
          evolution.id === evolucaoId
            ? { ...evolution, stages: [...evolution.stages, result.data!] }
            : evolution,
        ),
      )

      toast.success('Etapa adicionada')
      return result.data
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProntuario = useCallback(async (requestedPatientId: string, data: CreateProntuarioInput) => {
    if (!currentClinica?.id) {
      toast.error('Clinica nao selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.createProntuario(requestedPatientId, currentClinica.id, data)
      if (result.error || !result.data) {
        toast.error(result.error?.message || 'Erro ao criar prontuario')
        return null
      }

      setRecords((current) => [result.data!, ...current])
      toast.success('Prontuario em rascunho criado')
      return result.data
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const signProntuario = useCallback(async (recordId: string) => {
    if (!currentClinica?.id) {
      toast.error('Clinica nao selecionada')
      return {
        data: null,
        error: {
          message: 'Clinica nao selecionada',
          code: 'CLINICA_REQUIRED',
        },
      }
    }

    setIsLoading(true)
    try {
      const result = await medicalService.signProntuario(recordId, currentClinica.id)
      if (result.error || !result.data) {
        if (result.error?.code !== 'PENDING_GOAL_EVALUATIONS') {
          toast.error(result.error?.message || 'Erro ao assinar prontuario')
        }
        return result
      }

      setRecords((current) =>
        current.map((record) => (record.id === recordId ? result.data! : record)),
      )
      toast.success('Prontuario assinado com sucesso')
      return result
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const createErrata = useCallback(async (recordId: string, text: string) => {
    if (!currentClinica?.id) {
      toast.error('Clinica nao selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.createErrata(recordId, currentClinica.id, text)
      if (result.error || !result.data) {
        toast.error(result.error?.message || 'Erro ao criar errata')
        return null
      }

      setRecords((current) =>
        current.map((record) =>
          record.id === recordId
            ? { ...record, erratas: [...(record.erratas || []), result.data!] }
            : record,
        ),
      )
      toast.success('Errata registrada')
      return result.data
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const createAnexo = useCallback(async (requestedPatientId: string, data: CreateAnexoInput) => {
    if (!currentClinica?.id) {
      toast.error('Clinica nao selecionada')
      return null
    }

    setIsLoading(true)
    try {
      const result = await medicalService.createAnexo(requestedPatientId, currentClinica.id, data)
      if (result.error || !result.data) {
        toast.error(result.error?.message || 'Erro ao enviar anexo')
        return null
      }

      setAttachments((current) => [result.data!, ...current])
      toast.success('Anexo enviado com sucesso')
      return result.data
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  const deleteAnexo = useCallback(async (attachmentId: string, prontuarioId: string) => {
    if (!currentClinica?.id) {
      toast.error('Clinica nao selecionada')
      return false
    }

    setIsLoading(true)
    try {
      const result = await medicalService.deleteAnexo(attachmentId, currentClinica.id, prontuarioId)
      if (result.error || !result.data) {
        toast.error(result.error?.message || 'Erro ao remover anexo')
        return false
      }

      setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
      toast.success('Anexo removido')
      return true
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id])

  useEffect(() => {
    if (autoFetch && patientId) {
      fetchMedicalData(patientId)
    }
  }, [autoFetch, fetchMedicalData, patientId])

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
    saveAnamnese,
    createEvolucao,
    createEvolucaoEtapa,
    createProntuario,
    signProntuario,
    createErrata,
    createAnexo,
    deleteAnexo,
  }
}
