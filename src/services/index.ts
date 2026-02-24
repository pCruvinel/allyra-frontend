/**
 * Exporta todos os serviços
 * Camada de abstração para acesso a dados
 *
 * Uso:
 *   import { patientsService } from '@/services'
 *   const { data, error } = await patientsService.getAll()
 *
 * Migração Supabase:
 *   Trocar implementação interna dos serviços
 *   Manter mesma interface externa
 */

// Tipos
export * from './types'

// Helpers
export {
  success,
  error,
  simulateDelay,
  paginate,
  searchInFields,
  sortBy,
  filterByStatus,
  generateId,
} from './base.service'

// Serviços
export { patientsService } from './patients.service'
export type { CreatePatientInput, UpdatePatientInput } from './patients.service'

/** @deprecated Use useAppointments() hook via apiService. Mantido para backward compatibility. */
export { appointmentsService } from './appointments.service'
/** @deprecated Tipos devem ser importados de @/types/appointments */
export type { AppointmentDB } from './appointments.service'
// Tipos canônicos — re-exportados de @/types/appointments
export type {
  AppointmentFormatted,
  AppointmentStatusDB,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/types/appointments'
export {
  appointmentStatusLabels,
  appointmentStatusColors,
} from '@/types/appointments'

export { financialService } from './financial.service'
export type {
  ContaReceberDB,
  ContaReceberFormatted,
  ContaReceberStatusDB,
  RepasseDB,
  RepasseFormatted,
  RepasseStatusDB,
  NotaFiscalDB,
  NotaFiscalFormatted,
  FinancialFilters,
  contaReceberStatusLabels,
  contaReceberStatusColors,
  repasseStatusLabels,
  repasseStatusColors,
} from './financial.service'

export { billingService } from './billing.service'
export type {
  FaturamentoDB,
  FaturamentoFormatted,
  FaturaStatusDB,
  FaturamentoItemDB,
  PreFaturamentoFormatted,
  BillingFilters,
  faturaStatusLabels,
  faturaStatusColors,
} from './billing.service'

export { auditService } from './audit.service'
export type {
  AuditLogDB,
  AuditLogFormatted,
  AuditActionDB,
  AuditFilters,
  auditActionLabels,
  auditActionColors,
} from './audit.service'

export { avatarsService } from './avatars.service'
export type { AvatarUploadResponse, AvatarResponse } from './avatars.service'

export { documentsService } from './documents.service'
export type {
  DocumentDB,
  DocumentFormatted,
  UploadDocumentInput,
  ConsentUpdateInput,
} from './documents.service'
