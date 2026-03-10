import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useZodForm } from '@/hooks/useZodForm'
import { createCobrancaSchema, type CreateCobrancaInput } from '@/schemas/cobranca.schema'

interface NovaCobrancaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCobrancaInput) => void
  patientName?: string
}

const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão de Crédito' },
  { value: 'transferencia', label: 'Transferência Bancária' },
]

const installmentOptions = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
  { value: '4', label: '4x' },
  { value: '5', label: '5x' },
  { value: '6', label: '6x' },
]

const delayTabs = [
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
  { value: 45, label: '45 dias' },
  { value: 60, label: '60 dias' },
]

export function NovaCobrancaModal({
  isOpen,
  onClose,
  onSubmit,
  patientName = '',
}: NovaCobrancaModalProps) {
  const isMobile = useIsMobile()

  const defaultValues: CreateCobrancaInput = {
    patientName: patientName,
    value: 0,
    paymentMethod: '',
    installments: 1,
    discount: 0,
    delayDays: 15,
    message: '',
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    errors,
    formState: { isValid },
    setValue,
    watch,
  } = useZodForm(createCobrancaSchema, defaultValues)

  const currentDelayDays = watch('delayDays')

  useEffect(() => {
    if (isOpen) {
      reset({ ...defaultValues, patientName })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patientName])

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data)
    onClose()
    reset(defaultValues)
  })

  const content = (
    <div className="space-y-6">
      {/* Paciente */}
      <FormField label="Paciente">
        <Input
          {...register('patientName')}
          placeholder="Nome do paciente"
          className="bg-muted/50"
        />
      </FormField>

      {/* Valor e Forma de Pagamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Valor" required>
          <Controller
            name="value"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.value && (
            <p className="text-xs text-red-500 mt-1">{errors.value.message as string}</p>
          )}
        </FormField>
        <FormField label="Forma de pagamento" required>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Select
                options={paymentMethodOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione uma opção"
              />
            )}
          />
          {errors.paymentMethod && (
            <p className="text-xs text-red-500 mt-1">{errors.paymentMethod.message as string}</p>
          )}
        </FormField>
      </div>

      {/* Parcelas e Desconto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Quantidade de parcelas">
          <Controller
            name="installments"
            control={control}
            render={({ field }) => (
              <Select
                options={installmentOptions}
                value={field.value.toString()}
                onChange={(value) => field.onChange(Number(value))}
                placeholder="Selecione uma opção"
              />
            )}
          />
        </FormField>
        <FormField label="Desconto">
          <Controller
            name="discount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.discount && (
            <p className="text-xs text-red-500 mt-1">{errors.discount.message as string}</p>
          )}
        </FormField>
      </div>

      {/* Tabs de Atraso */}
      <FormField label="Após quantos dias de atraso">
        <div className="flex flex-wrap gap-2">
          {delayTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setValue('delayDays', tab.value, { shouldValidate: true })}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full border transition-colors',
                currentDelayDays === tab.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </FormField>

      {/* Mensagem de Cobrança */}
      <FormField label="Mensagem de cobrança">
        <Textarea
          {...register('message')}
          placeholder="Digite aqui a sua mensagem"
          rows={4}
        />
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
        Gerar
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
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
        onOpenChange={(open) => !open && onClose()}
        title="Gerar nova cobrança"
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
    <Modal isOpen={isOpen} onClose={onClose} title="Gerar nova cobrança" size="lg">
      <ModalBody>
        {content}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="rounded-full px-8">
          Cancelar
        </Button>
        <Button
          onClick={onFormSubmit}
          disabled={!isValid}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          Gerar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
