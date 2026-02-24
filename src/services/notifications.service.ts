/**
 * Serviço de Notificações
 * Busca e gerencia notificações do Supabase com RLS por usuário
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { success, error } from './base.service'
import type { ServiceResponse } from './types'

// ENUMs do banco de dados
export type TipoNotificacao =
  | 'agendamento'
  | 'cancelamento'
  | 'confirmacao'
  | 'lembrete'
  | 'financeiro'
  | 'sistema'
  | 'marketing'

export type CanalNotificacao =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'push'
  | 'interno'

export type StatusNotificacao =
  | 'pendente'
  | 'enviada'
  | 'entregue'
  | 'lida'
  | 'falha'

// Interface do banco de dados
export interface NotificacaoDB {
  id: string
  clinica_id: string
  usuario_id: string | null
  paciente_id: string | null
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  canal: CanalNotificacao
  status: StatusNotificacao
  data_envio: string | null
  data_leitura: string | null
  created_at: string
}

// Interface formatada para o frontend
export interface Notification {
  id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  canal: CanalNotificacao
  status: StatusNotificacao
  lida: boolean
  dataEnvio: string | null
  dataLeitura: string | null
  createdAt: string
}

// Interface para contagem
export interface NotificationCount {
  total: number
  unread: number
}

// Converte do banco para o formato do frontend
function formatNotification(db: NotificacaoDB): Notification {
  return {
    id: db.id,
    tipo: db.tipo,
    titulo: db.titulo,
    mensagem: db.mensagem,
    canal: db.canal,
    status: db.status,
    lida: db.status === 'lida',
    dataEnvio: db.data_envio,
    dataLeitura: db.data_leitura,
    createdAt: db.created_at,
  }
}

class NotificationsService {
  /**
   * Busca todas as notificações do usuário atual
   */
  async getAll(): Promise<ServiceResponse<Notification[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'CONFIG_ERROR')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })

      if (dbError) {
        console.error('Erro ao buscar notificações:', dbError)
        return error(dbError.message, dbError.code)
      }

      const notifications = (data as NotificacaoDB[]).map(formatNotification)
      return success(notifications, notifications.length)
    } catch (err) {
      console.error('Erro inesperado:', err)
      return error('Erro ao buscar notificações', 'UNKNOWN_ERROR')
    }
  }

  /**
   * Busca contagem de notificações (total e não lidas)
   */
  async getCount(): Promise<ServiceResponse<NotificationCount>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'CONFIG_ERROR')
    }

    try {
      // Total
      const { count: total, error: totalError } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })

      if (totalError) {
        return error(totalError.message, totalError.code)
      }

      // Não lidas
      const { count: unread, error: unreadError } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'lida')

      if (unreadError) {
        return error(unreadError.message, unreadError.code)
      }

      return success({
        total: total || 0,
        unread: unread || 0,
      })
    } catch (err) {
      console.error('Erro inesperado:', err)
      return error('Erro ao contar notificações', 'UNKNOWN_ERROR')
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(id: string): Promise<ServiceResponse<Notification>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'CONFIG_ERROR')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('notificacoes')
        .update({
          status: 'lida',
          data_leitura: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (dbError) {
        console.error('Erro ao marcar como lida:', dbError)
        return error(dbError.message, dbError.code)
      }

      return success(formatNotification(data as NotificacaoDB))
    } catch (err) {
      console.error('Erro inesperado:', err)
      return error('Erro ao marcar como lida', 'UNKNOWN_ERROR')
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(): Promise<ServiceResponse<number>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'CONFIG_ERROR')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('notificacoes')
        .update({
          status: 'lida',
          data_leitura: new Date().toISOString(),
        })
        .neq('status', 'lida')
        .select()

      if (dbError) {
        console.error('Erro ao marcar todas como lidas:', dbError)
        return error(dbError.message, dbError.code)
      }

      return success((data as NotificacaoDB[]).length)
    } catch (err) {
      console.error('Erro inesperado:', err)
      return error('Erro ao marcar todas como lidas', 'UNKNOWN_ERROR')
    }
  }

  /**
   * Remove todas as notificações lidas
   */
  async deleteRead(): Promise<ServiceResponse<number>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'CONFIG_ERROR')
    }

    try {
      const { data, error: dbError } = await supabase
        .from('notificacoes')
        .delete()
        .eq('status', 'lida')
        .select()

      if (dbError) {
        console.error('Erro ao limpar notificações lidas:', dbError)
        return error(dbError.message, dbError.code)
      }

      return success((data as NotificacaoDB[]).length)
    } catch (err) {
      console.error('Erro inesperado:', err)
      return error('Erro ao limpar notificações', 'UNKNOWN_ERROR')
    }
  }

  /**
   * Remove uma notificação específica (apenas se lida)
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      return error('Supabase não configurado', 'CONFIG_ERROR')
    }

    try {
      const { error: dbError } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id)
        .eq('status', 'lida')

      if (dbError) {
        console.error('Erro ao deletar notificação:', dbError)
        return error(dbError.message, dbError.code)
      }

      return success(true)
    } catch (err) {
      console.error('Erro inesperado:', err)
      return error('Erro ao deletar notificação', 'UNKNOWN_ERROR')
    }
  }
}

// Singleton export
export const notificationsService = new NotificationsService()
