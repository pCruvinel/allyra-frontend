import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { PatientAddress } from '@/types/patient'
import type { UpdatePatientInput } from '@/services/patients.service'

interface EnderecoTabProps {
  data: PatientAddress
  onSave?: (data: UpdatePatientInput) => Promise<unknown>
  isLoading?: boolean
}

const estadosOptions = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map(estado => ({ value: estado, label: estado }))

export function EnderecoTab({ data, onSave, isLoading }: EnderecoTabProps) {
  const [formData, setFormData] = useState({
    zipCode: data.zipCode,
    city: data.city,
    state: data.state,
    street: data.street,
    number: data.number,
    neighborhood: data.neighborhood,
    complement: data.complement || '',
  })

  const handleSave = async () => {
    if (onSave) {
      // Montar endereço completo
      const enderecoCompleto = [
        formData.street,
        formData.number,
        formData.complement,
      ].filter(Boolean).join(', ')

      await onSave({
        cep: formData.zipCode,
        address: enderecoCompleto,
        city: formData.city,
        state: formData.state,
        neighborhood: formData.neighborhood,
      })
    }
  }

  const handleCancel = () => {
    setFormData({
      zipCode: data.zipCode,
      city: data.city,
      state: data.state,
      street: data.street,
      number: data.number,
      neighborhood: data.neighborhood,
      complement: data.complement || '',
    })
  }

  return (
    <div className="space-y-6">
      {/* CEP */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          CEP <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.zipCode}
          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          placeholder="00000-000"
        />
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cidade <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Nome da cidade"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Estado <span className="text-red-500">*</span>
          </label>
          <Select
            options={estadosOptions}
            value={formData.state}
            onChange={(value) => setFormData({ ...formData, state: value })}
            placeholder="Selecione"
          />
        </div>
      </div>

      {/* Logradouro */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Logradouro <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          placeholder="Rua, Avenida, etc."
        />
      </div>

      {/* Número e Bairro */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Número <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            placeholder="Número"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Bairro <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            placeholder="Nome do bairro"
          />
        </div>
      </div>

      {/* Complemento */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Complemento <span className="text-muted-foreground">(opcional)</span>
        </label>
        <Input
          value={formData.complement}
          onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
          placeholder="Apartamento, bloco, etc."
        />
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
