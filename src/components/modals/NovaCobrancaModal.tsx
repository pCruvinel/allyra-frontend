import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface NovaCobrancaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CobrancaFormData) => void
  patientName?: string
}

interface CobrancaFormData {
  patientName: string
  value: number
  paymentMethod: string
  installments: number
  discount: number
  delayDays: number
  message: string
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
  const [formData, setFormData] = useState<CobrancaFormData>({
    patientName: patientName,
    value: 0,
    paymentMethod: '',
    installments: 1,
    discount: 0,
    delayDays: 15,
    message: '',
  })

  const handleSubmit = () => {
    onSubmit(formData)
    onClose()
    // Reset form
    setFormData({
      patientName: '',
      value: 0,
      paymentMethod: '',
      installments: 1,
      discount: 0,
      delayDays: 15,
      message: '',
    })
  }

  const isFormValid = formData.value > 0 && formData.paymentMethod !== ''

  const content = (
    <div className="space-y-6">
      {/* Paciente */}
      <FormField label="Paciente">
        <Input
          value={formData.patientName}
          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          placeholder="Nome do paciente"
          className="bg-muted/50"
        />
      </FormField>

      {/* Valor e Forma de Pagamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Valor" required>
          <Input
            type="number"
            value={formData.value || ''}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            placeholder="Digite apenas números"
          />
        </FormField>
        <FormField label="Forma de pagamento" required>
          <Select
            options={paymentMethodOptions}
            value={formData.paymentMethod}
            onChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            placeholder="Selecione uma opção"
          />
        </FormField>
      </div>

      {/* Parcelas e Desconto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Quantidade de parcelas">
          <Select
            options={installmentOptions}
            value={formData.installments.toString()}
            onChange={(value) => setFormData({ ...formData, installments: Number(value) })}
            placeholder="Selecione uma opção"
          />
        </FormField>
        <FormField label="Desconto">
          <Input
            type="number"
            value={formData.discount || ''}
            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
            placeholder="Digite apenas números"
          />
        </FormField>
      </div>

      {/* Tabs de Atraso */}
      <FormField label="Após quantos dias de atraso">
        <div className="flex flex-wrap gap-2">
          {delayTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFormData({ ...formData, delayDays: tab.value })}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full border transition-colors',
                formData.delayDays === tab.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </FormField>

      {/* Mensagem de Cobranca */}
      <FormField label="Mensagem de cobrança">
        <Textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
        onClick={handleSubmit}
        disabled={!isFormValid}
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
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          Gerar
        </Button>
      </ModalFooter>
    </Modal>
  )
}
