/**
 * Testes de Permissões por Usuário Real
 *
 * Valida que cada usuário de teste do Supabase tem as permissões corretas
 * baseado em seu perfil_tipo.
 *
 * Usuários de teste:
 * - admin@clinicamodelo.com.br (admin_master)
 * - ana.santos@clinicamodelo.com.br (profissional)
 * - carlos.silva@clinicamodelo.com.br (profissional)
 * - julia.fernandes@clinicamodelo.com.br (secretaria)
 * - marina.oliveira@clinicamodelo.com.br (profissional)
 *
 * Senha: Senh@_123
 */

import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  canAccessModule,
  type PerfilTipo,
} from '../permissions'
import {
  TEST_USERS,
  ADMIN_USER,
  PROFISSIONAL_USER,
  SECRETARIA_USER,
  EXPECTED_MODULES_BY_PERFIL,
  RESTRICTED_MODULES_BY_PERFIL,
  getUserByPerfil,
  getUsersByPerfil,
} from '@/test/fixtures/users'

describe('Permissões por Usuário Real', () => {
  describe('Dados de Teste', () => {
    it('deve ter 5 usuários de teste', () => {
      expect(TEST_USERS).toHaveLength(5)
    })

    it('cada usuário deve ter estrutura válida', () => {
      TEST_USERS.forEach((user) => {
        expect(user.id).toBeDefined()
        expect(user.email).toMatch(/@clinicamodelo\.com\.br$/)
        expect(user.nome_completo).toBeDefined()
        expect(user.perfil_tipo).toBeDefined()
        expect(user.password).toBe('Senh@_123')
      })
    })

    it('deve ter 1 admin_master', () => {
      const admins = getUsersByPerfil('admin_master')
      expect(admins).toHaveLength(1)
      expect(admins[0].email).toBe('admin@clinicamodelo.com.br')
    })

    it('deve ter 3 profissionais', () => {
      const profissionais = getUsersByPerfil('profissional')
      expect(profissionais).toHaveLength(3)
    })

    it('deve ter 1 secretária', () => {
      const secretarias = getUsersByPerfil('secretaria')
      expect(secretarias).toHaveLength(1)
      expect(secretarias[0].email).toBe('julia.fernandes@clinicamodelo.com.br')
    })
  })

  describe('Admin Sistema (admin@clinicamodelo.com.br)', () => {
    const user = ADMIN_USER

    it('deve ser admin_master', () => {
      expect(user.perfil_tipo).toBe('admin_master')
    })

    it('deve ter acesso a TODOS os módulos', () => {
      const modulosEsperados = EXPECTED_MODULES_BY_PERFIL.admin_master
      modulosEsperados.forEach((modulo) => {
        expect(canAccessModule(user.perfil_tipo, modulo)).toBe(true)
      })
    })

    it('deve ter TODAS as permissões nos módulos principais', () => {
      const todasAcoes = ['create', 'read', 'update', 'delete', 'export'] as const
      // Módulos principais (exceto api_docs que só tem read)
      const modulosPrincipais = [
        'agenda_recepcao', 'pacientes', 'prontuario', 'metas_terapeuticas',
        'financeiro', 'faturamento', 'relatorios', 'configuracoes', 'saas'
      ]

      modulosPrincipais.forEach((modulo) => {
        todasAcoes.forEach((acao) => {
          expect(hasPermission(user.perfil_tipo, modulo, acao)).toBe(true)
        })
      })
    })

    it('deve ter acesso read em api_docs', () => {
      expect(canAccessModule(user.perfil_tipo, 'api_docs')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'api_docs', 'read')).toBe(true)
    })

    it('deve poder gerenciar SaaS (clientes)', () => {
      expect(canAccessModule(user.perfil_tipo, 'saas')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'saas', 'create')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'saas', 'delete')).toBe(true)
    })
  })

  describe('Dra. Ana Santos (ana.santos@clinicamodelo.com.br)', () => {
    const user = TEST_USERS.find((u) => u.email === 'ana.santos@clinicamodelo.com.br')!

    it('deve ser profissional', () => {
      expect(user.perfil_tipo).toBe('profissional')
    })

    it('deve ter acesso a prontuário', () => {
      expect(canAccessModule(user.perfil_tipo, 'prontuario')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'prontuario', 'create')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'prontuario', 'read')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'prontuario', 'update')).toBe(true)
    })

    it('deve ter acesso a metas terapêuticas', () => {
      expect(canAccessModule(user.perfil_tipo, 'metas_terapeuticas')).toBe(true)
    })

    it('NÃO deve ter acesso a financeiro', () => {
      expect(canAccessModule(user.perfil_tipo, 'financeiro')).toBe(false)
      expect(hasPermission(user.perfil_tipo, 'financeiro', 'read')).toBe(false)
    })

    it('NÃO deve ter acesso a faturamento', () => {
      expect(canAccessModule(user.perfil_tipo, 'faturamento')).toBe(false)
    })

    it('NÃO deve ter acesso a configurações', () => {
      expect(canAccessModule(user.perfil_tipo, 'configuracoes')).toBe(false)
    })

    it('NÃO deve ter acesso ao SaaS', () => {
      expect(canAccessModule(user.perfil_tipo, 'saas')).toBe(false)
    })
  })

  describe('Julia Fernandes (julia.fernandes@clinicamodelo.com.br)', () => {
    const user = SECRETARIA_USER

    it('deve ser secretaria', () => {
      expect(user.perfil_tipo).toBe('secretaria')
      expect(user.nome_completo).toBe('Julia Fernandes')
    })

    it('deve ter acesso a agenda e recepção', () => {
      expect(canAccessModule(user.perfil_tipo, 'agenda_recepcao')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'agenda_recepcao', 'create')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'agenda_recepcao', 'read')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'agenda_recepcao', 'update')).toBe(true)
    })

    it('deve ter acesso a pacientes', () => {
      expect(canAccessModule(user.perfil_tipo, 'pacientes')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'pacientes', 'create')).toBe(true)
    })

    it('NÃO deve ter acesso a prontuário (sigilo médico)', () => {
      expect(canAccessModule(user.perfil_tipo, 'prontuario')).toBe(false)
      expect(hasPermission(user.perfil_tipo, 'prontuario', 'read')).toBe(false)
    })

    it('NÃO deve ter acesso a metas terapêuticas', () => {
      expect(canAccessModule(user.perfil_tipo, 'metas_terapeuticas')).toBe(false)
    })

    it('NÃO deve ter acesso a financeiro', () => {
      expect(canAccessModule(user.perfil_tipo, 'financeiro')).toBe(false)
    })

    it('NÃO deve ter acesso a faturamento', () => {
      expect(canAccessModule(user.perfil_tipo, 'faturamento')).toBe(false)
    })

    it('NÃO deve ter acesso a configurações', () => {
      expect(canAccessModule(user.perfil_tipo, 'configuracoes')).toBe(false)
    })

    it('deve ter apenas read em relatórios', () => {
      expect(canAccessModule(user.perfil_tipo, 'relatorios')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'relatorios', 'read')).toBe(true)
      expect(hasPermission(user.perfil_tipo, 'relatorios', 'create')).toBe(false)
      expect(hasPermission(user.perfil_tipo, 'relatorios', 'export')).toBe(false)
    })
  })

  describe('Validação de Módulos por Perfil', () => {
    const perfisParaTestar: PerfilTipo[] = ['admin_master', 'profissional', 'secretaria']

    perfisParaTestar.forEach((perfil) => {
      describe(`Perfil: ${perfil}`, () => {
        const user = getUserByPerfil(perfil)

        it(`usuário de teste existe para ${perfil}`, () => {
          expect(user).toBeDefined()
        })

        it('deve ter acesso aos módulos esperados', () => {
          const modulosEsperados = EXPECTED_MODULES_BY_PERFIL[perfil]
          modulosEsperados.forEach((modulo) => {
            expect(
              canAccessModule(perfil, modulo),
              `${perfil} deveria ter acesso a ${modulo}`
            ).toBe(true)
          })
        })

        it('NÃO deve ter acesso aos módulos restritos', () => {
          const modulosRestritos = RESTRICTED_MODULES_BY_PERFIL[perfil]
          modulosRestritos.forEach((modulo) => {
            expect(
              canAccessModule(perfil, modulo),
              `${perfil} NÃO deveria ter acesso a ${modulo}`
            ).toBe(false)
          })
        })
      })
    })
  })

  describe('Cenários de Uso Real', () => {
    describe('Fluxo de Atendimento (Secretária → Profissional)', () => {
      const secretaria = SECRETARIA_USER
      const profissional = PROFISSIONAL_USER

      it('secretária pode agendar consulta', () => {
        expect(hasPermission(secretaria.perfil_tipo, 'agenda_recepcao', 'create')).toBe(true)
      })

      it('secretária pode cadastrar paciente', () => {
        expect(hasPermission(secretaria.perfil_tipo, 'pacientes', 'create')).toBe(true)
      })

      it('secretária NÃO pode ver prontuário', () => {
        expect(hasPermission(secretaria.perfil_tipo, 'prontuario', 'read')).toBe(false)
      })

      it('profissional pode atualizar agenda (confirmar chegada)', () => {
        expect(hasPermission(profissional.perfil_tipo, 'agenda_recepcao', 'update')).toBe(true)
      })

      it('profissional pode criar prontuário', () => {
        expect(hasPermission(profissional.perfil_tipo, 'prontuario', 'create')).toBe(true)
      })

      it('profissional pode atualizar prontuário', () => {
        expect(hasPermission(profissional.perfil_tipo, 'prontuario', 'update')).toBe(true)
      })

      it('profissional pode criar metas terapêuticas', () => {
        expect(hasPermission(profissional.perfil_tipo, 'metas_terapeuticas', 'create')).toBe(true)
      })
    })

    describe('Separação de Responsabilidades', () => {
      it('apenas admin pode gerenciar configurações', () => {
        expect(canAccessModule('admin_master', 'configuracoes')).toBe(true)
        expect(canAccessModule('administrador_total', 'configuracoes')).toBe(true)
        expect(canAccessModule('profissional', 'configuracoes')).toBe(false)
        expect(canAccessModule('secretaria', 'configuracoes')).toBe(false)
      })

      it('apenas admin_master pode criar clientes SaaS', () => {
        expect(hasPermission('admin_master', 'saas', 'create')).toBe(true)
        expect(hasPermission('administrador_total', 'saas', 'create')).toBe(false)
        expect(hasPermission('profissional', 'saas', 'create')).toBe(false)
      })

      it('profissionais clínicos não acessam módulos financeiros', () => {
        expect(canAccessModule('profissional', 'financeiro')).toBe(false)
        expect(canAccessModule('profissional', 'faturamento')).toBe(false)
      })

      it('secretária não acessa informações clínicas sigilosas', () => {
        expect(canAccessModule('secretaria', 'prontuario')).toBe(false)
        expect(canAccessModule('secretaria', 'metas_terapeuticas')).toBe(false)
      })
    })
  })
})
