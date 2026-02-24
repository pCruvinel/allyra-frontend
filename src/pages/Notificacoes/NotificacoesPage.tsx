import { useState } from 'react'
import {
  Calendar,
  CreditCard,
  AlertCircle,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  Bell,
  BellOff,
  RefreshCw,
  MessageSquare,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { SkeletonList } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { useNotifications, type NotificationFormatted, type NotificationTypeDB } from '@/hooks/useNotifications'

type FilterType = 'all' | 'unread' | 'read'

export function NotificacoesPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteRead,
    refresh,
  } = useNotifications()

  const [filter, setFilter] = useState<FilterType>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  const getNotificationIcon = (type: NotificationTypeDB) => {
    switch (type) {
      case 'agendamento':
        return <Calendar className="w-5 h-5" />
      case 'confirmacao_consulta':
        return <Check className="w-5 h-5" />
      case 'cancelamento':
        return <AlertCircle className="w-5 h-5" />
      case 'cobranca':
        return <CreditCard className="w-5 h-5" />
      case 'lembrete_consulta':
        return <Clock className="w-5 h-5" />
      case 'sistema':
        return <Bell className="w-5 h-5" />
      default:
        return <MessageSquare className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: NotificationTypeDB) => {
    switch (type) {
      case 'agendamento':
      case 'confirmacao_consulta':
        return 'bg-blue-100 text-blue-600'
      case 'cobranca':
        return 'bg-green-100 text-green-600'
      case 'cancelamento':
        return 'bg-red-100 text-red-600'
      case 'lembrete_consulta':
        return 'bg-yellow-100 text-yellow-600'
      case 'sistema':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-3 h-3" />
      case 'whatsapp':
        return <MessageSquare className="w-3 h-3" />
      default:
        return null
    }
  }

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDeleteAllRead = async () => {
    setIsDeleting(true)
    await deleteRead()
    setIsDeleting(false)
    setShowDeleteModal(false)
  }

  const readCount = notifications.length - unreadCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? 'Carregando notificações...'
              : unreadCount > 0
                ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                : 'Todas as notificações foram lidas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </Button>
          )}
          {readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Limpar lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full',
            filter === 'all' && 'bg-primary hover:bg-primary/90'
          )}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
          className={cn(
            'rounded-full',
            filter === 'unread' && 'bg-primary hover:bg-primary/90'
          )}
        >
          Não lidas ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('read')}
          className={cn(
            'rounded-full',
            filter === 'read' && 'bg-primary hover:bg-primary/90'
          )}
        >
          Lidas ({readCount})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonList items={5} showIcon={true} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Nenhuma notificação"
            description={
              filter === 'unread'
                ? 'Você não tem notificações não lidas'
                : filter === 'read'
                  ? 'Você não tem notificações lidas'
                  : 'Você não tem notificações'
            }
            className="py-16"
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification: NotificationFormatted) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-4 transition-colors hover:bg-muted/50',
                  !notification.isRead && 'bg-primary/10'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    getNotificationColor(notification.type)
                  )}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            'text-sm',
                            notification.isRead
                              ? 'font-medium text-foreground'
                              : 'font-semibold text-foreground'
                          )}
                        >
                          {notification.title}
                        </h4>
                        {getChannelIcon(notification.channel) && (
                          <span className="text-muted-foreground">
                            {getChannelIcon(notification.channel)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.timestampFormatted}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2.5 h-2.5 bg-primary rounded-full mt-1.5" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Marcar como lida"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Limpar notificações lidas"
        size="sm"
      >
        <ModalBody>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir todas as notificações lidas? Esta ação
            não pode ser desfeita.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            className="rounded-full"
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteAllRead}
            className="rounded-full bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir todas'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
