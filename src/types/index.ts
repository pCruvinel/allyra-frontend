// Re-exportar tipos de paciente expandidos
export * from './patient'

// Re-exportar tipos de agendamentos (centralizado - GAP-05)
export * from './appointments'

// Re-exportar tipos de prontuário
export * from './medical-record'

// Re-exportar tipos de faturamento
export * from './billing'

// Re-exportar tipos de cliente
export * from './client'

// Re-exportar tipos de usuário do sistema
export * from './user'

// Re-exportar tipos de auditoria
export * from './audit'

// Status de atendimento
export type AppointmentStatus =
  | 'Ativo'
  | 'Confirmado'
  | 'Aguardando'
  | 'Pendente'
  | 'Cancelado'
  | 'Concluído'
  | 'scheduled'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

// Atendimento/Paciente
export interface Appointment {
  id: number | string
  patientId: string
  patientName: string
  date: string
  time: string
  insurance?: string
  insuranceId?: string
  professional?: string
  professionalId?: string
  procedure?: string
  serviceId?: string
  serviceName?: string
  serviceValue?: number
  status: AppointmentStatus
}

// Métricas do Dashboard
export interface DashboardMetrics {
  scheduledToday: number
  waitingPatients: number
  pendingReschedules: number
  completedToday: number
  noShows: number
  pendingTransfers: number
}

// Usuário
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'professional' | 'receptionist'
  avatar?: string
}

// Navegação
export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

// Chat
export interface ChatDepartment {
  id: string
  name: string
}

export interface ChatContact {
  id: string
  name: string
  role: string
  departmentId: string
  avatar?: string
  online?: boolean
}

export interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderRole?: string
  timestamp: Date
  isFromMe: boolean
}

export interface ChatConversation {
  id: string
  contact: ChatContact
  messages: ChatMessage[]
  lastMessage?: ChatMessage
  unreadCount: number
}

// Calendário / Agenda
export interface CalendarEvent {
  id: string
  patientName: string
  patientId: string
  date: Date
  time: string
  duration: number // minutos
  type: 'consulta' | 'retorno' | 'exame' | 'procedimento'
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'waiting' | 'in_progress'
  professionalId: string
}

export interface Professional {
  id: string
  name: string
  specialty: string
  avatar?: string
}

export type CalendarView = 'month' | 'week' | 'day'

// Pacientes
export type PatientStatus = 'active' | 'inactive' | 'blocked'

export interface Patient {
  id: string
  name: string
  email: string
  cpf: string
  insurance: string
  status: PatientStatus
  phone?: string
  birthDate?: string
}
