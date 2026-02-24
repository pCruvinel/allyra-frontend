/**
 * Fixtures de Usuários de Teste
 *
 * Dados reais de usuários criados no Supabase para testes de integração.
 * Estes usuários existem no banco de desenvolvimento e podem ser usados
 * para validar login, permissões e visibilidade de módulos.
 *
 * Senha padrão: Senh@_123
 */

import type { PerfilTipo } from '@/config/permissions'

export interface TestUser {
  id: string
  email: string
  nome_completo: string
  perfil_tipo: PerfilTipo
  clinicas_vinculadas: number
  password: string
}

/**
 * Senha padrão para todos os usuários de teste
 */
export const TEST_PASSWORD = 'Senh@_123'

/**
 * Usuários de teste criados no Supabase
 */
export const TEST_USERS: TestUser[] = [
  {
    id: '5420d3e6-1a7c-4d6a-876a-8d795252127c',
    email: 'admin@clinicamodelo.com.br',
    nome_completo: 'Admin Sistema',
    perfil_tipo: 'admin_master',
    clinicas_vinculadas: 1,
    password: TEST_PASSWORD,
  },
  {
    id: 'a3c06b87-cea8-4b82-ade8-ba3d4cf1a0bf',
    email: 'ana.santos@clinicamodelo.com.br',
    nome_completo: 'Dra. Ana Beatriz Santos',
    perfil_tipo: 'profissional',
    clinicas_vinculadas: 1,
    password: TEST_PASSWORD,
  },
  {
    id: 'b59559e5-efde-4677-8f02-4acbacdfccb0',
    email: 'carlos.silva@clinicamodelo.com.br',
    nome_completo: 'Dr. Carlos Silva',
    perfil_tipo: 'profissional',
    clinicas_vinculadas: 1,
    password: TEST_PASSWORD,
  },
  {
    id: 'de6e05ea-9ca9-41f1-a610-50091d23e4bd',
    email: 'julia.fernandes@clinicamodelo.com.br',
    nome_completo: 'Julia Fernandes',
    perfil_tipo: 'secretaria',
    clinicas_vinculadas: 1,
    password: TEST_PASSWORD,
  },
  {
    id: '112a2e9b-659b-4970-bfc2-8186554f8ebf',
    email: 'marina.oliveira@clinicamodelo.com.br',
    nome_completo: 'Dra. Marina Oliveira',
    perfil_tipo: 'profissional',
    clinicas_vinculadas: 1,
    password: TEST_PASSWORD,
  },
]

/**
 * Helpers para buscar usuários por perfil
 */
export function getUserByPerfil(perfil: PerfilTipo): TestUser | undefined {
  return TEST_USERS.find((u) => u.perfil_tipo === perfil)
}

export function getUsersByPerfil(perfil: PerfilTipo): TestUser[] {
  return TEST_USERS.filter((u) => u.perfil_tipo === perfil)
}

export function getUserById(id: string): TestUser | undefined {
  return TEST_USERS.find((u) => u.id === id)
}

export function getUserByEmail(email: string): TestUser | undefined {
  return TEST_USERS.find((u) => u.email === email)
}

/**
 * Usuários específicos para testes comuns
 */
export const ADMIN_USER = TEST_USERS.find((u) => u.perfil_tipo === 'admin_master')!
export const PROFISSIONAL_USER = TEST_USERS.find((u) => u.perfil_tipo === 'profissional')!
export const SECRETARIA_USER = TEST_USERS.find((u) => u.perfil_tipo === 'secretaria')!

/**
 * Mapeamento de módulos esperados por perfil
 * Usado para validar que cada perfil vê os módulos corretos
 */
export const EXPECTED_MODULES_BY_PERFIL: Record<PerfilTipo, string[]> = {
  admin_master: [
    'agenda_recepcao',
    'pacientes',
    'prontuario',
    'metas_terapeuticas',
    'financeiro',
    'faturamento',
    'relatorios',
    'configuracoes',
    'saas',
    'api_docs',
  ],
  desenvolvedor: [
    'agenda_recepcao',
    'pacientes',
    'prontuario',
    'metas_terapeuticas',
    'financeiro',
    'faturamento',
    'relatorios',
    'configuracoes',
    'saas',
    'api_docs',
  ],
  administrador_total: [
    'agenda_recepcao',
    'pacientes',
    'prontuario',
    'metas_terapeuticas',
    'financeiro',
    'faturamento',
    'relatorios',
    'configuracoes',
    'saas',
  ],
  socio_profissional: [
    'agenda_recepcao',
    'pacientes',
    'prontuario',
    'metas_terapeuticas',
    'financeiro',
    'faturamento',
    'relatorios',
    'configuracoes',
  ],
  profissional: [
    'agenda_recepcao',
    'pacientes',
    'prontuario',
    'metas_terapeuticas',
    'relatorios',
  ],
  secretaria: ['agenda_recepcao', 'pacientes', 'relatorios'],
  administrativo: [
    'agenda_recepcao',
    'pacientes',
    'financeiro',
    'faturamento',
    'relatorios',
  ],
  financeiro: [
    'agenda_recepcao',
    'pacientes',
    'financeiro',
    'faturamento',
    'relatorios',
  ],
  faturamento: [
    'agenda_recepcao',
    'pacientes',
    'financeiro',
    'faturamento',
    'relatorios',
  ],
}

/**
 * Módulos que cada perfil NÃO deve ter acesso
 */
export const RESTRICTED_MODULES_BY_PERFIL: Record<PerfilTipo, string[]> = {
  admin_master: [], // Admin tem acesso a tudo
  desenvolvedor: [], // Desenvolvedor tem acesso a tudo
  administrador_total: [], // Quase tudo, apenas não pode criar SaaS
  socio_profissional: ['saas'],
  profissional: ['financeiro', 'faturamento', 'configuracoes', 'saas'],
  secretaria: ['prontuario', 'metas_terapeuticas', 'financeiro', 'faturamento', 'configuracoes', 'saas'],
  administrativo: ['prontuario', 'metas_terapeuticas', 'configuracoes', 'saas'],
  financeiro: ['prontuario', 'metas_terapeuticas', 'configuracoes', 'saas'],
  faturamento: ['prontuario', 'metas_terapeuticas', 'configuracoes', 'saas'],
}
