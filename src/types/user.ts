// Status do Usuário
export type UserStatus = 'Ativo' | 'Inativo' | 'Bloqueado'

// Nível de permissão
export type PermissionLevel = 'Administrador' | 'Gerente' | 'Operador' | 'Visualizador'

// Usuário do Sistema (gestão multi-tenant)
export interface SystemUser {
  id: string
  clientId: string // CLIN-XXX
  name: string
  email: string
  phone?: string
  permissionLevel: PermissionLevel
  status: UserStatus
  lastAccess?: string
  createdAt: string
}

// Formulário de novo usuário
export interface NovoUsuarioForm {
  name: string
  permissionLevel: PermissionLevel
  email: string
  phone?: string
}

// Opções de permissão para select
export const permissionLevelOptions: { value: PermissionLevel; label: string }[] = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Gerente', label: 'Gerente' },
  { value: 'Operador', label: 'Operador' },
  { value: 'Visualizador', label: 'Visualizador' },
]
