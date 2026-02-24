import { useState, useRef, useEffect } from 'react'
import { X, Send, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatDepartments, chatContacts } from '@/data/mock'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { ChatDepartment, ChatContact, ChatMessage } from '@/types'

type ChatStep = 'departments' | 'contacts' | 'conversation'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

// Componente de conteúdo do chat (compartilhado entre mobile e desktop)
interface ChatContentProps {
  step: ChatStep
  selectedDepartment: ChatDepartment | null
  selectedContact: ChatContact | null
  messages: ChatMessage[]
  inputValue: string
  filteredContacts: ChatContact[]
  messagesEndRef: React.RefObject<HTMLDivElement>
  onSelectDepartment: (dept: ChatDepartment) => void
  onSelectContact: (contact: ChatContact) => void
  onBack: () => void
  onClose: () => void
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  showHeader?: boolean
}

function ChatContent({
  step,
  selectedContact,
  messages,
  inputValue,
  filteredContacts,
  messagesEndRef,
  onSelectDepartment,
  onSelectContact,
  onBack,
  onClose,
  onInputChange,
  onSendMessage,
  onKeyPress,
  showHeader = true,
}: ChatContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header - apenas em desktop */}
      {showHeader && (
        <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== 'departments' && (
              <button
                onClick={onBack}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="font-medium text-sm">Chat</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subheader */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          {!showHeader && step !== 'departments' && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <h3 className="font-semibold text-sm text-foreground">
            {step === 'conversation' && selectedContact
              ? selectedContact.name
              : 'Converse internamente'}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        {step === 'departments' && (
          <div className="p-4 space-y-2">
            {/* Assistant message */}
            <div className="mb-4">
              <div className="bg-primary text-white rounded-lg p-3 max-w-[85%]">
                <p className="text-[10px] text-primary-foreground/70 mb-1">Assistente de comunicação</p>
                <p className="text-sm">Olá, sou o assistente de comunicação. Com qual setor deseja se comunicar?</p>
              </div>
            </div>

            {/* Department options */}
            {chatDepartments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => onSelectDepartment(dept)}
                className="w-full text-left px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
              >
                {dept.name}
              </button>
            ))}
          </div>
        )}

        {step === 'contacts' && (
          <div className="p-4 space-y-2">
            {/* Assistant messages */}
            {messages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <div className="bg-primary text-white rounded-lg p-3 max-w-[85%]">
                  <p className="text-[10px] text-primary-foreground/70 mb-1">{msg.senderName}</p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Contact options */}
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className="w-full text-left px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
              >
                {contact.name}
              </button>
            ))}

            {/* Back button */}
            <button
              onClick={onBack}
              className="w-full text-left px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Voltar
            </button>
          </div>
        )}

        {step === 'conversation' && (
          <div className="p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.isFromMe ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'rounded-lg p-3 max-w-[85%]',
                    msg.isFromMe
                      ? 'bg-primary text-white'
                      : 'bg-primary/80 text-white'
                  )}
                >
                  {!msg.isFromMe && (
                    <p className="text-[10px] text-primary-foreground/70 mb-1">
                      {msg.senderName} {msg.senderRole && `- ${msg.senderRole}`}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Sua mensagem"
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-foreground"
          />
          <button
            onClick={onSendMessage}
            disabled={!inputValue.trim()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              inputValue.trim()
                ? 'text-primary hover:bg-primary/10'
                : 'text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [step, setStep] = useState<ChatStep>('departments')
  const [selectedDepartment, setSelectedDepartment] = useState<ChatDepartment | null>(null)
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setStep('departments')
      setSelectedDepartment(null)
      setSelectedContact(null)
      setMessages([])
      setInputValue('')
    }
  }, [isOpen])

  const handleSelectDepartment = (department: ChatDepartment) => {
    setSelectedDepartment(department)
    setMessages([
      {
        id: '1',
        content: `Você selecionou "${department.name}"`,
        senderId: 'assistant',
        senderName: 'Assistente de comunicação',
        timestamp: new Date(),
        isFromMe: false,
      },
      {
        id: '2',
        content: 'Agora selecione com quem da recepção você deseja falar',
        senderId: 'assistant',
        senderName: 'Assistente de comunicação',
        timestamp: new Date(),
        isFromMe: false,
      },
    ])
    setStep('contacts')
  }

  const handleSelectContact = (contact: ChatContact) => {
    setSelectedContact(contact)
    setMessages([
      {
        id: '1',
        content: 'Olá, do que precisa?',
        senderId: contact.id,
        senderName: contact.name,
        senderRole: contact.role,
        timestamp: new Date(),
        isFromMe: false,
      },
    ])
    setStep('conversation')
  }

  const handleBack = () => {
    if (step === 'contacts') {
      setStep('departments')
      setSelectedDepartment(null)
      setMessages([])
    } else if (step === 'conversation') {
      setStep('contacts')
      setSelectedContact(null)
      setMessages([
        {
          id: '1',
          content: `Você selecionou "${selectedDepartment?.name}"`,
          senderId: 'assistant',
          senderName: 'Assistente de comunicação',
          timestamp: new Date(),
          isFromMe: false,
        },
        {
          id: '2',
          content: 'Agora selecione com quem da recepção você deseja falar',
          senderId: 'assistant',
          senderName: 'Assistente de comunicação',
          timestamp: new Date(),
          isFromMe: false,
        },
      ])
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      senderId: 'me',
      senderName: 'Você',
      timestamp: new Date(),
      isFromMe: true,
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue('')

    // Simula resposta após 1 segundo
    if (selectedContact) {
      setTimeout(() => {
        const response: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Entendido! Vou verificar e já te respondo.',
          senderId: selectedContact.id,
          senderName: selectedContact.name,
          senderRole: selectedContact.role,
          timestamp: new Date(),
          isFromMe: false,
        }
        setMessages((prev) => [...prev, response])
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredContacts = selectedDepartment
    ? chatContacts.filter((c) => c.departmentId === selectedDepartment.id)
    : []

  // Props compartilhadas para o conteúdo do chat
  const chatContentProps = {
    step,
    selectedDepartment,
    selectedContact,
    messages,
    inputValue,
    filteredContacts,
    messagesEndRef,
    onSelectDepartment: handleSelectDepartment,
    onSelectContact: handleSelectContact,
    onBack: handleBack,
    onClose,
    onInputChange: setInputValue,
    onSendMessage: handleSendMessage,
    onKeyPress: handleKeyPress,
  }

  // Mobile: usar BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Chat"
        description="Converse internamente com sua equipe"
        snapPoints={[0.6, 0.9]}
        className="h-[80vh]"
      >
        <div className="h-full -mx-4 -mb-8 -mt-4">
          <ChatContent {...chatContentProps} showHeader={false} />
        </div>
      </BottomSheet>
    )
  }

  // Desktop: usar painel fixo
  if (!isOpen) return null

  return (
    <div className="fixed bottom-24 right-6 w-80 h-[500px] bg-background rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden border border-border">
      <ChatContent {...chatContentProps} showHeader={true} />
    </div>
  )
}
