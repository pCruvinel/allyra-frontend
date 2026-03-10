import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CnpjInput } from '@/components/ui/cnpj-input'
import { CepInput } from '@/components/ui/cep-input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui'
import { BRAZILIAN_STATES } from '@/lib/constants'
import { availableModules } from '@/types/client'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useZodForm } from '@/hooks/useZodForm'
import { createClienteSchema, type CreateClienteInput } from '@/schemas/client.schema'

interface NovoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateClienteInput) => void
}

const defaultValues: CreateClienteInput = {
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

  const {
    register,
    control,
    handleSubmit,
    reset,
    errors,
    formState: { isValid },
    setValue,
    watch,
  } = useZodForm(createClienteSchema, defaultValues)

  const selectedModules = watch('modules')

  const handleClose = () => {
    reset(defaultValues)
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen, reset])

  const toggleModule = (module: string) => {
    const current = selectedModules || []
    const updated = current.includes(module)
      ? current.filter((m: string) => m !== module)
      : [...current, module]
    setValue('modules', updated, { shouldValidate: true })
  }

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data)
    handleClose()
  })

  const content = (
    <div className="space-y-4">
      <FormField label="Código" required>
        <Input
          {...register('code')}
          placeholder="CLIN-XXX"
        />
        {errors.code && (
          <p className="text-xs text-red-500 mt-1">{errors.code.message as string}</p>
        )}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nome fantasia" required>
          <Input
            {...register('fantasyName')}
            placeholder="Nome fantasia"
          />
          {errors.fantasyName && (
            <p className="text-xs text-red-500 mt-1">{errors.fantasyName.message as string}</p>
          )}
        </FormField>
        <FormField label="Razão social" required>
          <Input
            {...register('companyName')}
            placeholder="Razão social"
          />
          {errors.companyName && (
            <p className="text-xs text-red-500 mt-1">{errors.companyName.message as string}</p>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="CNPJ" required>
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <CnpjInput
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.cnpj && (
            <p className="text-xs text-red-500 mt-1">{errors.cnpj.message as string}</p>
          )}
        </FormField>
        <FormField label="Inscrição estadual">
          <Input
            {...register('stateRegistration')}
            placeholder="Inscrição estadual"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <FormField label="Telefone" required>
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
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="CEP">
          <Controller
            name="cep"
            control={control}
            render={({ field }) => (
              <CepInput
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
          {errors.cep && (
            <p className="text-xs text-red-500 mt-1">{errors.cep.message as string}</p>
          )}
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Logradouro">
            <Input
              {...register('address')}
              placeholder="Endereço completo"
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Bairro">
          <Input
            {...register('neighborhood')}
            placeholder="Bairro"
          />
        </FormField>
        <FormField label="Cidade">
          <Input
            {...register('city')}
            placeholder="Cidade"
          />
        </FormField>
        <FormField label="UF">
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select
                options={BRAZILIAN_STATES}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Selecione"
              />
            )}
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
                (selectedModules || []).includes(module)
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
        onClick={onFormSubmit}
        disabled={!isValid}
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
          onClick={onFormSubmit}
          disabled={!isValid}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          Adicionar cliente
        </Button>
      </ModalFooter>
    </Modal>
  )
}
