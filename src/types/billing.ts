// Status do Pré-faturamento
export type PreFaturamentoStatus = 'Aberto' | 'Faturado' | 'Cancelado'

// Status da Fatura Emitida
export type FaturaEmitidaStatus = 'Emitida' | 'Paga' | 'Cancelada' | 'Pendente'

// Pré-faturamento
export interface PreFaturamento {
  id: string
  patientId: string
  patientName: string
  unit: string
  insurance: string
  professionalId: string
  professionalName: string
  service: string
  date: string
  value: number
  isOpen: boolean // ATD. ABERTO
  status: PreFaturamentoStatus
}

// Fatura Emitida
export interface FaturaEmitida {
  id: string
  unit: string
  title: string
  invoiceNumber: string
  patientId: string
  patientName: string
  insurance: string
  responsible?: string
  value: number
  issueDate: string
  status: FaturaEmitidaStatus
}

// Formulário de alteração do pré-faturamento
export interface AlterarPreFaturamentoForm {
  patientName: string // readonly
  value: number
  procedure: string
  transferRule: string
  insurance: string
}

// Estatísticas de Faturamento
export interface BillingStats {
  preFaturamentoCount: number
  faturasEmitidasCount: number
  totalValue: number
  pendingValue: number
}
