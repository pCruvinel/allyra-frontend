/**
 * ShareModal - Modal para gerar link de compartilhamento do portal do paciente
 */

import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { usePortalShare } from '@/hooks/useGoalProgress'
import { Copy, Check, Link2, Calendar, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  planName: string
  patientName: string
}

interface ShareOptions {
  expiresInDays: number
  mostrarGraficos: boolean
  mostrarParecer: boolean
  mostrarRecomendacoes: boolean
}

export function ShareModal({
  isOpen,
  onClose,
  planId,
  planName,
  patientName,
}: ShareModalProps) {
  const isMobile = useIsMobile()
  const { generateLink, isLoading } = usePortalShare()

  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [options, setOptions] = useState<ShareOptions>({
    expiresInDays: 30,
    mostrarGraficos: true,
    mostrarParecer: true,
    mostrarRecomendacoes: true,
  })

  const handleGenerateLink = async () => {
    const result = await generateLink(planId, {
      dias_validade: options.expiresInDays,
      opcoes: {
        mostrarGraficos: options.mostrarGraficos,
        mostrarParecer: options.mostrarParecer,
        mostrarRecomendacoes: options.mostrarRecomendacoes,
      },
    })

    if (result) {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/portal/${result.token}`
      setGeneratedLink(link)
    }
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar link')
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setGeneratedLink(null)
      setCopied(false)
      onClose()
    }
  }

  const handleOptionToggle = (key: keyof Omit<ShareOptions, 'expiresInDays'>) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
    // Se já gerou link, limpa para forçar nova geração
    setGeneratedLink(null)
  }

  const content = (
    <div className="space-y-5">
      {/* Info */}
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Gere um link para compartilhar o relatório de progresso de{' '}
          <span className="font-medium text-foreground">{patientName}</span> no plano{' '}
          <span className="font-medium text-foreground">{planName}</span>.
        </p>
      </div>

      {/* Validade */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Calendar size={14} className="inline mr-1" />
          Validade do Link
        </label>
        <div className="flex gap-2">
          {[7, 15, 30, 60].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => {
                setOptions((prev) => ({ ...prev, expiresInDays: days }))
                setGeneratedLink(null)
              }}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                options.expiresInDays === days
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted'
              )}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      {/* Opções de Visualização */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Conteúdo visível no portal
        </label>
        <div className="space-y-2">
          {[
            { key: 'mostrarGraficos' as const, label: 'Gráficos de evolução' },
            { key: 'mostrarParecer' as const, label: 'Parecer do profissional' },
            { key: 'mostrarRecomendacoes' as const, label: 'Recomendações' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleOptionToggle(key)}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                options[key]
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card hover:bg-muted'
              )}
            >
              <span className="text-sm">{label}</span>
              {options[key] ? (
                <Eye size={16} className="text-primary" />
              ) : (
                <EyeOff size={16} className="text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Link Gerado */}
      {generatedLink && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Link gerado com sucesso!
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              value={generatedLink}
              readOnly
              className="flex-1 text-sm bg-white dark:bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Válido por {options.expiresInDays} dias a partir de hoje
          </p>
        </div>
      )}
    </div>
  )

  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      {!generatedLink ? (
        <Button
          onClick={handleGenerateLink}
          disabled={isLoading}
          className="w-full rounded-full"
        >
          {isLoading ? 'Gerando...' : 'Gerar Link de Compartilhamento'}
        </Button>
      ) : (
        <Button
          onClick={handleCopyLink}
          className="w-full rounded-full"
        >
          {copied ? 'Copiado!' : 'Copiar Link'}
        </Button>
      )}
      <Button
        variant="outline"
        onClick={handleClose}
        className="w-full rounded-full"
        disabled={isLoading}
      >
        Fechar
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title="Compartilhar Relatório"
      >
        <AppDrawerBody>{content}</AppDrawerBody>
        <AppDrawerFooter>{mobileActions}</AppDrawerFooter>
      </AppDrawer>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Compartilhar Relatório" size="md">
      <ModalBody>{content}</ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          className="rounded-full px-8"
          disabled={isLoading}
        >
          Fechar
        </Button>
        {!generatedLink ? (
          <Button
            onClick={handleGenerateLink}
            disabled={isLoading}
            className="rounded-full px-8"
          >
            {isLoading ? 'Gerando...' : 'Gerar Link'}
          </Button>
        ) : (
          <Button
            onClick={handleCopyLink}
            className="rounded-full px-8"
          >
            {copied ? 'Copiado!' : 'Copiar Link'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
