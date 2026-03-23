import { apiService, ApiRequestError, type ApiResponse } from './api.service'
import { error, success } from './base.service'
import { medicalRecordAttachmentsService } from './medical-record-attachments.service'
import type { ServiceResponse } from './types'
import type {
  Anamnesis,
  ClinicalEvolution,
  EvolutionStage,
  MedicalAttachment,
  MedicalAttachmentType,
  MedicalRecord,
  MedicalRecordErrata,
  PatientMedicalData,
  TreatmentHistory,
} from '@/types/medical-record'

export type ProntuarioFormatted = MedicalRecord
export type EvolucaoClinicaFormatted = ClinicalEvolution
export type EvolucaoEtapaFormatted = EvolutionStage
export type TratamentoHistoricoFormatted = TreatmentHistory
export type AnamneseFormatted = Anamnesis
export type AnexoMedicoFormatted = MedicalAttachment
export type PatientMedicalDataFormatted = PatientMedicalData

interface MedicalRecordApi {
  id: string
  paciente_id: string
  agendamento_id?: string | null
  diagnostico?: string | null
  data_atendimento?: string | null
  hora_atendimento?: string | null
  queixa_principal?: string | null
  historia_doenca?: string | null
  prescricao?: string | null
  observacoes_privadas?: string | null
  assinado?: boolean | null
  data_assinatura?: string | null
  assinado_por_nome?: string | null
  assinado_por_crm?: string | null
  assinado_em?: string | null
  created_at: string
  updated_at?: string | null
  erratas?: MedicalRecordErrataApi[] | null
}

interface MedicalRecordErrataApi {
  id: string
  texto: string
  created_at: string
  criado_por_id?: string | null
}

interface ClinicalEvolutionApi {
  id: string
  paciente_id: string
  titulo?: string | null
  created_at: string
  updated_at?: string | null
  etapas?: EvolutionStageApi[] | null
}

interface EvolutionStageApi {
  id: string
  descricao: string
  data_etapa?: string | null
  hora_etapa?: string | null
  status?: string | null
}

interface TreatmentHistoryApi {
  id: string
  paciente_id: string
  tratamento: string
  queixa?: string | null
  diagnostico?: string | null
  data_tratamento: string
  status: TreatmentHistory['status']
}

interface AnamnesisApi {
  id: string
  paciente_id: string
  doenca_hereditaria: boolean
  doenca_hereditaria_detalhes?: string | null
  usa_medicamento: boolean
  medicamento_detalhes?: string | null
  alergias?: string | null
  cirurgias?: string | null
  historico_familiar?: string | null
  created_at: string
  updated_at?: string | null
}

interface SummaryAttachmentApi {
  id: string
  paciente_id?: string | null
  prontuario_id?: string | null
  nome_arquivo?: string | null
  codigo?: string | null
  url?: string | null
  url_arquivo?: string | null
  tipo?: MedicalAttachmentType | null
  tipo_arquivo?: MedicalAttachmentType | null
  created_at: string
}

interface SummaryApi {
  records?: MedicalRecordApi[]
  evolutions?: ClinicalEvolutionApi[]
  treatmentHistory?: TreatmentHistoryApi[]
  anamnesis?: AnamnesisApi | null
  attachments?: SummaryAttachmentApi[]
}

interface CreateEvolutionInput {
  title: string
  profissionalId?: string
}

interface CreateStageInput {
  description: string
  date?: string
  time?: string
  status?: 'Concluido' | 'Pendente' | 'Concluído'
}

interface CreateMedicalRecordInput {
  agendamentoId: string
  diagnosis: string
  complaint: string
  diseaseHistory?: string
  prescription?: string
  privateNotes?: string
  profissionalId?: string
}

interface SaveAnamneseInput {
  hasHereditaryDisease: boolean
  hereditaryDiseaseDetails?: string
  usesMedication: boolean
  medicationDetails?: string
  allergies?: string
  surgeries?: string
  familyHistory?: string
  profissionalId?: string
}

interface CreateAttachmentInput {
  file: File
  prontuarioId: string
  type?: MedicalAttachmentType
  description?: string
}

function mapErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

function mapServiceError<T>(
  err: unknown,
  fallbackMessage: string,
  fallbackCode: string,
): ServiceResponse<T> {
  if (err instanceof ApiRequestError) {
    return {
      data: null,
      error: {
        message: err.message || fallbackMessage,
        code: err.code || fallbackCode,
        details: err.details ?? err.payload?.pendingGoals ?? err.payload?.data ?? err.payload,
      },
    } satisfies ServiceResponse<T>
  }

  return error<T>(mapErrorMessage(err, fallbackMessage), fallbackCode)
}

