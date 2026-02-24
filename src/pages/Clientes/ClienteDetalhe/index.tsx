import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  MessageCircle,
  Ban,
  KeyRound,
  CreditCard,
  Users,
  DollarSign,
  HardDrive,
  Loader2,
} from 'lucide-react'
import { Button, FloatingButton } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { ChatPanel } from '@/components/chat'
import { ConfirmActionModal } from '@/components/modals'
import { useClients } from '@/hooks'
import type { ClientFormatted, ClientMetricsFormatted } from '@/services/clients.service'
import { availableModules } from '@/types/client'
import { cn } from '@/lib/utils'

type TabType = 'identification' | 'general' | 'privacy'

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  valueColor?: string
}

function StatCard({ icon, value, label, valueColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className={cn('text-2xl font-bold', valueColor)}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function ClienteDetalhePage() {
  const { clienteId } = useParams({ from: '/clientes/$clienteId' })
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('identification')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Usar hook para buscar dados
  const { getClientById, getClientMetrics, updateClientStatus } = useClients({ autoFetch: false })
  const [client, setClient] = useState<ClientFormatted | null>(null)
  const [metrics, setMetrics] = useState<ClientMetricsFormatted | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    fantasyName: '',
    companyName: '',
    cnpj: '',
    stateRegistration: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    modules: [] as string[],
  })

  // Carregar dados do cliente
  useEffect(() => {
    const loadClient = async () => {
      setIsLoading(true)
      const [clientData, metricsData] = await Promise.all([
        getClientById(clienteId),
        getClientMetrics(clienteId),
      ])

      if (clientData) {
        setClient(clientData)
        setFormData({
          code: clientData.code || '',
          fantasyName: clientData.fantasyName || '',
          companyName: clientData.companyName || '',
          cnpj: clientData.cnpj || '',
          stateRegistration: '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          cep: '',
          address: clientData.address || '',
          neighborhood: '',
          city: clientData.city || '',
          state: clientData.state || '',
          modules: clientData.modules || [],
        })
      }

      if (metricsData) {
        setMetrics(metricsData)
      }

      setIsLoading(false)
    }

    loadClient()
  }, [clienteId, getClientById, getClientMetrics])

  const handleGoBack = () => {
    navigate({ to: '/clientes' })
  }

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const handleSave = () => {
    console.log('Salvando alterações:', formData)
  }

  const handleBlock = () => {
    setIsBlockModalOpen(true)
  }

  const handleResetPassword = () => {
    setIsResetPasswordModalOpen(true)
  }

  const handleChangePlan = () => {
    console.log('Alterar plano')
  }

  const handleConfirmBlock = async () => {
    if (client) {
      await updateClientStatus(client.id, 'bloqueada')
      // Recarregar dados
      const updatedClient = await getClientById(clienteId)
      if (updatedClient) {
        setClient(updatedClient)
      }
    }
    setIsBlockModalOpen(false)
  }

  const handleConfirmResetPassword = () => {
    console.log('Resetando senha do cliente:', clienteId)
    setIsResetPasswordModalOpen(false)
  }

  const toggleModule = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter((m) => m !== module)
        : [...prev.modules, module],
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cliente não encontrado</p>
      </div>
    )
  }

  const tabs = [
    { id: 'identification' as TabType, label: 'Identificação' },
    { id: 'general' as TabType, label: 'Dados gerais' },
    { id: 'privacy' as TabType, label: 'Privacidade e consentimento' },
  ]

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={handleGoBack} className="hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Clientes</span>
          <span className="text-muted-foreground/60">›</span>
          <span>Início</span>
          <span className="text-muted-foreground/60">›</span>
          <span>Clientes</span>
          <span className="text-muted-foreground/60">›</span>
          <span className="text-foreground">{client.fantasyName}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tabs */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="border-b border-border">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'identification' && (
              <div className="space-y-4">
                {/* Código */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Código</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="max-w-xs"
                    readOnly
                  />
                </div>

                {/* Nome Fantasia e Razão Social */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nome fantasia
                    </label>
                    <Input
                      value={formData.fantasyName}
                      onChange={(e) => setFormData({ ...formData, fantasyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Razão social
                    </label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                </div>

                {/* CNPJ e Inscrição Estadual */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CNPJ</label>
                    <Input
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Inscrição estadual
                    </label>
                    <Input
                      value={formData.stateRegistration}
                      onChange={(e) =>
                        setFormData({ ...formData, stateRegistration: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* E-mail e Telefone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Telefone
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CEP</label>
                    <Input
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Logradouro
                    </label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bairro</label>
                    <Input
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Cidade</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">UF</label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>

                {/* Módulos */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Módulos</label>
                  <div className="flex flex-wrap gap-2">
                    {availableModules.map((module) => (
                      <button
                        key={module}
                        type="button"
                        onClick={() => toggleModule(module)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                          formData.modules.includes(module)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-card text-foreground border-border hover:border-primary'
                        )}
                      >
                        {module}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botão Salvar */}
                <div className="pt-4">
                  <Button
                    onClick={handleSave}
                    className="rounded-full px-8 bg-primary hover:bg-primary/90"
                  >
                    Salvar alterações
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'general' && metrics && (
              <div className="space-y-6">
                {/* Cards de Métricas */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Uso do Sistema */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Uso do sistema</h3>
                    <div className="space-y-3">
                      <StatCard
                        icon={<Users className="w-5 h-5 text-primary" />}
                        value={`${metrics.activeUsers}/${metrics.totalUsers}`}
                        label="Usuários ativos"
                      />
                      <p className="text-xs text-muted-foreground">
                        Último acesso: {formatDate(metrics.lastAccess)}
                      </p>
                    </div>
                  </div>

                  {/* Financeiro */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Financeiro</h3>
                    <div className="space-y-3">
                      <StatCard
                        icon={<DollarSign className="w-5 h-5 text-primary" />}
                        value={formatCurrency(metrics.monthlyValue)}
                        label="Valor mensal"
                      />
                      <p className="text-xs text-muted-foreground">
                        Agendamentos no mês: {metrics.appointmentsMonth}
                      </p>
                    </div>
                  </div>

                  {/* Consumo */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Consumo</h3>
                    <div className="space-y-3">
                      <StatCard
                        icon={<HardDrive className="w-5 h-5 text-primary" />}
                        value={`${metrics.storageUsed.toFixed(1)}/${metrics.storageTotal} GB`}
                        label="Armazenamento"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pacientes ativos: {metrics.activePatients}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Ações rápidas</h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleBlock}
                      className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Bloquear
                    </Button>
                    <Button variant="outline" onClick={handleResetPassword} className="rounded-full">
                      <KeyRound className="w-4 h-4 mr-2" />
                      Resetar senha
                    </Button>
                    <Button variant="outline" onClick={handleChangePlan} className="rounded-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Alterar plano
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="text-center py-12 text-muted-foreground">
                Configurações de privacidade e consentimento em desenvolvimento.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Bloquear Cliente */}
      <ConfirmActionModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleConfirmBlock}
        title="Bloquear cliente"
        itemCount={1}
        itemLabel="cliente"
        description={`Tem certeza que deseja bloquear o cliente "${client.fantasyName}"? O acesso será imediatamente suspenso.`}
        confirmLabel="Bloquear"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Modal Resetar Senha */}
      <ConfirmActionModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onConfirm={handleConfirmResetPassword}
        title="Resetar senha"
        itemCount={1}
        itemLabel="cliente"
        description={`Tem certeza que deseja resetar a senha do cliente "${client.fantasyName}"? Uma nova senha será enviada por e-mail.`}
        confirmLabel="Resetar"
        cancelLabel="Cancelar"
        variant="warning"
      />

      {/* Botão Flutuante de Chat */}
      <FloatingButton
        icon={<MessageCircle className="w-8 h-8 text-primary-foreground" fill="currentColor" />}
        onClick={handleOpenChat}
      />

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
