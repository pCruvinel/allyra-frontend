// Status do Cliente
export type ClientStatus = 'Ativo' | 'Inativo' | 'Bloqueado'

// Cliente (Clínica/Empresa)
export interface Client {
  id: string
  code: string // CLIN-XXX
  fantasyName: string
  companyName: string
  cnpj: string
  stateRegistration?: string
  email: string
  phone: string
  cep: string
  address: string
  neighborhood: string
  city: string
  state: string
  modules: string[] // Módulos contratados
  status: ClientStatus
  createdAt: string
}

// Formulário de novo cliente
export interface NovoClienteForm {
  code: string
  fantasyName: string
  companyName: string
  cnpj: string
  stateRegistration?: string
  email: string
  phone: string
  cep: string
  address: string
  neighborhood: string
  city: string
  state: string
  modules: string[]
}

// Métricas do Cliente (Dados gerais)
export interface ClientMetrics {
  // Uso do sistema
  activeUsers: number
  totalUsers: number
  lastAccess: string

  // Financeiro
  monthlyValue: number
  pendingPayments: number
  lastPaymentDate: string

  // Consumo
  storageUsed: number // GB
  storageLimit: number // GB
  apiCalls: number
}

// Ações rápidas do cliente
export type ClientQuickAction = 'block' | 'resetPassword' | 'changePlan'

// Módulos disponíveis
export const availableModules = [
  'Agenda',
  'Pacientes',
  'Faturamento',
  'Financeiro',
  'Relatórios',
  'Auditoria',
] as const

export type AvailableModule = typeof availableModules[number]
