/**
 * Página de Detalhes do Orçamento
 * Exibe informações completas do orçamento e permite ações
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  CheckCircle,
  Calendar,
  Trash2,
  FileText,
  User,
  Stethoscope,
  Clock,
  Percent,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FloatingButton } from '@/components/ui'
import { ChatPanel } from '@/components/chat'
import { useOrcamentos } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { orcamentoService } from '@/services/orcamento.service'
import type { Orcamento } from '@/types/orcamento'
import { statusLabels, statusStyles } from '@/types/orcamento'
import { cn } from '@/lib/utils'

export function OrcamentoDetalhePage() {
  const navigate = useNavigate()
  const { orcamentoId } = useParams({ from: '/orcamentos/$orcamentoId' })
  const { currentClinica } = useAuth()
  const { aprovarOrcamento, deleteOrcamento, isLoading } = useOrcamentos()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrcamento() {
      if (!orcamentoId || !currentClinica?.id) return
      setLoading(true)
      const result = await orcamentoService.getById(orcamentoId, currentClinica.id)
      if (result.data) {
        setOrcamento(result.data)
      }
      setLoading(false)
    }
    fetchOrcamento()
  }, [orcamentoId, currentClinica?.id])

  const handleGoBack = () => {
    navigate({ to: '/orcamentos' })
  }

  const handleAprovar = async () => {
    if (!orcamento) return
    const result = await aprovarOrcamento(orcamento.id)
    if (result) {
      setOrcamento({ ...orcamento, status: 'aprovado' })
    }
  }

  const handleConverterAgendamento = () => {
    if (!orcamento) return
    navigate({ to: '/agenda', search: { orcamentoId: orcamento.id } })
  }

  const handleExcluir = async () => {
    if (!orcamento) return
    if (window.confirm(`Deseja realmente excluir o orçamento ${orcamento.numero}?`)) {
      const result = await deleteOrcamento(orcamento.id)
      if (result) {
        navigate({ to: '/orcamentos' })
      }
    }
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Orçamento não encontrado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          O orçamento solicitado não existe ou foi removido.
        </p>
        <Button onClick={handleGoBack} variant="outline" className="rounded-full">
          Voltar para orçamentos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Card Principal */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {/* Header do Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{orcamento.numero}</h2>
              <p className="text-sm text-muted-foreground">
                Criado em {new Date(orcamento.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium self-start',
                statusStyles[orcamento.status]
              )}
            >
              {statusLabels[orcamento.status]}
            </span>
          </div>

          {/* Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Paciente */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-medium text-foreground">{orcamento.pacienteNome}</p>
              </div>
            </div>

            {/* Profissional */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profissional</p>
                <p className="font-medium text-foreground">{orcamento.profissionalNome}</p>
              </div>
            </div>

            {/* Validade */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validade</p>
                <p className="font-medium text-foreground">
                  {orcamento.validade
                    ? new Date(orcamento.validade).toLocaleDateString('pt-BR')
                    : 'Sem validade'}
                </p>
              </div>
            </div>

            {/* Desconto */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desconto</p>
                <p className="font-medium text-foreground">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(orcamento.desconto)}
                </p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {orcamento.observacoes && (
            <div className="p-4 bg-muted/30 rounded-xl mb-6">
              <p className="text-sm text-muted-foreground mb-1">Observações</p>
              <p className="text-foreground">{orcamento.observacoes}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-3">
            {orcamento.status === 'pendente' && (
              <Button
                onClick={handleAprovar}
                disabled={isLoading}
                className="rounded-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar orçamento
              </Button>
            )}
            {orcamento.status === 'aprovado' && (
              <Button
                onClick={handleConverterAgendamento}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Converter em agendamento
              </Button>
            )}
            {orcamento.status !== 'convertido' && (
              <Button
                onClick={handleExcluir}
                disabled={isLoading}
                variant="outline"
                className="rounded-full text-red-500 border-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>

        {/* Itens do Orçamento */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Itens do orçamento</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Serviço
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                    Qtd
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Valor Unit.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orcamento.itens.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.servicoNome}</p>
                      {item.descricao && (
                        <p className="text-xs text-muted-foreground">{item.descricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground">{item.quantidade}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.valorUnitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.valorTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(orcamento.valorTotal)}
              </span>
            </div>
            {orcamento.desconto > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-red-500">
                  -{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(orcamento.desconto)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(orcamento.valorFinal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}

export default OrcamentoDetalhePage
