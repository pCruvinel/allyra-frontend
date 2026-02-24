/**
 * Schemas de validação Zod para Módulo de Metas Terapêuticas (M10)
 */

import { z } from 'zod'

// =====================================================
// ENUMS
// =====================================================

export const goalInputTypeSchema = z.enum(['numerico', 'booleano', 'escala', 'protocolo'], {
  errorMap: () => ({ message: 'Tipo de input inválido' }),
})

export const planStatusSchema = z.enum(['ativo', 'concluido', 'cancelado'], {
  errorMap: () => ({ message: 'Status inválido' }),
})

export const progressStatusSchema = z.enum(['pendente', 'atingido', 'parcial', 'nao_atingido', 'registrado'], {
  errorMap: () => ({ message: 'Status de progresso inválido' }),
})

// =====================================================
// PLANOS TERAPÊUTICOS
// =====================================================

export const createPlanSchema = z.object({
  clinica_id: z.string().uuid('ID da clínica inválido'),

  paciente_id: z.string().uuid('ID do paciente inválido'),

  nome: z
    .string()
    .min(3, 'Nome do plano deve ter no mínimo 3 caracteres')
    .max(200, 'Nome do plano deve ter no máximo 200 caracteres'),

  tipo_plano: z
    .string()
    .min(1, 'Tipo de plano é obrigatório')
    .max(50, 'Tipo de plano deve ter no máximo 50 caracteres'),

  profissional_responsavel_id: z.string().uuid('ID do profissional inválido'),

  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida (formato: AAAA-MM-DD)')
    .refine(
      (date) => {
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      },
      'Data de início inválida'
    ),

  data_fim_prevista: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data fim inválida (formato: AAAA-MM-DD)')
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      },
      'Data fim inválida'
    ),
})

export const updatePlanSchema = createPlanSchema
  .omit({ clinica_id: true })
  .partial()
  .extend({
    status: planStatusSchema.optional(),
  })

// =====================================================
// METAS TERAPÊUTICAS
// =====================================================

export const createGoalSchema = z.object({
  plano_id: z.string().uuid('ID do plano inválido'),

  titulo: z
    .string()
    .min(3, 'Título da meta deve ter no mínimo 3 caracteres')
    .max(200, 'Título da meta deve ter no máximo 200 caracteres'),

  descricao: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional()
    .nullable(),

  tipo_meta: z
    .string()
    .max(50, 'Tipo de meta deve ter no máximo 50 caracteres')
    .optional()
    .nullable(),

  tipo_input: goalInputTypeSchema,

  meta_esperada: z
    .string()
    .min(1, 'Meta esperada é obrigatória')
    .max(100, 'Meta esperada deve ter no máximo 100 caracteres'),

  unidade: z
    .string()
    .max(50, 'Unidade deve ter no máximo 50 caracteres')
    .optional()
    .nullable(),

  especialidade: z
    .string()
    .max(100, 'Especialidade deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),

  percentual_alvo: z
    .number()
    .min(0, 'Percentual deve ser no mínimo 0')
    .max(100, 'Percentual deve ser no máximo 100')
    .optional()
    .nullable(),
})

export const updateGoalSchema = createGoalSchema
  .omit({ plano_id: true })
  .partial()
  .extend({
    ativo: z.boolean().optional(),
  })

// =====================================================
// REGISTRO DE PROGRESSO
// =====================================================

export const createProgressSchema = z.object({
  meta_id: z.string().uuid('ID da meta inválido'),

  clinica_id: z.string().uuid('ID da clínica inválido'),

  profissional_id: z.string().uuid('ID do profissional inválido'),

  data_registro: z
    .string()
    .refine(
      (date) => {
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      },
      'Data de registro inválida'
    ),

  valor_registrado: z
    .string()
    .min(1, 'Valor é obrigatório')
    .max(100, 'Valor deve ter no máximo 100 caracteres'),

  prontuario_id: z.string().uuid('ID do prontuário inválido').optional().nullable(),

  agendamento_id: z.string().uuid('ID do agendamento inválido').optional().nullable(),

  status_classificacao: progressStatusSchema.optional(),

  percentual_progresso: z
    .number()
    .min(0, 'Percentual deve ser no mínimo 0')
    .max(100, 'Percentual deve ser no máximo 100')
    .optional()
    .nullable(),

  observacoes_subjetivas: z
    .string()
    .max(2000, 'Observações devem ter no máximo 2000 caracteres')
    .optional()
    .nullable(),
})

// =====================================================
// PORTAL DO PACIENTE
// =====================================================

export const portalTokenOptionsSchema = z.object({
  mostrarGraficos: z.boolean().default(true),
  mostrarParecer: z.boolean().default(true),
  mostrarRecomendacoes: z.boolean().default(true),
})

export const generateTokenSchema = z.object({
  clinica_id: z.string().uuid('ID da clínica inválido'),

  paciente_id: z.string().uuid('ID do paciente inválido'),

  plano_id: z.string().uuid('ID do plano inválido'),

  opcoes: portalTokenOptionsSchema.optional(),

  dias_validade: z
    .number()
    .int('Dias de validade deve ser um número inteiro')
    .min(1, 'Dias de validade deve ser no mínimo 1')
    .max(365, 'Dias de validade deve ser no máximo 365')
    .optional()
    .default(30),
})

// =====================================================
// TIPOS INFERIDOS
// =====================================================

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type CreateProgressInput = z.infer<typeof createProgressSchema>
export type GenerateTokenInput = z.infer<typeof generateTokenSchema>
export type PortalTokenOptions = z.infer<typeof portalTokenOptionsSchema>

export type GoalInputType = z.infer<typeof goalInputTypeSchema>
export type PlanStatus = z.infer<typeof planStatusSchema>
export type ProgressStatus = z.infer<typeof progressStatusSchema>

// =====================================================
// HELPERS DE VALIDAÇÃO
// =====================================================

import { formatZodErrors } from './patient.schema'

/**
 * Valida dados de um plano terapêutico
 */
export function validatePlan<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: formatZodErrors(result.error) }
}

/**
 * Valida valor de input baseado no tipo
 */
export function validateGoalValue(tipoInput: GoalInputType, valor: string): string | null {
  switch (tipoInput) {
    case 'numerico': {
      const num = parseFloat(valor)
      if (isNaN(num)) return 'Valor deve ser um número'
      if (num < 0) return 'Valor não pode ser negativo'
      return null
    }
    case 'booleano': {
      const lower = valor.toLowerCase()
      if (!['sim', 'não', 'nao', 'yes', 'no', 'true', 'false', '1', '0'].includes(lower)) {
        return 'Valor deve ser Sim ou Não'
      }
      return null
    }
    case 'escala': {
      const num = parseInt(valor)
      if (isNaN(num) || num < 1 || num > 5) {
        return 'Valor deve ser entre 1 e 5'
      }
      return null
    }
    case 'protocolo':
      // Protocolo aceita qualquer texto
      return null
    default:
      return 'Tipo de input inválido'
  }
}

/**
 * Normaliza valor de input booleano
 */
export function normalizeBooleanoValue(valor: string): string {
  const lower = valor.toLowerCase()
  if (['sim', 'yes', 'true', '1'].includes(lower)) return 'sim'
  if (['não', 'nao', 'no', 'false', '0'].includes(lower)) return 'não'
  return valor
}
