/**
 * Sistema de Permissoes - Allyra
 *
 * Define os perfis de usuario e a matriz de permissoes por modulo.
 * Baseado em docs/business/permissions.md
 */

export type PerfilTipo =
  | 'admin_master'
  | 'desenvolvedor'
  | 'administrador_total'
  | 'socio_profissional'
  | 'profissional'
  | 'secretaria'
  | 'administrativo'
  | 'financeiro'
  | 'faturamento'

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export'

export const PERMISSION_MATRIX: Record<PerfilTipo, Record<string, PermissionAction[]>> = {
  admin_master: {
    agenda_recepcao: ['create', 'read', 'update', 'delete', 'export'],
    pacientes: ['create', 'read', 'update', 'delete', 'export'],
    escalas_rh: ['create', 'read', 'update', 'delete', 'export'],
    prontuario: ['create', 'read', 'update', 'delete', 'export'],
    metas_terapeuticas: ['create', 'read', 'update', 'delete', 'export'],
    financeiro: ['create', 'read', 'update', 'delete', 'export'],
    faturamento: ['create', 'read', 'update', 'delete', 'export'],
    relatorios: ['create', 'read', 'update', 'delete', 'export'],
    configuracoes: ['create', 'read', 'update', 'delete', 'export'],
    saas: ['create', 'read', 'update', 'delete', 'export'],
    api_docs: ['read'],
  },
  desenvolvedor: {
    agenda_recepcao: ['create', 'read', 'update', 'delete', 'export'],
    pacientes: ['create', 'read', 'update', 'delete', 'export'],
    escalas_rh: ['create', 'read', 'update', 'delete', 'export'],
    prontuario: ['create', 'read', 'update', 'delete', 'export'],
    metas_terapeuticas: ['create', 'read', 'update', 'delete', 'export'],
    financeiro: ['create', 'read', 'update', 'delete', 'export'],
    faturamento: ['create', 'read', 'update', 'delete', 'export'],
    relatorios: ['create', 'read', 'update', 'delete', 'export'],
    configuracoes: ['create', 'read', 'update', 'delete', 'export'],
    saas: ['create', 'read', 'update', 'delete', 'export'],
    api_docs: ['read'],
  },
  administrador_total: {
    agenda_recepcao: ['create', 'read', 'update', 'delete', 'export'],
    pacientes: ['create', 'read', 'update', 'delete', 'export'],
    escalas_rh: ['create', 'read', 'update', 'delete', 'export'],
    prontuario: ['create', 'read', 'update', 'delete', 'export'],
    metas_terapeuticas: ['create', 'read', 'update', 'delete', 'export'],
    financeiro: ['create', 'read', 'update', 'delete', 'export'],
    faturamento: ['create', 'read', 'update', 'delete', 'export'],
    relatorios: ['create', 'read', 'update', 'delete', 'export'],
    configuracoes: ['create', 'read', 'update', 'delete', 'export'],
    saas: ['read'],
  },
  socio_profissional: {
    agenda_recepcao: ['create', 'read', 'update'],
    pacientes: ['read'],
    escalas_rh: ['create', 'read', 'update', 'export'],
    prontuario: ['create', 'read', 'update'],
    metas_terapeuticas: ['create', 'read', 'update'],
    financeiro: ['read'],
    faturamento: ['read'],
    relatorios: ['read', 'export'],
    configuracoes: [],
    saas: [],
  },
  profissional: {
    agenda_recepcao: ['read', 'update'],
    pacientes: ['read'],
    escalas_rh: ['read'],
    prontuario: ['create', 'read', 'update'],
    metas_terapeuticas: ['create', 'read', 'update'],
    financeiro: [],
    faturamento: [],
    relatorios: ['read'],
    configuracoes: [],
    saas: [],
  },
  secretaria: {
    agenda_recepcao: ['create', 'read', 'update'],
    pacientes: ['create', 'read', 'update'],
    escalas_rh: [],
    prontuario: [],
    metas_terapeuticas: [],
    financeiro: [],
    faturamento: [],
    relatorios: ['read'],
    configuracoes: [],
    saas: [],
  },
  administrativo: {
    agenda_recepcao: ['read'],
    pacientes: ['read'],
    escalas_rh: ['read', 'export'],
    prontuario: [],
    metas_terapeuticas: [],
    financeiro: ['read'],
    faturamento: ['read'],
    relatorios: ['read', 'export'],
    configuracoes: [],
    saas: [],
  },
  financeiro: {
    agenda_recepcao: ['read'],
    pacientes: ['read'],
    escalas_rh: [],
    prontuario: [],
    metas_terapeuticas: [],
    financeiro: ['create', 'read', 'update'],
    faturamento: ['read'],
    relatorios: ['read', 'export'],
    configuracoes: [],
    saas: [],
  },
  faturamento: {
    agenda_recepcao: ['read'],
    pacientes: ['read'],
    escalas_rh: [],
    prontuario: [],
    metas_terapeuticas: [],
    financeiro: ['read'],
    faturamento: ['create', 'read', 'update', 'export'],
    relatorios: ['read', 'export'],
    configuracoes: [],
    saas: [],
  },
}

/**
 * Verifica se um perfil tem determinada permissao em um modulo
 */
export function hasPermission(
  perfil: PerfilTipo,
  moduleSlug: string,
  action: PermissionAction
): boolean {
  const permissions = PERMISSION_MATRIX[perfil]?.[moduleSlug] || []
  return permissions.includes(action)
}

/**
 * Verifica se um perfil pode acessar um modulo (tem pelo menos 'read')
 */
export function canAccessModule(perfil: PerfilTipo, moduleSlug: string): boolean {
  return hasPermission(perfil, moduleSlug, 'read')
}

/**
 * Retorna todas as permissoes de um perfil para um modulo
 */
export function getModulePermissions(
  perfil: PerfilTipo,
  moduleSlug: string
): PermissionAction[] {
  return PERMISSION_MATRIX[perfil]?.[moduleSlug] || []
}
