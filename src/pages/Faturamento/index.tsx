import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FileSpreadsheet, Receipt, MessageCircle } from 'lucide-react'
import { FloatingButton, NavigationCard } from '@/components/ui'
import { ChatPanel } from '@/components/chat'

export function FaturamentoPage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div className="space-y-6 pb-20">
      {/* Content */}
      <div className="p-6">
        <div className="bg-muted rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Faturamento</h1>

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <NavigationCard
              icon={<FileSpreadsheet className="w-6 h-6 text-white" />}
              title="Pré-faturamento"
              onClick={() => navigate({ to: '/faturamento/pre-faturamento' })}
            />

            <NavigationCard
              icon={<Receipt className="w-6 h-6 text-white" />}
              title="Faturamentos emitidos"
              onClick={() => navigate({ to: '/faturamento/emitidos' })}
            />
          </div>
        </div>
      </div>

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={() => setIsChatOpen(true)}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
