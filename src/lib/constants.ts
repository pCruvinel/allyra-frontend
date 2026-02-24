// Design Tokens - Cores do sistema
// NOTA: Usar classes Tailwind (bg-primary, text-primary) em vez de valores hex
// A cor primária é definida em src/index.css via --primary (HSL)
export const colors = {
  // Primary (roxo) - Para referência, usar classes Tailwind
  primary: {
    DEFAULT: '#a78bfa',       // hsl(263 70% 76%) - bg-primary
    foreground: '#FCFCFD',    // text-primary-foreground
  },
  // Background
  background: {
    DEFAULT: '#EEEEEE',
    card: '#FCFCFD',
    surface: '#FFFFFF',
    muted: '#F9FAFB',
  },
  // Text
  text: {
    primary: '#0C111D',
    secondary: '#344054',
    muted: '#667085',
    dark: '#1C1C1C',
    light: '#131416',
  },
  // Border
  border: {
    DEFAULT: '#D0D5DD',
    light: '#E8E8EF',
    input: '#D2D2DC',
    muted: '#E9E9E9',
  },
  // Status
  status: {
    success: '#B3FF7B',
    successText: '#3B3B3B',
  },
  // Input
  input: {
    placeholder: '#9D9AAD',
    icon: '#888599',
  },
} as const

// Tipografia
export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, Roboto, Helvetica, sans-serif',
    display: "'Inter Tight', Inter, sans-serif",
  },
} as const

// ============================================
// OPÇÕES COMPARTILHADAS PARA FORMULÁRIOS
// ============================================

export type SelectOption = {
  value: string
  label: string
}

// Convênios/Seguros
export const INSURANCE_OPTIONS: SelectOption[] = [
  { value: 'particular', label: 'Particular' },
  { value: 'unimed', label: 'Unimed' },
  { value: 'bradesco', label: 'Bradesco Saúde' },
  { value: 'sulamerica', label: 'SulAmérica' },
  { value: 'amil', label: 'Amil' },
  { value: 'hapvida', label: 'Hapvida' },
  { value: 'notredame', label: 'NotreDame Intermédica' },
]

// Formas de Pagamento
export const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit', label: 'Cartão de Crédito' },
  { value: 'debit', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'transfer', label: 'Transferência Bancária' },
]

// Parcelas
export const INSTALLMENT_OPTIONS: SelectOption[] = [
  { value: '1', label: '1x (à vista)' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
  { value: '4', label: '4x' },
  { value: '5', label: '5x' },
  { value: '6', label: '6x' },
  { value: '10', label: '10x' },
  { value: '12', label: '12x' },
]

// Estados brasileiros
export const BRAZILIAN_STATES: SelectOption[] = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

// Níveis de permissão
export const PERMISSION_LEVELS: SelectOption[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'operator', label: 'Operador' },
  { value: 'viewer', label: 'Visualizador' },
]

// Hierarquia de permissões (maior número = mais poder)
export const PERMISSION_HIERARCHY: Record<string, number> = {
  admin: 4,
  manager: 3,
  operator: 2,
  viewer: 1,
}

// Mapeamento de perfis do sistema para níveis de permissão
export const PERFIL_TO_PERMISSION: Record<string, string> = {
  admin_master: 'admin',
  administrador_total: 'admin',
  socio_profissional: 'manager',
  profissional: 'operator',
  secretaria: 'operator',
  administrativo: 'operator',
  financeiro: 'operator',
  faturamento: 'operator',
}

/**
 * Retorna os níveis de permissão que o usuário pode atribuir
 * Regra: usuário não pode dar permissão maior que a sua
 * - admin_master: pode criar qualquer perfil
 * - administrador_total: pode criar todos EXCETO admin (que seria admin_master)
 */
export function getAvailablePermissionsFor(
  userPerfil: string,
  isAdminMaster: boolean = false
): SelectOption[] {
  // admin_master pode criar qualquer perfil
  if (isAdminMaster || userPerfil === 'admin_master') {
    return PERMISSION_LEVELS
  }

  // administrador_total pode criar todos EXCETO Administrador
  if (userPerfil === 'administrador_total') {
    return PERMISSION_LEVELS.filter((p) => p.value !== 'admin')
  }

  // Outros perfis não podem criar usuários (não devem ter acesso a esta tela)
  // Mas por segurança, retorna apenas viewer
  const userPermission = PERFIL_TO_PERMISSION[userPerfil] || 'viewer'
  const userLevel = PERMISSION_HIERARCHY[userPermission] || 1

  return PERMISSION_LEVELS.filter(
    (option) => PERMISSION_HIERARCHY[option.value] <= userLevel
  )
}

// Estilos de Status (classes Tailwind)
export const STATUS_STYLES = {
  // Status gerais
  active: 'bg-primary text-white',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  blocked: 'bg-red-100 text-red-700',

  // Status financeiros
  paid: 'bg-primary text-white',
  overdue: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',

  // Status de fatura
  emitida: 'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-700',
} as const

export type StatusType = keyof typeof STATUS_STYLES
