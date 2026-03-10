/**
 * Schemas de validação Zod para Pacientes
 */

import { z } from 'zod'
import { isValidCPF } from '@/lib/validators'

// Regex para validação de formato
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/

// Schema base para dados do paciente
export const patientBaseSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),

  cpf: z
    .string()
    .min(11, 'CPF deve ter 11 dígitos')
    .max(14, 'CPF inválido')
    .refine(isValidCPF, 'CPF inválido'),

  phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido (formato: (00) 00000-0000)')
    .optional()
    .or(z.literal('')),

  birthDate: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const parsed = new Date(date)
        return !isNaN(parsed.getTime()) && parsed < new Date()
      },
      'Data de nascimento inválida'
    ),

  insurance: z
    .string()
    .min(1, 'Convênio é obrigatório'),
})

// Schema para criação de paciente
export const createPatientSchema = patientBaseSchema

// Schema para atualização de paciente (todos os campos opcionais)
export const updatePatientSchema = patientBaseSchema.partial()

// Schema para alteração de status
export const patientStatusSchema = z.enum(['active', 'inactive', 'blocked'], {
  errorMap: () => ({ message: 'Status inválido' }),
})

// Tipos inferidos dos schemas
export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
export type PatientStatus = z.infer<typeof patientStatusSchema>

// Helper para formatar erros do Zod
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = issue.message
    }
  }

  return errors
}

// Helper para validar e retornar erros formatados
export function validatePatient<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: formatZodErrors(result.error) }
}
