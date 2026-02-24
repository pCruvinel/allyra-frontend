/**
 * Hook para gerenciamento de notificações
 * Integrado com API via apiService
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/api.service'
import { useAuth } from '@/contexts/AuthContext'

// Tipos de notificação
export type NotificationTypeDB =
  | 'lembrete_consulta'
  | 'confirmacao_consulta'
  | 'cobranca'
  | 'sistema'
  | 'agendamento'
  | 'cancelamento'

export type NotificationChannelDB = 'sistema' | 'email' | 'whatsapp' | 'sms'
export type NotificationStatusDB = 'pendente' | 'enviada' | 'entregue' | 'lida' | 'erro'

// Interface do banco
export interface NotificationDB {
  id: string
  clinica_id: string | null
  usuario_id: string | null
  paciente_id: string | null
  tipo: NotificationTypeDB
  titulo: string
  mensagem: string
  canal: NotificationChannelDB
  status: NotificationStatusDB
  data_envio: string | null
  data_leitura: string | null
  relacionado_id: string | null
  relacionado_tipo: string | null
  created_at: string
  // Joins
  usuario?: {
    id: string
    nome: string
  } | null
  paciente?: {
    id: string
    nome_completo: string
  } | null
}

// Interface formatada para frontend
export interface NotificationFormatted {
  id: string
  clinicaId: string | null
  userId: string | null
  userName: string | null
  patientId: string | null
  patientName: string | null
  type: NotificationTypeDB
  typeLabel: string
  title: string
  message: string
  channel: NotificationChannelDB
  channelLabel: string
  status: NotificationStatusDB
  statusLabel: string
  sentAt: string | null
  readAt: string | null
  relatedId: string | null
  relatedType: string | null
  timestamp: string
  timestampFormatted: string
  isRead: boolean
}

// Labels
export const notificationTypeLabels: Record<NotificationTypeDB, string> = {
  lembrete_consulta: 'Lembrete de Consulta',
  confirmacao_consulta: 'Confirmação de Consulta',
  cobranca: 'Cobrança',
  sistema: 'Sistema',
  agendamento: 'Agendamento',
  cancelamento: 'Cancelamento',
}

export const notificationChannelLabels: Record<NotificationChannelDB, string> = {
  sistema: 'Sistema',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
}

export const notificationStatusLabels: Record<NotificationStatusDB, string> = {
  pendente: 'Pendente',
  enviada: 'Enviada',
  entregue: 'Entregue',
  lida: 'Lida',
  erro: 'Erro',
}

// Conversão
function formatNotification(notif: NotificationDB): NotificationFormatted {
  const timestamp = new Date(notif.created_at)

  return {
    id: notif.id,
    clinicaId: notif.clinica_id,
    userId: notif.usuario_id,
    userName: notif.usuario?.nome || null,
    patientId: notif.paciente_id,
    patientName: notif.paciente?.nome_completo || null,
    type: notif.tipo,
    typeLabel: notificationTypeLabels[notif.tipo] || notif.tipo,
    title: notif.titulo,
    message: notif.mensagem,
    channel: notif.canal,
    channelLabel: notificationChannelLabels[notif.canal] || notif.canal,
    status: notif.status,
    statusLabel: notificationStatusLabels[notif.status] || notif.status,
    sentAt: notif.data_envio,
    readAt: notif.data_leitura,
    relatedId: notif.relacionado_id,
    relatedType: notif.relacionado_tipo,
    timestamp: notif.created_at,
    timestampFormatted: timestamp.toLocaleString('pt-BR'),
    isRead: notif.status === 'lida' || !!notif.data_leitura,
  }
}

interface UseNotificationsOptions {
  autoFetch?: boolean
  onlyUnread?: boolean
}

interface UseNotificationsReturn {
  notifications: NotificationFormatted[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  total: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteRead: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoFetch = true, onlyUnread = false } = options
  const { currentClinica, user } = useAuth()

  const [notifications, setNotifications] = useState<NotificationFormatted[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const fetchNotifications = useCallback(async () => {
    // SEGURANÇA: clinica_id e usuario_id são obrigatórios
    if (!currentClinica?.id || !user?.id) {
      setNotifications([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiService.getNotifications(
        currentClinica.id,
        user.id,
        100
      )

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      let filteredData = result.data || []

      // Filtro de apenas não lidas (aplicado no frontend já que a API retorna todas)
      if (onlyUnread) {
        filteredData = filteredData.filter(n => n.status !== 'lida' && !n.data_leitura)
      }

      const formatted = filteredData.map(formatNotification)
      setNotifications(formatted)
      setTotal(result.count ?? formatted.length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar notificações'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentClinica?.id, user?.id, onlyUnread])

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await apiService.markNotificationAsRead(id)

      if (result.error) {
        toast.error(result.error)
        return false
      }

      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, status: 'lida' as NotificationStatusDB, isRead: true } : n
        )
      )

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar como lida'
      toast.error(message)
      return false
    }
  }, [])

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length === 0) return true

    if (!currentClinica?.id || !user?.id) {
      toast.error('Clínica ou usuário não identificado')
      return false
    }

    try {
      const result = await apiService.markAllNotificationsAsRead(currentClinica.id, user.id)

      if (result.error) {
        toast.error(result.error)
        return false
      }

      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'lida' as NotificationStatusDB, isRead: true }))
      )

      toast.success(`${result.data?.count || unreadIds.length} notificações marcadas como lidas`)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar todas como lidas'
      toast.error(message)
      return false
    }
  }, [notifications, currentClinica?.id, user?.id])

  const deleteRead = useCallback(async (): Promise<boolean> => {
    const readIds = notifications.filter(n => n.isRead).map(n => n.id)
    if (readIds.length === 0) {
      toast.info('Não há notificações lidas para remover')
      return true
    }

    if (!currentClinica?.id || !user?.id) {
      toast.error('Clínica ou usuário não identificado')
      return false
    }

    try {
      const result = await apiService.deleteReadNotifications(currentClinica.id, user.id)

      if (result.error) {
        toast.error(result.error)
        return false
      }

      // Remover localmente
      setNotifications(prev => prev.filter(n => !n.isRead))

      toast.success('Notificações lidas removidas')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao limpar notificações'
      toast.error(message)
      return false
    }
  }, [notifications, currentClinica?.id, user?.id])

  const refresh = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (autoFetch) {
      fetchNotifications()
    }
  }, [autoFetch, currentClinica?.id, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    total,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteRead,
    refresh,
  }
}
