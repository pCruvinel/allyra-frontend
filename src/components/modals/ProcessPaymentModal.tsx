import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface ProcessPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PaymentFormData) => void
  patientName: string
  serviceName?: string
  appointmentId?: string
  isLoading?: boolean
}

export interface PaymentFormData {
  value: string
  paymentMethod: string
  installments: string
  discount: string
  appointmentId?: string
}

const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'boleto', label: 'Boleto' },
]

const installmentOptions = [
  { value: '1', label: '1x (à vista)' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
  { value: '4', label: '4x' },
  { value: '5', label: '5x' },
  { value: '6', label: '6x' },
  { value: '10', label: '10x' },
  { value: '12', label: '12x' },
]

export function ProcessPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  patientName,
  serviceName,
  appointmentId,
  isLoading = false,
}: ProcessPaymentModalProps) {
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState<PaymentFormData>({
    value: '',
    paymentMethod: '',
    installments: '1',
    discount: '',
    appointmentId,
  })

  // Atualizar appointmentId quando mudar
  useEffect(() => {
    setFormData(prev => ({ ...prev, appointmentId }))
  }, [appointmentId])

  // Resetar form quando fechar
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        value: '',
        paymentMethod: '',
        installments: '1',
        discount: '',
        appointmentId,
      })
    }
  }, [isOpen, appointmentId])

  const handleSubmit = () => {
    onSubmit(formData)
  }

  const handleChange = (field: keyof PaymentFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.value && formData.paymentMethod

  // Calcular valor final
  const valorNumerico = parseFloat(formData.value.replace(',', '.')) || 0
  const descontoNumerico = parseFloat(formData.discount.replace(',', '.')) || 0
  const valorFinal = Math.max(0, valorNumerico - descontoNumerico)

  const content = (
    <div className="space-y-4">
      {/* Patient Name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Paciente</label>
        <div className="px-3 py-2 text-sm bg-muted rounded-md text-foreground">
          {patientName}
        </div>
      </div>

      {/* Servico */}
      {serviceName && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Serviço</label>
          <div className="px-3 py-2 text-sm bg-muted rounded-md text-foreground">
            {serviceName}
          </div>
        </div>
      )}

      {/* Value and Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Valor <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Ex: 150,00"
            value={formData.value}
            onChange={(e) => handleChange('value')(e.target.value)}
          />
        </div>

        <Select
          label="Forma de pagamento"
          required
          options={paymentMethodOptions}
          value={formData.paymentMethod}
          onChange={handleChange('paymentMethod')}
          placeholder="Selecione uma opção"
        />
      </div>

      {/* Installments and Discount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Quantidade de parcelas"
          options={installmentOptions}
          value={formData.installments}
          onChange={handleChange('installments')}
          placeholder="Selecione uma opção"
          disabled={formData.paymentMethod !== 'credito'}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Desconto</label>
          <Input
            type="text"
            placeholder="Ex: 10,00"
            value={formData.discount}
            onChange={(e) => handleChange('discount')(e.target.value)}
          />
        </div>
      </div>

      {/* Valor Final */}
      {valorNumerico > 0 && (
        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium text-foreground">Valor final:</span>
          <span className="text-lg font-bold text-primary">
            R$ {valorFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      )}
    </div>
  )

  // Footer mobile: stack vertical (primario embaixo)
  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className="w-full rounded-full"
      >
        {isLoading ? 'Processando...' : 'Confirmar pagamento'}
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
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
        onOpenChange={(open) => !open && !isLoading && onClose()}
        title="Efetuar pagamento"
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Efetuar pagamento"
      size="md"
    >
      <ModalBody>
        {content}
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-full px-8"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          className="rounded-full px-8"
        >
          {isLoading ? 'Processando...' : 'Confirmar pagamento'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
