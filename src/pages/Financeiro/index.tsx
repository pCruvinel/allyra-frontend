import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Building2, DollarSign, ArrowRightLeft, FileText, MessageCircle } from 'lucide-react'
import { FloatingButton, NavigationCard } from '@/components/ui'
import { ChatPanel } from '@/components/chat'

export function FinanceiroPage() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div className="space-y-6 pb-20">
      {/* Content */}
      <div className="p-6">
        <div className="bg-muted rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Financeiro</h1>

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <NavigationCard
              icon={<Building2 className="w-6 h-6 text-white" />}
              title="Contas a receber"
              onClick={() => navigate({ to: '/financeiro/contas-a-receber' })}
            />

            <NavigationCard
              icon={<DollarSign className="w-6 h-6 text-white" />}
              title="Cobrança"
              onClick={() => navigate({ to: '/financeiro/cobranca' })}
            />

            <NavigationCard
              icon={<ArrowRightLeft className="w-6 h-6 text-white" />}
              title="Repasse"
              onClick={() => navigate({ to: '/financeiro/repasse' })}
            />

            <NavigationCard
              icon={<FileText className="w-6 h-6 text-white" />}
              title="NFs Emitidas"
              onClick={() => navigate({ to: '/financeiro/nfs-emitidas' })}
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
