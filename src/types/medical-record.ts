export type EvolutionStageStatus = 'Concluido' | 'Pendente' | 'Concluído'

export type TreatmentStatus = 'Finalizada' | 'Em andamento' | 'Cancelada'

export type MedicalAttachmentType = 'exame' | 'receita' | 'laudo' | 'imagem' | 'outros'

export interface DigitalSignature {
  name: string
  crm?: string
  signedAt?: string | null
}

export interface MedicalRecordErrata {
  id: string
  text: string
  createdAt: string
  createdById?: string | null
}

export interface MedicalRecord {
  id: string
  patientId: string
  appointmentId?: string | null
  diagnosis: string
  date: string
  time: string
  complaint: string
  diseaseHistory?: string | null
  prescription?: string | null
  privateNotes?: string | null
  isSigned: boolean
  signedAt?: string | null
  signedBy?: DigitalSignature | null
  erratas?: MedicalRecordErrata[]
  createdAt: string
  updatedAt?: string
}

export interface EvolutionStage {
  id: string
  description: string
  date: string
  time: string
  status: EvolutionStageStatus
}

export interface ClinicalEvolution {
  id: string
  patientId: string
  title: string
  stages: EvolutionStage[]
  createdAt: string
  updatedAt?: string
}

export interface TreatmentHistory {
  id: string
  patientId: string
  treatment: string
  complaint?: string | null
  diagnosis?: string | null
  date: string
  status: TreatmentStatus
}

export interface Anamnesis {
  id: string
  patientId: string
  hasHereditaryDisease: boolean
  hereditaryDiseaseDetails?: string | null
  usesMedication: boolean
  medicationDetails?: string | null
  allergies?: string | null
  surgeries?: string | null
  familyHistory?: string | null
  createdAt: string
  updatedAt?: string
}

export interface MedicalAttachment {
  id: string
  patientId: string
  prontuarioId?: string | null
  name: string
  code?: string | null
  uploadedAt: string
  url: string
  type: MedicalAttachmentType
}

export interface PatientMedicalData {
  records: MedicalRecord[]
  evolutions: ClinicalEvolution[]
  treatmentHistory: TreatmentHistory[]
  anamnesis: Anamnesis | null
  attachments: MedicalAttachment[]
}
