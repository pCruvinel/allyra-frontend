import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Ban, Clock3, UserSearch, UserX } from 'lucide-react'
import { StatCard } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api.service'
import { toast } from 'sonner'
import type { PatientEngagementSummary } from '@/types/clinical-intelligence'

const engagementReasonLabels: Record<'no_show' | 'inactive', string> = {
  no_show: 'Risco por faltas',
  inactive: 'Inatividade',
}

export function EngajamentoPage() {
  const navigate = useNavigate()
  const { currentClinica } = useAuth()
  const [engagementLoading, setEngagementLoading] = useState(false)
  const [engagementMetrics, setEngagementMetrics] = useState({
    noShows90d: 0,
    cancellations90d: 0,
    inactivePatients: 0,
    flaggedPatients: 0,
  })
  const [flaggedPatients, setFlaggedPatients] = useState<PatientEngagementSummary[]>([])

  const loadEngagement = useCallback(async () => {
    if (!currentClinica?.id) {
      setEngagementMetrics({
        noShows90d: 0,
        cancellations90d: 0,
        inactivePatients: 0,
        flaggedPatients: 0,
      })
      setFlaggedPatients([])
      return
    }

    setEngagementLoading(true)
    try {
      const response = await apiService.getPatientEngagement(currentClinica.id)

      if (response.error) {
        toast.error(response.error)
        return
      }

      setEngagementMetrics(response.data?.metrics ?? {
        noShows90d: 0,
        cancellations90d: 0,
        inactivePatients: 0,
        flaggedPatients: 0,
      })
      setFlaggedPatients(response.data?.patients ?? [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar painel de engajamento'
      toast.error(message)
    } finally {
      setEngagementLoading(false)
    }
  }, [currentClinica?.id])

  useEffect(() => {
    void loadEngagement()
  }, [loadEngagement])

  const handleViewDetails = (patientId: string, patientName: string, cpf: string) => {
    navigate({
      to: '/pacientes/$patientId',
      params: { patientId },
      search: { tab: undefined },
    })
    void patientName
    void cpf
  }

  return (
    <div className="space-y-6 pb-20">
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<UserX className="h-4 w-4" />}
            value={engagementMetrics.noShows90d}
            label="Faltas nos últimos 90 dias"
            isLoading={engagementLoading}
          />
          <StatCard
            icon={<Ban className="h-4 w-4" />}
            value={engagementMetrics.cancellations90d}
            label="Cancelamentos nos últimos 90 dias"
            isLoading={engagementLoading}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            value={engagementMetrics.inactivePatients}
            label="Pacientes inativos"
            subtitle="Sem concluído e sem futuro por 60 dias"
            isLoading={engagementLoading}
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4" />}
            value={engagementMetrics.flaggedPatients}
            label="Pacientes sinalizados"
            subtitle="Evasão ou inatividade"
            isLoading={engagementLoading}
          />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Painel de engajamento</h3>
              <p className="text-sm text-muted-foreground">
                No-show por falta, cancelamento sem penalidade e inatividade a partir de 60 dias.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {flaggedPatients.length} sinalizado{flaggedPatients.length !== 1 ? 's' : ''}
            </div>
          </div>

          {flaggedPatients.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum paciente sinalizado pelos critérios operacionais atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Paciente
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Critério
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      No-show 90d
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Cancelamentos 90d
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Inatividade
                    </th>
                    <th className="py-2 px-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedPatients.map((patient) => (
                    <tr key={patient.patientId} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{patient.patientName}</span>
                          <span className="text-xs text-muted-foreground">
                            {patient.cpf || 'CPF não informado'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm text-foreground">
                        {patient.reasons.map((reason) => engagementReasonLabels[reason]).join(' + ')}
                      </td>
                      <td className="py-2 px-3 text-sm text-foreground">
                        {patient.noShowCount90d} ({Math.round(patient.noShowRate90d)}%)
                      </td>
                      <td className="py-2 px-3 text-sm text-foreground">
                        {patient.cancellationCount90d}
                      </td>
                      <td className="py-2 px-3 text-sm text-foreground">
                        {patient.daysWithoutCompleted != null
                          ? `${patient.daysWithoutCompleted} dias`
                          : 'Sem histórico'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(
                            patient.patientId,
                            patient.patientName,
                            patient.cpf || '',
                          )}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          <UserSearch className="h-3.5 w-3.5" />
                          Abrir ficha
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
