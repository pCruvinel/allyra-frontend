import { cn } from '@/lib/utils'

/**
 * Variantes de dominio para StatusBadge
 * Cada variante define os status possiveis e seus estilos
 */
type StatusVariant = 'patient' | 'appointment' | 'payment' | 'client' | 'invoice' | 'notification' | 'custom'

interface StatusConfig {
  label: string
  className: string
}

/**
 * Configuracoes de status por dominio
 * Centralizadas para consistencia visual em todo o sistema
 */
const statusConfigs: Record<string, Record<string, StatusConfig>> = {
  patient: {
    active: { label: 'Ativo', className: 'bg-primary text-white' },
    inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
    blocked: { label: 'Bloqueado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  },
  client: {
    Ativo: { label: 'Ativo', className: 'bg-primary text-white' },
    Inativo: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
    Bloqueado: { label: 'Bloqueado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    Suspenso: { label: 'Suspenso', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  },
  appointment: {
    agendado: { label: 'Agendado', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    confirmado: { label: 'Confirmado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    aguardando: { label: 'Aguardando', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    em_atendimento: { label: 'Em Atendimento', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    concluido: { label: 'Concluído', className: 'bg-muted text-muted-foreground' },
    falta: { label: 'Falta', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  },
  payment: {
    pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    paid: { label: 'Pago', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
    // Aliases em portugues
    pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    pago: { label: 'Pago', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    vencido: { label: 'Vencido', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelado: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  },
  invoice: {
    draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
    pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    sent: { label: 'Enviada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    paid: { label: 'Paga', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    overdue: { label: 'Vencida', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelled: { label: 'Cancelada', className: 'bg-muted text-muted-foreground' },
  },
  notification: {
    unread: { label: 'Não lida', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    read: { label: 'Lida', className: 'bg-muted text-muted-foreground' },
  },
}

// Fallback para status desconhecido
const defaultConfig: StatusConfig = {
  label: '',
  className: 'bg-muted text-muted-foreground',
}

interface StatusBadgeProps {
  /** Valor do status */
  status: string
  /** Variante de dominio (patient, appointment, etc.) */
  variant: StatusVariant
  /** Classes CSS adicionais */
  className?: string
  /** Configuracao customizada para variant='custom' */
  customConfig?: Record<string, StatusConfig>
  /** Se true, exibe o status original quando nao encontrado */
  showRawStatus?: boolean
}

/**
 * StatusBadge - Componente para exibir status com estilo consistente
 *
 * @example
 * // Paciente
 * <StatusBadge status="active" variant="patient" />
 *
 * // Agendamento
 * <StatusBadge status="confirmado" variant="appointment" />
 *
 * // Custom
 * <StatusBadge
 *   status="custom_status"
 *   variant="custom"
 *   customConfig={{ custom_status: { label: 'Custom', className: 'bg-purple-100' } }}
 * />
 */
export function StatusBadge({
  status,
  variant,
  className,
  customConfig,
  showRawStatus = true,
}: StatusBadgeProps) {
  // Buscar configuracao do status
  const configs = variant === 'custom' ? customConfig : statusConfigs[variant]
  const config = configs?.[status] || { ...defaultConfig, label: showRawStatus ? status : '' }

  if (!config.label) return null

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

/**
 * Hook para obter labels e estilos de status
 * Util para uso fora do componente StatusBadge
 */
export function useStatusConfig(variant: StatusVariant, customConfig?: Record<string, StatusConfig>) {
  const configs = variant === 'custom' ? customConfig : statusConfigs[variant]

  const getConfig = (status: string): StatusConfig => {
    return configs?.[status] || defaultConfig
  }

  const getLabel = (status: string): string => {
    return getConfig(status).label || status
  }

  const getClassName = (status: string): string => {
    return getConfig(status).className
  }

  return { getConfig, getLabel, getClassName }
}

// Exportar tipos para uso externo
export type { StatusVariant, StatusConfig, StatusBadgeProps }
