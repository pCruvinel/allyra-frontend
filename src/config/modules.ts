/**
 * Sistema de Modulos - Allyra
 *
 * Define os modulos do sistema.
 * Todos os modulos estao liberados por padrao.
 */

export interface ModuleConfig {
  id: string
  name: string
  slug: string
  route: string
  icon: string
  description?: string
}

/**
 * Todos os modulos do sistema
 */
export const MODULES: Record<string, ModuleConfig> = {
  agenda_recepcao: {
    id: 'M1',
    name: 'Agenda e Recepcao',
    slug: 'agenda_recepcao',
    route: '/agenda',
    icon: 'Calendar',
    description: 'Agendamento de consultas, recepcao e registro de presenca',
  },
  // NOTA: Prontuario removido do sidebar conforme PRD
  // "Acesso via Agenda ou Menu Paciente" - nao tem rota dedicada
  // Permissoes de prontuario sao verificadas via config/permissions.ts
  multiclinica: {
    id: 'M4',
    name: 'Multi-Clinica',
    slug: 'multiclinica',
    route: '/clinicas',
    icon: 'Building2',
    description: 'Suporte a multiplas clinicas com segregacao de dados',
  },
  portal_paciente: {
    id: 'M5',
    name: 'Portal do Paciente',
    slug: 'portal_paciente',
    route: '/portal',
    icon: 'UserCircle',
    description: 'Portal externo para pacientes agendarem e ver historico',
  },
  integracoes: {
    id: 'M6',
    name: 'Integracoes',
    slug: 'integracoes',
    route: '/integracoes',
    icon: 'Plug',
    description: 'WhatsApp, chat interno e exportacoes',
  },
  relatorios: {
    id: 'M7',
    name: 'Relatorios',
    slug: 'relatorios',
    route: '/relatorios',
    icon: 'BarChart',
    description: 'Relatorios gerenciais customizaveis',
  },
  financeiro: {
    id: 'M8',
    name: 'Financeiro',
    slug: 'financeiro',
    route: '/financeiro',
    icon: 'DollarSign',
    description: 'Contas a receber/pagar, cobranca e repasse',
  },
  faturamento: {
    id: 'M9',
    name: 'Faturamento',
    slug: 'faturamento',
    route: '/faturamento',
    icon: 'Receipt',
    description: 'Pre-faturamento, emissao de faturas e TISS/TUSS',
  },
  metas_terapeuticas: {
    id: 'M10',
    name: 'Metas Terapeuticas',
    slug: 'metas_terapeuticas',
    route: '/metas',
    icon: 'Target',
    description: 'Planos terapeuticos e metas por paciente',
  },
  pacientes: {
    id: 'CORE',
    name: 'Pacientes',
    slug: 'pacientes',
    route: '/pacientes',
    icon: 'Users',
    description: 'Cadastro e gestao de pacientes',
  },
  escalas_rh: {
    id: 'M07-RH',
    name: 'Escalas e RH',
    slug: 'escalas_rh',
    route: '/escalas',
    icon: 'ClipboardList',
    description: 'Escalas profissionais, pausas, ferias e carga horaria',
  },
  configuracoes: {
    id: 'CORE',
    name: 'Configuracoes',
    slug: 'configuracoes',
    route: '/configuracoes',
    icon: 'Settings',
    description: 'Configuracoes da clinica',
  },
}

/**
 * Verifica se um modulo esta disponivel
 * Todos os modulos estao sempre disponiveis
 */
export function isModuleAvailable(moduleSlug: string): boolean {
  return !!MODULES[moduleSlug]
}

/**
 * Retorna todos os modulos disponiveis no ambiente atual
 */
export function getAvailableModules(): ModuleConfig[] {
  return Object.values(MODULES).filter((module) => isModuleAvailable(module.slug))
}

/**
 * Retorna um modulo pelo slug
 */
export function getModuleBySlug(slug: string): ModuleConfig | undefined {
  return MODULES[slug]
}

/**
 * Retorna um modulo pela rota
 */
export function getModuleByRoute(route: string): ModuleConfig | undefined {
  return Object.values(MODULES).find((module) => route.startsWith(module.route))
}
