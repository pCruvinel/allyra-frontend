/**
 * Serviço de Dados Médicos
 * Prontuários, evoluções clínicas, anamnese e anexos
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { success, error, simulateDelay } from './base.service'
import type { ServiceResponse } from './types'

// =====================================================
// TIPOS DO BANCO
// =====================================================

export interface ProntuarioDB {
  id: string
  clinica_id: string
  paciente_id: string
  profissional_id: string | null
  diagnostico: string
  data_atendimento: string
  hora_atendimento: string
  queixa_principal: string
  historia_doenca: string | null
  prescricao: string | null
  observacoes_privadas: string | null
  assinado_por_nome: string | null
  assinado_por_crm: string | null
  assinado_em: string | null
  created_at: string
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
  }
}

export interface EvolucaoClinicaDB {
  id: string
  clinica_id: string
  paciente_id: string
  profissional_id: string | null
  titulo: string
  created_at: string
  updated_at: string
  etapas?: EvolucaoEtapaDB[]
}

export interface EvolucaoEtapaDB {
  id: string
  evolucao_id: string
  descricao: string
  data_etapa: string
  hora_etapa: string
  status: 'Concluído' | 'Pendente'
}

export interface TratamentoHistoricoDB {
  id: string
  clinica_id: string
  paciente_id: string
  tratamento: string
  queixa: string | null
  diagnostico: string | null
  data_tratamento: string
  status: 'Finalizada' | 'Em andamento' | 'Cancelada'
  created_at: string
}

export interface AnamneseDB {
  id: string
  clinica_id: string
  paciente_id: string
  profissional_id: string | null
  doenca_hereditaria: boolean
  doenca_hereditaria_detalhes: string | null
  usa_medicamento: boolean
  medicamento_detalhes: string | null
  alergias: string | null
  cirurgias: string | null
  historico_familiar: string | null
  created_at: string
  updated_at: string
}

export interface AnexoMedicoDB {
  id: string
  clinica_id: string
  paciente_id: string
  prontuario_id: string | null
  nome_arquivo: string
  codigo: string | null
  url: string
  tipo: 'exame' | 'receita' | 'laudo' | 'outros'
  created_at: string
}

// =====================================================
// TIPOS FORMATADOS PARA FRONTEND
// =====================================================

export interface ProntuarioFormatted {
  id: string
  patientId: string
  diagnosis: string
  date: string
  time: string
  complaint: string
  diseaseHistory: string | null
  prescription: string | null
  privateNotes: string | null
  signedBy: {
    name: string
    crm: string
    signedAt: string | null
  } | null
  createdAt: string
}

export interface EvolucaoClinicaFormatted {
  id: string
  patientId: string
  title: string
  stages: EvolucaoEtapaFormatted[]
  createdAt: string
}

export interface EvolucaoEtapaFormatted {
  id: string
  description: string
  date: string
  time: string
  status: 'Concluído' | 'Pendente'
}

export interface TratamentoHistoricoFormatted {
  id: string
  patientId: string
  treatment: string
  complaint: string | null
  diagnosis: string | null
  date: string
  status: 'Finalizada' | 'Em andamento' | 'Cancelada'
}

export interface AnamneseFormatted {
  id: string
  patientId: string
  hasHereditaryDisease: boolean
  hereditaryDiseaseDetails: string | null
  usesMedication: boolean
  medicationDetails: string | null
  allergies: string | null
  surgeries: string | null
  familyHistory: string | null
  createdAt: string
}

export interface AnexoMedicoFormatted {
  id: string
  patientId: string
  name: string
  code: string | null
  uploadedAt: string
  url: string
  type: 'exame' | 'receita' | 'laudo' | 'outros'
}

export interface PatientMedicalDataFormatted {
  records: ProntuarioFormatted[]
  evolutions: EvolucaoClinicaFormatted[]
  treatmentHistory: TratamentoHistoricoFormatted[]
  anamnesis: AnamneseFormatted | null
  attachments: AnexoMedicoFormatted[]
}

// =====================================================
// FUNÇÕES DE CONVERSÃO
// =====================================================

function formatProntuario(p: ProntuarioDB): ProntuarioFormatted {
  return {
    id: p.id,
    patientId: p.paciente_id,
    diagnosis: p.diagnostico,
    date: new Date(p.data_atendimento).toLocaleDateString('pt-BR'),
    time: p.hora_atendimento.substring(0, 5),
    complaint: p.queixa_principal,
    diseaseHistory: p.historia_doenca,
    prescription: p.prescricao,
    privateNotes: p.observacoes_privadas,
    signedBy: p.assinado_por_nome ? {
      name: p.assinado_por_nome,
      crm: p.assinado_por_crm || '',
      signedAt: p.assinado_em ? new Date(p.assinado_em).toLocaleString('pt-BR') : null,
    } : null,
    createdAt: new Date(p.created_at).toLocaleDateString('pt-BR'),
  }
}

function formatEvolucaoEtapa(e: EvolucaoEtapaDB): EvolucaoEtapaFormatted {
  return {
    id: e.id,
    description: e.descricao,
    date: new Date(e.data_etapa).toLocaleDateString('pt-BR'),
    time: e.hora_etapa.substring(0, 5),
    status: e.status,
  }
}

function formatEvolucaoClinica(e: EvolucaoClinicaDB): EvolucaoClinicaFormatted {
  return {
    id: e.id,
    patientId: e.paciente_id,
    title: e.titulo,
    stages: (e.etapas || []).map(formatEvolucaoEtapa),
    createdAt: new Date(e.created_at).toLocaleDateString('pt-BR'),
  }
}

function formatTratamentoHistorico(t: TratamentoHistoricoDB): TratamentoHistoricoFormatted {
  return {
    id: t.id,
    patientId: t.paciente_id,
    treatment: t.tratamento,
    complaint: t.queixa,
    diagnosis: t.diagnostico,
    date: new Date(t.data_tratamento).toLocaleDateString('pt-BR'),
    status: t.status,
  }
}

function formatAnamnese(a: AnamneseDB): AnamneseFormatted {
  return {
    id: a.id,
    patientId: a.paciente_id,
    hasHereditaryDisease: a.doenca_hereditaria,
    hereditaryDiseaseDetails: a.doenca_hereditaria_detalhes,
    usesMedication: a.usa_medicamento,
    medicationDetails: a.medicamento_detalhes,
    allergies: a.alergias,
    surgeries: a.cirurgias,
    familyHistory: a.historico_familiar,
    createdAt: new Date(a.created_at).toLocaleDateString('pt-BR'),
  }
}

function formatAnexoMedico(a: AnexoMedicoDB): AnexoMedicoFormatted {
  return {
    id: a.id,
    patientId: a.paciente_id,
    name: a.nome_arquivo,
    code: a.codigo,
    uploadedAt: new Date(a.created_at).toLocaleString('pt-BR'),
    url: a.url,
    type: a.tipo,
  }
}

// =====================================================
// SERVIÇO
// =====================================================

class MedicalService {
  // Buscar prontuários de um paciente
  async getProntuarios(patientId: string, clinicaId?: string): Promise<ServiceResponse<ProntuarioFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('prontuarios')
        .select('*')
        .eq('paciente_id', patientId)
        .order('data_atendimento', { ascending: false })

      if (clinicaId) {
        query = query.eq('clinica_id', clinicaId)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      const result = (data as ProntuarioDB[]).map(formatProntuario)
      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar prontuários', 'UNKNOWN_ERROR')
    }
  }

  // Buscar evoluções clínicas de um paciente
  async getEvolucoes(patientId: string, clinicaId?: string): Promise<ServiceResponse<EvolucaoClinicaFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('evolucoes_clinicas')
        .select(`
          *,
          etapas:evolucoes_etapas(*)
        `)
        .eq('paciente_id', patientId)
        .order('created_at', { ascending: false })

      if (clinicaId) {
        query = query.eq('clinica_id', clinicaId)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      const result = (data as EvolucaoClinicaDB[]).map(formatEvolucaoClinica)
      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar evoluções', 'UNKNOWN_ERROR')
    }
  }

  // Buscar histórico de tratamentos de um paciente
  async getTratamentos(patientId: string, clinicaId?: string): Promise<ServiceResponse<TratamentoHistoricoFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('tratamentos_historico')
        .select('*')
        .eq('paciente_id', patientId)
        .order('data_tratamento', { ascending: false })

      if (clinicaId) {
        query = query.eq('clinica_id', clinicaId)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      const result = (data as TratamentoHistoricoDB[]).map(formatTratamentoHistorico)
      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar tratamentos', 'UNKNOWN_ERROR')
    }
  }

  // Buscar anamnese de um paciente
  async getAnamnese(patientId: string, clinicaId?: string): Promise<ServiceResponse<AnamneseFormatted | null>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('anamneses')
        .select('*')
        .eq('paciente_id', patientId)

      if (clinicaId) {
        query = query.eq('clinica_id', clinicaId)
      }

      const { data, error: dbError } = await query.maybeSingle()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      if (!data) {
        return success(null)
      }

      return success(formatAnamnese(data as AnamneseDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar anamnese', 'UNKNOWN_ERROR')
    }
  }

  // Buscar anexos médicos de um paciente
  async getAnexos(patientId: string, clinicaId?: string): Promise<ServiceResponse<AnexoMedicoFormatted[]>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      let query = supabase
        .from('anexos_medicos')
        .select('*')
        .eq('paciente_id', patientId)
        .order('created_at', { ascending: false })

      if (clinicaId) {
        query = query.eq('clinica_id', clinicaId)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      const result = (data as AnexoMedicoDB[]).map(formatAnexoMedico)
      return success(result, result.length)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar anexos', 'UNKNOWN_ERROR')
    }
  }

  // Buscar todos os dados médicos de um paciente
  async getPatientMedicalData(patientId: string, clinicaId?: string): Promise<ServiceResponse<PatientMedicalDataFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const [records, evolutions, treatments, anamnesis, attachments] = await Promise.all([
        this.getProntuarios(patientId, clinicaId),
        this.getEvolucoes(patientId, clinicaId),
        this.getTratamentos(patientId, clinicaId),
        this.getAnamnese(patientId, clinicaId),
        this.getAnexos(patientId, clinicaId),
      ])

      // Verificar erros (exceto SUPABASE_NOT_CONFIGURED)
      const errors = [records, evolutions, treatments, anamnesis, attachments]
        .filter(r => r.error && r.error.code !== 'SUPABASE_NOT_CONFIGURED')

      if (errors.length > 0) {
        return error(errors[0].error!.message, errors[0].error!.code)
      }

      const medicalData: PatientMedicalDataFormatted = {
        records: records.data || [],
        evolutions: evolutions.data || [],
        treatmentHistory: treatments.data || [],
        anamnesis: anamnesis.data || null,
        attachments: attachments.data || [],
      }

      return success(medicalData)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao buscar dados médicos', 'UNKNOWN_ERROR')
    }
  }

  // =====================================================
  // MÉTODOS DE CRIAÇÃO/ATUALIZAÇÃO
  // =====================================================

  // Criar ou atualizar anamnese
  async upsertAnamnese(
    patientId: string,
    clinicaId: string,
    data: {
      hasHereditaryDisease: boolean
      hereditaryDiseaseDetails?: string
      usesMedication: boolean
      medicationDetails?: string
      allergies?: string
      surgeries?: string
      familyHistory?: string
    }
  ): Promise<ServiceResponse<AnamneseFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      // Verificar se já existe anamnese para o paciente
      const { data: existing } = await supabase
        .from('anamneses')
        .select('id')
        .eq('paciente_id', patientId)
        .eq('clinica_id', clinicaId)
        .maybeSingle()

      const anamneseData = {
        clinica_id: clinicaId,
        paciente_id: patientId,
        doenca_hereditaria: data.hasHereditaryDisease,
        doenca_hereditaria_detalhes: data.hereditaryDiseaseDetails || null,
        usa_medicamento: data.usesMedication,
        medicamento_detalhes: data.medicationDetails || null,
        alergias: data.allergies || null,
        cirurgias: data.surgeries || null,
        historico_familiar: data.familyHistory || null,
        updated_at: new Date().toISOString(),
      }

      let result
      if (existing?.id) {
        // Update
        result = await supabase
          .from('anamneses')
          .update(anamneseData)
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        // Insert
        result = await supabase
          .from('anamneses')
          .insert(anamneseData)
          .select()
          .single()
      }

      if (result.error) {
        return error(result.error.message, result.error.code)
      }

      return success(formatAnamnese(result.data as AnamneseDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao salvar anamnese', 'UNKNOWN_ERROR')
    }
  }

  // Criar nova evolução clínica
  async createEvolucao(
    patientId: string,
    clinicaId: string,
    data: {
      title: string
      profissionalId?: string
    }
  ): Promise<ServiceResponse<EvolucaoClinicaFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data: result, error: dbError } = await supabase
        .from('evolucoes_clinicas')
        .insert({
          clinica_id: clinicaId,
          paciente_id: patientId,
          profissional_id: data.profissionalId || null,
          titulo: data.title,
        })
        .select(`
          *,
          etapas:evolucoes_etapas(*)
        `)
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatEvolucaoClinica(result as EvolucaoClinicaDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar evolução', 'UNKNOWN_ERROR')
    }
  }

  // Criar nova etapa de evolução
  async createEvolucaoEtapa(
    evolucaoId: string,
    data: {
      description: string
      date?: string
      time?: string
      status?: 'Concluído' | 'Pendente'
    }
  ): Promise<ServiceResponse<EvolucaoEtapaFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const now = new Date()
      const { data: result, error: dbError } = await supabase
        .from('evolucoes_etapas')
        .insert({
          evolucao_id: evolucaoId,
          descricao: data.description,
          data_etapa: data.date || now.toISOString().split('T')[0],
          hora_etapa: data.time || now.toTimeString().substring(0, 5),
          status: data.status || 'Pendente',
        })
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatEvolucaoEtapa(result as EvolucaoEtapaDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar etapa', 'UNKNOWN_ERROR')
    }
  }

  // Criar novo prontuário
  async createProntuario(
    patientId: string,
    clinicaId: string,
    data: {
      diagnosis: string
      complaint: string
      diseaseHistory?: string
      prescription?: string
      privateNotes?: string
      profissionalId?: string
    }
  ): Promise<ServiceResponse<ProntuarioFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const now = new Date()
      const { data: result, error: dbError } = await supabase
        .from('prontuarios')
        .insert({
          clinica_id: clinicaId,
          paciente_id: patientId,
          profissional_id: data.profissionalId || null,
          diagnostico: data.diagnosis,
          queixa_principal: data.complaint,
          historia_doenca: data.diseaseHistory || null,
          prescricao: data.prescription || null,
          observacoes_privadas: data.privateNotes || null,
          data_atendimento: now.toISOString().split('T')[0],
          hora_atendimento: now.toTimeString().substring(0, 5),
        })
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatProntuario(result as ProntuarioDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar prontuário', 'UNKNOWN_ERROR')
    }
  }

  // Criar anexo médico
  async createAnexo(
    patientId: string,
    clinicaId: string,
    data: {
      name: string
      url: string
      code?: string
      type?: 'exame' | 'receita' | 'laudo' | 'outros'
      prontuarioId?: string
    }
  ): Promise<ServiceResponse<AnexoMedicoFormatted>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      const { data: result, error: dbError } = await supabase
        .from('anexos_medicos')
        .insert({
          clinica_id: clinicaId,
          paciente_id: patientId,
          prontuario_id: data.prontuarioId || null,
          nome_arquivo: data.name,
          codigo: data.code || null,
          url: data.url,
          tipo: data.type || 'outros',
        })
        .select()
        .single()

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(formatAnexoMedico(result as AnexoMedicoDB))
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao criar anexo', 'UNKNOWN_ERROR')
    }
  }

  // Deletar anexo médico
  // IMPORTANTE: clinicaId é OBRIGATÓRIO para validação multi-tenant e conformidade RLS
  // anexos_medicos não tem clinica_id direto, então validamos via prontuarios (JOIN)
  async deleteAnexo(anexoId: string, clinicaId: string): Promise<ServiceResponse<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      await simulateDelay()
      return error('Supabase não configurado', 'SUPABASE_NOT_CONFIGURED')
    }

    try {
      // Buscar anexo com JOIN para validar clínica via prontuário
      const { data: anexo, error: fetchError } = await supabase
        .from('anexos_medicos')
        .select(`
          id,
          prontuario:prontuarios!inner(clinica_id)
        `)
        .eq('id', anexoId)
        .single()

      if (fetchError) {
        return error(fetchError.message, fetchError.code)
      }

      // Validar que anexo pertence à clínica do usuário (via prontuário)
      // prontuario é array quando há JOIN, pegamos o primeiro elemento
      const prontuario = Array.isArray(anexo.prontuario) ? anexo.prontuario[0] : anexo.prontuario
      if (!prontuario || prontuario.clinica_id !== clinicaId) {
        return error('Anexo não pertence à clínica atual', 'FORBIDDEN')
      }

      // Deletar anexo (RLS valida via prontuario → paciente → clinica)
      const { error: dbError } = await supabase
        .from('anexos_medicos')
        .delete()
        .eq('id', anexoId)

      if (dbError) {
        return error(dbError.message, dbError.code)
      }

      return success(true)
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Erro ao deletar anexo', 'UNKNOWN_ERROR')
    }
  }
}

// Singleton
export const medicalService = new MedicalService()
