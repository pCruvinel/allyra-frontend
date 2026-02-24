/**
 * Hook para gerenciar atendimentos no modo stand-alone
 * Usa API como fonte primária, com fallback para localStorage
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  metasStandaloneService,
  StandaloneAttendance,
  PatientStats,
} from '@/services/metas-standalone.service'
import { STORAGE_KEYS } from '../types/standalone'

// Tipo para formulário de atendimento
export interface AttendanceFormData {
  pacienteId: string
  pacienteNome?: string
  data: string
  horario?: string
  tipo: 'presente' | 'ausente' | 'remarcado' | 'cancelado'
  observacoes?: string
  profissionalId?: string
}

// Carrega atendimentos do localStorage (fallback)
function loadAttendancesFromStorage(): StandaloneAttendance[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Silently fail
  }
  return []
}

// Salva atendimentos no localStorage (cache local)
function saveAttendancesToStorage(attendances: StandaloneAttendance[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendances))
  } catch {
    // Silently fail
  }
}

interface UseStandaloneAttendanceOptions {
  getPatientName?: (id: string) => string | undefined
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useStandaloneAttendance(_options?: UseStandaloneAttendanceOptions) {
  const { currentClinica } = useAuth()
  const clinicaId = currentClinica?.id || ''

  const [records, setRecords] = useState<StandaloneAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carrega atendimentos da API ou localStorage
  const loadAttendances = useCallback(async () => {
    if (!clinicaId) {
      setRecords([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await metasStandaloneService.listAttendances(clinicaId)
      const apiRecords = response.data || []
      setRecords(apiRecords)
      saveAttendancesToStorage(apiRecords) // Cache local
    } catch (err) {
      console.warn('[useStandaloneAttendance] Falha ao carregar da API, usando localStorage:', err)
      // Fallback para localStorage
      const localRecords = loadAttendancesFromStorage()
      setRecords(localRecords)
      setError('Modo offline - usando dados locais')
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // Carrega atendimentos ao montar ou quando clínica muda
  useEffect(() => {
    loadAttendances()
  }, [loadAttendances])

  // Registra um novo atendimento
  const registerAttendance = useCallback(async (data: AttendanceFormData): Promise<StandaloneAttendance | null> => {
    if (!clinicaId) {
      toast.error('Selecione uma clínica primeiro')
      return null
    }

    try {
      const response = await metasStandaloneService.createAttendance({
        clinica_id: clinicaId,
        paciente_id: data.pacienteId,
        data: data.data,
        horario: data.horario,
        tipo: data.tipo,
        observacoes: data.observacoes,
        profissional_id: data.profissionalId,
      })

      const newRecord = response.data
      setRecords(prev => {
        const updated = [newRecord, ...prev]
        saveAttendancesToStorage(updated)
        return updated
      })

      const tipoLabel = data.tipo === 'presente' ? 'Presença' : data.tipo === 'ausente' ? 'Ausência' : data.tipo
      toast.success(`${tipoLabel} registrada com sucesso!`)
      return newRecord
    } catch (err: unknown) {
      console.error('[useStandaloneAttendance] Erro ao registrar atendimento:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar atendimento')
      return null
    }
  }, [clinicaId])

  // Atualiza um atendimento existente
  const updateAttendance = useCallback(async (
    id: string,
    data: Partial<Omit<AttendanceFormData, 'pacienteId' | 'pacienteNome'>>
  ): Promise<boolean> => {
    if (!clinicaId) {
      toast.error('Selecione uma clínica primeiro')
      return false
    }

    try {
      const response = await metasStandaloneService.updateAttendance(id, clinicaId, {
        data: data.data,
        horario: data.horario,
        tipo: data.tipo,
        observacoes: data.observacoes,
        profissional_id: data.profissionalId,
      })

      const updatedRecord = response.data
      setRecords(prev => {
        const updated = prev.map(r => r.id === id ? updatedRecord : r)
        saveAttendancesToStorage(updated)
        return updated
      })

      toast.success('Atendimento atualizado!')
      return true
    } catch (err: unknown) {
      console.error('[useStandaloneAttendance] Erro ao atualizar atendimento:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar atendimento')
      return false
    }
  }, [clinicaId])

  // Remove um registro de atendimento
  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    if (!clinicaId) {
      toast.error('Selecione uma clínica primeiro')
      return false
    }

    try {
      await metasStandaloneService.deleteAttendance(id, clinicaId)

      setRecords(prev => {
        const updated = prev.filter(r => r.id !== id)
        saveAttendancesToStorage(updated)
        return updated
      })

      toast.success('Registro removido!')
      return true
    } catch (err: unknown) {
      console.error('[useStandaloneAttendance] Erro ao remover registro:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao remover registro')
      return false
    }
  }, [clinicaId])

  // Busca registros por paciente
  const getRecordsByPatient = useCallback((pacienteId: string): StandaloneAttendance[] => {
    return records.filter(r => r.paciente_id === pacienteId)
  }, [records])

  // Obtém estatísticas de um paciente da API
  const getPatientStats = useCallback(async (pacienteId: string): Promise<PatientStats | null> => {
    if (!clinicaId) return null

    try {
      const response = await metasStandaloneService.getPatientStats(pacienteId, clinicaId)
      return response.data
    } catch (err) {
      console.error('[useStandaloneAttendance] Erro ao obter estatísticas:', err)

      // Fallback: calcular localmente
      const patientRecords = records.filter(r => r.paciente_id === pacienteId)
      const total = patientRecords.length
      const presentes = patientRecords.filter(r => r.tipo === 'presente').length
      const ausentes = patientRecords.filter(r => r.tipo === 'ausente').length
      const remarcados = patientRecords.filter(r => r.tipo === 'remarcado').length
      const cancelados = patientRecords.filter(r => r.tipo === 'cancelado').length

      return {
        total,
        presentes,
        ausentes,
        remarcados,
        cancelados,
        taxaPresenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
      }
    }
  }, [clinicaId, records])

  // Recarrega atendimentos da API
  const refetch = useCallback(() => {
    return loadAttendances()
  }, [loadAttendances])

  // Registros agrupados por data (para timeline)
  const recordsByDate = useMemo(() => {
    const grouped: Record<string, StandaloneAttendance[]> = {}

    records.forEach(record => {
      const date = record.data
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(record)
    })

    // Ordenar registros dentro de cada data por horário
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (!a.horario) return 1
        if (!b.horario) return -1
        return a.horario.localeCompare(b.horario)
      })
    })

    return grouped
  }, [records])

  // Datas ordenadas (mais recentes primeiro)
  const sortedDates = useMemo(() => {
    return Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a))
  }, [recordsByDate])

  return {
    records,
    recordsByDate,
    sortedDates,
    isLoading,
    error,
    registerAttendance,
    updateAttendance,
    deleteRecord,
    getRecordsByPatient,
    getPatientStats,
    refetch,
  }
}
