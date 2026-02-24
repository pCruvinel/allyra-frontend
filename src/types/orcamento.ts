// Tipos para Orçamentos

export type OrcamentoStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'expirado' | 'convertido'

export interface OrcamentoItem {
  id: string
  servicoId: string
  servicoNome: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  descricao?: string
}

export interface Orcamento {
  id: string
  clinicaId: string
  pacienteId: string
  pacienteNome: string
  profissionalId: string
  profissionalNome: string
  numero: string
  status: OrcamentoStatus
  valorTotal: number
  desconto: number
  valorFinal: number
  validade?: string
  observacoes?: string
  itens: OrcamentoItem[]
  createdAt: string
  updatedAt?: string
}

export interface CreateOrcamentoInput {
  clinica_id: string
  paciente_id: string
  profissional_id: string
  valor_total: number
  desconto?: number
  validade?: string
  observacoes?: string
  itens: {
    servico_id: string
    quantidade: number
    valor_unitario: number
    valor_total: number
    descricao?: string
  }[]
}

export interface UpdateOrcamentoInput {
  valor_total?: number
  desconto?: number
  validade?: string
  observacoes?: string
  status?: OrcamentoStatus
}

export interface ConverterAgendamentoInput {
  clinica_id: string
  data_agendamento: string
  hora_inicio: string
  sala_id?: string
}

// Status labels para exibição
export const statusLabels: Record<OrcamentoStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  expirado: 'Expirado',
  convertido: 'Convertido',
}

// Status styles para exibição
export const statusStyles: Record<OrcamentoStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  aprovado: 'bg-primary text-white',
  rejeitado: 'bg-red-100 text-red-700',
  expirado: 'bg-muted text-muted-foreground',
  convertido: 'bg-blue-100 text-blue-700',
}
