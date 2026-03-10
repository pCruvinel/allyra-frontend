import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CpfInput } from '@/components/ui/cpf-input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useZodForm } from '@/hooks/useZodForm'
import { createPatientSchema, type CreatePatientInput } from '@/schemas/patient.schema'

interface NovoPacienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePatientInput) => void
  isLoading?: boolean
}

const insuranceOptions = [
  { value: 'Particular', label: 'Particular' },
  { value: 'Unimed', label: 'Unimed' },
  { value: 'Bradesco Saude', label: 'Bradesco Saude' },
  { value: 'SulAmerica', label: 'SulAmerica' },
  { value: 'Amil', label: 'Amil' },
  { value: 'Porto Seguro', label: 'Porto Seguro' },
]

const defaultValues: CreatePatientInput = {
  name: '',
  email: '',
  cpf: '',
  phone: '',
  birthDate: '',
  insurance: '',
}

export function NovoPacienteModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: NovoPacienteModalProps) {
  const isMobile = useIsMobile()

  const {
    register,
    control,
    handleSubmit,
    reset,
    errors,
    formState: { isValid },
  } = useZodForm(createPatientSchema, defaultValues)

  // Limpa o form quando o modal é fechado
  const handleClose = () => {
    if (!isLoading) {
      reset(defaultValues)
      onClose()
    }
  }

  // Reset ao reabrir
  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen, reset])

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data)
  })

  const content = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <Input
          {...register('name')}
          placeholder="Digite o nome completo"
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            E-mail <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Telefone
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone.message as string}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            CPF <span className="text-red-500">*</span>
          </label>
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <CpfInput
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.cpf && (
            <p className="text-xs text-red-500 mt-1">{errors.cpf.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Data de nascimento
          </label>
          <Input
            type="date"
            {...register('birthDate')}
          />
          {errors.birthDate && (
            <p className="text-xs text-red-500 mt-1">{errors.birthDate.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <Controller
          name="insurance"
          control={control}
          render={({ field }) => (
            <Select
              label="Convênio"
              required
              options={insuranceOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecione o convênio"
            />
          )}
        />
        {errors.insurance && (
          <p className="text-xs text-red-500 mt-1">{errors.insurance.message as string}</p>
        )}
      </div>
    </div>
  )

  // Footer mobile: stack vertical (primário embaixo)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={onFormSubmit}
        disabled={!isValid || isLoading}
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
          onClick={onFormSubmit}
          disabled={!isValid || isLoading}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
