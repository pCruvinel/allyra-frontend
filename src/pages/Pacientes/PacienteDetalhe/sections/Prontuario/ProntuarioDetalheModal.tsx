import { Calendar, Clock, ShieldCheck, User, FileText, Stethoscope, Pill, Lock } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { MedicalRecord } from '@/types/medical-record'

interface ProntuarioDetalheModalProps {
  isOpen: boolean
  onClose: () => void
  record: MedicalRecord | null
}

export function ProntuarioDetalheModal({ isOpen, onClose, record }: ProntuarioDetalheModalProps) {
  const isMobile = useIsMobile()

  if (!record) return null

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) {
      return dateStr
    }
    return date.toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) {
      return dateStr
    }
    return date.toLocaleString('pt-BR')
  }

  const content = (
    <div className="space-y-6">
      {/* Header com diagnóstico, data e hora */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
        <h3 className="text-lg font-semibold text-foreground mb-3">{record.diagnosis}</h3>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(record.date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{record.time}</span>
          </div>
        </div>
      </div>

      {/* Queixa Principal */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="w-4 h-4 text-primary" />
          <span>Queixa principal</span>
        </div>
        <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border">
          {record.complaint || 'Não informada'}
        </p>
      </div>

      {/* História da Doença Atual */}
      {record.diseaseHistory && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            <span>História da doença atual</span>
          </div>
          <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border whitespace-pre-wrap">
            {record.diseaseHistory}
          </p>
        </div>
      )}

      {/* Diagnóstico detalhado */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Stethoscope className="w-4 h-4 text-primary" />
          <span>Diagnóstico</span>
        </div>
        <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border">
          {record.diagnosis}
        </p>
      </div>

      {/* Prescrição Médica */}
      {record.prescription && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Pill className="w-4 h-4 text-primary" />
            <span>Prescrição médica</span>
          </div>
          <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border whitespace-pre-wrap">
            {record.prescription}
          </p>
        </div>
      )}

      {/* Observações Privadas */}
      {record.privateNotes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Observações privadas</span>
          </div>
          <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/20">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {record.privateNotes}
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Visível apenas para o profissional
            </p>
          </div>
        </div>
      )}

      {record.appointmentId && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Sessão vinculada: <span className="font-medium text-foreground">{record.appointmentId}</span>
        </div>
      )}

      {/* Assinatura Digital */}
      {record.isSigned ? (
        <div className="space-y-2 rounded-lg border border-primary/10 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div className="text-sm">
              <span className="text-foreground">Assinado digitalmente por: </span>
              <strong className="text-foreground">{record.signedBy?.name || 'Profissional'}</strong>
              {record.signedBy?.crm && (
                <span className="text-muted-foreground"> (CRM: {record.signedBy.crm})</span>
              )}
            </div>
          </div>
          {record.signedAt && (
            <p className="text-xs text-muted-foreground">
              Assinatura registrada em {formatDateTime(record.signedAt)}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Este prontuário ainda está em rascunho e pode ser editado até a assinatura clínica.
        </div>
      )}

      {record.erratas && record.erratas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            <span>Erratas registradas</span>
          </div>
          <div className="space-y-2">
            {record.erratas.map((errata) => (
              <div key={errata.id} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">{errata.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Registrada em {formatDateTime(errata.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Footer
  const footer = (
    <Button
      onClick={onClose}
      className="w-full sm:w-auto rounded-full px-8 bg-primary hover:bg-primary/90"
    >
      Fechar
    </Button>
  )

  // Mobile: usar AppDrawer (fullscreen)
  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Detalhes do prontuário"
      >
        <AppDrawerBody>
          {content}
        </AppDrawerBody>
        <AppDrawerFooter>
          {footer}
        </AppDrawerFooter>
      </AppDrawer>
    )
  }

  // Desktop: usar Modal
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do prontuário" size="lg">
      <ModalBody>
        {content}
      </ModalBody>
      <ModalFooter>
        {footer}
      </ModalFooter>
    </Modal>
  )
}
