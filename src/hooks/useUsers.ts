/**
 * Hook para gerenciamento de usuários do sistema
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  usersService,
  type SystemUserFormatted,
  type UserFilters,
  type CreateUserInput,
} from '@/services/users.service'
import type { QueryOptions } from '@/services/types'
import type { UserStatus, PermissionLevel } from '@/types/user'

interface UseUsersOptions {
  autoFetch?: boolean
  initialFilters?: UserFilters
  clientId?: string
}

interface UseUsersReturn {
  users: SystemUserFormatted[]
  isLoading: boolean
  error: string | null
  total: number
  summary: {
    total: number
    active: number
    inactive: number
    blocked: number
  }
  fetchUsers: (options?: QueryOptions & { filters?: UserFilters }) => Promise<void>
  getUserById: (id: string) => Promise<SystemUserFormatted | null>
  getUsersByClient: (clientId: string) => Promise<SystemUserFormatted[]>
  createUser: (data: CreateUserInput) => Promise<SystemUserFormatted | null>
  updateUserStatus: (id: string, ativo: boolean) => Promise<boolean>
  setSearch: (search: string) => void
  setStatusFilter: (status: UserStatus | '') => void
  setPermissionFilter: (level: PermissionLevel | '') => void
  setClientFilter: (clientId: string) => void
  clearFilters: () => void
  refresh: () => Promise<void>
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { autoFetch = true, initialFilters, clientId } = options

  const [users, setUsers] = useState<SystemUserFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
  })
  const [filters, setFilters] = useState<UserFilters>({
    ...initialFilters,
    clientId,
  })

  const fetchUsers = useCallback(async (queryOptions?: QueryOptions & { filters?: UserFilters }) => {
    setIsLoading(true)
    setError(null)

    try {
      const combinedFilters: UserFilters = {
        ...filters,
        ...queryOptions?.filters,
      }

      const [usersResult, summaryResult] = await Promise.all([
        usersService.getAll({ ...queryOptions, filters: combinedFilters }),
        usersService.getSummary(combinedFilters.clientId),
      ])

      if (usersResult.error) {
        setError(usersResult.error.message)
        if (usersResult.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(usersResult.error.message)
        }
      } else {
        setUsers(usersResult.data || [])
        setTotal(usersResult.count || 0)
      }

      if (summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar usuários'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const getUserById = useCallback(async (id: string): Promise<SystemUserFormatted | null> => {
    try {
      const result = await usersService.getById(id)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return null
      }
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar usuário'
      toast.error(message)
      return null
    }
  }, [])

  const getUsersByClient = useCallback(async (clientIdParam: string): Promise<SystemUserFormatted[]> => {
    try {
      const result = await usersService.getByClientId(clientIdParam)
      if (result.error) {
        if (result.error.code !== 'SUPABASE_NOT_CONFIGURED') {
          toast.error(result.error.message)
        }
        return []
      }
      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar usuários do cliente'
      toast.error(message)
      return []
    }
  }, [])

  const createUser = useCallback(async (data: CreateUserInput): Promise<SystemUserFormatted | null> => {
    setIsLoading(true)
    try {
      const result = await usersService.create(data)
      if (result.error) {
        toast.error(result.error.message)
        return null
      }
      toast.success('Usuário criado com sucesso!')
      await fetchUsers()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsers])

  const updateUserStatus = useCallback(async (id: string, ativo: boolean): Promise<boolean> => {
    try {
      const result = await usersService.updateStatus(id, ativo)
      if (result.error) {
        toast.error(result.error.message)
        return false
      }
      toast.success(ativo ? 'Usuário ativado com sucesso' : 'Usuário desativado com sucesso')
      await fetchUsers()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status'
      toast.error(message)
      return false
    }
  }, [fetchUsers])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setStatusFilter = useCallback((status: UserStatus | '') => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const setPermissionFilter = useCallback((permissionLevel: PermissionLevel | '') => {
    setFilters(prev => ({ ...prev, permissionLevel }))
  }, [])

  const setClientFilter = useCallback((newClientId: string) => {
    setFilters(prev => ({ ...prev, clientId: newClientId }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ clientId: filters.clientId }) // Mantém o clientId se existir
  }, [filters.clientId])

  const refresh = useCallback(async () => {
    await fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (autoFetch && filters.clientId) {
      fetchUsers()
    }
  }, [autoFetch, filters, fetchUsers])

  return {
    users,
    isLoading,
    error,
    total,
    summary,
    fetchUsers,
    getUserById,
    getUsersByClient,
    createUser,
    updateUserStatus,
    setSearch,
    setStatusFilter,
    setPermissionFilter,
    setClientFilter,
    clearFilters,
    refresh,
  }
}
