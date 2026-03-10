// Schemas de validação Zod

export {
  patientBaseSchema,
  createPatientSchema,
  updatePatientSchema,
  patientStatusSchema,
  formatZodErrors,
  validatePatient,
  type CreatePatientInput,
  type UpdatePatientInput,
  type PatientStatus,
} from './patient.schema'

export {
  clienteBaseSchema,
  createClienteSchema,
  updateClienteSchema,
  type CreateClienteInput,
  type UpdateClienteInput,
} from './client.schema'

export {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from './user.schema'

export {
  createCobrancaSchema,
  type CreateCobrancaInput,
} from './cobranca.schema'
