import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, FileText, Video, Search, ChevronRight, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface DocSection {
  id: string
  title: string
  icon: LucideIcon
  description: string
  articles: DocArticle[]
}

interface DocArticle {
  id: string
  title: string
  summary: string
  content: string
}

export function DocumentacaoPage() {
  const navigate = useNavigate()
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Primeiros Passos',
      icon: BookOpen,
      description: 'Aprenda os conceitos básicos do Allyra',
      articles: [
        {
          id: 'intro',
          title: 'Introdução ao Allyra',
          summary: 'Conheça o sistema e suas principais funcionalidades',
          content: `O Allyra é um sistema completo de gestão para clínicas de saúde que permite:

• Gerenciar agenda e agendamentos de pacientes
• Manter prontuários eletrônicos completos
• Controlar o financeiro (contas a receber, repasses, faturamento)
• Gerar relatórios de devolutiva personalizados
• Acompanhar metas terapêuticas e evolução dos pacientes

O sistema foi desenvolvido pensando na facilidade de uso e na eficiência do trabalho clínico.`
        },
        {
          id: 'first-access',
          title: 'Primeiro Acesso',
          summary: 'Como configurar seu perfil e começar a usar',
          content: `Ao acessar o Allyra pela primeira vez:

1. Faça login com suas credenciais
2. Acesse "Meu Perfil" para completar suas informações
3. Configure suas preferências em "Configurações"
4. Explore o Dashboard para ter uma visão geral

Dica: Use o menu lateral para navegar entre os módulos.`
        },
        {
          id: 'navigation',
          title: 'Navegação e Interface',
          summary: 'Entenda a estrutura do sistema',
          content: `A interface do Allyra é organizada em:

MENU LATERAL
Acesso rápido aos principais módulos: Dashboard, Agenda, Pacientes, Financeiro, etc.

HEADER
Busca global, notificações e menu do perfil.

ÁREA DE CONTEÚDO
Onde são exibidas as informações e formulários de cada módulo.

AÇÕES RÁPIDAS
Botões flutuantes para criar novos registros rapidamente.`
        }
      ]
    },
    {
      id: 'agenda',
      title: 'Agenda e Agendamentos',
      icon: FileText,
      description: 'Gerencie seus atendimentos',
      articles: [
        {
          id: 'create-appointment',
          title: 'Criando um Agendamento',
          summary: 'Como agendar atendimentos para pacientes',
          content: `Para criar um novo agendamento:

1. Acesse a aba "Agenda"
2. Clique em "Novo Agendamento" ou clique diretamente no horário desejado
3. Selecione o paciente
4. Escolha o profissional responsável
5. Defina data, horário e duração
6. Selecione o serviço/procedimento
7. Adicione observações se necessário
8. Clique em "Salvar"

O agendamento aparecerá na agenda do profissional selecionado.`
        },
        {
          id: 'appointment-status',
          title: 'Status dos Agendamentos',
          summary: 'Entenda os diferentes status',
          content: `Os agendamentos podem ter os seguintes status:

AGENDADO (azul)
Atendimento confirmado e aguardando realização.

CONFIRMADO (verde)
Paciente confirmou presença.

EM ATENDIMENTO (amarelo)
Atendimento em andamento.

CONCLUÍDO (verde escuro)
Atendimento finalizado com sucesso.

CANCELADO (vermelho)
Atendimento foi cancelado.

FALTOU (cinza)
Paciente não compareceu.`
        },
        {
          id: 'recurring-appointments',
          title: 'Agendamentos Recorrentes',
          summary: 'Configure atendimentos periódicos',
          content: `Para criar agendamentos recorrentes:

1. Ao criar um agendamento, marque "Repetir agendamento"
2. Escolha a frequência: Semanal, Quinzenal ou Mensal
3. Defina a data de término da recorrência
4. Selecione os dias da semana (se semanal)
5. Confirme a criação

Todos os agendamentos serão criados automaticamente.`
        }
      ]
    },
    {
      id: 'patients',
      title: 'Pacientes e Prontuários',
      icon: FileText,
      description: 'Cadastro e acompanhamento de pacientes',
      articles: [
        {
          id: 'register-patient',
          title: 'Cadastrando um Paciente',
          summary: 'Como criar uma ficha de paciente completa',
          content: `Para cadastrar um novo paciente:

1. Acesse "Pacientes" no menu lateral
2. Clique em "Novo Paciente"
3. Preencha os dados básicos:
   - Nome completo
   - Data de nascimento
   - CPF (opcional)
   - Contatos
4. Adicione informações do responsável (se menor)
5. Selecione o convênio (se aplicável)
6. Clique em "Salvar"

Você pode completar a ficha posteriormente com mais detalhes.`
        },
        {
          id: 'medical-records',
          title: 'Prontuário Eletrônico',
          summary: 'Como registrar evoluções e diagnósticos',
          content: `O prontuário de cada paciente contém:

EVOLUÇÃO
Registre observações de cada atendimento, diagnósticos e prescrições.

ANEXOS
Faça upload de documentos, exames e imagens.

HISTÓRICO
Visualize todo o histórico de atendimentos do paciente.

METAS TERAPÊUTICAS
Defina e acompanhe metas de tratamento.

Para adicionar uma evolução:
1. Acesse a ficha do paciente
2. Vá para a aba "Prontuário"
3. Clique em "Nova Evolução"
4. Preencha as informações e salve`
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financeiro',
      icon: FileText,
      description: 'Controle financeiro da clínica',
      articles: [
        {
          id: 'accounts-receivable',
          title: 'Contas a Receber',
          summary: 'Gerencie recebimentos de pacientes e convênios',
          content: `O módulo de Contas a Receber permite:

• Visualizar todas as faturas pendentes
• Filtrar por status, paciente ou período
• Registrar recebimentos parciais ou totais
• Gerar boletos e links de pagamento
• Acompanhar inadimplência

Para registrar um recebimento:
1. Localize a fatura na lista
2. Clique em "Registrar Pagamento"
3. Informe valor, data e forma de pagamento
4. Confirme a operação`
        },
        {
          id: 'professional-payments',
          title: 'Repasse de Profissionais',
          summary: 'Configure e gerencie repasses',
          content: `O módulo de Repasse controla pagamentos aos profissionais:

CONFIGURAÇÃO
Defina o percentual ou valor fixo por profissional/serviço.

APURAÇÃO
O sistema calcula automaticamente com base nos atendimentos.

PAGAMENTO
Registre os pagamentos realizados.

RELATÓRIOS
Acompanhe histórico e totais por período.`
        }
      ]
    },
    {
      id: 'tutorials',
      title: 'Tutoriais em Vídeo',
      icon: Video,
      description: 'Assista tutoriais passo a passo',
      articles: [
        {
          id: 'video-intro',
          title: 'Vídeo: Visão Geral do Sistema',
          summary: 'Tour completo pelas funcionalidades (5 min)',
          content: `Este vídeo apresenta uma visão geral completa do sistema Allyra, incluindo:

• Interface principal e navegação
• Criação de agendamentos
• Cadastro de pacientes
• Módulo financeiro
• Relatórios

[Vídeo em breve]`
        },
        {
          id: 'video-advanced',
          title: 'Vídeo: Recursos Avançados',
          summary: 'Aprenda dicas e truques para otimizar seu trabalho (8 min)',
          content: `Neste vídeo você aprenderá:

• Atalhos de teclado
• Filtros e buscas avançadas
• Personalização de relatórios
• Configurações avançadas

[Vídeo em breve]`
        }
      ]
    }
  ]

  const filteredSections = docSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.articles.length > 0)

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null)
    } else {
      navigate({ to: '/' })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Botão Voltar */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mb-4 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium text-sm">
            {selectedArticle ? 'Voltar para documentação' : 'Voltar'}
          </span>
        </button>

        {!selectedArticle ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-1">
                Documentação
              </h1>
              <p className="text-sm text-muted-foreground">
                Guias completos e tutoriais para usar o Allyra
              </p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-[500px]">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar na documentação..."
                  className="pl-11 rounded-lg"
                />
              </div>
            </div>

            {/* Documentation Sections */}
            <div className="space-y-6">
              {filteredSections.map(section => (
                <div key={section.id} className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <section.icon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground text-base">
                        {section.title}
                      </h2>
                      <p className="text-muted-foreground text-[13px]">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {section.articles.map(article => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-muted-foreground text-[13px]">
                            {article.summary}
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredSections.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum resultado encontrado para "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Article View */
          <div className="max-w-[800px]">
            <div className="bg-card rounded-xl border border-border p-8">
              <h1 className="text-2xl font-semibold text-foreground mb-4">
                {selectedArticle.title}
              </h1>
              <p className="text-muted-foreground text-base mb-8">
                {selectedArticle.summary}
              </p>
              <div className="text-foreground text-[15px] leading-relaxed whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
