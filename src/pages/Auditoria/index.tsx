import { useState, useMemo } from 'react'
import { Eye, MessageCircle, FileText, Shield, Users } from 'lucide-react'
import { SimpleDropdownMenu, FloatingButton, SearchInput, Pagination, EmptyState } from '@/components/ui'
import { SkeletonTable } from '@/components/ui/skeleton'
import { ChatPanel } from '@/components/chat'
import { DetalhesLogModal } from '@/components/modals/DetalhesLogModal'
import { useAuditLogs, usePaginationConfig } from '@/hooks'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { AuditLog, UserAudit, ComplianceReport, AuditTab } from '@/types/audit'
import { cn } from '@/lib/utils'

// Mapear ação do banco para perfil do usuário
const actionProfileMap: Record<string, string> = {
  login: 'Usuário',
  logout: 'Usuário',
  create: 'Sistema',
  update: 'Sistema',
  delete: 'Sistema',
  acesso_prontuario: 'Profissional',
  assinatura_digital: 'Profissional',
  exportacao_dados: 'Sistema',
}

const complianceStatusStyles: Record<ComplianceReport['status'], string> = {
  Conforme: 'bg-primary text-white',
  Pendente: 'bg-yellow-100 text-yellow-700',
  'Não Conforme': 'bg-red-100 text-red-700',
}

