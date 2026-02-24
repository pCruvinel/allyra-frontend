/**
 * Testes do Sistema de Módulos
 *
 * Valida a configuração dos módulos
 */

import { describe, it, expect } from 'vitest'
import { MODULES, isModuleAvailable } from '../modules'

describe('Sistema de Módulos', () => {
  describe('MODULES', () => {
    it('deve ter módulos definidos', () => {
      const modulos = Object.keys(MODULES)
      expect(modulos.length).toBeGreaterThanOrEqual(9)
    })

    it('cada módulo deve ter estrutura válida', () => {
      Object.values(MODULES).forEach((module) => {
        expect(module).toHaveProperty('id')
        expect(module).toHaveProperty('name')
        expect(module).toHaveProperty('slug')
        expect(module).toHaveProperty('route')
        expect(module).toHaveProperty('icon')
      })
    })
  })

  describe('isModuleAvailable()', () => {
    it('todos os módulos devem estar disponíveis', () => {
      expect(isModuleAvailable('agenda_recepcao')).toBe(true)
      expect(isModuleAvailable('pacientes')).toBe(true)
      expect(isModuleAvailable('financeiro')).toBe(true)
      expect(isModuleAvailable('faturamento')).toBe(true)
      expect(isModuleAvailable('metas_terapeuticas')).toBe(true)
      expect(isModuleAvailable('relatorios')).toBe(true)
      expect(isModuleAvailable('multiclinica')).toBe(true)
    })

    it('retorna false para módulo inexistente', () => {
      expect(isModuleAvailable('modulo_nao_existe')).toBe(false)
    })
  })

  describe('Rotas dos Módulos', () => {
    it('agenda_recepcao deve ter rota /agenda', () => {
      expect(MODULES.agenda_recepcao.route).toBe('/agenda')
    })

    it('pacientes deve ter rota /pacientes', () => {
      expect(MODULES.pacientes.route).toBe('/pacientes')
    })

    it('financeiro deve ter rota /financeiro', () => {
      expect(MODULES.financeiro.route).toBe('/financeiro')
    })

    it('faturamento deve ter rota /faturamento', () => {
      expect(MODULES.faturamento.route).toBe('/faturamento')
    })
  })

  describe('Ícones dos Módulos', () => {
    it('cada módulo deve ter um ícone definido', () => {
      Object.values(MODULES).forEach((module) => {
        expect(module.icon).toBeDefined()
        expect(typeof module.icon).toBe('string')
        expect(module.icon.length).toBeGreaterThan(0)
      })
    })
  })
})
