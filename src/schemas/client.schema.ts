/**
 * Schemas de validação Zod para Clientes (Clínicas)
 */

import { z } from 'zod'
import { isValidCNPJ, isValidCEP } from '@/lib/validators'

// Schema base para dados do cliente/clínica
export const clienteBaseSchema = z.object({
  code: z
    .string()
    .min(1, 'Código é obrigatório')
    .max(20, 'Código deve ter no máximo 20 caracteres'),

  fantasyName: z
    .string()
    .min(2, 'Nome fantasia deve ter no mínimo 2 caracteres')
    .max(100, 'Nome fantasia deve ter no máximo 100 caracteres'),

  companyName: z
    .string()
    .min(2, 'Razão social deve ter no mínimo 2 caracteres')
    .max(150, 'Razão social deve ter no máximo 150 caracteres'),

  cnpj: z
    .string()
    .min(14, 'CNPJ deve ter 14 dígitos')
    .refine(isValidCNPJ, 'CNPJ inválido'),

  stateRegistration: z
    .string()
    .max(20, 'Inscrição estadual deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),

  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos'),

  cep: z
    .string()
    .refine((val) => val === '' || isValidCEP(val), 'CEP inválido (8 dígitos)')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .optional()
    .or(z.literal('')),

  neighborhood: z
    .string()
    .max(100, 'Bairro deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),

  state: z
    .string()
    .max(2, 'UF deve ter 2 caracteres')
    .optional()
    .or(z.literal('')),

  modules: z.array(z.string()).default([]),
})

// Schema para criação
export const createClienteSchema = clienteBaseSchema

// Schema para atualização (todos campos opcionais)
export const updateClienteSchema = clienteBaseSchema.partial()

// Tipos inferidos
export type CreateClienteInput = z.infer<typeof createClienteSchema>
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>
