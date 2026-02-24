/**
 * LoginPage - Tela de Login com Layout Split-Screen
 *
 * Layout:
 * - Lado esquerdo: Formulário de login (sempre visível)
 * - Lado direito: Slider de slides dinâmicos (hidden em mobile/tablet)
 *
 * Os slides são carregados dinamicamente do banco de dados e podem ser
 * configurados globalmente ou por clínica.
 */

import { LoginForm, LoginSlider } from './components'

export function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-muted/30">
        <LoginForm />
      </div>

      {/* Lado Direito - Slider (hidden em mobile/tablet) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden">
        {/* Background decorativo com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />

        {/* Padrão decorativo sutil (grid) */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Círculos decorativos */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        {/* Slider */}
        <LoginSlider className="relative z-10" />
      </div>
    </div>
  )
}
