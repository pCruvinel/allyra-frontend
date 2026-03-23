import { Bell, CheckCheck } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useNotifications } from '@/hooks/useNotifications'

// Formata tempo relativo para exibição
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Agora'
  if (diffMinutes < 60) return `há ${diffMinutes} minutos`
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
  return date.toLocaleDateString('pt-BR')
}

// Mapeia tipo da API para tipo visual
function mapNotificationType(type: string): 'atendimento' | 'meta' | 'sistema' {
  switch (type) {
    case 'agendamento':
    case 'confirmacao_consulta':
    case 'lembrete_consulta':
      return 'atendimento'
    case 'meta':
      return 'meta'
    default:
      return 'sistema'
  }
}

// Cor do ícone por tipo (padrão módulo metas)
function getNotificationColor(tipo: string) {
  switch (tipo) {
    case 'atendimento':
      return 'bg-blue-100 text-blue-600'
    case 'meta':
      return 'bg-violet-100 text-violet-600'
    case 'sistema':
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function NotificationsDropdown() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ autoFetch: true })

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id)
    }
  }

  const handleViewAll = () => {
    setIsOpen(false)
    navigate({ to: '/notificacoes' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-1.5 transition-colors hover:bg-muted/50"
      >
        <Bell size={20} className="text-muted-foreground" />
        {/* Badge de notificações não lidas */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-primary rounded-full flex items-center justify-center px-1">
            <span className="text-white text-[10px] font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[380px] bg-background rounded-xl border border-border shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-base">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-primary hover:text-primary/80"
              >
                <CheckCheck size={16} />
                <span className="font-medium text-xs">
                  Marcar todas como lidas
                </span>
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Bell size={32} className="text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              notifications.slice(0, 5).map(notification => {
                const tipo = mapNotificationType(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-violet-50/50 dark:bg-violet-950/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ícone de tipo */}
                      <div className={`w-8 h-8 rounded-full ${getNotificationColor(tipo)} flex items-center justify-center shrink-0`}>
                        <Bell size={16} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-[13px] mb-1">
                          {notification.message}
                        </p>
                        <span className="text-muted-foreground/70 text-[11px]">
                          {formatRelativeTime(new Date(notification.timestamp))}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border text-center">
            <button
              onClick={handleViewAll}
              className="font-medium text-primary text-[13px] hover:text-primary/80"
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
