import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { PatientContact } from '@/types/patient'
import type { UpdatePatientInput } from '@/services/patients.service'

interface ContatosTabProps {
  data: PatientContact
  onSave?: (data: UpdatePatientInput) => Promise<unknown>
  isLoading?: boolean
}

const relationshipOptions = [
  { value: 'Cônjuge', label: 'Cônjuge' },
  { value: 'Pai', label: 'Pai' },
  { value: 'Mãe', label: 'Mãe' },
  { value: 'Filho(a)', label: 'Filho(a)' },
  { value: 'Irmão(ã)', label: 'Irmão(ã)' },
  { value: 'Avô(ó)', label: 'Avô(ó)' },
  { value: 'Tio(a)', label: 'Tio(a)' },
  { value: 'Primo(a)', label: 'Primo(a)' },
  { value: 'Outro', label: 'Outro' },
]

export function ContatosTab({ data, onSave, isLoading }: ContatosTabProps) {
  const [formData, setFormData] = useState({
    email: data.email,
    phone: data.phone,
    familyResponsible: {
      cpf: data.familyResponsible?.cpf || '',
      name: data.familyResponsible?.name || '',
      relationship: data.familyResponsible?.relationship || '',
    },
    financialResponsible: {
      cpf: data.financialResponsible?.cpf || '',
      name: data.financialResponsible?.name || '',
      relationship: data.financialResponsible?.relationship || '',
    },
  })

  const handleSave = async () => {
    if (onSave) {
      await onSave({
        email: formData.email,
        phone: formData.phone,
        familyResponsible: formData.familyResponsible,
        financialResponsible: formData.financialResponsible,
      })
    }
  }

  const handleCancel = () => {
    setFormData({
      email: data.email,
      phone: data.phone,
      familyResponsible: {
        cpf: data.familyResponsible?.cpf || '',
        name: data.familyResponsible?.name || '',
        relationship: data.familyResponsible?.relationship || '',
      },
      financialResponsible: {
        cpf: data.financialResponsible?.cpf || '',
        name: data.financialResponsible?.name || '',
        relationship: data.financialResponsible?.relationship || '',
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* E-mail e Telefone */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            E-mail <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Telefone <span className="text-red-500">*</span>
          </label>
          <PhoneInput
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
          />
        </div>
      </div>

      {/* Responsável Familiar */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Dados do responsável familiar <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Input
            value={formData.familyResponsible.cpf}
            onChange={(e) =>
              setFormData({
                ...formData,
                familyResponsible: { ...formData.familyResponsible, cpf: e.target.value },
              })
            }
            placeholder="CPF"
          />
          <Input
            value={formData.familyResponsible.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                familyResponsible: { ...formData.familyResponsible, name: e.target.value },
              })
            }
            placeholder="Nome completo"
          />
          <Select
            options={relationshipOptions}
            value={formData.familyResponsible.relationship}
            onChange={(value) =>
              setFormData({
                ...formData,
                familyResponsible: { ...formData.familyResponsible, relationship: value },
              })
            }
            placeholder="Parentesco"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Registre o responsável preenchendo todos os dados
        </p>
      </div>

      {/* Responsável Financeiro */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Dados do responsável financeiro <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Input
            value={formData.financialResponsible.cpf}
            onChange={(e) =>
              setFormData({
                ...formData,
                financialResponsible: { ...formData.financialResponsible, cpf: e.target.value },
              })
            }
            placeholder="CPF"
          />
          <Input
            value={formData.financialResponsible.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                financialResponsible: { ...formData.financialResponsible, name: e.target.value },
              })
            }
            placeholder="Nome completo"
          />
          <Select
            options={relationshipOptions}
            value={formData.financialResponsible.relationship}
            onChange={(value) =>
              setFormData({
                ...formData,
                financialResponsible: { ...formData.financialResponsible, relationship: value },
              })
            }
            placeholder="Parentesco"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Registre o responsável preenchendo todos os dados
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="rounded-full px-6 border-primary text-primary hover:bg-primary/10"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
