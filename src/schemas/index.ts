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
