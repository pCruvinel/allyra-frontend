import type { PerfilTipo } from '@/config/permissions'

interface AgendaProfessionalLike {
  id: string
  userId: string
}

interface ResolveInitialAgendaProfessionalParams {
  perfilTipo?: PerfilTipo
  userId?: string
  professionals: AgendaProfessionalLike[]
  storedProfessionalId?: string
}

export function getAgendaPreferenceKey(clinicaId: string, userId: string) {
  return `allyra:agenda:selected-professional:${clinicaId}:${userId}`
}

export function resolveInitialAgendaProfessional({
  perfilTipo,
  userId,
  professionals,
  storedProfessionalId,
}: ResolveInitialAgendaProfessionalParams): string {
  const ownProfessionalId = userId
    ? professionals.find((professional) => professional.userId === userId)?.id ?? ''
    : ''

  const hasStoredProfessional = !!storedProfessionalId
    && professionals.some((professional) => professional.id === storedProfessionalId)

  if (perfilTipo === 'profissional') {
    return ownProfessionalId
  }

  if (hasStoredProfessional) {
    return storedProfessionalId!
  }

  if (perfilTipo === 'socio_profissional') {
    return ownProfessionalId
  }

  return ''
}

export function canViewAllAgendas(perfilTipo?: PerfilTipo) {
  return perfilTipo !== 'profissional'
}
