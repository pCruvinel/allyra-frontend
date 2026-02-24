import { Construction, Rocket, Sparkles } from 'lucide-react'
import { MainLayout } from '@/components/layout'

interface ModuleInProgressPageProps {
  moduleName: string
  moduleSlug?: string
  description?: string
  breadcrumb?: { label: string; href?: string }[]
}

export function ModuleInProgressPage({
  moduleName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moduleSlug: _moduleSlug,
  description,
  breadcrumb,
}: ModuleInProgressPageProps) {
  const defaultDescription = `Estamos trabalhando para trazer este módulo até você. Em breve você terá acesso a todas as funcionalidades.`

  const defaultBreadcrumb = [{ label: 'Início', href: '/' }, { label: moduleName }]

  return (
    <MainLayout
      title={moduleName}
      breadcrumb={breadcrumb || defaultBreadcrumb}
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-2xl w-full">
          {/* Card principal com gradiente sutil */}
          <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl shadow-lg border border-border p-8 md:p-12">
            {/* Decoração de fundo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 text-center space-y-8">
              {/* Ícone animado */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl rotate-6 opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-2xl flex items-center justify-center shadow-inner">
                  <Construction className="w-12 h-12 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
                {/* Sparkle decorativo */}
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-6 h-6 text-amber-500 animate-bounce" />
                </div>
              </div>

              {/* Badge de status */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 text-sm font-semibold shadow-sm border border-amber-200/50 dark:border-amber-700/50">
                <Rocket className="w-4 h-4" />
                Em Desenvolvimento
              </div>

              {/* Título */}
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {moduleName}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Novidades chegando em breve!
                </p>
              </div>

              {/* Descrição */}
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                {description || defaultDescription}
              </p>

            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}
