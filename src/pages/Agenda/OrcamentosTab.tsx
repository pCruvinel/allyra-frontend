/**
 * Tab de Orçamentos na Agenda
 * Lista orçamentos aprovados prontos para converter em agendamento
 */

import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye, Calendar, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleDropdownMenu } from '@/components/ui/dropdown-menu'
import { useOrcamentos } from '@/hooks'
import { statusLabels, statusStyles } from '@/types/orcamento'
import { cn } from '@/lib/utils'

interface OrcamentosTabProps {
  onConverterAgendamento: (orcamentoId: string, pacienteId: string, profissionalId: string) => void
}

export function OrcamentosTab({ onConverterAgendamento }: OrcamentosTabProps) {
  const navigate = useNavigate()
  const { orcamentos, isLoading, summary } = useOrcamentos()

  // Filtrar apenas orçamentos pendentes e aprovados (podem ser convertidos)
  const orcamentosConvertíveis = useMemo(() => {
    return orcamentos.filter((o) => o.status === 'pendente' || o.status === 'aprovado')
  }, [orcamentos])

  const handleVerDetalhes = (id: string) => {
    navigate({ to: '/orcamentos/$orcamentoId', params: { orcamentoId: id } })
  }

  const handleConverterAgendamento = (orc: typeof orcamentos[0]) => {
    onConverterAgendamento(orc.id, orc.pacienteId, orc.profissionalId)
  }

  const handleVerTodos = () => {
    navigate({ to: '/orcamentos' })
  }

  const getRowActions = (orc: typeof orcamentos[0]) => {
    const actions = [
      {
        icon: <Eye className="w-4 h-4" />,
        label: 'Ver detalhes',
        onClick: () => handleVerDetalhes(orc.id),
      },
    ]

    if (orc.status === 'aprovado') {
      actions.push({
        icon: <Calendar className="w-4 h-4" />,
        label: 'Converter em agendamento',
        onClick: () => handleConverterAgendamento(orc),
      })
    }

    return actions
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{summary.total}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.pendentes}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Aprovados</p>
          <p className="text-2xl font-bold text-green-600">{summary.aprovados}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Convertidos</p>
          <p className="text-2xl font-bold text-primary">{summary.convertidos}</p>
        </div>
      </div>

      {/* Tabela de orçamentos convertíveis */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Orçamentos para agendar</h3>
            <p className="text-sm text-muted-foreground">
              Orçamentos pendentes e aprovados prontos para converter em agendamento
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleVerTodos} className="rounded-full">
            Ver todos
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {orcamentosConvertíveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h4 className="text-base font-medium text-foreground mb-1">
              Nenhum orçamento disponível
            </h4>
            <p className="text-sm text-muted-foreground">
              Não há orçamentos pendentes ou aprovados para converter em agendamento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Profissional
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orcamentosConvertíveis.slice(0, 10).map((orc) => (
                  <tr key={orc.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{orc.numero}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{orc.pacienteNome}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{orc.profissionalNome}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(orc.valorFinal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusStyles[orc.status]
                        )}
                      >
                        {statusLabels[orc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <SimpleDropdownMenu items={getRowActions(orc)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
