import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePatients } from '@/hooks/usePatients'
import type { PatientFull } from '@/types/patient'
import type { UpdatePatientInput } from '@/services/patients.service'
import { DadosPessoaisTab } from './DadosPessoaisTab'
import { ContatosTab } from './ContatosTab'
import { EnderecoTab } from './EnderecoTab'
import { AtendimentoTab } from './AtendimentoTab'
import { DadosAdministrativosTab } from './DadosAdministrativosTab'
import { PrivacidadeTab } from './PrivacidadeTab'

interface DadosPacienteSectionProps {
  patient: PatientFull
  onRefresh?: () => void
}

export function DadosPacienteSection({ patient, onRefresh }: DadosPacienteSectionProps) {
  const [activeTab, setActiveTab] = useState('dados-pessoais')
  const { updatePatient, isLoading } = usePatients({ autoFetch: false })

  const handleUpdatePatient = async (data: UpdatePatientInput) => {
    const result = await updatePatient(patient.personal.id, data)
    // Refresh dos dados após salvar
    if (result && onRefresh) {
      onRefresh()
    }
    return result
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start border-b border-border bg-transparent px-4 md:px-6 gap-0 overflow-x-auto">
        <TabsTrigger
          value="dados-pessoais"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Dados pessoais
        </TabsTrigger>
        <TabsTrigger
          value="contatos"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Contatos
        </TabsTrigger>
        <TabsTrigger
          value="endereco"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Endereço
        </TabsTrigger>
        <TabsTrigger
          value="atendimento"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Atendimento
        </TabsTrigger>
        <TabsTrigger
          value="dados-administrativos"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Dados administrativos
        </TabsTrigger>
        <TabsTrigger
          value="privacidade"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Privacidade e consentimento
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dados-pessoais" className="p-4 md:p-6">
        <DadosPessoaisTab data={patient.personal} onSave={handleUpdatePatient} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="contatos" className="p-4 md:p-6">
        <ContatosTab data={patient.contact} onSave={handleUpdatePatient} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="endereco" className="p-4 md:p-6">
        <EnderecoTab data={patient.address} onSave={handleUpdatePatient} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="atendimento" className="p-4 md:p-6">
        <AtendimentoTab data={patient.insurance} />
      </TabsContent>

      <TabsContent value="dados-administrativos" className="p-4 md:p-6">
        <DadosAdministrativosTab documents={patient.documents} patientId={patient.personal.id} />
      </TabsContent>

      <TabsContent value="privacidade" className="p-4 md:p-6">
        <PrivacidadeTab consent={patient.consent} patientId={patient.personal.id} />
      </TabsContent>
    </Tabs>
  )
}