function formatDate(value?: string | null): string {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('pt-BR')
}

function formatDateTime(value?: string | null): string | null {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('pt-BR')
}

function formatTime(value?: string | null): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

function formatErrata(errata: MedicalRecordErrataApi): MedicalRecordErrata {
  return {
    id: errata.id,
    text: errata.texto,
    createdAt: formatDateTime(errata.created_at) || errata.created_at,
    createdById: errata.criado_por_id || null,
  }
}

function formatMedicalRecord(record: MedicalRecordApi): MedicalRecord {
  const signedAt = formatDateTime(record.assinado_em || record.data_assinatura)

  return {
    id: record.id,
    patientId: record.paciente_id,
    appointmentId: record.agendamento_id || null,
    diagnosis: record.diagnostico || '',
    date: formatDate(record.data_atendimento || record.created_at),
    time: formatTime(record.hora_atendimento),
    complaint: record.queixa_principal || '',
    diseaseHistory: record.historia_doenca || null,
    prescription: record.prescricao || null,
    privateNotes: record.observacoes_privadas || null,
    isSigned: Boolean(record.assinado),
    signedAt,
    signedBy: record.assinado_por_nome
      ? {
          name: record.assinado_por_nome,
          crm: record.assinado_por_crm || undefined,
          signedAt,
        }
      : null,
    erratas: (record.erratas || []).map(formatErrata),
    createdAt: formatDate(record.created_at),
    updatedAt: formatDateTime(record.updated_at) || undefined,
  }
}

function formatEvolutionStage(stage: EvolutionStageApi): EvolutionStage {
  return {
    id: stage.id,
    description: stage.descricao,
    date: formatDate(stage.data_etapa),
    time: formatTime(stage.hora_etapa),
    status: (stage.status as EvolutionStage['status']) || 'Pendente',
  }
}

function formatEvolution(evolution: ClinicalEvolutionApi): ClinicalEvolution {
  return {
    id: evolution.id,
    patientId: evolution.paciente_id,
    title: evolution.titulo || 'Evolucao clinica',
    stages: (evolution.etapas || []).map(formatEvolutionStage),
    createdAt: formatDate(evolution.created_at),
    updatedAt: formatDateTime(evolution.updated_at) || undefined,
  }
}

function formatTreatment(history: TreatmentHistoryApi): TreatmentHistory {
  return {
    id: history.id,
    patientId: history.paciente_id,
    treatment: history.tratamento,
    complaint: history.queixa || null,
    diagnosis: history.diagnostico || null,
    date: formatDate(history.data_tratamento),
    status: history.status,
  }
}

function formatAnamnesis(anamnesis: AnamnesisApi): Anamnesis {
  return {
    id: anamnesis.id,
    patientId: anamnesis.paciente_id,
    hasHereditaryDisease: anamnesis.doenca_hereditaria,
    hereditaryDiseaseDetails: anamnesis.doenca_hereditaria_detalhes || null,
    usesMedication: anamnesis.usa_medicamento,
    medicationDetails: anamnesis.medicamento_detalhes || null,
    allergies: anamnesis.alergias || null,
    surgeries: anamnesis.cirurgias || null,
    familyHistory: anamnesis.historico_familiar || null,
    createdAt: formatDate(anamnesis.created_at),
    updatedAt: formatDateTime(anamnesis.updated_at) || undefined,
  }
}

function formatSummaryAttachment(
  attachment: SummaryAttachmentApi,
  patientId: string,
): MedicalAttachment {
  return {
    id: attachment.id,
    patientId: attachment.paciente_id || patientId,
    prontuarioId: attachment.prontuario_id || null,
    name: attachment.nome_arquivo || 'Anexo',
    code: attachment.codigo || null,
    uploadedAt: formatDateTime(attachment.created_at) || attachment.created_at,
    url: attachment.url || attachment.url_arquivo || '',
    type: attachment.tipo || attachment.tipo_arquivo || 'outros',
  }
}

async function requestSummary(
  patientId: string,
  clinicaId?: string,
): Promise<ServiceResponse<PatientMedicalDataFormatted>> {
  if (!clinicaId) {
    return error('Clinica nao selecionada', 'CLINICA_REQUIRED')
  }

  try {
    const response = await apiService.get<ApiResponse<SummaryApi>>(
      `/api/medical-records/summary?clinica_id=${encodeURIComponent(clinicaId)}&paciente_id=${encodeURIComponent(patientId)}`,
    )

    if (response.error) {
      return error(response.error, 'MEDICAL_SUMMARY_ERROR')
    }

    const payload = response.data || {}

    return success({
      records: (payload.records || []).map(formatMedicalRecord),
      evolutions: (payload.evolutions || []).map(formatEvolution),
      treatmentHistory: (payload.treatmentHistory || []).map(formatTreatment),
      anamnesis: payload.anamnesis ? formatAnamnesis(payload.anamnesis) : null,
      attachments: (payload.attachments || []).map((item) => formatSummaryAttachment(item, patientId)),
    })
  } catch (err) {
    return error(mapErrorMessage(err, 'Erro ao buscar dados medicos'), 'MEDICAL_SUMMARY_ERROR')
  }
}

