import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { PatientMedicalData } from '@/types/medical-record'
import { ProntuarioAtualTab } from './ProntuarioAtualTab'
import { EvolucaoTab } from './EvolucaoTab'
import { HistoricoAtendimentoTab } from './HistoricoAtendimentoTab'
import { AnamneseTab } from './AnamneseTab'
import { AnexosTab } from './AnexosTab'

interface ProntuarioSectionProps {
  medicalData: PatientMedicalData
  patientId: string
}

export function ProntuarioSection({ medicalData, patientId }: ProntuarioSectionProps) {
  const [activeTab, setActiveTab] = useState('prontuario-atual')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start border-b border-border bg-transparent px-4 md:px-6 gap-0 overflow-x-auto">
        <TabsTrigger
          value="prontuario-atual"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Prontuário atual
        </TabsTrigger>
        <TabsTrigger
          value="evolucao"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Evolução
        </TabsTrigger>
        <TabsTrigger
          value="historico"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Histórico de atendimento
        </TabsTrigger>
        <TabsTrigger
          value="anamnese"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Anamnese
        </TabsTrigger>
        <TabsTrigger
          value="anexos"
          className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 md:px-4 py-3 whitespace-nowrap text-sm"
        >
          Anexos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prontuario-atual" className="p-4 md:p-6">
        <ProntuarioAtualTab records={medicalData.records} patientId={patientId} />
      </TabsContent>

      <TabsContent value="evolucao" className="p-4 md:p-6">
        <EvolucaoTab evolutions={medicalData.evolutions} patientId={patientId} />
      </TabsContent>

      <TabsContent value="historico" className="p-4 md:p-6">
        <HistoricoAtendimentoTab history={medicalData.treatmentHistory} />
      </TabsContent>

      <TabsContent value="anamnese" className="p-4 md:p-6">
        <AnamneseTab anamnesis={medicalData.anamnesis} patientId={patientId} />
      </TabsContent>

      <TabsContent value="anexos" className="p-4 md:p-6">
        <AnexosTab
          attachments={medicalData.attachments}
          records={medicalData.records}
          patientId={patientId}
        />
      </TabsContent>
    </Tabs>
  )
}
