import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Mail, MessageSquare, Phone, Send, HelpCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface TicketData {
  subject: string
  category: string
  message: string
  email: string
}

export function AjudaSuportePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq')
  const [ticketData, setTicketData] = useState<TicketData>({
    subject: '',
    category: 'technical',
    message: '',
    email: user?.email || ''
  })
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  const faqs = [
    {
      category: 'Geral',
      questions: [
        {
          q: 'Como faço para começar a usar o Allyra?',
          a: 'Para começar, acesse a aba "Agenda" para criar seus primeiros agendamentos. Você também pode cadastrar pacientes em "Pacientes" e explorar o Dashboard para ter uma visão geral da clínica.'
        },
        {
          q: 'Posso usar o Allyra em dispositivos móveis?',
          a: 'Sim! O Allyra é responsivo e funciona perfeitamente em tablets e smartphones. Você pode acessar de qualquer dispositivo com navegador e conexão à internet.'
        },
        {
          q: 'Meus dados estão seguros?',
          a: 'Sim. Todos os dados são criptografados e armazenados em servidores seguros seguindo as normas da LGPD. Implementamos as melhores práticas de segurança para proteger as informações dos seus pacientes.'
        }
      ]
    },
    {
      category: 'Agenda e Agendamentos',
      questions: [
        {
          q: 'Como cancelar um agendamento?',
          a: 'Acesse a Agenda, clique no agendamento que deseja cancelar e selecione a opção "Cancelar". Você pode adicionar um motivo do cancelamento que ficará registrado no histórico.'
        },
        {
          q: 'É possível criar agendamentos recorrentes?',
          a: 'Sim! Ao criar um novo agendamento, marque a opção "Repetir agendamento" e configure a frequência desejada (semanal, quinzenal ou mensal).'
        },
        {
          q: 'Como enviar lembretes para os pacientes?',
          a: 'O sistema envia lembretes automaticamente por email e/ou WhatsApp (se configurado). Você pode personalizar os lembretes em Configurações > Notificações.'
        }
      ]
    },
    {
      category: 'Pacientes e Prontuários',
      questions: [
        {
          q: 'Como adicionar documentos ao prontuário?',
          a: 'Acesse a ficha do paciente, vá para a aba "Prontuário" e clique em "Anexar Documento". Você pode fazer upload de PDFs, imagens e outros arquivos.'
        },
        {
          q: 'Posso exportar o prontuário de um paciente?',
          a: 'Sim. Na ficha do paciente, clique em "Exportar" para gerar um PDF completo com todo o histórico, evoluções e documentos anexados.'
        },
        {
          q: 'Como funciona o compartilhamento de prontuário?',
          a: 'Você pode compartilhar o prontuário com outros profissionais da clínica através das permissões de acesso. Cada profissional só vê os pacientes aos quais tem acesso.'
        }
      ]
    },
    {
      category: 'Financeiro',
      questions: [
        {
          q: 'Como gerar boletos para os pacientes?',
          a: 'Acesse Financeiro > Contas a Receber, selecione a fatura e clique em "Gerar Boleto". O boleto será enviado automaticamente para o email do paciente.'
        },
        {
          q: 'Como configurar o repasse dos profissionais?',
          a: 'Em Configurações > Repasses, você pode definir o percentual ou valor fixo que cada profissional recebe por atendimento ou por tipo de serviço.'
        },
        {
          q: 'O sistema emite nota fiscal?',
          a: 'O Allyra possui integração para emissão de NFS-e. Configure seu certificado digital em Configurações > Nota Fiscal para começar a emitir.'
        }
      ]
    }
  ]

  const handleSubmitTicket = () => {
    if (!ticketData.subject || !ticketData.message) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    // Simulate ticket submission
    setTimeout(() => {
      setTicketSubmitted(true)
      toast.success('Ticket enviado com sucesso! Responderemos em breve.')
    }, 1000)
  }

  const handleBack = () => {
    navigate({ to: '/' })
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
          <span className="font-medium text-sm">Voltar</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Ajuda e Suporte
          </h1>
          <p className="text-sm text-muted-foreground">
            Encontre respostas ou entre em contato com nossa equipe
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Mail size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">
              E-mail
            </h3>
            <p className="text-muted-foreground text-[13px] mb-2">
              suporte@allyra.com.br
            </p>
            <p className="text-muted-foreground text-xs">
              Resposta em até 24h
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">
              Chat Online
            </h3>
            <p className="text-muted-foreground text-[13px] mb-2">
              Segunda a Sexta
            </p>
            <p className="text-muted-foreground text-xs">
              9h às 18h
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Phone size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">
              Telefone
            </h3>
            <p className="text-muted-foreground text-[13px] mb-2">
              (11) 3000-0000
            </p>
            <p className="text-muted-foreground text-xs">
              Suporte Premium
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-5 py-3 rounded-t-lg font-medium text-sm transition-colors ${
              activeTab === 'faq'
                ? 'bg-card text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={18} />
              Perguntas Frequentes
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('contact')
              setTicketSubmitted(false)
            }}
            className={`px-5 py-3 rounded-t-lg font-medium text-sm transition-colors ${
              activeTab === 'contact'
                ? 'bg-card text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              Abrir Ticket
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'faq' ? (
          <div className="space-y-6">
            {faqs.map((category, idx) => (
              <div key={idx} className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-semibold text-foreground text-lg mb-5">
                  {category.category}
                </h2>
                <div className="space-y-5">
                  {category.questions.map((faq, qIdx) => (
                    <div key={qIdx} className="border-b border-border pb-5 last:border-b-0 last:pb-0">
                      <h3 className="font-semibold text-foreground text-[15px] mb-2">
                        {faq.q}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-[700px]">
            {!ticketSubmitted ? (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-semibold text-foreground text-lg mb-5">
                  Abrir Ticket de Suporte
                </h2>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="mb-2 block">
                      Seu E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={ticketData.email}
                      onChange={(e) => setTicketData({ ...ticketData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Select
                      label="Categoria"
                      value={ticketData.category}
                      onChange={(value) => setTicketData({ ...ticketData, category: value })}
                      options={[
                        { value: 'technical', label: 'Problema Técnico' },
                        { value: 'billing', label: 'Financeiro' },
                        { value: 'feature', label: 'Sugestão de Funcionalidade' },
                        { value: 'other', label: 'Outro' },
                      ]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="mb-2 block">
                      Assunto *
                    </Label>
                    <Input
                      id="subject"
                      value={ticketData.subject}
                      onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                      placeholder="Resuma seu problema ou dúvida"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="mb-2 block">
                      Mensagem *
                    </Label>
                    <textarea
                      id="message"
                      value={ticketData.message}
                      onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                      className="w-full min-h-[150px] px-3 py-2 border border-input rounded-lg text-sm bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Descreva seu problema ou dúvida em detalhes..."
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                    <Button variant="outline" onClick={handleBack} className="flex-1 rounded-lg">
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmitTicket} className="flex-1 rounded-lg bg-primary hover:bg-primary/90">
                      <Send size={18} className="mr-2" />
                      Enviar Ticket
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                </div>
                <h2 className="font-semibold text-foreground text-2xl mb-3">
                  Ticket Enviado com Sucesso!
                </h2>
                <p className="text-muted-foreground text-[15px] mb-2">
                  Recebemos sua solicitação e nossa equipe entrará em contato em breve.
                </p>
                <p className="text-muted-foreground text-sm mb-8">
                  Número do ticket: <span className="font-semibold text-primary">#{`AL${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`}</span>
                </p>
                <Button onClick={() => setTicketSubmitted(false)} variant="outline" className="rounded-lg">
                  Abrir Outro Ticket
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
