import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select } from '@/components/ui/select'
import { FormModal, FormField } from '@/components/ui'
import { getAvailablePermissionsFor } from '@/lib/constants'

interface NovoUsuarioModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NovoUsuarioFormData) => void
  /** Perfil do usuário logado (admin_master, administrador_total, etc) */
  currentUserPerfil?: string
}

interface NovoUsuarioFormData {
  name: string
  permissionLevel: string
  email: string
  phone?: string
}

const initialFormData: NovoUsuarioFormData = {
  name: '',
  permissionLevel: '',
  email: '',
  phone: '',
}

export function NovoUsuarioModal({
  isOpen,
  onClose,
  onSubmit,
  currentUserPerfil = 'admin_master',
}: NovoUsuarioModalProps) {
  const [formData, setFormData] = useState<NovoUsuarioFormData>(initialFormData)

  // Filtra as opções de permissão baseado no perfil do usuário logado
  const availablePermissions = useMemo(() => {
    return getAvailablePermissionsFor(currentUserPerfil)
  }, [currentUserPerfil])

  const handleSubmit = () => {
    onSubmit(formData)
    handleClose()
  }

  const handleClose = () => {
    setFormData(initialFormData)
    onClose()
  }

  const isFormValid =
    formData.name !== '' &&
    formData.permissionLevel !== '' &&
    formData.email !== ''

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Adicionar novo usuário"
      submitLabel="Adicionar usuário"
      submitDisabled={!isFormValid}
    >
      <FormField label="Nome completo" required>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nome completo do usuário"
        />
      </FormField>

      <FormField label="Nível de permissão" required>
        <Select
          options={availablePermissions}
          value={formData.permissionLevel}
          onChange={(value) => setFormData({ ...formData, permissionLevel: value })}
          placeholder="Selecione o nível de permissão"
        />
      </FormField>

      <FormField label="E-mail" required>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@exemplo.com"
        />
      </FormField>

      <FormField label="Contato">
        <PhoneInput
          value={formData.phone || ''}
          onChange={(value) => setFormData({ ...formData, phone: value })}
        />
      </FormField>
    </FormModal>
  )
}
