/**
 * NewGoalModal - Modal para criar/editar metas terapêuticas
 */

import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { TherapeuticGoal, GoalInputType } from '@/types/goals'
import { createGoalSchema, goalInputTypeSchema } from '@/schemas/goals.schema'
import { z } from 'zod'
import { toast } from 'sonner'

const goalFormSchema = z.object({
  titulo: createGoalSchema.shape.titulo,
  descricao: z.string().max(2000, 'Descrição muito longa').optional(),
  tipo_input: goalInputTypeSchema,
  meta_esperada: z.string().min(1, 'Meta esperada é obrigatória'),
  unidade: z.string().max(50, 'Unidade não pode exceder 50 caracteres').optional(),
})

interface NewGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: GoalFormData) => Promise<void>
  planId: string
  editingGoal?: TherapeuticGoal | null
}

interface GoalFormData {
  titulo: string
  descricao?: string
  tipo_input: GoalInputType
  meta_esperada: string
  unidade?: string
}

const inputTypeOptions = [
  { value: 'numerico', label: 'Numérico', description: 'Valor numérico (ex: 30 palavras)' },
  { value: 'booleano', label: 'Sim/Não', description: 'Resposta binária' },
  { value: 'escala', label: 'Escala (1-5)', description: 'Pontuação de 1 a 5' },
  { value: 'protocolo', label: 'Protocolo', description: 'Texto descritivo' },
]

export function NewGoalModal({
  isOpen,
  onClose,
  onSave,
  editingGoal,
}: NewGoalModalProps) {
  const isMobile = useIsMobile()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<GoalFormData>({
    titulo: '',
    descricao: '',
    tipo_input: 'numerico',
    meta_esperada: '',
    unidade: '',
  })

  // Preenche form quando estiver editando
  useEffect(() => {
    if (editingGoal) {
      setFormData({
        titulo: editingGoal.titulo || '',
        descricao: editingGoal.descricao || '',
        tipo_input: editingGoal.tipo_input,
        meta_esperada: editingGoal.meta_esperada || '',
        unidade: editingGoal.unidade || '',
      })
    } else {
      setFormData({
        titulo: '',
        descricao: '',
        tipo_input: 'numerico',
        meta_esperada: '',
        unidade: '',
      })
    }
  }, [editingGoal, isOpen])

  const handleSubmit = async () => {
    // Validação com Zod
    const result = goalFormSchema.safeParse(formData)
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

  const handleChange = (field: keyof GoalFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSelectChange = (field: keyof GoalFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.titulo && formData.meta_esperada

  const title = editingGoal ? 'Editar Meta' : 'Nova Meta'

  // Placeholder dinâmico baseado no tipo
  const getMetaPlaceholder = () => {
    switch (formData.tipo_input) {
      case 'numerico':
        return 'Ex: 30'
      case 'booleano':
        return 'Sim'
      case 'escala':
        return 'Ex: 4 (de 1 a 5)'
      case 'protocolo':
        return 'Descreva o objetivo do protocolo'
      default:
        return ''
    }
  }

  // Mostra campo de unidade apenas para tipos que fazem sentido
  const showUnitField = formData.tipo_input === 'numerico' || formData.tipo_input === 'escala'

  const content = (
    <div className="space-y-4">
      {/* Título da Meta */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Título da Meta <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.titulo}
          onChange={handleChange('titulo')}
          placeholder="Ex: Falar 30 palavras, Contato visual, etc."
        />
      </div>

      {/* Tipo de Medição */}
      <Select
        label="Tipo de Medição"
        required
        options={inputTypeOptions.map(opt => ({ value: opt.value, label: opt.label }))}
        value={formData.tipo_input}
        onChange={handleSelectChange('tipo_input')}
      />
      <p className="text-xs text-muted-foreground -mt-2">
        {inputTypeOptions.find(o => o.value === formData.tipo_input)?.description}
      </p>

      {/* Meta Esperada */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Meta Esperada <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.meta_esperada}
          onChange={handleChange('meta_esperada')}
          placeholder={getMetaPlaceholder()}
        />
      </div>

      {/* Unidade (apenas para numérico e escala) */}
      {showUnitField && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Unidade
          </label>
          <Input
            value={formData.unidade}
            onChange={handleChange('unidade')}
            placeholder="Ex: palavras, minutos, pontos"
          />
        </div>
      )}

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Descrição (opcional)
        </label>
        <Textarea
          value={formData.descricao}
          onChange={handleChange('descricao')}
          placeholder="Detalhes adicionais sobre a meta..."
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
        {isLoading ? 'Salvando...' : editingGoal ? 'Salvar Alterações' : 'Adicionar Meta'}
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
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
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
          {isLoading ? 'Salvando...' : editingGoal ? 'Salvar Alterações' : 'Adicionar Meta'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
