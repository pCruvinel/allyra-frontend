// =====================================================
// TIPOS - MÓDULO DE METAS TERAPÊUTICAS (M10)
// =====================================================

// Tipos base
export type GoalInputType = 'numerico' | 'booleano' | 'escala' | 'protocolo'
export type PlanStatus = 'ativo' | 'concluido' | 'cancelado'
export type ProgressStatus = 'pendente' | 'atingido' | 'parcial' | 'nao_atingido' | 'registrado'

// =====================================================
// PLANOS TERAPÊUTICOS
// =====================================================

export interface TherapeuticPlan {
  id: string
  clinica_id: string
  paciente_id: string
  nome: string
  tipo_plano?: string
  profissional_responsavel_id: string
  data_inicio: string
  data_fim: string // Renamed from data_fim_prevista for consistency
  data_fim_prevista?: string // Kept for backwards compatibility
  status: PlanStatus
  observacoes?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  paciente?: {
    id: string
    nome_completo: string
    data_nascimento?: string
    telefone?: string
    email?: string
  }
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
  }
  metas?: TherapeuticGoal[]
}

export interface CreatePlanInput {
  clinica_id: string
  paciente_id: string
  nome: string
  tipo_plano: string
  profissional_responsavel_id: string
  data_inicio: string
  data_fim_prevista?: string
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  status?: PlanStatus
}

// =====================================================
// METAS TERAPÊUTICAS
// =====================================================

export interface TherapeuticGoal {
  id: string
  plano_id: string
  titulo: string
  descricao?: string
  tipo_meta?: string
  tipo_input: GoalInputType
  meta_esperada: string
  unidade?: string
  especialidade?: string
  percentual_alvo?: number
  ativo: boolean
  created_at?: string
  // Computed fields (from progress)
  valor_atual?: number
  status?: 'pending' | 'achieved' | 'partial' | 'not-achieved'
  // Relacionamento
  plano?: {
    id: string
    nome: string
    clinica_id: string
    paciente_id: string
  }
}

export interface CreateGoalInput {
  plano_id: string
  titulo: string
  descricao?: string
  tipo_meta?: string
  tipo_input: GoalInputType
  meta_esperada: string
  unidade?: string
  especialidade?: string
  percentual_alvo?: number
}

export interface UpdateGoalInput extends Partial<Omit<CreateGoalInput, 'plano_id'>> {
  ativo?: boolean
}

// =====================================================
// REGISTRO DE PROGRESSO
// =====================================================

export interface GoalProgress {
  id: string
  meta_id: string
  clinica_id?: string
  prontuario_id?: string
  agendamento_id?: string
  profissional_id: string
  data_registro: string
  valor_registrado: string
  status_classificacao: ProgressStatus
  percentual_progresso?: number
  observacoes_subjetivas?: string
  created_at?: string
  // Relacionamentos
  meta?: TherapeuticGoal
  profissional?: {
    id: string
    usuario?: {
      nome_completo: string
    }
  }
}

export interface CreateProgressInput {
  meta_id: string
  clinica_id: string
  profissional_id: string
  data_registro: string
  valor_registrado: string
  prontuario_id?: string
  agendamento_id?: string
  status_classificacao?: ProgressStatus
  percentual_progresso?: number
  observacoes_subjetivas?: string
}

// =====================================================
// RELATÓRIOS
// =====================================================

export interface GoalReportStatistics {
  totalMetas: number
  totalRegistros: number
  metasAtingidas: number
  metasParciais: number
  metasNaoAtingidas: number
  taxaSucesso: number
}

export interface GoalProgressRecord {
  data: string
  valor: string
  status: ProgressStatus
}

export interface GoalProgressByMeta {
  meta: TherapeuticGoal
  registros: GoalProgressRecord[]
  ultimoRegistro: GoalProgressRecord | null
}

export interface GoalReport {
  plano: TherapeuticPlan
  metas: TherapeuticGoal[]
  estatisticas: GoalReportStatistics
  progressoPorMeta: GoalProgressByMeta[]
  periodoInicio: string
  periodoFim?: string
}

// =====================================================
// PORTAL DO PACIENTE
// =====================================================

export interface PortalTokenOptions {
  mostrarGraficos?: boolean
  mostrarParecer?: boolean
  mostrarRecomendacoes?: boolean
}

export interface PortalToken {
  id: string
  clinica_id: string
  paciente_id: string
  plano_id: string
  token: string
  opcoes: PortalTokenOptions
  expira_em: string
  acessos: number
  ultimo_acesso?: string
  ativo: boolean
  created_at?: string
  link?: string
}

export interface GenerateTokenInput {
  clinica_id: string
  paciente_id: string
  plano_id: string
  opcoes?: PortalTokenOptions
  dias_validade?: number
}

export interface PortalValidationResult {
  plano_id: string
  paciente_id: string
  clinica_id: string
  paciente_nome: string
  plano_nome: string
  opcoes: PortalTokenOptions
  valido: boolean
}

export interface PortalMetaData {
  titulo: string
  tipoInput: GoalInputType
  metaEsperada: string
  unidade?: string
  registros: GoalProgressRecord[]
}

export interface PortalData {
  paciente: {
    id?: string
    nome: string
  }
  clinica?: {
    id?: string
    nome: string
  }
  plano: {
    id?: string
    nome: string
    data_inicio: string
    data_fim: string
    status?: PlanStatus
    observacoes?: string
    profissional?: string
  }
  estatisticas?: {
    totalAtendimentos: number
    taxaSucesso: number
    progressoGeral: number
  }
  metas: PortalGoalData[]
  opcoes: PortalTokenOptions
}

export interface PortalGoalData {
  id: string
  titulo?: string
  descricao?: string
  tipo_input: GoalInputType
  meta_esperada: string
  unidade?: string
  valor_atual?: number
  status?: 'pending' | 'achieved' | 'partial' | 'not-achieved'
  registros?: GoalProgressRecord[]
}

// =====================================================
// UI HELPERS
// =====================================================

// Status display mapping
export const progressStatusDisplay: Record<ProgressStatus, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'gray' },
  atingido: { label: 'Atingido', color: 'green' },
  parcial: { label: 'Parcial', color: 'yellow' },
  nao_atingido: { label: 'Não Atingido', color: 'red' },
  registrado: { label: 'Registrado', color: 'blue' },
}

export const planStatusDisplay: Record<PlanStatus, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'green' },
  concluido: { label: 'Concluído', color: 'blue' },
  cancelado: { label: 'Cancelado', color: 'red' },
}

export const goalInputTypeDisplay: Record<GoalInputType, { label: string; description: string }> = {
  numerico: { label: 'Numérico', description: 'Valor numérico com unidade (ex: 10 minutos)' },
  booleano: { label: 'Sim/Não', description: 'Resposta binária (Sim ou Não)' },
  escala: { label: 'Escala 1-5', description: 'Escala de 1 a 5 pontos' },
  protocolo: { label: 'Protocolo', description: 'Campo de texto livre para protocolos' },
}

// Paciente com planos (para seleção)
export interface PatientWithPlans {
  id: string
  nome_completo: string
  data_nascimento?: string
  telefone?: string
  email?: string
  status?: string
  planos_ativos: number
  ultima_consulta?: string
}
