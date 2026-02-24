import { useState } from 'react'
import { useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { Users, ClipboardList, Calendar, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePatientDetails } from '@/hooks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { DadosPacienteSection } from './sections/DadosPaciente'
import { ProntuarioSection } from './sections/Prontuario'
import { AgendamentosSection } from './sections/Agendamentos'

type Section = 'dados' | 'prontuario' | 'agendamentos'

const sections = [
  { id: 'dados' as const, label: 'Dados do paciente', icon: Users },
  { id: 'prontuario' as const, label: 'Prontuário', icon: ClipboardList },
  { id: 'agendamentos' as const, label: 'Agendamentos', icon: Calendar },
]

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Bloqueado',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function PacienteDetalhePage() {
  const { patientId } = useParams({ strict: false })
  const search = useSearch({ strict: false }) as { tab?: string }
  const navigate = useNavigate()
  const initialTab = (['dados', 'prontuario', 'agendamentos'] as Section[]).includes(search.tab as Section)
    ? (search.tab as Section)
    : 'dados'
  const [activeSection, setActiveSection] = useState<Section>(initialTab)

  // Usar o hook de detalhes do paciente
  const { patient, isLoading, error, refresh } = usePatientDetails(patientId)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    const isPermissionError = error.includes('permissão') || error.includes('outra clínica')

    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        {isPermissionError ? (
          <>
            <ShieldAlert className="w-12 h-12 text-amber-500" />
            <p className="text-amber-600 font-medium text-center max-w-md">{error}</p>
            <button
              onClick={() => navigate({ to: '/pacientes' })}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para lista de pacientes
            </button>
          </>
        ) : (
          <>
            <p className="text-red-500">{error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>
    )
  }

  // Not found state
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Paciente não encontrado</p>
        <button
          onClick={() => navigate({ to: '/pacientes' })}
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista de pacientes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo do paciente */}
      <div className="bg-card rounded-2xl shadow-soft border border-border/40 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="w-14 h-14 md:w-16 md:h-16">
            <AvatarImage src={patient.personal.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg md:text-xl">
              {getInitials(patient.personal.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-foreground truncate">
              {patient.personal.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              CPF: {patient.personal.cpf}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {patient.insurance.insuranceName}
            </Badge>
            <Badge
              variant={patient.status === 'active' ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                patient.status === 'active' && 'bg-green-100 text-green-700 hover:bg-green-100',
                patient.status === 'blocked' && 'bg-red-100 text-red-700 hover:bg-red-100'
              )}
            >
              {statusLabels[patient.status] || patient.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navegação de seções */}
      <div className="flex items-center justify-end gap-1.5 overflow-x-auto">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap',
                isActive
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo da seção ativa */}
      <div className="bg-card rounded-2xl shadow-soft border border-border/40 overflow-hidden">
        {activeSection === 'dados' && (
          <DadosPacienteSection patient={patient} onRefresh={refresh} />
        )}
        {activeSection === 'prontuario' && (
          patient.medical ? (
            <ProntuarioSection medicalData={patient.medical} patientId={patient.personal.id} />
          ) : (
            <div className="p-6">
              <EmptyState
                icon={ClipboardList}
                title="Prontuário não iniciado"
                description="Este paciente ainda não possui prontuário. O acompanhamento clínico será disponibilizado em breve."
              />
            </div>
          )
        )}
        {activeSection === 'agendamentos' && (
          <AgendamentosSection patientId={patient.personal.id} />
        )}
      </div>
    </div>
  )
}
