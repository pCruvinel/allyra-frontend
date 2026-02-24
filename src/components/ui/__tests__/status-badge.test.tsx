/**
 * Testes do StatusBadge
 *
 * Valida o componente de badge de status centralizado
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge, useStatusConfig } from '../status-badge'
import { renderHook } from '@testing-library/react'

describe('StatusBadge', () => {
  describe('Variante Patient', () => {
    it('deve renderizar status "active" como "Ativo"', () => {
      render(<StatusBadge status="active" variant="patient" />)
      expect(screen.getByText('Ativo')).toBeInTheDocument()
    })

    it('deve renderizar status "inactive" como "Inativo"', () => {
      render(<StatusBadge status="inactive" variant="patient" />)
      expect(screen.getByText('Inativo')).toBeInTheDocument()
    })

    it('deve renderizar status "blocked" como "Bloqueado"', () => {
      render(<StatusBadge status="blocked" variant="patient" />)
      expect(screen.getByText('Bloqueado')).toBeInTheDocument()
    })

    it('deve aplicar classe correta para status "active"', () => {
      render(<StatusBadge status="active" variant="patient" />)
      const badge = screen.getByText('Ativo')
      expect(badge).toHaveClass('bg-primary')
    })

    it('deve aplicar classe correta para status "blocked"', () => {
      render(<StatusBadge status="blocked" variant="patient" />)
      const badge = screen.getByText('Bloqueado')
      expect(badge).toHaveClass('bg-red-100')
    })
  })

  describe('Variante Client', () => {
    it('deve renderizar status "Ativo" corretamente', () => {
      render(<StatusBadge status="Ativo" variant="client" />)
      expect(screen.getByText('Ativo')).toBeInTheDocument()
    })

    it('deve renderizar status "Suspenso" corretamente', () => {
      render(<StatusBadge status="Suspenso" variant="client" />)
      expect(screen.getByText('Suspenso')).toBeInTheDocument()
    })
  })

  describe('Variante Appointment', () => {
    it('deve renderizar status "agendado" como "Agendado"', () => {
      render(<StatusBadge status="agendado" variant="appointment" />)
      expect(screen.getByText('Agendado')).toBeInTheDocument()
    })

    it('deve renderizar status "confirmado" como "Confirmado"', () => {
      render(<StatusBadge status="confirmado" variant="appointment" />)
      expect(screen.getByText('Confirmado')).toBeInTheDocument()
    })

    it('deve renderizar status "falta" como "Falta"', () => {
      render(<StatusBadge status="falta" variant="appointment" />)
      expect(screen.getByText('Falta')).toBeInTheDocument()
    })
  })

  describe('Variante Payment', () => {
    it('deve suportar status em ingles', () => {
      render(<StatusBadge status="paid" variant="payment" />)
      expect(screen.getByText('Pago')).toBeInTheDocument()
    })

    it('deve suportar status em portugues', () => {
      render(<StatusBadge status="pago" variant="payment" />)
      expect(screen.getByText('Pago')).toBeInTheDocument()
    })

    it('deve renderizar status "pending" como "Pendente"', () => {
      render(<StatusBadge status="pending" variant="payment" />)
      expect(screen.getByText('Pendente')).toBeInTheDocument()
    })
  })

  describe('Variante Custom', () => {
    it('deve usar configuracao customizada', () => {
      const customConfig = {
        my_status: { label: 'Meu Status', className: 'bg-purple-100' },
      }

      render(
        <StatusBadge
          status="my_status"
          variant="custom"
          customConfig={customConfig}
        />
      )

      expect(screen.getByText('Meu Status')).toBeInTheDocument()
    })
  })

  describe('Status Desconhecido', () => {
    it('deve exibir status original quando showRawStatus=true', () => {
      render(<StatusBadge status="unknown_status" variant="patient" showRawStatus={true} />)
      expect(screen.getByText('unknown_status')).toBeInTheDocument()
    })

    it('nao deve renderizar quando showRawStatus=false e status desconhecido', () => {
      const { container } = render(
        <StatusBadge status="unknown_status" variant="patient" showRawStatus={false} />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Classes Customizadas', () => {
    it('deve aplicar className adicional', () => {
      render(<StatusBadge status="active" variant="patient" className="my-custom-class" />)
      const badge = screen.getByText('Ativo')
      expect(badge).toHaveClass('my-custom-class')
    })

    it('deve manter classes base do componente', () => {
      render(<StatusBadge status="active" variant="patient" />)
      const badge = screen.getByText('Ativo')
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('font-medium')
    })
  })
})

describe('useStatusConfig Hook', () => {
  it('deve retornar config para status conhecido', () => {
    const { result } = renderHook(() => useStatusConfig('patient'))

    const config = result.current.getConfig('active')
    expect(config.label).toBe('Ativo')
    expect(config.className).toContain('bg-primary')
  })

  it('deve retornar label para status conhecido', () => {
    const { result } = renderHook(() => useStatusConfig('patient'))

    const label = result.current.getLabel('blocked')
    expect(label).toBe('Bloqueado')
  })

  it('deve retornar status original para status desconhecido', () => {
    const { result } = renderHook(() => useStatusConfig('patient'))

    const label = result.current.getLabel('unknown')
    expect(label).toBe('unknown')
  })

  it('deve funcionar com customConfig', () => {
    const customConfig = {
      test: { label: 'Teste', className: 'bg-test' },
    }
    const { result } = renderHook(() => useStatusConfig('custom', customConfig))

    const config = result.current.getConfig('test')
    expect(config.label).toBe('Teste')
    expect(config.className).toBe('bg-test')
  })
})
