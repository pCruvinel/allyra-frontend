// Hooks personalizados

// Pacientes
export { usePatients, usePatientDetails } from './usePatients'

// Agendamentos
export { useAppointments, useAppointmentDetails, useAppointmentStats } from './useAppointments'

// Financeiro
export { useContasReceber, useRepasses, useNotasFiscais } from './useFinancialData'

// Faturamento
export { useFaturamentos, usePreFaturamentos } from './useBillingData'

// Auditoria
export { useAuditLogs } from './useAuditLogs'

// Profissionais
export { useProfessionals } from './useProfessionals'

// Serviços da Clínica
export { useServices } from './useServices'

// Convênios
export { useInsurances } from './useInsurances'

// Options para modal de agendamento
export { useAppointmentOptions } from './useAppointmentOptions'

// Notificações
export { useNotifications } from './useNotifications'

// Clientes (Clínicas)
export { useClients } from './useClients'

// Usuários do Sistema
export { useUsers } from './useUsers'

// Dados Médicos (prontuários, evoluções, anamnese)
export { useMedicalData } from './useMedicalData'

// Data Service (controle de dados de teste)
export { useDataService, useEnvironment } from './useDataService'

// Configuração de paginação
export { usePaginationConfig, DEFAULT_ITEMS_PER_PAGE } from './usePaginationConfig'

// Debounce
export { useDebounce, useDebouncedCallback } from './useDebounce'

// Orçamentos
export { useOrcamentos } from './useOrcamentos'
