import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui'
import { BRAZILIAN_STATES } from '@/lib/constants'
import { availableModules } from '@/types/client'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface NovoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NovoClienteFormData) => void
}

interface NovoClienteFormData {
  code: string
  fantasyName: string
  companyName: string
  cnpj: string
  stateRegistration?: string
  email: string
  phone: string
  cep: string
  address: string
  neighborhood: string
  city: string
  state: string
  modules: string[]
}

const initialFormData: NovoClienteFormData = {
  code: '',
  fantasyName: '',
  companyName: '',
  cnpj: '',
  stateRegistration: '',
  email: '',
  phone: '',
  cep: '',
  address: '',
  neighborhood: '',
  city: '',
  state: '',
  modules: [],
}

export function NovoClienteModal({
  isOpen,
  onClose,
  onSubmit,
}: NovoClienteModalProps) {
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState<NovoClienteFormData>(initialFormData)

  const handleSubmit = () => {
    onSubmit(formData)
    handleClose()
  }

  const handleClose = () => {
    setFormData(initialFormData)
    onClose()
  }

  const toggleModule = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter((m) => m !== module)
        : [...prev.modules, module],
    }))
  }

  const isFormValid =
    formData.code !== '' &&
    formData.fantasyName !== '' &&
    formData.companyName !== '' &&
    formData.cnpj !== '' &&
    formData.email !== '' &&
    formData.phone !== ''

  const content = (
    <div className="space-y-4">
      <FormField label="Código" required>
        <Input
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="CLIN-XXX"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nome fantasia" required>
          <Input
            value={formData.fantasyName}
            onChange={(e) => setFormData({ ...formData, fantasyName: e.target.value })}
            placeholder="Nome fantasia"
          />
        </FormField>
        <FormField label="Razão social" required>
          <Input
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Razão social"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="CNPJ" required>
          <Input
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
          />
        </FormField>
        <FormField label="Inscrição estadual">
          <Input
            value={formData.stateRegistration}
            onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
            placeholder="Inscrição estadual"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="E-mail" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </FormField>
        <FormField label="Telefone" required>
          <PhoneInput
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="CEP">
          <Input
            value={formData.cep}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            placeholder="00000-000"
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Logradouro">
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Endereço completo"
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Bairro">
          <Input
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            placeholder="Bairro"
          />
        </FormField>
        <FormField label="Cidade">
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Cidade"
          />
        </FormField>
        <FormField label="UF">
          <Select
            options={BRAZILIAN_STATES}
            value={formData.state}
            onChange={(value) => setFormData({ ...formData, state: value })}
            placeholder="Selecione"
          />
        </FormField>
      </div>

      <FormField label="Módulos">
        <div className="flex flex-wrap gap-2">
          {availableModules.map((module) => (
            <button
              key={module}
              type="button"
              onClick={() => toggleModule(module)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                formData.modules.includes(module)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary'
              )}
            >
              {module}
            </button>
          ))}
        </div>
      </FormField>
    </div>
  )

  // Footer mobile: stack vertical (primario embaixo)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
      >
        Adicionar cliente
      </Button>
      <Button
        variant="outline"
        onClick={handleClose}
        className="w-full rounded-full"
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
        title="Adicionar novo cliente"
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar novo cliente" size="lg">
      <ModalBody className="max-h-[70vh] overflow-y-auto">
        {content}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} className="rounded-full px-8">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          Adicionar cliente
        </Button>
      </ModalFooter>
    </Modal>
  )
}
