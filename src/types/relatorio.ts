/**
 * Tipos para o módulo de Relatórios
 */

export type TipoRelatorio =
  | 'agenda'
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

/**
 * Configurações dos tipos de relatórios disponíveis
 */
export const REPORT_TYPES: RelatorioConfig[] = [
  {
    tipo: 'agenda',
    titulo: 'Agenda',
    descricao: 'Relatório de agendamentos',
    icone: 'Calendar',
    filtrosDisponiveis: ['periodo', 'profissional', 'status'],
  },
  {
    tipo: 'financeiro',
    titulo: 'Financeiro',
    descricao: 'Relatório financeiro',
    icone: 'DollarSign',
    filtrosDisponiveis: ['periodo', 'profissional', 'status'],
  },
  {
    tipo: 'comissao',
    titulo: 'Comissão',
    descricao: 'Relatório de comissões',
    icone: 'Percent',
    filtrosDisponiveis: ['periodo', 'profissional'],
  },
  {
    tipo: 'evolucao',
    titulo: 'Evolução',
    descricao: 'Relatório de evolução',
    icone: 'TrendingUp',
    filtrosDisponiveis: ['periodo', 'profissional', 'especialidade'],
  },
  {
    tipo: 'tratamento',
    titulo: 'Tratamento',
    descricao: 'Relatório de tratamentos',
    icone: 'Heart',
    filtrosDisponiveis: ['periodo', 'profissional', 'especialidade'],
  },
  {
    tipo: 'paciente',
    titulo: 'Paciente',
    descricao: 'Relatório de pacientes',
    icone: 'Users',
    filtrosDisponiveis: ['periodo', 'status'],
  },
  {
    tipo: 'estoque',
    titulo: 'Estoque',
    descricao: 'Relatório de estoque',
    icone: 'Package',
    filtrosDisponiveis: ['periodo', 'status'],
  },
  {
    tipo: 'homecare',
    titulo: 'Home Care',
    descricao: 'Relatório de atendimentos domiciliares',
    icone: 'Home',
    filtrosDisponiveis: ['periodo', 'profissional', 'status'],
  },
  {
    tipo: 'geral',
    titulo: 'Geral',
    descricao: 'Relatório geral',
    icone: 'FileText',
    filtrosDisponiveis: ['periodo'],
  },
]
