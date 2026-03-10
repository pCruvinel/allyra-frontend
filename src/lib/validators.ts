/**
 * Funções puras de validação para documentos brasileiros.
 * Todas as funções recebem o valor LIMPO (apenas dígitos).
 */

// =====================================================
// CPF
// =====================================================

/**
 * Valida CPF com algoritmo de dígito verificador.
 * Aceita entrada com ou sem pontuação.
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return false

  // Rejeita sequências de dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cleaned)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i)
  }
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cleaned[9])) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i)
  }
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cleaned[10])) return false

  return true
}

// =====================================================
// CNPJ
// =====================================================

/**
 * Valida CNPJ com algoritmo de dígito verificador.
 * Aceita entrada com ou sem pontuação.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return false

  // Rejeita sequências de dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false

  // Pesos para cálculo do primeiro e segundo dígito
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  // Primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i]
  }
  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder
  if (firstDigit !== parseInt(cleaned[12])) return false

  // Segundo dígito verificador
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i]
  }
  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder
  if (secondDigit !== parseInt(cleaned[13])) return false

  return true
}

// =====================================================
// CEP
// =====================================================

/**
 * Valida se o CEP tem 8 dígitos.
 */
export function isValidCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '')
  return cleaned.length === 8
}

// =====================================================
// FORMAT HELPERS (para exibição — usados nos masked inputs)
// =====================================================

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11)

  if (numbers.length === 0) return ''
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 14)

  if (numbers.length === 0) return ''
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`
}

/**
 * Formata CEP: 00000-000
 */
export function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 8)

  if (numbers.length === 0) return ''
  if (numbers.length <= 5) return numbers
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
}

/**
 * Formata valor monetário: R$ 1.234,56
 * Recebe centavos como inteiro ou valor decimal como string.
 */
export function formatCurrency(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')

  if (numbers.length === 0) return ''

  // Converte para centavos (inteiro)
  const cents = parseInt(numbers, 10)
  const reais = cents / 100

  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Converte display monetário (R$ 1.234,56) para valor numérico (1234.56)
 */
export function parseCurrencyToNumber(display: string): number {
  const numbers = display.replace(/\D/g, '')
  if (numbers.length === 0) return 0
  return parseInt(numbers, 10) / 100
}
