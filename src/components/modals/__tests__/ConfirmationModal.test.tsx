/**
 * Testes do ConfirmationModal
 *
 * Valida o componente genérico de confirmação que consolida
 * ConfirmAbsenceModal, ConfirmArrivalModal e outros modais de confirmação
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmationModal } from '../ConfirmationModal'

// Mock do hook useIsMobile
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false), // Default: desktop
}))

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    description: 'Tem certeza que deseja continuar?',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização', () => {
    it('deve renderizar o modal quando isOpen=true', () => {
      render(<ConfirmationModal {...defaultProps} />)
      expect(screen.getByText('Tem certeza que deseja continuar?')).toBeInTheDocument()
    })

    it('deve exibir o título padrão "Confirmar ação"', () => {
      render(<ConfirmationModal {...defaultProps} />)
      expect(screen.getByText('Confirmar ação')).toBeInTheDocument()
    })

    it('deve exibir título customizado', () => {
      render(<ConfirmationModal {...defaultProps} title="Excluir Item" />)
      expect(screen.getByText('Excluir Item')).toBeInTheDocument()
    })

    it('deve exibir heading quando fornecido', () => {
      render(<ConfirmationModal {...defaultProps} heading="ATENÇÃO!" />)
      expect(screen.getByText('ATENÇÃO!')).toBeInTheDocument()
    })

    it('deve exibir labels padrão nos botões', () => {
      render(<ConfirmationModal {...defaultProps} />)
      expect(screen.getByText('Confirmar')).toBeInTheDocument()
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('deve exibir labels customizados nos botões', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          confirmLabel="Sim, excluir"
          cancelLabel="Não, voltar"
        />
      )
      expect(screen.getByText('Sim, excluir')).toBeInTheDocument()
      expect(screen.getByText('Não, voltar')).toBeInTheDocument()
    })
  })

  describe('Item Count Badge', () => {
    it('deve exibir badge com contagem de itens', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          itemCount={5}
          itemLabel="pacientes selecionados"
        />
      )
      expect(screen.getByText('5 pacientes selecionados')).toBeInTheDocument()
    })

    it('não deve exibir badge quando itemCount não fornecido', () => {
      render(<ConfirmationModal {...defaultProps} itemLabel="pacientes" />)
      expect(screen.queryByText(/pacientes/)).not.toBeInTheDocument()
    })
  })

  describe('Interações', () => {
    it('deve chamar onConfirm e onClose ao confirmar', () => {
      const onConfirm = vi.fn()
      const onClose = vi.fn()

      render(
        <ConfirmationModal
          {...defaultProps}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Confirmar'))

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('deve chamar onClose ao cancelar', () => {
      const onClose = vi.fn()

      render(<ConfirmationModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('Cancelar'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('deve desabilitar botões quando isLoading=true', () => {
      render(<ConfirmationModal {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Processando...')).toBeInTheDocument()
      expect(screen.getByText('Processando...').closest('button')).toBeDisabled()
      expect(screen.getByText('Cancelar').closest('button')).toBeDisabled()
    })
  })

  describe('Variantes', () => {
    it('deve aplicar estilo danger por padrão para variant=danger', () => {
      render(<ConfirmationModal {...defaultProps} variant="danger" />)
      const confirmButton = screen.getByText('Confirmar').closest('button')
      expect(confirmButton).toHaveClass('bg-red-600')
    })

    it('deve aplicar estilo warning para variant=warning', () => {
      render(<ConfirmationModal {...defaultProps} variant="warning" />)
      const confirmButton = screen.getByText('Confirmar').closest('button')
      expect(confirmButton).toHaveClass('bg-yellow-500')
    })

    it('deve aplicar estilo info para variant=info', () => {
      render(<ConfirmationModal {...defaultProps} variant="info" />)
      const confirmButton = screen.getByText('Confirmar').closest('button')
      expect(confirmButton).toHaveClass('bg-blue-600')
    })
  })

  describe('Descrição com JSX', () => {
    it('deve renderizar descrição com elementos JSX', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          description={
            <>
              O paciente <strong>João Silva</strong> será removido.
            </>
          }
        />
      )
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })
  })
})

describe('ConfirmAbsenceModal (wrapper)', () => {
  it('deve usar ConfirmationModal com props corretas', async () => {
    // Import dinâmico para testar wrapper
    const { ConfirmAbsenceModal } = await import('../ConfirmAbsenceModal')
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ConfirmAbsenceModal isOpen={true} onClose={onClose} onConfirm={onConfirm} />
    )

    expect(screen.getByText('REGISTRAR FALTA!')).toBeInTheDocument()
    expect(
      screen.getByText(/gostaríamos de confirmar se você realmente deseja/i)
    ).toBeInTheDocument()
  })
})

describe('ConfirmArrivalModal (wrapper)', () => {
  it('deve usar ConfirmationModal com props corretas', async () => {
    const { ConfirmArrivalModal } = await import('../ConfirmArrivalModal')
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ConfirmArrivalModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        patientName="Maria Santos"
        date="18/01/2026"
        time="14:30"
      />
    )

    expect(screen.getByText('REGISTRAR CHEGADA DO PACIENTE!')).toBeInTheDocument()
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getByText(/18\/01\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/14:30/)).toBeInTheDocument()
  })
})