export function AuditoriaPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AuditTab>('logs')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false)

  // Buscar configuração de paginação do banco
  const { itemsPerPage } = usePaginationConfig()

  // Buscar logs de auditoria do Supabase
  const { logs: auditLogsData, isLoading } = useAuditLogs()
  const isMobile = useIsMobile()

  // Converter dados do banco para formato da UI
  const auditLogs: AuditLog[] = useMemo(() => {
    return auditLogsData.map(log => ({
      id: log.id,
      clientId: log.clinicaId || '',
      userId: log.userId || '',
      userName: log.userName || 'Usuário',
      userProfile: actionProfileMap[log.action] || 'Sistema',
      action: log.actionLabel,
      actionType: 'Visualizar' as const,
      ip: log.ipAddress || '-',
      browser: log.browser || '-',
      device: log.device || '-',
      timestamp: log.timestamp,
    }))
  }, [auditLogsData])

  // Converter logs para formato de auditoria de usuário
  const userAudits: UserAudit[] = useMemo(() => {
    return auditLogsData.map(log => ({
      id: log.id,
      clientId: log.clinicaId || '',
      userId: log.userId || '',
      userName: log.userName || 'Usuário',
      userProfile: actionProfileMap[log.action] || 'Sistema',
      action: log.actionLabel,
      module: log.tableLabel,
      details: log.recordId ? `Registro: ${log.recordId.slice(0, 8)}...` : '-',
      timestamp: log.timestamp,
    }))
  }, [auditLogsData])

  // Dados de conformidade (mantendo estático por enquanto pois não há tabela no banco)
  const complianceReports: ComplianceReport[] = useMemo(() => {
    return [
      {
        id: '1',
        clientId: '',
        title: 'Relatório LGPD - Janeiro',
        type: 'LGPD' as const,
        generatedAt: new Date().toISOString(),
        status: 'Conforme' as const,
        details: 'Todos os requisitos atendidos',
      },
      {
        id: '2',
        clientId: '',
        title: 'Auditoria de Segurança',
        type: 'Segurança' as const,
        generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Pendente' as const,
        details: 'Aguardando revisão',
      },
    ]
  }, [])

  // Paginação
  const getCurrentData = () => {
    switch (activeTab) {
      case 'logs':
        return auditLogs
      case 'userAudit':
        return userAudits
      case 'compliance':
        return complianceReports
      default:
        return []
    }
  }

  const currentData = getCurrentData()
  const totalPages = Math.ceil(currentData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = currentData.slice(startIndex, startIndex + itemsPerPage)

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const handleViewLogDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setIsLogDetailsOpen(true)
  }

  const handleTabChange = (tab: AuditTab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getLogActions = (log: AuditLog) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: 'Ver detalhes',
      onClick: () => handleViewLogDetails(log),
    },
  ]

  const tabs = [
    { id: 'logs' as AuditTab, label: 'Logs de acesso', icon: <FileText className="w-4 h-4" /> },
    { id: 'userAudit' as AuditTab, label: 'Auditoria de usuários', icon: <Users className="w-4 h-4" /> },
    { id: 'compliance' as AuditTab, label: 'Relatórios de conformidade', icon: <Shield className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 md:px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Auditoria</span>
          <span className="text-muted-foreground/50">›</span>
          <span className="text-foreground">Central de auditoria</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        <div className="bg-card rounded-2xl border border-border">
          {/* Tabs - scrollable em mobile */}
          <div className="border-b border-border">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.icon}
                  <span className={isMobile ? 'hidden sm:inline' : ''}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search - stacked em mobile */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-border">
            <h2 className="text-sm md:text-base font-semibold text-foreground">
              {activeTab === 'logs' && 'Logs de acesso'}
              {activeTab === 'userAudit' && 'Auditoria de usuários'}
              {activeTab === 'compliance' && 'Relatórios de conformidade'}
            </h2>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full md:w-60"
            />
          </div>

          {/* Tab Content - Logs de Acesso */}
          {activeTab === 'logs' && (
            <div className="overflow-x-auto min-h-[320px]">
              {isLoading ? (
                <SkeletonTable rows={5} columns={5} className="p-4" />
              ) : paginatedData.length === 0 ? (
                <div className="flex items-center justify-center h-[320px]">
                  <EmptyState
                    icon={FileText}
                    title="Nenhum log de acesso"
                    description="Os logs de acesso aparecerão aqui quando houver atividade no sistema."
                  />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        DATA/HORA
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        USUÁRIO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        PERFIL
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        AÇÃO
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(paginatedData as AuditLog[]).map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-1 h-8 bg-primary rounded-full mr-3" />
                            <span className="text-sm text-foreground">{formatDate(log.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground">{log.userName}</td>
                        <td className="px-4 py-4 text-sm text-foreground">{log.userProfile}</td>
                        <td className="px-4 py-4 text-sm text-foreground">{log.action}</td>
                        <td className="px-4 py-4 text-right">
                          <SimpleDropdownMenu items={getLogActions(log)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab Content - Auditoria de Usuários */}
          {activeTab === 'userAudit' && (
            <div className="overflow-x-auto min-h-[320px]">
              {isLoading ? (
                <SkeletonTable rows={5} columns={5} className="p-4" />
              ) : paginatedData.length === 0 ? (
                <div className="flex items-center justify-center h-[320px]">
                  <EmptyState
                    icon={Users}
                    title="Nenhuma auditoria de usuário"
                    description="As atividades dos usuários aparecerão aqui."
                  />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        DATA/HORA
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        USUÁRIO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        MÓDULO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        AÇÃO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        DETALHES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(paginatedData as UserAudit[]).map((audit) => (
                      <tr key={audit.id} className="hover:bg-muted/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-1 h-8 bg-blue-400 rounded-full mr-3" />
                            <span className="text-sm text-foreground">{formatDate(audit.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground">{audit.userName}</td>
                        <td className="px-4 py-4 text-sm text-foreground">{audit.module}</td>
                        <td className="px-4 py-4 text-sm text-foreground">{audit.action}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{audit.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab Content - Relatórios de Conformidade */}
          {activeTab === 'compliance' && (
            <div className="overflow-x-auto min-h-[320px]">
              {paginatedData.length === 0 ? (
                <div className="flex items-center justify-center h-[320px]">
                  <EmptyState
                    icon={Shield}
                    title="Nenhum relatório de conformidade"
                    description="Os relatórios de conformidade aparecerão aqui."
                  />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        TÍTULO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        TIPO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        DATA DE GERAÇÃO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        STATUS
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        DETALHES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(paginatedData as ComplianceReport[]).map((report) => (
                      <tr key={report.id} className="hover:bg-muted/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-1 h-8 bg-purple-400 rounded-full mr-3" />
                            <span className="text-sm text-foreground">{report.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground">{report.type}</td>
                        <td className="px-4 py-4 text-sm text-foreground">
                          {formatDate(report.generatedAt)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              complianceStatusStyles[report.status]
                            )}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {report.details || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={currentData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal Detalhes do Log */}
      <DetalhesLogModal
        isOpen={isLogDetailsOpen}
        onClose={() => {
          setIsLogDetailsOpen(false)
          setSelectedLog(null)
        }}
        log={selectedLog}
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
