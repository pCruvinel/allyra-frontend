export interface PatientEngagementSummary {
  patientId: string
  patientName: string
  cpf?: string | null
  noShowRate90d: number
  noShowCount90d: number
  cancellationCount90d: number
  lastCompletedAt?: string | null
  daysWithoutCompleted?: number | null
  hasFutureAppointment: boolean
  reasons: Array<'no_show' | 'inactive'>
}

export interface PatientEngagementMetrics {
  noShows90d: number
  cancellations90d: number
  inactivePatients: number
  flaggedPatients: number
}

export interface PatientEngagementResponse {
  metrics: PatientEngagementMetrics
  patients: PatientEngagementSummary[]
}

export interface ProfessionalWorkloadSummary {
  professionalId: string
  allocatedHours: number
  attendedHours: number
  utilization: number
}

export interface PendingGoalEvaluation {
  goalId: string
  planId: string
  patientId: string
  recordId?: string | null
  appointmentId?: string | null
  title: string
  typeInput: string
  targetValue: string
}
