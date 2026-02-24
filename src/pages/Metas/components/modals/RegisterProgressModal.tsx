/**
 * RegisterProgressModal - Modal para registrar progresso em uma meta
 */

import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useGoalProgress } from '@/hooks/useGoalProgress'
import { cn } from '@/lib/utils'
import type { TherapeuticGoal } from '@/types/goals'
import { createProgressSchema } from '@/schemas/goals.schema'
import { toast } from 'sonner'

const progressFormSchema = createProgressSchema.pick({
  valor_registrado: true,
  observacoes_subjetivas: true,
})

interface RegisterProgressModalProps {
  isOpen: boolean
  onClose: () => void
  goal: TherapeuticGoal
}

export function RegisterProgressModal({
  isOpen,
  onClose,
  goal,
}: RegisterProgressModalProps) {
  const isMobile = useIsMobile()
  const { registerProgress, isLoading } = useGoalProgress({ goalId: goal.id, autoFetch: false })

  const [valorRegistrado, setValorRegistrado] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [selectedScale, setSelectedScale] = useState<number | null>(null)
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null)

  const handleSubmit = async () => {
    let finalValue = valorRegistrado

    // Converte valores especiais para string
    if (goal.tipo_input === 'escala' && selectedScale !== null) {
      finalValue = String(selectedScale)
    } else if (goal.tipo_input === 'booleano' && selectedBoolean !== null) {
      finalValue = selectedBoolean ? 'Sim' : 'Não'
    }

    const validationResult = progressFormSchema.safeParse({
      valor_registrado: finalValue,
      observacoes_subjetivas: observacoes || undefined,
    })

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message)
      return
    }

    const result = await registerProgress({
      valor_registrado: finalValue,
      observacoes_subjetivas: observacoes || undefined,
      data_registro: new Date().toISOString(),
      profissional_id: '', // será sobrescrito pelo hook/service
    })

    if (result) {
      handleClose()
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setValorRegistrado('')
      setObservacoes('')
      setSelectedScale(null)
      setSelectedBoolean(null)
      onClose()
    }
  }

  const isFormValid = () => {
    if (goal.tipo_input === 'escala') return selectedScale !== null
    if (goal.tipo_input === 'booleano') return selectedBoolean !== null
    return valorRegistrado.trim().length > 0
  }

  const renderInputField = () => {
    switch (goal.tipo_input) {
      case 'numerico':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Valor Registrado <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={valorRegistrado}
                onChange={(e) => setValorRegistrado(e.target.value)}
                placeholder={`Meta: ${goal.meta_esperada}`}
                className="flex-1"
              />
              {goal.unidade && (
                <span className="text-sm text-muted-foreground">{goal.unidade}</span>
              )}
            </div>
          </div>
        )

      case 'booleano':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              A meta foi atingida? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBoolean(true)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors',
                  selectedBoolean === true
                    ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-card hover:bg-muted'
                )}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setSelectedBoolean(false)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors',
                  selectedBoolean === false
                    ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-card hover:bg-muted'
                )}
              >
                Não
              </button>
            </div>
          </div>
        )

      case 'escala':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pontuação (1-5) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedScale(value)}
                  className={cn(
                    'flex-1 py-3 rounded-lg border text-sm font-medium transition-colors',
                    selectedScale === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta esperada: {goal.meta_esperada}
            </p>
          </div>
        )

      case 'protocolo':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Registro do Protocolo <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={valorRegistrado}
              onChange={(e) => setValorRegistrado(e.target.value)}
              placeholder="Descreva o progresso no protocolo..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {goal.meta_esperada}
            </p>
          </div>
        )

      default:
        return null
    }
  }

  const content = (
    <div className="space-y-4">
      {/* Info da Meta */}
      <div className="p-3 rounded-lg bg-muted/50">
        <h4 className="font-medium text-foreground">{goal.titulo || goal.descricao}</h4>
        {goal.titulo && goal.descricao && (
          <p className="text-sm text-muted-foreground mt-1">{goal.descricao}</p>
        )}
      </div>

      {/* Campo de Input dinâmico */}
      {renderInputField()}

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Observações (opcional)
        </label>
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações sobre esta sessão..."
          rows={3}
        />
      </div>
    </div>
  )

  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid() || isLoading}
        className="w-full rounded-full"
      >
        {isLoading ? 'Salvando...' : 'Registrar Progresso'}
      </Button>
      <Button
        variant="outline"
        onClick={handleClose}
        className="w-full rounded-full"
        disabled={isLoading}
      >
        Cancelar
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title="Registrar Progresso"
      >
        <AppDrawerBody>{content}</AppDrawerBody>
        <AppDrawerFooter>{mobileActions}</AppDrawerFooter>
      </AppDrawer>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Progresso" size="md">
      <ModalBody>{content}</ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          className="rounded-full px-8"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
          className="rounded-full px-8"
        >
          {isLoading ? 'Salvando...' : 'Registrar Progresso'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
