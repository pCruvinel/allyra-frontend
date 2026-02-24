/**
 * Sistema de Permissões - Allyra
 *
 * Define os 8 perfis de usuário e a matriz de permissões por módulo.
 * Baseado em docs/business/permissions.md
 */

// Tipos de perfil do sistema (match com enum do banco)
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

// Matriz de permissões completa baseada em docs/business/permissions.md
export const PERMISSION_MATRIX: Record<PerfilTipo, Record<string, PermissionAction[]>> = {
  admin_master: {
    agenda_recepcao: ['create', 'read', 'update', 'delete', 'export'],
    pacientes: ['create', 'read', 'update', 'delete', 'export'],
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
    prontuario: ['create', 'read', 'update'],
    metas_terapeuticas: ['create', 'read', 'update'],
    financeiro: ['read'],
    faturamento: ['read'],
    relatorios: ['read', 'export'],
    configuracoes: [], // Apenas admins podem acessar configurações
    saas: [],
  },
  profissional: {
    agenda_recepcao: ['read', 'update'],
    pacientes: ['read'],
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
 * Verifica se um perfil tem determinada permissão em um módulo
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
 * Verifica se um perfil pode acessar um módulo (tem pelo menos 'read')
 */
export function canAccessModule(perfil: PerfilTipo, moduleSlug: string): boolean {
  return hasPermission(perfil, moduleSlug, 'read')
}

/**
 * Retorna todas as permissões de um perfil para um módulo
 */
export function getModulePermissions(
  perfil: PerfilTipo,
  moduleSlug: string
): PermissionAction[] {
  return PERMISSION_MATRIX[perfil]?.[moduleSlug] || []
}
