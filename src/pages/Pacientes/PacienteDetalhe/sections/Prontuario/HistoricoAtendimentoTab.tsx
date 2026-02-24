import { useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { usePaginationConfig } from '@/hooks'
import { cn } from '@/lib/utils'
import type { TreatmentHistory, TreatmentStatus } from '@/types/medical-record'

interface HistoricoAtendimentoTabProps {
  history: TreatmentHistory[]
}

const statusStyles: Record<TreatmentStatus, string> = {
  'Finalizada': 'bg-primary text-white',
  'Em andamento': 'bg-yellow-500 text-white',
  'Cancelada': 'bg-red-500 text-white',
}

export function HistoricoAtendimentoTab({ history }: HistoricoAtendimentoTabProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Buscar configuração de paginação do banco
  const { itemsPerPage } = usePaginationConfig()

  const totalPages = Math.ceil(history.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHistory = history.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-lg font-semibold text-foreground">Histórico de atendimento</h3>

      {/* Tabela */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tratamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Queixa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Diagnóstico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedHistory.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-1 h-8 bg-primary rounded-full mr-3" />
                    <span className="text-sm text-foreground">{item.treatment}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {item.complaint}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {item.diagnosis}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {item.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      statusStyles[item.status]
                    )}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {history.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum histórico de atendimento registrado
        </div>
      )}

      {/* Paginação */}
      {history.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={history.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
