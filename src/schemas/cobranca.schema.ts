/**
 * Schemas de validação Zod para Cobranças
 */

import { z } from 'zod'

export const createCobrancaSchema = z.object({
  patientName: z
    .string()
    .optional()
    .or(z.literal('')),

  value: z
    .number()
    .positive('Valor deve ser maior que zero'),

  paymentMethod: z
    .string()
    .min(1, 'Forma de pagamento é obrigatória'),

  installments: z
    .number()
    .int()
    .min(1, 'Mínimo de 1 parcela')
    .max(12, 'Máximo de 12 parcelas')
    .default(1),

  discount: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .default(0),

  delayDays: z
    .number()
    .int()
    .min(1, 'Mínimo de 1 dia')
    .default(15),

  message: z
    .string()
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => data.discount <= data.value,
  {
    message: 'Desconto não pode ser maior que o valor',
    path: ['discount'],
  }
)

export type CreateCobrancaInput = z.infer<typeof createCobrancaSchema>
