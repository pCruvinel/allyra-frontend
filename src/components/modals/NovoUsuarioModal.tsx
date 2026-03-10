import { useEffect, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select } from '@/components/ui/select'
import { FormModal, FormField } from '@/components/ui'
import { getAvailablePermissionsFor } from '@/lib/constants'
import { useZodForm } from '@/hooks/useZodForm'
import { createUserSchema, type CreateUserInput } from '@/schemas/user.schema'

interface NovoUsuarioModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateUserInput) => void
  /** Perfil do usuário logado (admin_master, administrador_total, etc) */
  currentUserPerfil?: string
}

const defaultValues: CreateUserInput = {
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
  const {
    register,
    control,
    handleSubmit,
    reset,
    errors,
    formState: { isValid },
  } = useZodForm(createUserSchema, defaultValues)

  // Filtra as opções de permissão baseado no perfil do usuário logado
  const availablePermissions = useMemo(() => {
    return getAvailablePermissionsFor(currentUserPerfil)
  }, [currentUserPerfil])

  const handleClose = () => {
    reset(defaultValues)
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen, reset])

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data)
    handleClose()
  })

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={onFormSubmit}
      title="Adicionar novo usuário"
      submitLabel="Adicionar usuário"
      submitDisabled={!isValid}
    >
      <FormField label="Nome completo" required>
        <Input
          {...register('name')}
          placeholder="Nome completo do usuário"
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>
        )}
      </FormField>

      <FormField label="Nível de permissão" required>
        <Controller
          name="permissionLevel"
          control={control}
          render={({ field }) => (
            <Select
              options={availablePermissions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecione o nível de permissão"
            />
          )}
        />
        {errors.permissionLevel && (
          <p className="text-xs text-red-500 mt-1">{errors.permissionLevel.message as string}</p>
        )}
      </FormField>

      <FormField label="E-mail" required>
        <Input
          type="email"
          {...register('email')}
          placeholder="email@exemplo.com"
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>
        )}
      </FormField>

      <FormField label="Contato">
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              value={field.value || ''}
              onChange={field.onChange}
            />
          )}
        />
      </FormField>
    </FormModal>
  )
}