class MedicalService {
  async getPatientMedicalData(
    patientId: string,
    clinicaId?: string,
  ): Promise<ServiceResponse<PatientMedicalDataFormatted>> {
    return requestSummary(patientId, clinicaId)
  }

  async getProntuarios(patientId: string, clinicaId?: string): Promise<ServiceResponse<ProntuarioFormatted[]>> {
    const response = await requestSummary(patientId, clinicaId)
    if (response.error) {
      return error(response.error.message, response.error.code)
    }

    return success(response.data?.records || [], response.data?.records.length || 0)
  }

  async getEvolucoes(patientId: string, clinicaId?: string): Promise<ServiceResponse<EvolucaoClinicaFormatted[]>> {
    const response = await requestSummary(patientId, clinicaId)
    if (response.error) {
      return error(response.error.message, response.error.code)
    }

    return success(response.data?.evolutions || [], response.data?.evolutions.length || 0)
  }

  async getTratamentos(patientId: string, clinicaId?: string): Promise<ServiceResponse<TratamentoHistoricoFormatted[]>> {
    const response = await requestSummary(patientId, clinicaId)
    if (response.error) {
      return error(response.error.message, response.error.code)
    }

    return success(response.data?.treatmentHistory || [], response.data?.treatmentHistory.length || 0)
  }

  async getAnamnese(patientId: string, clinicaId?: string): Promise<ServiceResponse<AnamneseFormatted | null>> {
    const response = await requestSummary(patientId, clinicaId)
    if (response.error) {
      return error(response.error.message, response.error.code)
    }

    if (!response.data?.anamnesis) {
      return success(null)
    }

    return success(response.data.anamnesis)
  }

  async getAnexos(patientId: string, clinicaId?: string): Promise<ServiceResponse<AnexoMedicoFormatted[]>> {
    const response = await requestSummary(patientId, clinicaId)
    if (response.error) {
      return error(response.error.message, response.error.code)
    }

    return success(response.data?.attachments || [], response.data?.attachments.length || 0)
  }

  async upsertAnamnese(
    patientId: string,
    clinicaId: string,
    data: SaveAnamneseInput,
  ): Promise<ServiceResponse<AnamneseFormatted>> {
    try {
      const response = await apiService.post<ApiResponse<AnamnesisApi>>('/api/medical-records/anamnesis', {
        clinica_id: clinicaId,
        paciente_id: patientId,
        profissional_id: data.profissionalId,
        hasHereditaryDisease: data.hasHereditaryDisease,
        hereditaryDiseaseDetails: data.hereditaryDiseaseDetails,
        usesMedication: data.usesMedication,
        medicationDetails: data.medicationDetails,
        allergies: data.allergies,
        surgeries: data.surgeries,
        familyHistory: data.familyHistory,
      })

      if (response.error || !response.data) {
        return error(response.error || 'Erro ao salvar anamnese', 'ANAMNESIS_SAVE_ERROR')
      }

      return success(formatAnamnesis(response.data))
    } catch (err) {
      return error(mapErrorMessage(err, 'Erro ao salvar anamnese'), 'ANAMNESIS_SAVE_ERROR')
    }
  }

  async createEvolucao(
    patientId: string,
    clinicaId: string,
    data: CreateEvolutionInput,
  ): Promise<ServiceResponse<EvolucaoClinicaFormatted>> {
    try {
      const response = await apiService.post<ApiResponse<ClinicalEvolutionApi>>('/api/medical-records/evolutions', {
        clinica_id: clinicaId,
        paciente_id: patientId,
        profissional_id: data.profissionalId,
        title: data.title,
      })

      if (response.error || !response.data) {
        return error(response.error || 'Erro ao criar evolucao', 'EVOLUTION_CREATE_ERROR')
      }

      return success(formatEvolution(response.data))
    } catch (err) {
      return error(mapErrorMessage(err, 'Erro ao criar evolucao'), 'EVOLUTION_CREATE_ERROR')
    }
  }

