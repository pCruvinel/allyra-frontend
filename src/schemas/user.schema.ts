/**
 * Schemas de validação Zod para Usuários
 */

import { z } from 'zod'

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  permissionLevel: z
    .string()
    .min(1, 'Nível de permissão é obrigatório'),

  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),

  phone: z
    .string()
    .optional()
    .or(z.literal('')),
})

export const updateUserSchema = createUserSchema.partial()

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
