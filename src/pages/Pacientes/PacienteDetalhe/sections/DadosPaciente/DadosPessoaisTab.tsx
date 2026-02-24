import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { PatientPersonalData } from '@/types/patient'
import type { UpdatePatientInput } from '@/services/patients.service'

interface DadosPessoaisTabProps {
  data: PatientPersonalData
  onSave?: (data: UpdatePatientInput) => Promise<unknown>
  isLoading?: boolean
}

const genderOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'Não-binário', label: 'Não-binário' },
  { value: 'Prefiro não informar', label: 'Prefiro não informar' },
  { value: 'Outro', label: 'Outro' },
]

const maritalStatusOptions = [
  { value: 'Solteiro(a)', label: 'Solteiro(a)' },
  { value: 'Casado(a)', label: 'Casado(a)' },
  { value: 'Divorciado(a)', label: 'Divorciado(a)' },
  { value: 'Viúvo(a)', label: 'Viúvo(a)' },
  { value: 'União Estável', label: 'União Estável' },
  { value: 'Separado(a)', label: 'Separado(a)' },
  { value: 'Prefiro não informar', label: 'Prefiro não informar' },
]

export function DadosPessoaisTab({ data, onSave, isLoading }: DadosPessoaisTabProps) {
  const [formData, setFormData] = useState({
    name: data.name,
    cpf: data.cpf,
    birthDate: data.birthDate,
    gender: data.gender,
    maritalStatus: data.maritalStatus,
    avatar: data.avatar,
  })

  const handleSave = async () => {
    if (onSave) {
      await onSave({
        name: formData.name,
        cpf: formData.cpf,
        birthDate: formData.birthDate,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        avatar: formData.avatar,
      })
    }
  }

  const handleCancel = () => {
    setFormData({
      name: data.name,
      cpf: data.cpf,
      birthDate: data.birthDate,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      avatar: data.avatar,
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Avatar e Nome */}
      <div className="flex items-start gap-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="w-20 h-20">
            <AvatarImage src={formData.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(formData.name)}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            className="text-primary border-primary hover:bg-primary/10"
          >
            <Camera className="w-4 h-4 mr-1" />
            Adicionar foto
          </Button>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Digite o nome completo"
          />
        </div>
      </div>

      {/* CPF e Data de Nascimento */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            CPF <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Data de nascimento <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          />
        </div>
      </div>

      {/* Sexo e Estado Civil */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sexo <span className="text-red-500">*</span>
          </label>
          <Select
            options={genderOptions}
            value={formData.gender}
            onChange={(value) => setFormData({ ...formData, gender: value as typeof formData.gender })}
            placeholder="Selecione"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Estado civil
          </label>
          <Select
            options={maritalStatusOptions}
            value={formData.maritalStatus}
            onChange={(value) => setFormData({ ...formData, maritalStatus: value as typeof formData.maritalStatus })}
            placeholder="Selecione"
          />
        </div>
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
