// Tipo de ação de auditoria
export type AuditActionType = 'Login' | 'Logout' | 'Criar' | 'Editar' | 'Excluir' | 'Visualizar' | 'Exportar'

// Log de Acesso
export interface AuditLog {
  id: string
  clientId: string
  userId: string
  userName: string
  userProfile: string // Perfil do usuário
  action: string
  actionType: AuditActionType
  ip: string
  browser: string
  device: string
  timestamp: string
}

// Auditoria de Usuário
export interface UserAudit {
  id: string
  clientId: string
  userId: string
  userName: string
  userProfile: string
  action: string
  module: string
  details: string
  timestamp: string
}

// Relatório de Conformidade
export interface ComplianceReport {
  id: string
  clientId: string
  title: string
  type: 'LGPD' | 'Segurança' | 'Acesso'
  generatedAt: string
  status: 'Conforme' | 'Pendente' | 'Não Conforme'
  details?: string
}

// Detalhes do Log (para modal)
export interface AuditLogDetails {
  action: string
  ip: string
  browser: string
  device: string
}

// Filtros de Auditoria
export interface AuditFilters {
  clientId?: string
  startDate?: string
  endDate?: string
  userId?: string
  actionType?: AuditActionType
}

// Tab ativa da auditoria
export type AuditTab = 'logs' | 'userAudit' | 'compliance'
