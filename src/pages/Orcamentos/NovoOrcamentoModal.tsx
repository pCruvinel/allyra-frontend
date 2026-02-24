/**
 * Modal para criar novo orçamento
 */

import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { AppDrawer } from '@/components/ui/app-drawer'
import { Select } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useOrcamentos, usePatients, useProfessionals, useServices } from '@/hooks'
import type { CreateOrcamentoInput } from '@/types/orcamento'

interface NovoOrcamentoModalProps {
  isOpen: boolean
  onClose: () => void
  pacienteIdInicial?: string
}

interface ItemForm {
  servicoId: string
  quantidade: number
  valorUnitario: number
}

export function NovoOrcamentoModal({
  isOpen,
  onClose,
  pacienteIdInicial,
}: NovoOrcamentoModalProps) {
  const isMobile = useIsMobile()
  const { createOrcamento, isLoading } = useOrcamentos()
  const { patients } = usePatients()
  const { professionals } = useProfessionals()
  const { services } = useServices()

  const [pacienteId, setPacienteId] = useState(pacienteIdInicial || '')
  const [profissionalId, setProfissionalId] = useState('')
  const [validade, setValidade] = useState('')
  const [desconto, setDesconto] = useState(0)
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([
    { servicoId: '', quantidade: 1, valorUnitario: 0 },
  ])

  // Calcular valores
  const valorTotal = useMemo(() => {
    return itens.reduce((total, item) => {
      return total + item.quantidade * item.valorUnitario
    }, 0)
  }, [itens])

  const valorFinal = useMemo(() => {
    return Math.max(0, valorTotal - desconto)
  }, [valorTotal, desconto])

  const handleAddItem = () => {
    setItens([...itens, { servicoId: '', quantidade: 1, valorUnitario: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof ItemForm, value: string | number) => {
    const newItens = [...itens]
    if (field === 'servicoId') {
      newItens[index].servicoId = value as string
      // Preencher valor unitário automaticamente
      const servico = services.find((s) => s.id === value)
      if (servico) {
        newItens[index].valorUnitario = servico.defaultPrice || 0
      }
    } else if (field === 'quantidade') {
      newItens[index].quantidade = Number(value) || 1
    } else if (field === 'valorUnitario') {
      newItens[index].valorUnitario = Number(value) || 0
    }
    setItens(newItens)
  }

  const handleSubmit = async () => {
    if (!pacienteId || !profissionalId || itens.some((i) => !i.servicoId)) {
      return
    }

    const data: Omit<CreateOrcamentoInput, 'clinica_id'> = {
      paciente_id: pacienteId,
      profissional_id: profissionalId,
      valor_total: valorTotal,
      validade: validade || undefined,
      desconto: desconto || 0,
      observacoes: observacoes || undefined,
      itens: itens.map((item) => ({
        servico_id: item.servicoId,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        valor_total: item.quantidade * item.valorUnitario,
      })),
    }

    const result = await createOrcamento(data)
    if (result) {
      handleClose()
    }
  }

  const handleClose = () => {
    setPacienteId(pacienteIdInicial || '')
    setProfissionalId('')
    setValidade('')
    setDesconto(0)
    setObservacoes('')
    setItens([{ servicoId: '', quantidade: 1, valorUnitario: 0 }])
    onClose()
  }

  const isValid =
    pacienteId && profissionalId && itens.length > 0 && itens.every((i) => i.servicoId)

  const content = (
    <div className="space-y-6">
      {/* Paciente */}
      <div>
        <Select
          label="Paciente"
          required
          value={pacienteId}
          onChange={(value) => setPacienteId(value)}
          placeholder="Selecione um paciente"
          options={patients.map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>

      {/* Profissional */}
      <div>
        <Select
          label="Profissional"
          required
          value={profissionalId}
          onChange={(value) => setProfissionalId(value)}
          placeholder="Selecione um profissional"
          options={professionals.map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>

      {/* Validade */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Validade</label>
        <Input
          type="date"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Itens do Orçamento */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-foreground">
            Itens do orçamento <span className="text-red-500">*</span>
          </label>
          <Button variant="ghost" size="sm" onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {itens.map((item, index) => (
            <div
              key={index}
              className="p-3 border border-border rounded-xl bg-muted/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Item {index + 1}
                </span>
                {itens.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div>
                <Select
                  label="Serviço"
                  value={item.servicoId}
                  onChange={(value) => handleItemChange(index, 'servicoId', value)}
                  placeholder="Selecione um serviço"
                  options={services.map((s) => ({
                    value: s.id,
                    label: `${s.name} - ${new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(s.defaultPrice || 0)}`,
                  }))}
                  className="[&_label]:text-xs [&_label]:text-muted-foreground [&_label]:font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Quantidade</label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Valor unitário
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.valorUnitario}
                    onChange={(e) => handleItemChange(index, 'valorUnitario', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="text-right text-sm">
                <span className="text-muted-foreground">Subtotal: </span>
                <span className="font-medium text-foreground">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(item.quantidade * item.valorUnitario)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desconto */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Desconto (R$)</label>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={desconto}
          onChange={(e) => setDesconto(Number(e.target.value) || 0)}
        />
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações adicionais sobre o orçamento..."
          className="min-h-[80px]"
        />
      </div>

      {/* Resumo de Valores */}
      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="text-foreground">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(valorTotal)}
          </span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Desconto:</span>
            <span className="text-red-500">
              -{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(desconto)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-primary/10">
          <span className="text-foreground">Total:</span>
          <span className="text-primary">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(valorFinal)}
          </span>
        </div>
      </div>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="flex-1 rounded-full bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Salvando...' : 'Criar orçamento'}
        </Button>
        <Button variant="outline" onClick={handleClose} className="flex-1 rounded-full">
          Cancelar
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <AppDrawer open={isOpen} onOpenChange={(open) => !open && handleClose()} title="Novo orçamento">
        {content}
      </AppDrawer>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo orçamento" size="lg">
      {content}
    </Modal>
  )
}
