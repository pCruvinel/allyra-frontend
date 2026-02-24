/**
 * PatientSelector - Grid/Lista de pacientes para seleção
 * Padrões UI: cards com borda sutil, hover com sombra, badges de status
 */

import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { ChevronRight } from 'lucide-react'
import type { PatientListItem } from '@/types/patient'

interface PatientSelectorProps {
  patients: PatientListItem[]
  viewMode: 'grid' | 'list'
  onSelectPatient: (patientId: string) => void
}

export function PatientSelector({
  patients,
  viewMode,
  onSelectPatient,
}: PatientSelectorProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map(patient => (
          <button
            key={patient.id}
            onClick={() => onSelectPatient(patient.id)}
            className={cn(
              'group bg-card rounded-xl border border-border/60 p-5 text-left',
              'transition-all duration-200',
              'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
            )}
          >
            {/* Nome e Status */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base truncate group-hover:text-primary transition-colors">
                  {patient.name}
                </h3>
                <div className="mt-2">
                  <StatusBadge status={patient.status} variant="patient" />
                </div>
              </div>
            </div>

            {/* Informações em formato label:valor */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Planos ativos:</span>
                <span className="font-semibold text-primary">
                  {(patient as PatientListItem & { activePlansCount?: number }).activePlansCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Última consulta:</span>
                <span className="font-medium text-foreground">
                  {(patient as PatientListItem & { lastAppointment?: string }).lastAppointment
                    ? new Date((patient as PatientListItem & { lastAppointment?: string }).lastAppointment!).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
            </div>

            {/* Link de ação */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Ver planos
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>
        ))}
      </div>
    )
  }

  // List View - Tabela com estilo moderno
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nome do Paciente
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Planos Ativos
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Última Consulta
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {patients.map(patient => (
            <tr
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className="hover:bg-muted/40 transition-colors cursor-pointer group"
            >
              <td className="px-5 py-4">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {patient.name}
                </span>
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={patient.status} variant="patient" />
              </td>
              <td className="px-5 py-4">
                <span className="font-semibold text-primary">
                  {(patient as PatientListItem & { activePlansCount?: number }).activePlansCount || 0}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-foreground">
                  {(patient as PatientListItem & { lastAppointment?: string }).lastAppointment
                    ? new Date((patient as PatientListItem & { lastAppointment?: string }).lastAppointment!).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Ver planos
                  <ChevronRight size={14} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
