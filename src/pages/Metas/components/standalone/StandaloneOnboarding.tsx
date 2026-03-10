/**
 * StandaloneOnboarding - Tutorial interativo para o modo stand-alone
 * Design baseado no backup com 3 cards lado a lado
 */

import { Users, Calendar, Target, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { useMetasMode } from '../../contexts/MetasModeContext'

type TabType = 'registro' | 'planos'

interface StandaloneOnboardingProps {
  onNavigate?: (tab: TabType) => void
}

export function StandaloneOnboarding({ onNavigate }: StandaloneOnboardingProps) {
  const { showOnboarding, dismissOnboarding } = useMetasMode()

  const handleNavigate = (tab: TabType) => {
    if (onNavigate) {
      onNavigate(tab)
    }
    dismissOnboarding()
  }

  return (
    <Dialog open={showOnboarding} onOpenChange={(open) => !open && dismissOnboarding()}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        <VisuallyHidden.Root>
          <DialogTitle>Tutorial do Modo Stand-alone</DialogTitle>
        </VisuallyHidden.Root>
        {/* Header */}
        <div className="p-8 pb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Bem-vindo ao Modo Stand-alone! 🎯
          </h2>
          <p className="text-muted-foreground mt-2">
            Comece a trabalhar em apenas 3 passos simples
          </p>
        </div>

        {/* Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-8">
          {/* Step 1: Selecionar Paciente */}
          <div className="bg-muted/30 rounded-xl p-6 border-2 border-transparent hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-xl">1</span>
                <span className="font-semibold text-foreground">
                  Selecionar Paciente
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Selecione um paciente do sistema para vincular ao plano terapêutico
            </p>
            <Button
              onClick={() => handleNavigate('planos')}
              className="w-full"
            >
              Ir para Planos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Step 2: Criar Plano */}
          <div className="bg-muted/30 rounded-xl p-6 border-2 border-transparent hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-xl">2</span>
                <span className="font-semibold text-foreground">
                  Criar Plano
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Defina o plano terapêutico com metas e indicadores de desempenho
            </p>
            <Button
              onClick={() => handleNavigate('planos')}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10"
            >
              Ir para Planos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Step 3: Registrar Atendimento */}
          <div className="bg-muted/30 rounded-xl p-6 border-2 border-transparent hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-xl">3</span>
                <span className="font-semibold text-foreground">
                  Registrar Atendimento
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Registre manualmente os atendimentos realizados e as faltas
            </p>
            <Button
              onClick={() => handleNavigate('registro')}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10"
            >
              Ir para Registro
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mx-8 mt-8 p-5 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">💡</span>
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">
                Modo Stand-alone vs Integrado
              </p>
              <p className="text-muted-foreground text-sm">
                No <strong>Modo Stand-alone</strong>, você gerencia pacientes e atendimentos manualmente; já no{' '}
                <strong>Modo Integrado</strong>, essas informações são sincronizadas automaticamente com os módulos
                Agenda e Pacientes do Allyra, sendo possível alternar entre os modos a qualquer momento pelo switch
                no cabeçalho da tela.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-6 flex justify-center">
          <Button
            onClick={dismissOnboarding}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            Fechar Tutorial
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
