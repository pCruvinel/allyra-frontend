import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface NovoPacienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PatientFormData) => void
  isLoading?: boolean
}

interface PatientFormData {
  name: string
  email: string
  cpf: string
  phone: string
  birthDate: string
  insurance: string
}

const insuranceOptions = [
  { value: 'Particular', label: 'Particular' },
  { value: 'Unimed', label: 'Unimed' },
  { value: 'Bradesco Saude', label: 'Bradesco Saude' },
  { value: 'SulAmerica', label: 'SulAmerica' },
  { value: 'Amil', label: 'Amil' },
  { value: 'Porto Seguro', label: 'Porto Seguro' },
]

export function NovoPacienteModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: NovoPacienteModalProps) {
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    birthDate: '',
    insurance: '',
  })

  const handleSubmit = () => {
    onSubmit(formData)
    // Reset do form será feito quando o modal fechar
  }

  // Limpa o form quando o modal é fechado
  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        birthDate: '',
        insurance: '',
      })
      onClose()
    }
  }

  const handleChange = (field: keyof PatientFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSelectChange = (field: keyof PatientFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid =
    formData.name && formData.email && formData.cpf && formData.insurance

  const content = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={handleChange('name')}
          placeholder="Digite o nome completo"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            E-mail <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Telefone
          </label>
          <PhoneInput
            value={formData.phone}
            onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            CPF <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.cpf}
            onChange={handleChange('cpf')}
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Data de nascimento
          </label>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={handleChange('birthDate')}
          />
        </div>
      </div>

      <Select
        label="Convênio"
        required
        options={insuranceOptions}
        value={formData.insurance}
        onChange={handleSelectChange('insurance')}
        placeholder="Selecione o convênio"
      />
    </div>
  )

  // Footer mobile: stack vertical (primário embaixo)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        {isLoading ? 'Cadastrando...' : 'Cadastrar'}
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

  // Mobile: usar AppDrawer fullscreen
  if (isMobile) {
    return (
      <AppDrawer
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title="Novo paciente"
      >
        <AppDrawerBody>
          {content}
        </AppDrawerBody>
        <AppDrawerFooter>
          {mobileActions}
        </AppDrawerFooter>
      </AppDrawer>
    )
  }

  // Desktop: usar Modal tradicional
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo paciente" size="lg">
      <ModalBody>
        {content}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} className="rounded-full px-8" disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
