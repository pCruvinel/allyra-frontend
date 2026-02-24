import { User, Mail, Phone, Calendar, Shield, Building2, Clock } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { SystemUser } from '@/types/user'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: SystemUser | null
}

const statusColors: Record<SystemUser['status'], string> = {
  Ativo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Inativo: 'bg-muted text-muted-foreground',
  Bloqueado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
}: UserDetailsModalProps) {
  const isMobile = useIsMobile()

  if (!user) return null

  const content = (
    <>
      {/* Header com Avatar e Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
            <p className="text-sm text-muted-foreground">
              {user.permissionLevel}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            statusColors[user.status]
          )}
        >
          {user.status}
        </span>
      </div>

      {/* Informacoes de Contato */}
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">CONTATO</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium text-foreground">{user.email}</p>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium text-foreground">{user.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informacoes do Sistema */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">SISTEMA</h4>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nivel de permissao</p>
            <p className="font-medium text-foreground">{user.permissionLevel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Codigo do cliente</p>
            <p className="font-medium text-foreground">{user.clientId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de cadastro</p>
            <p className="font-medium text-foreground">{formatDate(user.createdAt)}</p>
          </div>
        </div>

        {user.lastAccess && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ultimo acesso</p>
              <p className="font-medium text-foreground">{formatDateTime(user.lastAccess)}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )

  // Footer mobile: stack vertical
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full rounded-full"
      >
        Fechar
      </Button>
    </div>
  )

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Detalhes do Usuario"
        snapPoints={[0.75, 0.9]}
        dismissible
      >
        {content}
        <BottomSheetFooter>
          {mobileActions}
        </BottomSheetFooter>
      </BottomSheet>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Usuario" size="md">
      <ModalBody>
        {content}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="rounded-full">
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
