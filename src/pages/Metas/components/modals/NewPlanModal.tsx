/**
 * NewPlanModal - Modal para criar/editar planos terapêuticos
 */

import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { TherapeuticPlan, PlanStatus } from '@/types/goals'
import { createPlanSchema, planStatusSchema } from '@/schemas/goals.schema'
import { z } from 'zod'
import { toast } from 'sonner'

const planFormSchema = z.object({
  nome: createPlanSchema.shape.nome,
  data_inicio: createPlanSchema.shape.data_inicio,
  data_fim: z.string().optional(),
  status: planStatusSchema,
  observacoes: z.string().max(2000, 'Observações muito longas').optional(),
})

interface NewPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PlanFormData) => Promise<void>
  patientId: string
  patientName: string
  editingPlan?: TherapeuticPlan | null
}

interface PlanFormData {
  nome: string
  data_inicio: string
  data_fim: string
  status: PlanStatus
  observacoes?: string
}

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function NewPlanModal({
  isOpen,
  onClose,
  onSave,
  patientName,
  editingPlan,
}: NewPlanModalProps) {
  const isMobile = useIsMobile()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PlanFormData>({
    nome: '',
    data_inicio: '',
    data_fim: '',
    status: 'ativo',
    observacoes: '',
  })

  // Preenche form quando estiver editando
  useEffect(() => {
    if (editingPlan) {
      setFormData({
        nome: editingPlan.nome,
        data_inicio: editingPlan.data_inicio,
        data_fim: editingPlan.data_fim,
        status: editingPlan.status,
        observacoes: editingPlan.observacoes || '',
      })
    } else {
      // Default: nome com data atual
      const today = new Date().toISOString().split('T')[0]
      const sixMonthsLater = new Date()
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

      setFormData({
        nome: 'Plano Terapêutico',
        data_inicio: today,
        data_fim: sixMonthsLater.toISOString().split('T')[0],
        status: 'ativo',
        observacoes: '',
      })
    }
  }, [editingPlan, isOpen])

  const handleSubmit = async () => {
    // Validação com Zod
    const result = planFormSchema.safeParse(formData)
    if (!result.success) {
      toast.error(result.error.errors[0].message)
      return
    }

    setIsLoading(true)
    try {
      await onSave(formData)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handleChange = (field: keyof PlanFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSelectChange = (field: keyof PlanFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.nome && formData.data_inicio && formData.data_fim

  const title = editingPlan ? 'Editar Plano Terapêutico' : 'Novo Plano Terapêutico'

  const content = (
    <div className="space-y-4">
      {/* Paciente (readonly) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Paciente
        </label>
        <Input value={patientName} disabled className="bg-muted" />
      </div>

      {/* Nome do Plano */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Nome do Plano <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.nome}
          onChange={handleChange('nome')}
          placeholder="Ex: Plano de Desenvolvimento da Fala"
        />
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Data de Início <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.data_inicio}
            onChange={handleChange('data_inicio')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Data de Fim <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.data_fim}
            onChange={handleChange('data_fim')}
          />
        </div>
      </div>

      {/* Status (apenas em edição) */}
      {editingPlan && (
        <Select
          label="Status"
          options={statusOptions}
          value={formData.status}
          onChange={handleSelectChange('status')}
        />
      )}

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Observações
        </label>
        <Textarea
          value={formData.observacoes}
          onChange={handleChange('observacoes')}
          placeholder="Observações sobre o plano terapêutico..."
          rows={3}
        />
      </div>
    </div>
  )

  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className="w-full rounded-full"
      >
        {isLoading ? 'Salvando...' : editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
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
        title={title}
      >
        <AppDrawerBody>{content}</AppDrawerBody>
        <AppDrawerFooter>{mobileActions}</AppDrawerFooter>
      </AppDrawer>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
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
          disabled={!isFormValid || isLoading}
          className="rounded-full px-8"
        >
          {isLoading ? 'Salvando...' : editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
