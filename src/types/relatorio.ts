/**
 * Tipos para o modulo de Relatorios
 */

export type TipoRelatorio =
  | 'agenda'
  | 'escalas'
  | 'financeiro'
  | 'comissao'
  | 'evolucao'
  | 'tratamento'
  | 'paciente'
  | 'estoque'
  | 'homecare'
  | 'geral'

export type FormatoExportacao = 'pdf' | 'excel'

export interface FiltrosRelatorio {
  tipo: TipoRelatorio
  dateFrom: string
  dateTo: string
  profissionalId?: string
  clinicaId?: string
  especialidadeId?: string
  status?: string
}

export interface RelatorioConfig {
  tipo: TipoRelatorio
  titulo: string
  descricao: string
  icone: string
  filtrosDisponiveis: ('periodo' | 'profissional' | 'clinica' | 'especialidade' | 'status')[]
}

export interface RelatorioResponse {
  dados: Record<string, unknown>[]
  totais?: Record<string, number>
  colunas?: { key: string; label: string }[]
  geradoEm: string
}

export interface GerarRelatorioRequest {
  tipo: TipoRelatorio
  formato: FormatoExportacao
  filtros: Omit<FiltrosRelatorio, 'tipo'>
}

export const REPORT_TYPES: RelatorioConfig[] = [
  {
    tipo: 'agenda',
    titulo: 'Agenda',
    descricao: 'Relatorio de agendamentos',
    icone: 'Calendar',
    filtrosDisponiveis: ['periodo', 'profissional', 'status'],
  },
  {
    tipo: 'escalas',
    titulo: 'Escalas',
    descricao: 'Carga horaria e utilizacao por profissional',
    icone: 'ClipboardList',
    filtrosDisponiveis: ['periodo', 'profissional'],
  },
  {
    tipo: 'financeiro',
    titulo: 'Financeiro',
    descricao: 'Relatorio financeiro',
    icone: 'DollarSign',
    filtrosDisponiveis: ['periodo', 'profissional', 'status'],
  },
  {
    tipo: 'comissao',
    titulo: 'Comissao',
    descricao: 'Relatorio de comissoes',
    icone: 'Percent',
    filtrosDisponiveis: ['periodo', 'profissional'],
  },
  {
    tipo: 'evolucao',
    titulo: 'Evolucao',
    descricao: 'Relatorio de evolucao',
    icone: 'TrendingUp',
    filtrosDisponiveis: ['periodo', 'profissional', 'especialidade'],
  },
  {
    tipo: 'tratamento',
    titulo: 'Tratamento',
    descricao: 'Relatorio de tratamentos',
    icone: 'Heart',
    filtrosDisponiveis: ['periodo', 'profissional', 'especialidade'],
  },
  {
    tipo: 'paciente',
    titulo: 'Paciente',
    descricao: 'Relatorio de pacientes',
    icone: 'Users',
    filtrosDisponiveis: ['periodo', 'status'],
  },
  {
    tipo: 'estoque',
    titulo: 'Estoque',
    descricao: 'Relatorio de estoque',
    icone: 'Package',
    filtrosDisponiveis: ['periodo', 'status'],
  },
  {
    tipo: 'homecare',
    titulo: 'Home Care',
    descricao: 'Relatorio de atendimentos domiciliares',
    icone: 'Home',
    filtrosDisponiveis: ['periodo', 'profissional', 'status'],
  },
  {
    tipo: 'geral',
    titulo: 'Geral',
    descricao: 'Relatorio geral',
    icone: 'FileText',
    filtrosDisponiveis: ['periodo'],
  },
]
