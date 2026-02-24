/**
 * Serviço de Pacientes
 * Busca dados de pacientes do Supabase
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { success, error, simulateDelay, generateId } from './base.service'
import type { ServiceResponse, QueryOptions } from './types'
import type { PatientListItem, PatientFull, PatientStatus, PatientMedicalData } from '@/types/patient'
import type {
  MedicalRecord,
  ClinicalEvolution,
  TreatmentHistory,
  Anamnesis,
  MedicalAttachment,
} from '@/types/medical-record'
import { medicalService, type PatientMedicalDataFormatted } from './medical.service'
import { createPatientSchema, validatePatient } from '@/schemas'

// Interface do banco
interface PacienteDB {
  id: string
  clinica_id: string
  nome_completo: string
  cpf: string | null
  data_nascimento: string | null
  sexo: string | null
  email: string | null
  telefone: string | null
  telefone_secundario: string | null
  endereco_completo: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  ativo: boolean
  created_at: string
  // Joins
  pacientes_convenios?: {
    convenio: {
      id: string
      nome: string
    }
  }[]
}

// Tipos para criação e atualização
export interface CreatePatientInput {
  name: string
  email: string
  cpf: string
  phone?: string
  birthDate?: string
  insurance: string
  status?: PatientStatus
}

// Input expandido para atualização de dados do paciente
export interface UpdatePatientInput {
  // Dados pessoais
  name?: string
  cpf?: string
  birthDate?: string
  gender?: string
  maritalStatus?: string
  avatar?: string

  // Contatos
  email?: string
  phone?: string
  phoneSecondary?: string

  // Responsáveis
  familyResponsible?: {
    cpf?: string
    name?: string
    relationship?: string
  }
  financialResponsible?: {
    cpf?: string
    name?: string
    relationship?: string
  }

  // Endereço
  cep?: string
  address?: string
  city?: string
  state?: string
  neighborhood?: string

  // Status
  status?: PatientStatus
}

// Converte PatientMedicalDataFormatted para PatientMedicalData (tipo esperado pelo PatientFull)
function toPatientMedicalData(data: PatientMedicalDataFormatted): PatientMedicalData {
  // Converter records
  const records: MedicalRecord[] = data.records.map(r => ({
    id: r.id,
    patientId: r.patientId,
    diagnosis: r.diagnosis,
    date: r.date,
    time: r.time,
    complaint: r.complaint,
    diseaseHistory: r.diseaseHistory || '',
    prescription: r.prescription || '',
    privateNotes: r.privateNotes || undefined,
    signedBy: r.signedBy ? {
      name: r.signedBy.name,
      crm: r.signedBy.crm,
      signedAt: r.signedBy.signedAt || undefined,
    } : { name: '', crm: '' },
    createdAt: r.createdAt,
  }))

  // Converter evolutions
  const evolutions: ClinicalEvolution[] = data.evolutions.map(e => ({
    id: e.id,
    patientId: e.patientId,
    title: e.title,
    stages: e.stages.map(s => ({
      id: s.id,
      description: s.description,
      date: s.date,
      time: s.time,
      status: s.status,
    })),
    createdAt: e.createdAt,
  }))

  // Converter treatmentHistory
  const treatmentHistory: TreatmentHistory[] = data.treatmentHistory.map(t => ({
    id: t.id,
    patientId: t.patientId,
    treatment: t.treatment,
    complaint: t.complaint || '',
    diagnosis: t.diagnosis || '',
    date: t.date,
    status: t.status,
  }))

  // Converter anamnesis
  const anamnesis: Anamnesis | undefined = data.anamnesis ? {
    id: data.anamnesis.id,
    patientId: data.anamnesis.patientId,
    hasHereditaryDisease: data.anamnesis.hasHereditaryDisease,
    hereditaryDiseaseDetails: data.anamnesis.hereditaryDiseaseDetails || undefined,
    usesMedication: data.anamnesis.usesMedication,
    medicationDetails: data.anamnesis.medicationDetails || undefined,
    allergies: data.anamnesis.allergies || undefined,
    surgeries: data.anamnesis.surgeries || undefined,
    familyHistory: data.anamnesis.familyHistory || undefined,
    createdAt: data.anamnesis.createdAt,
  } : undefined

  // Converter attachments
  const attachments: MedicalAttachment[] = data.attachments.map(a => ({
    id: a.id,
    patientId: a.patientId,
    name: a.name,
    code: a.code || '',
    uploadedAt: a.uploadedAt,
    url: a.url,
    type: a.type,
  }))

  return {
    records,
    evolutions,
    treatmentHistory,
    anamnesis,
    attachments,
  }
}

// Converte DB para PatientListItem
function toPatientListItem(p: PacienteDB): PatientListItem {
  const convenioData = p.pacientes_convenios?.[0]?.convenio
  const convenioNome = convenioData?.nome || 'Particular'
  const convenioId = convenioData?.id

  return {
    id: p.id,
    name: p.nome_completo,
    email: p.email || '',
    cpf: p.cpf || '',
    insurance: convenioNome,
    insuranceId: convenioId,
    status: p.ativo ? 'active' : 'inactive',
    phone: p.telefone || undefined,
    birthDate: p.data_nascimento || undefined,
  }
}

class PatientsService {
  async getAll(options?: QueryOptions & { clinicaId?: string }): Promise<ServiceResponse<PatientListItem[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('pacientes')
        .select(`
          *,
          pacientes_convenios(
            id,
            numero_carteirinha,
            convenio:convenios(id, nome)
          )
        `)
        .order('nome_completo', { ascending: true })

      if (options?.clinicaId) {
        query = query.eq('clinica_id', options.clinicaId)
      }

      const { data, error: dbError, count } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      let result = (data as PacienteDB[]).map(toPatientListItem)

      // Aplicar filtros de frontend
      if (options?.filters) {
        const { search, status, insurance } = options.filters

        if (search) {
          const searchLower = (search as string).toLowerCase()
          result = result.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.email.toLowerCase().includes(searchLower) ||
            p.cpf.includes(searchLower) ||
            (p.phone && p.phone.includes(searchLower))
          )
        }

        if (status && status !== 'all') {
          result = result.filter(p => p.status === status)
        }

        if (insurance && insurance !== 'all') {
          result = result.filter(p => p.insurance === insurance)
        }
      }

      return success(result, count ?? result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar pacientes', 'UNKNOWN_ERROR')
    }
  }

  async getById(id: string): Promise<ServiceResponse<PatientListItem>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('pacientes')
        .select(`
          *,
          pacientes_convenios(
            id,
            numero_carteirinha,
            convenio:convenios(id, nome)
          )
        `)
        .eq('id', id)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(toPatientListItem(data as PacienteDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar paciente', 'UNKNOWN_ERROR')
    }
  }

  // Busca detalhes completos do paciente
  async getFullDetails(id: string, clinicaId?: string): Promise<ServiceResponse<PatientFull>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      // Buscar dados básicos do paciente
      const { data: paciente, error: dbError } = await supabase
        .from('pacientes')
        .select(`
          *,
          pacientes_convenios(
            id,
            numero_carteirinha,
            validade,
            convenio:convenios(id, nome)
          )
        `)
        .eq('id', id)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      const p = paciente as PacienteDB & {
        pacientes_convenios?: {
          id: string
          numero_carteirinha: string | null
          validade: string | null
          convenio: { id: string; nome: string }
        }[]
      }

      // Buscar dados médicos
      const medicalResult = await medicalService.getPatientMedicalData(id, clinicaId)
      const medicalDataFormatted: PatientMedicalDataFormatted = medicalResult.data || {
        records: [],
        evolutions: [],
        treatmentHistory: [],
        anamnesis: null,
        attachments: [],
      }
      const medicalData = toPatientMedicalData(medicalDataFormatted)

      // Montar objeto completo
      const convenioData = p.pacientes_convenios?.[0]

      const fullData: PatientFull = {
        personal: {
          id: p.id,
          name: p.nome_completo,
          cpf: p.cpf || '',
          birthDate: p.data_nascimento || '',
          gender: p.sexo === 'masculino' ? 'M' : 'F',
          maritalStatus: 'Não informado',
          avatar: undefined,
        },
        contact: {
          email: p.email || '',
          phone: p.telefone || '',
          familyResponsible: undefined,
          financialResponsible: undefined,
        },
        address: {
          zipCode: p.cep || '',
          city: p.cidade || '',
          state: p.estado || '',
          street: p.endereco_completo || '',
          number: '',
          neighborhood: '',
          complement: '',
        },
        insurance: {
          insuranceName: convenioData?.convenio?.nome || 'Particular',
          cardNumber: convenioData?.numero_carteirinha || '',
          validUntil: convenioData?.validade || '',
          sessionsCompleted: 0,
          firstSession: undefined,
          nextSession: undefined,
        },
        documents: [],
        consent: {
          termsOfUse: false,
          privacyPolicy: false,
          contract: false,
        },
        status: p.ativo ? 'active' : 'inactive',
        medical: medicalData,
      }

      return success(fullData)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar detalhes do paciente', 'UNKNOWN_ERROR')
    }
  }

  // Cria novo paciente
  async create(data: CreatePatientInput, clinicaId: string): Promise<ServiceResponse<PatientListItem>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    // Validação com Zod
    const validation = validatePatient(createPatientSchema, data)
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0]
      return error(firstError, 'VALIDATION_ERROR')
    }

    try {
      // Verifica CPF duplicado
      const { data: existingCpf } = await supabase
        .from('pacientes')
        .select('id')
        .eq('cpf', data.cpf)
        .eq('clinica_id', clinicaId)
        .maybeSingle()

      if (existingCpf) {
        return error('CPF já cadastrado', 'DUPLICATE_CPF')
      }

      // Verifica email duplicado
      if (data.email) {
        const { data: existingEmail } = await supabase
          .from('pacientes')
          .select('id')
          .eq('email', data.email)
          .eq('clinica_id', clinicaId)
          .maybeSingle()

        if (existingEmail) {
          return error('Email já cadastrado', 'DUPLICATE_EMAIL')
        }
      }

      // Inserir paciente
      const { data: newPaciente, error: insertError } = await supabase
        .from('pacientes')
        .insert({
          id: generateId(),
          clinica_id: clinicaId,
          nome_completo: validation.data.name,
          email: validation.data.email,
          cpf: validation.data.cpf,
          telefone: validation.data.phone,
          data_nascimento: validation.data.birthDate,
          ativo: data.status !== 'inactive',
        })
        .select()
        .single()

      if (insertError) {
        return error(insertError.message, insertError.code)
      }

      return success(toPatientListItem(newPaciente as PacienteDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar paciente', 'UNKNOWN_ERROR')
    }
  }

  // Atualiza paciente
  // IMPORTANTE: clinicaId é obrigatório para validação multi-tenant
  async update(id: string, data: UpdatePatientInput, clinicaId: string): Promise<ServiceResponse<PatientListItem>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    if (!clinicaId) {
      return error('Clínica não especificada', 'CLINICA_REQUIRED')
    }

    try {
      const updateData: Record<string, unknown> = {}

      // Dados pessoais
      if (data.name) updateData.nome_completo = data.name
      if (data.cpf) updateData.cpf = data.cpf
      if (data.birthDate !== undefined) updateData.data_nascimento = data.birthDate
      if (data.gender !== undefined) updateData.sexo = data.gender
      if (data.maritalStatus !== undefined) updateData.estado_civil = data.maritalStatus
      if (data.avatar !== undefined) updateData.avatar_url = data.avatar

      // Contatos
      if (data.email !== undefined) updateData.email = data.email
      if (data.phone !== undefined) updateData.telefone = data.phone
      if (data.phoneSecondary !== undefined) updateData.telefone_secundario = data.phoneSecondary

      // Responsáveis (armazenados em JSONB)
      if (data.familyResponsible) {
        updateData.responsavel_familiar = data.familyResponsible
      }
      if (data.financialResponsible) {
        updateData.responsavel_financeiro = data.financialResponsible
      }

      // Endereço
      if (data.cep !== undefined) updateData.cep = data.cep
      if (data.address !== undefined) updateData.endereco_completo = data.address
      if (data.city !== undefined) updateData.cidade = data.city
      if (data.state !== undefined) updateData.estado = data.state
      if (data.neighborhood !== undefined) updateData.bairro = data.neighborhood

      // Status
      if (data.status) updateData.ativo = data.status === 'active'

      const { data: updated, error: updateError } = await supabase
        .from('pacientes')
        .update(updateData)
        .eq('id', id)
        .eq('clinica_id', clinicaId) // Validação multi-tenant
        .select(`
          *,
          pacientes_convenios(
            id,
            numero_carteirinha,
            convenio:convenios(id, nome)
          )
        `)
        .single()

      if (updateError) {
        return error(updateError.message, updateError.code)
      }

      return success(toPatientListItem(updated as PacienteDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao atualizar paciente', 'UNKNOWN_ERROR')
    }
  }

  // Altera status do paciente
  // IMPORTANTE: clinicaId é obrigatório para validação multi-tenant
  async changeStatus(id: string, status: PatientStatus, clinicaId: string): Promise<ServiceResponse<PatientListItem>> {
    return this.update(id, { status }, clinicaId)
  }

  // Deleta paciente (soft delete - marca como inativo)
  // IMPORTANTE: clinicaId é obrigatório para validação multi-tenant
  async delete(id: string, clinicaId: string): Promise<ServiceResponse<void>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    if (!clinicaId) {
      return error('Clínica não especificada', 'CLINICA_REQUIRED')
    }

    try {
      // Soft delete: marca como inativo ao invés de deletar
      const { error: updateError } = await supabase
        .from('pacientes')
        .update({ ativo: false })
        .eq('id', id)
        .eq('clinica_id', clinicaId) // Validação multi-tenant

      if (updateError) {
        return error(updateError.message, updateError.code)
      }

      return success(undefined)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao deletar paciente', 'UNKNOWN_ERROR')
    }
  }

  // Busca estatísticas de pacientes
  async getStats(clinicaId?: string): Promise<ServiceResponse<{
    total: number
    active: number
    inactive: number
    blocked: number
  }>> {
    const result = await this.getAll({ clinicaId })

    if (result.error) {
      return error(result.error.message, result.error.code)
    }

    const patients = result.data || []
    const stats = {
      total: patients.length,
      active: patients.filter(p => p.status === 'active').length,
      inactive: patients.filter(p => p.status === 'inactive').length,
      blocked: patients.filter(p => p.status === 'blocked').length,
    }

    return success(stats)
  }
}

// Singleton
export const patientsService = new PatientsService()
