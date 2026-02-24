/**
 * Sistema de Módulos - Allyra
 *
 * Define os módulos do sistema.
 * Todos os módulos estão liberados por padrão.
 */

// Configuração de um módulo
export interface ModuleConfig {
  id: string
  name: string
  slug: string
  route: string
  icon: string
  description?: string
}

/**
 * Todos os módulos do sistema
 */
export const MODULES: Record<string, ModuleConfig> = {
  agenda_recepcao: {
    id: 'M1',
    name: 'Agenda e Recepção',
    slug: 'agenda_recepcao',
    route: '/agenda',
    icon: 'Calendar',
    description: 'Agendamento de consultas, recepção, registro de presença',
  },
  // NOTA: Prontuário removido do sidebar conforme PRD
  // "Acesso via Agenda ou Menu Paciente" - não tem rota dedicada
  // Permissões de prontuário são verificadas via config/permissions.ts
  multiclinica: {
    id: 'M4',
    name: 'Multi-Clínica',
    slug: 'multiclinica',
    route: '/clinicas',
    icon: 'Building2',
    description: 'Suporte a múltiplas clínicas com segregação de dados',
  },
  portal_paciente: {
    id: 'M5',
    name: 'Portal do Paciente',
    slug: 'portal_paciente',
    route: '/portal',
    icon: 'UserCircle',
    description: 'Portal externo para pacientes agendarem e ver histórico',
  },
  integracoes: {
    id: 'M6',
    name: 'Integrações',
    slug: 'integracoes',
    route: '/integracoes',
    icon: 'Plug',
    description: 'WhatsApp, chat interno, exportações',
  },
  relatorios: {
    id: 'M7',
    name: 'Relatórios',
    slug: 'relatorios',
    route: '/relatorios',
    icon: 'BarChart',
    description: 'Relatórios gerenciais customizáveis',
  },
  financeiro: {
    id: 'M8',
    name: 'Financeiro',
    slug: 'financeiro',
    route: '/financeiro',
    icon: 'DollarSign',
    description: 'Contas a receber/pagar, cobrança, repasse',
  },
  faturamento: {
    id: 'M9',
    name: 'Faturamento',
    slug: 'faturamento',
    route: '/faturamento',
    icon: 'Receipt',
    description: 'Pré-faturamento, emissão de faturas, TISS/TUSS',
  },
  metas_terapeuticas: {
    id: 'M10',
    name: 'Metas Terapêuticas',
    slug: 'metas_terapeuticas',
    route: '/metas',
    icon: 'Target',
    description: 'Planos terapêuticos e metas por paciente',
  },
  pacientes: {
    id: 'CORE',
    name: 'Pacientes',
    slug: 'pacientes',
    route: '/pacientes',
    icon: 'Users',
    description: 'Cadastro e gestão de pacientes',
  },
  configuracoes: {
    id: 'CORE',
    name: 'Configurações',
    slug: 'configuracoes',
    route: '/configuracoes',
    icon: 'Settings',
    description: 'Configurações da clínica',
  },
}

/**
 * Verifica se um módulo está disponível
 * Todos os módulos estão sempre disponíveis
 */
export function isModuleAvailable(moduleSlug: string): boolean {
  return !!MODULES[moduleSlug]
}

/**
 * Retorna todos os módulos disponíveis no ambiente atual
 */
export function getAvailableModules(): ModuleConfig[] {
  return Object.values(MODULES).filter((module) => isModuleAvailable(module.slug))
}

/**
 * Retorna um módulo pelo slug
 */
export function getModuleBySlug(slug: string): ModuleConfig | undefined {
  return MODULES[slug]
}

/**
 * Retorna um módulo pela rota
 */
export function getModuleByRoute(route: string): ModuleConfig | undefined {
  return Object.values(MODULES).find((module) => route.startsWith(module.route))
}