  async createEvolucaoEtapa(
    evolucaoId: string,
    data: CreateStageInput,
  ): Promise<ServiceResponse<EvolucaoEtapaFormatted>> {
    try {
      const response = await apiService.post<ApiResponse<EvolutionStageApi>>(
        `/api/medical-records/evolutions/${evolucaoId}/stages`,
        {
          description: data.description,
          date: data.date,
          time: data.time,
          status: data.status,
        },
      )

      if (response.error || !response.data) {
        return error(response.error || 'Erro ao criar etapa', 'EVOLUTION_STAGE_CREATE_ERROR')
      }

      return success(formatEvolutionStage(response.data))
    } catch (err) {
      return error(mapErrorMessage(err, 'Erro ao criar etapa'), 'EVOLUTION_STAGE_CREATE_ERROR')
    }
  }

  async createProntuario(
    patientId: string,
    clinicaId: string,
    data: CreateMedicalRecordInput,
  ): Promise<ServiceResponse<ProntuarioFormatted>> {
    try {
      const response = await apiService.post<ApiResponse<MedicalRecordApi>>('/api/medical-records', {
        clinica_id: clinicaId,
        paciente_id: patientId,
        profissional_id: data.profissionalId,
        agendamento_id: data.agendamentoId,
        diagnosis: data.diagnosis,
        complaint: data.complaint,
        diseaseHistory: data.diseaseHistory,
        prescription: data.prescription,
        privateNotes: data.privateNotes,
      })

      if (response.error || !response.data) {
        return error(response.error || 'Erro ao criar prontuario', 'MEDICAL_RECORD_CREATE_ERROR')
      }

      return success(formatMedicalRecord(response.data))
    } catch (err) {
      return error(mapErrorMessage(err, 'Erro ao criar prontuario'), 'MEDICAL_RECORD_CREATE_ERROR')
    }
  }

  async signProntuario(
    recordId: string,
    clinicaId: string,
  ): Promise<ServiceResponse<ProntuarioFormatted>> {
    try {
      const response = await apiService.post<ApiResponse<MedicalRecordApi>>(
        `/api/medical-records/${recordId}/sign`,
        { clinica_id: clinicaId },
      )

      if (response.error || !response.data) {
        return error(response.error || 'Erro ao assinar prontuario', 'MEDICAL_RECORD_SIGN_ERROR')
      }

      return success(formatMedicalRecord(response.data))
    } catch (err) {
      return mapServiceError(
        err,
        'Erro ao assinar prontuario',
        'MEDICAL_RECORD_SIGN_ERROR',
      )
    }
  }

  async createErrata(
    recordId: string,
    clinicaId: string,
    text: string,
  ): Promise<ServiceResponse<MedicalRecordErrata>> {
    try {
      const response = await apiService.post<ApiResponse<MedicalRecordErrataApi>>(
        `/api/medical-records/${recordId}/errata`,
        {
          clinica_id: clinicaId,
          texto: text,
        },
      )

      if (response.error || !response.data) {
        return error(response.error || 'Erro ao criar errata', 'MEDICAL_RECORD_ERRATA_ERROR')
      }

      return success(formatErrata(response.data))
    } catch (err) {
      return error(mapErrorMessage(err, 'Erro ao criar errata'), 'MEDICAL_RECORD_ERRATA_ERROR')
    }
  }

  async createAnexo(
    patientId: string,
    clinicaId: string,
    data: CreateAttachmentInput,
  ): Promise<ServiceResponse<AnexoMedicoFormatted>> {
    const result = await medicalRecordAttachmentsService.uploadAttachment({
      file: data.file,
      prontuarioId: data.prontuarioId,
      clinicaId,
      tipo: data.type,
      descricao: data.description,
    })

    if (result.error || !result.data) {
      return error(result.error?.message || 'Erro ao enviar anexo', 'MEDICAL_ATTACHMENT_CREATE_ERROR')
    }

    return success({
      id: result.data.id,
      patientId,
      prontuarioId: result.data.prontuarioId,
      name: result.data.nomeArquivo,
      code: null,
      uploadedAt: formatDateTime(result.data.createdAt) || result.data.createdAt,
      url: result.data.url,
      type: result.data.tipoArquivo,
    })
  }

  async deleteAnexo(
    attachmentId: string,
    clinicaId: string,
    prontuarioId: string,
  ): Promise<ServiceResponse<boolean>> {
    const result = await medicalRecordAttachmentsService.deleteAttachment(
      prontuarioId,
      attachmentId,
      clinicaId,
    )

    if (result.error || !result.data) {
      return error(result.error?.message || 'Erro ao remover anexo', 'MEDICAL_ATTACHMENT_DELETE_ERROR')
    }

    return success(true)
  }
}

export const medicalService = new MedicalService()
