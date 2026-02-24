/**
 * Testes do Sistema de Permissões
 *
 * Valida a matriz de permissões conforme docs/business/permissions.md
 */

import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  canAccessModule,
  getModulePermissions,
  PERMISSION_MATRIX,
  type PerfilTipo,
  type PermissionAction,
} from '../permissions'

describe('Sistema de Permissões', () => {
  describe('PERMISSION_MATRIX', () => {
    it('deve ter 9 perfis definidos', () => {
      const perfis = Object.keys(PERMISSION_MATRIX)
      expect(perfis).toHaveLength(9)
      expect(perfis).toContain('admin_master')
      expect(perfis).toContain('desenvolvedor')
      expect(perfis).toContain('administrador_total')
      expect(perfis).toContain('socio_profissional')
      expect(perfis).toContain('profissional')
      expect(perfis).toContain('secretaria')
      expect(perfis).toContain('administrativo')
      expect(perfis).toContain('financeiro')
      expect(perfis).toContain('faturamento')
    })
  })

  describe('admin_master', () => {
    const perfil: PerfilTipo = 'admin_master'

    it('deve ter todas as permissões nos módulos principais', () => {
      // Módulos principais com CRUD completo
      const modulosPrincipais = [
        'agenda_recepcao', 'pacientes', 'prontuario', 'metas_terapeuticas',
        'financeiro', 'faturamento', 'relatorios', 'configuracoes', 'saas'
      ]
      const todasAcoes: PermissionAction[] = ['create', 'read', 'update', 'delete', 'export']

      modulosPrincipais.forEach((modulo) => {
        todasAcoes.forEach((acao) => {
          expect(hasPermission(perfil, modulo, acao)).toBe(true)
        })
      })
    })

    it('deve ter acesso read em api_docs', () => {
      expect(canAccessModule(perfil, 'api_docs')).toBe(true)
      expect(hasPermission(perfil, 'api_docs', 'read')).toBe(true)
    })

    it('deve ter acesso ao módulo SaaS', () => {
      expect(canAccessModule(perfil, 'saas')).toBe(true)
      expect(hasPermission(perfil, 'saas', 'create')).toBe(true)
    })
  })

  describe('administrador_total', () => {
    const perfil: PerfilTipo = 'administrador_total'

    it('deve ter todas as permissões exceto SaaS completo', () => {
      expect(hasPermission(perfil, 'agenda_recepcao', 'create')).toBe(true)
      expect(hasPermission(perfil, 'pacientes', 'delete')).toBe(true)
      expect(hasPermission(perfil, 'configuracoes', 'update')).toBe(true)
    })

    it('deve ter apenas read no módulo SaaS', () => {
      expect(hasPermission(perfil, 'saas', 'read')).toBe(true)
      expect(hasPermission(perfil, 'saas', 'create')).toBe(false)
      expect(hasPermission(perfil, 'saas', 'delete')).toBe(false)
    })
  })

  describe('profissional', () => {
    const perfil: PerfilTipo = 'profissional'

    it('deve ter acesso a prontuário', () => {
      expect(canAccessModule(perfil, 'prontuario')).toBe(true)
      expect(hasPermission(perfil, 'prontuario', 'create')).toBe(true)
      expect(hasPermission(perfil, 'prontuario', 'read')).toBe(true)
      expect(hasPermission(perfil, 'prontuario', 'update')).toBe(true)
    })

    it('NÃO deve ter acesso a financeiro', () => {
      expect(canAccessModule(perfil, 'financeiro')).toBe(false)
      expect(hasPermission(perfil, 'financeiro', 'read')).toBe(false)
    })

    it('NÃO deve ter acesso a faturamento', () => {
      expect(canAccessModule(perfil, 'faturamento')).toBe(false)
    })

    it('NÃO deve ter acesso a configurações', () => {
      expect(canAccessModule(perfil, 'configuracoes')).toBe(false)
    })

    it('NÃO deve ter acesso ao SaaS', () => {
      expect(canAccessModule(perfil, 'saas')).toBe(false)
    })

    it('deve ter acesso a metas terapêuticas', () => {
      expect(canAccessModule(perfil, 'metas_terapeuticas')).toBe(true)
      expect(hasPermission(perfil, 'metas_terapeuticas', 'create')).toBe(true)
    })
  })

  describe('secretaria', () => {
    const perfil: PerfilTipo = 'secretaria'

    it('deve ter acesso a agenda e recepção', () => {
      expect(canAccessModule(perfil, 'agenda_recepcao')).toBe(true)
      expect(hasPermission(perfil, 'agenda_recepcao', 'create')).toBe(true)
      expect(hasPermission(perfil, 'agenda_recepcao', 'read')).toBe(true)
      expect(hasPermission(perfil, 'agenda_recepcao', 'update')).toBe(true)
    })

    it('deve ter acesso a pacientes', () => {
      expect(canAccessModule(perfil, 'pacientes')).toBe(true)
      expect(hasPermission(perfil, 'pacientes', 'create')).toBe(true)
    })

    it('NÃO deve ter acesso a prontuário', () => {
      expect(canAccessModule(perfil, 'prontuario')).toBe(false)
      expect(hasPermission(perfil, 'prontuario', 'read')).toBe(false)
    })

    it('NÃO deve ter acesso a metas terapêuticas', () => {
      expect(canAccessModule(perfil, 'metas_terapeuticas')).toBe(false)
    })

    it('NÃO deve ter acesso a financeiro', () => {
      expect(canAccessModule(perfil, 'financeiro')).toBe(false)
    })

    it('NÃO deve ter acesso a faturamento', () => {
      expect(canAccessModule(perfil, 'faturamento')).toBe(false)
    })

    it('deve ter acesso apenas read a relatórios', () => {
      expect(canAccessModule(perfil, 'relatorios')).toBe(true)
      expect(hasPermission(perfil, 'relatorios', 'read')).toBe(true)
      expect(hasPermission(perfil, 'relatorios', 'create')).toBe(false)
    })
  })

  describe('financeiro', () => {
    const perfil: PerfilTipo = 'financeiro'

    it('deve ter acesso CRUD no módulo financeiro', () => {
      expect(canAccessModule(perfil, 'financeiro')).toBe(true)
      expect(hasPermission(perfil, 'financeiro', 'create')).toBe(true)
      expect(hasPermission(perfil, 'financeiro', 'read')).toBe(true)
      expect(hasPermission(perfil, 'financeiro', 'update')).toBe(true)
    })

    it('deve ter apenas read no faturamento', () => {
      expect(canAccessModule(perfil, 'faturamento')).toBe(true)
      expect(hasPermission(perfil, 'faturamento', 'read')).toBe(true)
      expect(hasPermission(perfil, 'faturamento', 'create')).toBe(false)
    })

    it('NÃO deve ter acesso a prontuário', () => {
      expect(canAccessModule(perfil, 'prontuario')).toBe(false)
    })

    it('deve ter export em relatórios', () => {
      expect(hasPermission(perfil, 'relatorios', 'export')).toBe(true)
    })
  })

  describe('faturamento', () => {
    const perfil: PerfilTipo = 'faturamento'

    it('deve ter acesso completo ao módulo faturamento', () => {
      expect(canAccessModule(perfil, 'faturamento')).toBe(true)
      expect(hasPermission(perfil, 'faturamento', 'create')).toBe(true)
      expect(hasPermission(perfil, 'faturamento', 'read')).toBe(true)
      expect(hasPermission(perfil, 'faturamento', 'update')).toBe(true)
      expect(hasPermission(perfil, 'faturamento', 'export')).toBe(true)
    })

    it('deve ter apenas read no financeiro', () => {
      expect(canAccessModule(perfil, 'financeiro')).toBe(true)
      expect(hasPermission(perfil, 'financeiro', 'read')).toBe(true)
      expect(hasPermission(perfil, 'financeiro', 'create')).toBe(false)
    })

    it('NÃO deve ter acesso a prontuário', () => {
      expect(canAccessModule(perfil, 'prontuario')).toBe(false)
    })
  })

  describe('administrativo', () => {
    const perfil: PerfilTipo = 'administrativo'

    it('deve ter apenas read em agenda', () => {
      expect(canAccessModule(perfil, 'agenda_recepcao')).toBe(true)
      expect(hasPermission(perfil, 'agenda_recepcao', 'read')).toBe(true)
      expect(hasPermission(perfil, 'agenda_recepcao', 'create')).toBe(false)
    })

    it('deve ter read em financeiro e faturamento', () => {
      expect(canAccessModule(perfil, 'financeiro')).toBe(true)
      expect(canAccessModule(perfil, 'faturamento')).toBe(true)
    })

    it('NÃO deve ter acesso a prontuário', () => {
      expect(canAccessModule(perfil, 'prontuario')).toBe(false)
    })

    it('deve ter export em relatórios', () => {
      expect(hasPermission(perfil, 'relatorios', 'export')).toBe(true)
    })
  })

  describe('socio_profissional', () => {
    const perfil: PerfilTipo = 'socio_profissional'

    it('deve ter acesso a prontuário', () => {
      expect(canAccessModule(perfil, 'prontuario')).toBe(true)
      expect(hasPermission(perfil, 'prontuario', 'create')).toBe(true)
    })

    it('deve ter apenas read no financeiro', () => {
      expect(canAccessModule(perfil, 'financeiro')).toBe(true)
      expect(hasPermission(perfil, 'financeiro', 'read')).toBe(true)
      expect(hasPermission(perfil, 'financeiro', 'create')).toBe(false)
    })

    it('deve ter export em relatórios', () => {
      expect(hasPermission(perfil, 'relatorios', 'export')).toBe(true)
    })
  })

  describe('hasPermission()', () => {
    it('retorna false para módulo inexistente', () => {
      expect(hasPermission('admin_master', 'modulo_inexistente', 'read')).toBe(false)
    })

    it('retorna false para ação não permitida', () => {
      expect(hasPermission('secretaria', 'prontuario', 'read')).toBe(false)
    })
  })

  describe('canAccessModule()', () => {
    it('retorna true se tem permissão read', () => {
      expect(canAccessModule('profissional', 'agenda_recepcao')).toBe(true)
    })

    it('retorna false se não tem permissão read', () => {
      expect(canAccessModule('secretaria', 'prontuario')).toBe(false)
    })
  })

  describe('getModulePermissions()', () => {
    it('retorna array de permissões para módulo válido', () => {
      const perms = getModulePermissions('admin_master', 'agenda_recepcao')
      expect(perms).toContain('create')
      expect(perms).toContain('read')
      expect(perms).toContain('update')
      expect(perms).toContain('delete')
      expect(perms).toContain('export')
    })

    it('retorna array vazio para módulo sem permissões', () => {
      const perms = getModulePermissions('secretaria', 'prontuario')
      expect(perms).toEqual([])
    })

    it('retorna array vazio para módulo inexistente', () => {
      const perms = getModulePermissions('admin_master', 'nao_existe')
      expect(perms).toEqual([])
    })
  })
})
