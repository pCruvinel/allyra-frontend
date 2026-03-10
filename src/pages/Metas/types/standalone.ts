/**
 * Types para o Modo Stand-alone do Módulo de Metas Terapêuticas
 * Usado quando o módulo é vendido/usado de forma avulsa, sem integração com o ERP
 *
 * NOTA: Tipos de Paciente removidos na unificação SSOT.
 * Pacientes agora são gerenciados exclusivamente pela tabela global `pacientes`.
 */

// Registro de atendimento/falta manual
export interface StandaloneAttendance {
  id: string
  pacienteId: string
  pacienteNome: string
  data: string
  horario?: string
  tipo: 'presente' | 'ausente'
  observacoes?: string
  createdAt: string
}

// Formulário de registro de atendimento
export interface StandaloneAttendanceFormData {
  pacienteId: string
  data: string
  horario?: string
  tipo: 'presente' | 'ausente'
  observacoes?: string
}

// Configuração do modo stand-alone
export interface MetasModeConfig {
  isStandaloneMode: boolean
  showOnboarding: boolean
}

// Constantes para localStorage
export const STORAGE_KEYS = {
  MODE: 'allyra_metas_standalone_mode',
  ATTENDANCE: 'allyra_metas_standalone_attendance',
  ONBOARDING_DISMISSED: 'allyra_metas_onboarding_dismissed',
} as const
