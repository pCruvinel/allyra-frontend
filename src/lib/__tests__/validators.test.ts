import { describe, it, expect } from 'vitest'
import {
  isValidCPF,
  isValidCNPJ,
  isValidCEP,
  formatCPF,
  formatCNPJ,
  formatCEP,
  formatCurrency,
  parseCurrencyToNumber,
} from '../validators'

// =====================================================
// isValidCPF
// =====================================================
describe('isValidCPF', () => {
  it('should accept valid CPFs', () => {
    // CPFs reais válidos (dígitos verificadores corretos)
    expect(isValidCPF('52998224725')).toBe(true)
    expect(isValidCPF('11144477735')).toBe(true)
    expect(isValidCPF('45612378901')).toBe(false) // inválido propositalmente
  })

  it('should accept CPF with punctuation', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true)
  })

  it('should reject CPFs with all equal digits', () => {
    expect(isValidCPF('11111111111')).toBe(false)
    expect(isValidCPF('00000000000')).toBe(false)
    expect(isValidCPF('99999999999')).toBe(false)
  })

  it('should reject CPFs with wrong length', () => {
    expect(isValidCPF('1234567890')).toBe(false)     // 10 dígitos
    expect(isValidCPF('123456789012')).toBe(false)   // 12 dígitos
    expect(isValidCPF('')).toBe(false)
  })

  it('should reject CPFs with invalid check digits', () => {
    expect(isValidCPF('52998224726')).toBe(false) // último dígito trocado
    expect(isValidCPF('52998224715')).toBe(false) // penúltimo dígito trocado
  })
})

// =====================================================
// isValidCNPJ
// =====================================================
describe('isValidCNPJ', () => {
  it('should accept valid CNPJs', () => {
    expect(isValidCNPJ('11222333000181')).toBe(true)
    expect(isValidCNPJ('11444777000161')).toBe(true)
  })

  it('should accept CNPJ with punctuation', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true)
  })

  it('should reject CNPJs with all equal digits', () => {
    expect(isValidCNPJ('11111111111111')).toBe(false)
    expect(isValidCNPJ('00000000000000')).toBe(false)
  })

  it('should reject CNPJs with wrong length', () => {
    expect(isValidCNPJ('1122233300018')).toBe(false)   // 13 dígitos
    expect(isValidCNPJ('112223330001811')).toBe(false)  // 15 dígitos
    expect(isValidCNPJ('')).toBe(false)
  })

  it('should reject CNPJs with invalid check digits', () => {
    expect(isValidCNPJ('11222333000182')).toBe(false) // último dígito trocado
  })
})

// =====================================================
// isValidCEP
// =====================================================
describe('isValidCEP', () => {
  it('should accept valid CEPs (8 digits)', () => {
    expect(isValidCEP('01310100')).toBe(true)
    expect(isValidCEP('12345678')).toBe(true)
  })

  it('should accept CEP with dash', () => {
    expect(isValidCEP('01310-100')).toBe(true)
  })

  it('should reject CEPs with wrong length', () => {
    expect(isValidCEP('1234567')).toBe(false)
    expect(isValidCEP('123456789')).toBe(false)
    expect(isValidCEP('')).toBe(false)
  })
})

// =====================================================
// formatCPF
// =====================================================
describe('formatCPF', () => {
  it('should format CPF progressively', () => {
    expect(formatCPF('')).toBe('')
    expect(formatCPF('5')).toBe('5')
    expect(formatCPF('529')).toBe('529')
    expect(formatCPF('5299')).toBe('529.9')
    expect(formatCPF('529982')).toBe('529.982')
    expect(formatCPF('5299822')).toBe('529.982.2')
    expect(formatCPF('529982247')).toBe('529.982.247')
    expect(formatCPF('5299822472')).toBe('529.982.247-2')
    expect(formatCPF('52998224725')).toBe('529.982.247-25')
  })

  it('should limit to 11 digits', () => {
    expect(formatCPF('529982247251234')).toBe('529.982.247-25')
  })
})

// =====================================================
// formatCNPJ
// =====================================================
describe('formatCNPJ', () => {
  it('should format CNPJ progressively', () => {
    expect(formatCNPJ('')).toBe('')
    expect(formatCNPJ('11')).toBe('11')
    expect(formatCNPJ('11222')).toBe('11.222')
    expect(formatCNPJ('11222333')).toBe('11.222.333')
    expect(formatCNPJ('112223330001')).toBe('11.222.333/0001')
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81')
  })
})

// =====================================================
// formatCEP
// =====================================================
describe('formatCEP', () => {
  it('should format CEP progressively', () => {
    expect(formatCEP('')).toBe('')
    expect(formatCEP('01310')).toBe('01310')
    expect(formatCEP('01310100')).toBe('01310-100')
  })
})

// =====================================================
// formatCurrency / parseCurrencyToNumber
// =====================================================
describe('formatCurrency', () => {
  it('should format cents to BRL currency', () => {
    const result100 = formatCurrency('10000')
    expect(result100).toContain('100')
    expect(result100).toContain('R$')

    const result1cent = formatCurrency('1')
    expect(result1cent).toContain('0')
    expect(result1cent).toContain('01')
    expect(result1cent).toContain('R$')
  })

  it('should return empty string for empty input', () => {
    expect(formatCurrency('')).toBe('')
  })
})

describe('parseCurrencyToNumber', () => {
  it('should parse formatted currency to number', () => {
    expect(parseCurrencyToNumber('R$ 100,00')).toBe(100)
    expect(parseCurrencyToNumber('R$ 0,01')).toBe(0.01)
    expect(parseCurrencyToNumber('')).toBe(0)
  })
})
