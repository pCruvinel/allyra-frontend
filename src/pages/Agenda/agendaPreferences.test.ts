import { describe, expect, it } from 'vitest'

import { canViewAllAgendas, getAgendaPreferenceKey, resolveInitialAgendaProfessional } from './agendaPreferences'

const professionals = [
  { id: 'prof-1', userId: 'user-1' },
  { id: 'prof-2', userId: 'user-2' },
]

describe('agendaPreferences', () => {
  describe('getAgendaPreferenceKey', () => {
    it('cria uma chave estável por clínica e usuário', () => {
      expect(getAgendaPreferenceKey('clinica-1', 'user-1')).toBe(
        'allyra:agenda:selected-professional:clinica-1:user-1',
      )
    })
  })

  describe('resolveInitialAgendaProfessional', () => {
    it('prioriza a própria agenda para perfil profissional', () => {
      expect(resolveInitialAgendaProfessional({
        perfilTipo: 'profissional',
        userId: 'user-2',
        professionals,
        storedProfessionalId: 'prof-1',
      })).toBe('prof-2')
    })

    it('restaura o último profissional salvo para perfis administrativos', () => {
      expect(resolveInitialAgendaProfessional({
        perfilTipo: 'secretaria',
        userId: 'user-1',
        professionals,
        storedProfessionalId: 'prof-2',
      })).toBe('prof-2')
    })

    it('usa a própria agenda como fallback inicial para sócio profissional', () => {
      expect(resolveInitialAgendaProfessional({
        perfilTipo: 'socio_profissional',
        userId: 'user-1',
        professionals,
      })).toBe('prof-1')
    })

    it('abre visão consolidada quando não há preferência válida', () => {
      expect(resolveInitialAgendaProfessional({
        perfilTipo: 'secretaria',
        userId: 'user-1',
        professionals,
        storedProfessionalId: 'inexistente',
      })).toBe('')
    })
  })

  describe('canViewAllAgendas', () => {
    it('bloqueia visão consolidada para profissional', () => {
      expect(canViewAllAgendas('profissional')).toBe(false)
    })

    it('permite visão consolidada para perfis operacionais e administrativos', () => {
      expect(canViewAllAgendas('secretaria')).toBe(true)
      expect(canViewAllAgendas('socio_profissional')).toBe(true)
    })
  })
})
