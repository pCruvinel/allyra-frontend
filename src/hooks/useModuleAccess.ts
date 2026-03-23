/**
 * Hook useModuleAccess
 *
 * Centraliza a lógica de verificação de acesso a módulos, combinando:
 * 1. Status do módulo (disponível no ambiente?)
 * 2. Permissões do perfil do usuário
 * 3. Módulos ativos na clínica (futuro)
 */

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES, isModuleAvailable, ModuleConfig } from '@/config/modules'
import {
  canAccessModule,
  hasPermission,
  PermissionAction,
  PerfilTipo,
} from '@/config/permissions'

interface UseModuleAccessReturn {
  /** Lista de módulos visíveis para o usuário atual */
  visibleModules: ModuleConfig[]
  /** Verifica se usuário pode acessar um módulo específico */
  canAccess: (moduleSlug: string) => boolean
  /** Verifica permissão específica em um módulo */
  checkPermission: (moduleSlug: string, action: PermissionAction) => boolean
  /** Perfil do usuário atual */
  currentPerfil: PerfilTipo | null
  /** Indica se está carregando dados do usuário */
  isLoading: boolean
}

/**
 * Hook para verificar acesso a módulos
 *
 * O perfil_tipo agora vem diretamente do banco de dados via RPC get_current_user_with_clinics
 */
export function useModuleAccess(): UseModuleAccessReturn {
  const { user, isLoading } = useAuth()

  // Determina o perfil atual do usuário (vem do banco de dados)
  const currentPerfil: PerfilTipo | null = useMemo(() => {
    if (!user) return null

    // Perfil_tipo vem diretamente do usuário autenticado
    if (user.perfil_tipo) {
      return user.perfil_tipo
    }

    // Fallback para secretaria se não tiver perfil definido
    console.warn('[useModuleAccess] Usuário sem perfil_tipo definido, usando fallback: secretaria')
    return 'secretaria'
  }, [user])

  // Lista de módulos visíveis para o usuário
  const visibleModules = useMemo(() => {
    if (!currentPerfil) return []

    return Object.values(MODULES).filter((module) => {
      // 1. Módulo está disponível no ambiente?
      if (!isModuleAvailable(module.slug)) return false

      // 2. Usuário tem permissão para acessar?
      return canAccessModule(currentPerfil, module.slug)
    })
  }, [currentPerfil])

  const isPermissionAwareModule = (moduleSlug: string): boolean => {
    if (isModuleAvailable(moduleSlug)) return true
    return moduleSlug === 'prontuario'
  }

  // Verifica se usuário pode acessar um módulo
  const canAccess = (moduleSlug: string): boolean => {
    if (!currentPerfil) return false
    if (!isPermissionAwareModule(moduleSlug)) return false
    return canAccessModule(currentPerfil, moduleSlug)
  }

  // Verifica permissão específica
  const checkPermission = (moduleSlug: string, action: PermissionAction): boolean => {
    if (!currentPerfil) return false
    if (!isPermissionAwareModule(moduleSlug)) return false
    return hasPermission(currentPerfil, moduleSlug, action)
  }

  return {
    visibleModules,
    canAccess,
    checkPermission,
    currentPerfil,
    isLoading,
  }
}

/**
 * Hook para verificar permissão em um módulo específico
 * Uso: const { canCreate, canUpdate, canDelete } = useModulePermission('financeiro')
 */
export function useModulePermission(moduleSlug: string) {
  const { checkPermission, canAccess, currentPerfil, isLoading } = useModuleAccess()

  return {
    canAccess: canAccess(moduleSlug),
    canCreate: checkPermission(moduleSlug, 'create'),
    canRead: checkPermission(moduleSlug, 'read'),
    canUpdate: checkPermission(moduleSlug, 'update'),
    canDelete: checkPermission(moduleSlug, 'delete'),
    canExport: checkPermission(moduleSlug, 'export'),
    currentPerfil,
    isLoading,
  }
}
