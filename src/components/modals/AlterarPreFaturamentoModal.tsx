import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormModal, FormField, ReadOnlyField } from '@/components/ui'
import { INSURANCE_OPTIONS } from '@/lib/constants'
import type { PreFaturamento } from '@/types/billing'

interface AlterarPreFaturamentoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AlterarPreFaturamentoFormData) => void
  preFaturamento: PreFaturamento | null
}

interface AlterarPreFaturamentoFormData {
  value: number
  procedure: string
  transferRule: string
  insurance: string
}

const procedureOptions = [
  { value: 'avaliacao-30', label: 'Avaliação 30min. (30)' },
  { value: 'consulta-45', label: 'Consulta 45min. (45)' },
  { value: 'terapia-60', label: 'Terapia 60min. (60)' },
  { value: 'retorno-20', label: 'Retorno 20min. (20)' },
]

const transferRuleOptions = [
  { value: 'paciente-proprio', label: 'Paciente próprio' },
  { value: 'paciente-clinica', label: 'Paciente da clínica' },
  { value: 'sem-repasse', label: 'Sem repasse' },
]

const initialFormData: AlterarPreFaturamentoFormData = {
  value: 0,
  procedure: '',
  transferRule: '',
  insurance: '',
}

export function AlterarPreFaturamentoModal({
  isOpen,
  onClose,
  onSubmit,
  preFaturamento,
}: AlterarPreFaturamentoModalProps) {
  const [formData, setFormData] = useState<AlterarPreFaturamentoFormData>(initialFormData)

  useEffect(() => {
    if (preFaturamento) {
      setFormData({
        value: preFaturamento.value,
        procedure: preFaturamento.service,
        transferRule: 'paciente-proprio',
        insurance: preFaturamento.insurance.toLowerCase().replace(/\s+/g, '-'),
      })
    }
  }, [preFaturamento])

  const handleSubmit = () => {
    onSubmit(formData)
    handleClose()
  }

  const handleClose = () => {
    setFormData(initialFormData)
    onClose()
  }

  const isFormValid = formData.value > 0 && formData.procedure !== '' && formData.insurance !== ''

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Alterar dados do pré-faturamento"
      submitLabel="Salvar alterações"
      submitDisabled={!isFormValid}
    >
      <ReadOnlyField label="Paciente" value={preFaturamento?.patientName || ''} />

      <FormField label="Valor" required>
        <Input
          type="number"
          value={formData.value || ''}
          onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
          placeholder="Digite o valor"
        />
      </FormField>

      <FormField label="Procedimento" required>
        <Select
          options={procedureOptions}
          value={formData.procedure}
          onChange={(value) => setFormData({ ...formData, procedure: value })}
          placeholder="Selecione o procedimento"
        />
      </FormField>

      <FormField label="Regra de repasse">
        <Select
          options={transferRuleOptions}
          value={formData.transferRule}
          onChange={(value) => setFormData({ ...formData, transferRule: value })}
          placeholder="Selecione a regra"
        />
      </FormField>

      <FormField label="Convênio" required>
        <Select
          options={INSURANCE_OPTIONS}
          value={formData.insurance}
          onChange={(value) => setFormData({ ...formData, insurance: value })}
          placeholder="Selecione o convênio"
        />
      </FormField>
    </FormModal>
  )
}
