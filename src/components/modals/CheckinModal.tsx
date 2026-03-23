/**
 * CheckinModal — Modal de check-in multimodal com 3 opções
 * Combina useCheckin hook com CameraCapture/SignaturePad para captura de evidência
 */

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Camera, PenTool, FileText, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCheckin, type CheckinMethod } from '@/hooks/useCheckin'
import { CameraCapture } from '@/components/checkin/CameraCapture'
import { SignaturePad } from '@/components/checkin/SignaturePad'

interface CheckinAppointment {
  id: string
  patientName: string
  date: string
  dateStr?: string
  time: string
  serviceName?: string
}

interface CheckinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appointment: CheckinAppointment
}

const methods: { key: CheckinMethod; label: string; icon: typeof Camera; description: string }[] = [
  {
    key: 'fotografia',
    label: 'Fotografia',
    icon: Camera,
    description: 'Capturar foto do paciente',
  },
  {
    key: 'assinatura',
    label: 'Assinatura',
    icon: PenTool,
    description: 'Assinatura digital em tela',
  },
  {
    key: 'manual',
    label: 'Manual',
    icon: FileText,
    description: 'Justificativa textual',
  },
]

export function CheckinModal({ isOpen, onClose, onSuccess, appointment }: CheckinModalProps) {
  const {
    selectedMethod,
    setSelectedMethod,
    justificativa,
    setJustificativa,
    capturedFile,
    setCapturedFile,
    isSubmitting,
    submitCheckin,
    reset,
    isValid,
  } = useCheckin()

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const handleSubmit = async () => {
    const success = await submitCheckin(appointment.id)
    if (success) {
      onSuccess()
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Chegada</DialogTitle>
          <DialogDescription>
            <strong>{appointment.patientName}</strong> — {appointment.dateStr || appointment.date} às {appointment.time}
            {appointment.serviceName && ` — ${appointment.serviceName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Method Selection */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Selecione o método de comprovação:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => {
                const Icon = m.icon
                const isSelected = selectedMethod === m.key
                const hasEvidence = m.key !== 'manual' && capturedFile !== null && selectedMethod === m.key

                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      setSelectedMethod(m.key)
                      setCapturedFile(null)
                    }}
                    disabled={isSubmitting}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground',
                      hasEvidence && 'ring-2 ring-green-500 ring-offset-1'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{m.label}</span>
                    {hasEvidence && <Check className="w-3 h-3 text-green-500" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic Content by Method */}
          {selectedMethod === 'fotografia' && !capturedFile && (
            <CameraCapture
              onCapture={(file) => setCapturedFile(file)}
              onCancel={() => setSelectedMethod(null)}
            />
          )}

          {selectedMethod === 'fotografia' && capturedFile && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img
                  src={URL.createObjectURL(capturedFile)}
                  alt="Foto capturada"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCapturedFile(null)}
                disabled={isSubmitting}
              >
                Tirar Outra
              </Button>
            </div>
          )}

          {selectedMethod === 'assinatura' && !capturedFile && (
            <SignaturePad
              onSign={(file) => setCapturedFile(file)}
              onCancel={() => setSelectedMethod(null)}
            />
          )}

          {selectedMethod === 'assinatura' && capturedFile && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-full max-w-sm border rounded-lg overflow-hidden bg-white p-2">
                <img
                  src={URL.createObjectURL(capturedFile)}
                  alt="Assinatura capturada"
                  className="w-full h-auto"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCapturedFile(null)}
                disabled={isSubmitting}
              >
                Assinar Novamente
              </Button>
            </div>
          )}

          {selectedMethod === 'manual' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Justificativa <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Descreva o motivo do check-in manual (mín. 10 caracteres)..."
                rows={3}
                disabled={isSubmitting}
                className={cn(
                  justificativa.length > 0 && justificativa.trim().length < 10 && 'border-destructive'
                )}
              />
              <p className="text-xs text-muted-foreground">
                {justificativa.trim().length}/10 caracteres mínimos
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar Check-in
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
