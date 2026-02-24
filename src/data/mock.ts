/**
 * Dados mock para ChatPanel
 * NOTA: Este é o ÚNICO arquivo mock que deve ser mantido
 * Todos os outros dados vêm do Supabase
 */

import type { ChatDepartment, ChatContact } from '@/types'

// Departamentos para o chat
export const chatDepartments: ChatDepartment[] = [
  { id: 'recepcao', name: 'Recepção' },
  { id: 'enfermeiros', name: 'Enfermeiros' },
  { id: 'medicos', name: 'Médicos' },
  { id: 'almoxarifado', name: 'Almoxarifado' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'rh', name: 'Recursos humanos' },
]

// Contatos para o chat
export const chatContacts: ChatContact[] = [
  { id: '1', name: 'Julia da Silva', role: 'Recepcionista', departmentId: 'recepcao', online: true },
  { id: '2', name: 'Patrícia dos Santos', role: 'Recepcionista', departmentId: 'recepcao', online: true },
  { id: '3', name: 'Marcos Santana', role: 'Nutricionista', departmentId: 'medicos', online: true },
  { id: '4', name: 'João Ricardo Martins', role: 'Enfermeiro', departmentId: 'enfermeiros', online: false },
  { id: '5', name: 'Ana Paula Costa', role: 'Médica', departmentId: 'medicos', online: true },
  { id: '6', name: 'Carlos Eduardo', role: 'Almoxarife', departmentId: 'almoxarifado', online: false },
  { id: '7', name: 'Fernanda Lima', role: 'Financeiro', departmentId: 'financeiro', online: true },
  { id: '8', name: 'Roberto Silva', role: 'RH', departmentId: 'rh', online: true },
]
