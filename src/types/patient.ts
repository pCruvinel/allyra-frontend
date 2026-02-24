// Tipos expandidos para Detalhes do Paciente

// Gênero do paciente
export type PatientGender = 'M' | 'F' | 'Outro'

// Estado civil
export type MaritalStatus = 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo' | 'União Estável' | 'Não informado'

// Dados pessoais expandidos
export interface PatientPersonalData {
  id: string
  name: string
  cpf: string
  birthDate: string
  gender: PatientGender
  maritalStatus: MaritalStatus
  avatar?: string
}

// Responsável (familiar ou financeiro)
export interface PatientResponsible {
  cpf: string
  name: string
  relationship: string
}

// Contatos do paciente
export interface PatientContact {
  email: string
  phone: string
  familyResponsible?: PatientResponsible
  financialResponsible?: PatientResponsible
}

// Endereço do paciente
export interface PatientAddress {
  zipCode: string
  city: string
  state: string
  street: string
  number: string
  neighborhood: string
  complement?: string
}

// Informações de sessão
export interface SessionInfo {
  date: string
  time: string
}

// Dados de atendimento/convênio
export interface PatientInsurance {
  insuranceName: string
  cardNumber: string
  validUntil: string
  sessionsCompleted: number
  firstSession?: SessionInfo
  nextSession?: SessionInfo
}

// Documento anexado
export interface PatientDocument {
  id: string
  name: string
  code: string
  uploadedAt: string
  url: string
}

// Consentimentos do paciente
export interface PatientConsent {
  termsOfUse: boolean
  termsOfUseDoc?: PatientDocument
  privacyPolicy: boolean
  privacyPolicyDoc?: PatientDocument
  contract: boolean
  contractDoc?: PatientDocument
}

// Status do paciente (re-exportado para conveniência)
export type PatientStatus = 'active' | 'inactive' | 'blocked'

// Dados médicos do paciente (import type para evitar dependência circular)
import type { PatientMedicalData } from './medical-record'
export type { PatientMedicalData }

// Paciente completo com todos os dados
export interface PatientFull {
  personal: PatientPersonalData
  contact: PatientContact
  address: PatientAddress
  insurance: PatientInsurance
  documents: PatientDocument[]
  consent: PatientConsent
  status: PatientStatus
  medical?: PatientMedicalData
}

// Tipo para listagem básica (compatível com o existente)
export interface PatientListItem {
  id: string
  name: string
  email: string
  cpf: string
  insurance: string
  insuranceId?: string  // UUID do convênio para auto-fill no modal
  status: PatientStatus
  phone?: string
  birthDate?: string
}
