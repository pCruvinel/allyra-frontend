/**
 * Tipos centralizados de Agendamentos
 *
 * Este é o arquivo canônico para tipos de appointment.
 * NÃO defina AppointmentFormatted em outros locais.
 *
 * Consumidores:
 *  - useAppointments.ts (hook principal)
 *  - RecepcaoTab.tsx
 *  - DataContext.tsx
 *  - AgendaPage.tsx
 */

// Status possíveis no banco de dados
export type AppointmentStatusDB =
  | 'agendado'
  | 'confirmado'
  | 'aguardando'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | 'falta'
  | 'reagendado'

/**
 * Appointment formatado para uso no frontend.
 * Combina dados relacionais do banco com campos de compatibilidade.
 */
export interface AppointmentFormatted {
  id: string
  data_hora_inicio: string
  data_hora_fim: string
  data_chegada?: string | null
  data_inicio_atendimento?: string | null
  data_fim_atendimento?: string | null
  status: AppointmentStatusDB
  observacoes?: string
  paciente?: {
    id: string
    nome_completo: string
  }
  profissional?: {
    id: string
    especialidades: string[]
    usuario: {
      nome_completo: string
    }
  }
  servico?: {
    id: string
    nome: string
  }
  convenio?: {
    id: string
    nome: string
  }
  // Campos de compatibilidade com componentes existentes
  patientId: string
  patientName: string
  date: string
  dateStr: string
  time: string
  duration: number
  type: string
  professionalId: string
  professionalName: string
  serviceName: string
  insuranceName: string
}

export type CreateAppointmentInput = {
  paciente_id: string
  profissional_id: string
  servico_id: string
  data_hora_inicio: string
  data_hora_fim: string
  convenio_id?: string
  sala_id?: string
  observacoes?: string
  duracao_minutos?: number
  tipo?: string
}

// Tipo para atualização de agendamento
export type UpdateAppointmentInput = Partial<CreateAppointmentInput> & {
  status?: AppointmentStatusDB
}

// Filtros de agendamento
export interface AppointmentFilters {
  search?: string
  status?: AppointmentStatusDB | ''
  professionalId?: string
  dateFrom?: string
  dateTo?: string
  clinicaId?: string
}

// Labels de status para exibição
export const appointmentStatusLabels: Record<AppointmentStatusDB, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  falta: 'Falta',
  reagendado: 'Reagendado',
}

// Cores de status CSS
export const appointmentStatusColors: Record<AppointmentStatusDB, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  aguardando: 'bg-yellow-100 text-yellow-800',
  em_atendimento: 'bg-purple-100 text-purple-800',
  concluido: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
  falta: 'bg-orange-100 text-orange-800',
  reagendado: 'bg-cyan-100 text-cyan-800',
}
