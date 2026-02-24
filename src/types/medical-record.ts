// Tipos para Prontuário Médico

// Status de etapa de evolução
export type EvolutionStageStatus = 'Concluído' | 'Pendente'

// Status de tratamento
export type TreatmentStatus = 'Finalizada' | 'Em andamento' | 'Cancelada'

// Assinatura digital do profissional
export interface DigitalSignature {
  name: string
  crm: string
  signedAt?: string
}

// Prontuário médico
export interface MedicalRecord {
  id: string
  patientId: string
  diagnosis: string
  date: string
  time: string
  complaint: string // Queixa principal
  diseaseHistory: string // História da doença atual
  prescription: string // Prescrição médica
  privateNotes?: string // Observações privadas
  signedBy: DigitalSignature
  createdAt: string
  updatedAt?: string
}

// Etapa de evolução clínica
export interface EvolutionStage {
  id: string
  description: string
  date: string
  time: string
  status: EvolutionStageStatus
}

// Evolução clínica
export interface ClinicalEvolution {
  id: string
  patientId: string
  title: string
  stages: EvolutionStage[]
  createdAt: string
  updatedAt?: string
}

// Histórico de atendimento/tratamento
export interface TreatmentHistory {
  id: string
  patientId: string
  treatment: string
  complaint: string
  diagnosis: string
  date: string
  status: TreatmentStatus
}

// Anamnese
export interface Anamnesis {
  id: string
  patientId: string
  hasHereditaryDisease: boolean
  hereditaryDiseaseDetails?: string
  usesMedication: boolean
  medicationDetails?: string
  allergies?: string
  surgeries?: string
  familyHistory?: string
  createdAt: string
  updatedAt?: string
}

// Anexo de prontuário
export interface MedicalAttachment {
  id: string
  patientId: string
  name: string
  code: string
  uploadedAt: string
  url: string
  type: 'exame' | 'receita' | 'laudo' | 'outros'
}

// Dados completos do prontuário do paciente
export interface PatientMedicalData {
  records: MedicalRecord[]
  evolutions: ClinicalEvolution[]
  treatmentHistory: TreatmentHistory[]
  anamnesis?: Anamnesis
  attachments: MedicalAttachment[]
}
