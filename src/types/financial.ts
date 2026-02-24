// Status de pagamento
export type PaymentStatus = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado'
export type RepasseStatus = 'Total' | 'Parcial' | 'Pendente'
export type CobrancaStatus = 'Pendente' | 'Pago' | 'Cancelado'

// Conta a Receber (Fatura)
export interface Invoice {
  id: string
  unit: string
  invoiceNumber: string
  titleNumber: string
  patientId: string
  patientName: string
  insurance: string
  service: string
  dueDate: string
  value: number
  status: PaymentStatus
}

// Cobrança
export interface Billing {
  id: string
  patientId: string
  patientName: string
  totalValue: number
  installmentValue: number
  installments: number
  dueDate: string
  status: CobrancaStatus
}

// Repasse
export interface Transfer {
  id: string
  unit: string
  transferCode: string
  issueDate: string
  paymentDate: string
  quantity: number
  value: number
  status: RepasseStatus
}

// Detalhe do Repasse
export interface TransferDetail {
  id: string
  transferId: string
  professionalId: string
  professionalName: string
  value: number
  status: RepasseStatus
}

// Item do Repasse (atendimento)
export interface TransferItem {
  id: string
  transferDetailId: string
  attendanceDate: string
  invoiceNumber: string
  patientName: string
  service: string
  transferValue: number
  rule: string
}

// Nota Fiscal
export interface NFEmitida {
  id: string
  unit: string
  nfNumber: string
  issueDate: string
  patientName: string
  service: string
  value: number
  status: 'Emitida' | 'Cancelada'
}

// Resumo Financeiro
export interface FinancialSummary {
  totalValue: number
  received: number
  toReceive: number
}

// Dados do gráfico de fluxo de caixa
export interface CashFlowData {
  month: string
  value: number
}

// Estatísticas de Cobrança
export interface BillingStats {
  activeCount: number
  pendingCount: number
  todayTotal: number
  total: number
}
