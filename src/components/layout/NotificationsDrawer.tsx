import { Drawer } from 'vaul'
import { useNavigate } from '@tanstack/react-router'
import { Bell, X, CheckCheck, BellOff } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import { useNotifications, type NotificationFormatted } from '@/hooks/useNotifications'

// Formata tempo relativo para exibição
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Agora'
  if (diffMinutes < 60) return `${diffMinutes} min atrás`
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
  return date.toLocaleDateString('pt-BR')
}

// Cor do ícone por tipo de notificação (padrão módulo metas)
const getNotificationColor = (type: string) => {
  switch (type) {
    case 'agendamento':
    case 'confirmacao_consulta':
      return 'bg-blue-100 text-blue-600'
    case 'meta':
      return 'bg-violet-100 text-violet-600'
    case 'cobranca':
      return 'bg-green-100 text-green-600'
    case 'cancelamento':
      return 'bg-red-100 text-red-600'
    case 'lembrete_consulta':
      return 'bg-yellow-100 text-yellow-600'
    case 'sistema':
    default:
      return 'bg-muted text-muted-foreground'
  }
}

interface NotificationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ autoFetch: true })

  const handleViewAll = () => {
    onOpenChange(false)
    navigate({ to: '/notificacoes' })
  }

  const handleNotificationClick = async (notification: NotificationFormatted) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[380px] bg-background flex flex-col"
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <Drawer.Title>Notificações</Drawer.Title>
          </VisuallyHidden>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-base font-semibold text-foreground">Notificações</span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  <CheckCheck size={16} />
                  <span className="text-xs font-medium">Marcar todas como lidas</span>
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-5">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BellOff size={32} className="text-muted-foreground/70" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex items-start gap-3 px-5 py-4 w-full text-left transition-colors border-b border-border last:border-b-0",
                      !notification.isRead ? "bg-violet-50/50 hover:bg-violet-50 dark:bg-violet-950/20 dark:hover:bg-violet-950/30" : "hover:bg-muted/50"
                    )}
                  >
                    {/* Ícone circular por tipo */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      getNotificationColor(notification.type)
                    )}>
                      <Bell size={16} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-[13px] text-muted-foreground mb-1">
                        {notification.message}
                      </p>
                      <span className="text-[11px] text-muted-foreground/70">
                        {formatRelativeTime(new Date(notification.timestamp))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border text-center">
            <button
              onClick={handleViewAll}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Ver todas as notificações
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
