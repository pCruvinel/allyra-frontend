// Hook para buscar slides públicos do login (sem autenticação)
// TEMPORÁRIO: Apenas mock, sem chamada à API
import { useState, useEffect } from 'react'
import {
  type LoginSlidePublic,
  type LoginSlidesConfig,
} from '@/services/login-slides.service'

// Slides mockados para fallback
const MOCK_SLIDES: LoginSlidePublic[] = [
  {
    id: 'mock-1',
    titulo: 'Transforme Dados em Insights',
    descricao: 'Tome decisões informadas com as ferramentas de análise poderosas do Allyra. Aproveite o poder dos dados para impulsionar seu negócio.',
    imagem_url: null,
    botao_texto: null,
    botao_link: null,
    tipo: 'feature',
  },
  {
    id: 'mock-2',
    titulo: 'Gestão Completa de Clínicas',
    descricao: 'Agenda, pacientes, financeiro e muito mais em uma única plataforma integrada e fácil de usar.',
    imagem_url: null,
    botao_texto: null,
    botao_link: null,
    tipo: 'feature',
  },
  {
    id: 'mock-3',
    titulo: 'Segurança e Confiabilidade',
    descricao: 'Seus dados protegidos com criptografia de ponta e backups automáticos. Conformidade com LGPD garantida.',
    imagem_url: null,
    botao_texto: null,
    botao_link: null,
    tipo: 'feature',
  },
]

const DEFAULT_CONFIG: LoginSlidesConfig = { intervalo_rotacao: 5000 }

interface UseLoginSlidesOptions {
  clinicaId?: string
  enabled?: boolean
}

interface UseLoginSlidesReturn {
  slides: LoginSlidePublic[]
  config: LoginSlidesConfig
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useLoginSlides(options: UseLoginSlidesOptions = {}): UseLoginSlidesReturn {
  const { enabled = true } = options

  // TEMPORÁRIO: Usa apenas mock, sem chamada à API
  // Carrega instantaneamente os slides mockados
  const [slides] = useState<LoginSlidePublic[]>(MOCK_SLIDES)
  const [config] = useState<LoginSlidesConfig>(DEFAULT_CONFIG)
  const [isLoading] = useState(false)
  const [error] = useState<Error | null>(null)

  useEffect(() => {
    if (enabled) {
      console.log('[useLoginSlides] Usando slides mockados (API desativada)')
    }
  }, [enabled])

  // Refetch desativado enquanto usando mock
  const refetch = async () => {
    // No-op
  }

  return {
    slides,
    config,
    isLoading,
    error,
    refetch,
  }
}
