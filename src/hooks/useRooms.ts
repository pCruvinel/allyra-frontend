import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'

export interface Room {
  id: string
  clinica_id: string
  nome: string
  descricao?: string
  capacidade?: number
  ativo: boolean
  created_at: string
}

interface UseRoomsOptions {
  autoFetch?: boolean
  activeOnly?: boolean
}

export function useRooms(options: UseRoomsOptions = {}) {
  const { autoFetch = true, activeOnly = true } = options
  const { currentClinica } = useAuth()

  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRooms = useCallback(async () => {
    if (!currentClinica?.id) {
      setRooms([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.getRooms(currentClinica.id)

      if (response.error) {
        setError(response.error)
        toast.error(response.error)
        return
      }

      let data = response.data || []
      
      if (activeOnly) {
        data = data.filter((r: Room) => r.ativo !== false)
      }

      setRooms(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar salas'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, activeOnly])

  useEffect(() => {
    if (autoFetch) {
      fetchRooms()
    }
  }, [fetchRooms, autoFetch])

  // Helpers derived from state
  const roomsOptions = rooms.map(s => ({
    value: s.id,
    label: s.nome,
  }))

  return {
    rooms,
    roomsOptions,
    isLoading,
    error,
    refresh: fetchRooms,
  }
}
