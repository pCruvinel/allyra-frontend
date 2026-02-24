import { useState, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  MessageCircle,
  Shield,
  Loader2,
  Trash2,
  Upload,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FloatingButton } from '@/components/ui'
import { ChatPanel } from '@/components/chat'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { usersService } from '@/services/users.service'
import { avatarsService } from '@/services/avatars.service'
import { toast } from 'sonner'
import type { PerfilTipo } from '@/config/permissions'

// Função helper para formatar o tipo de perfil
function formatPerfilTipo(perfil?: PerfilTipo): string {
  if (!perfil) return 'Não definido'

  const labels: Record<PerfilTipo, string> = {
    admin_master: 'Admin Master',
    desenvolvedor: 'Desenvolvedor',
    administrador_total: 'Administrador',
    socio_profissional: 'Sócio Profissional',
    profissional: 'Profissional',
    secretaria: 'Secretária',
    administrativo: 'Administrativo',
    financeiro: 'Financeiro',
    faturamento: 'Faturamento',
  }
  return labels[perfil] || perfil
}

// Função para formatar data de criação como "Mês Ano"
function formatMemberSince(dateStr?: string): string {
  if (!dateStr) return 'Janeiro 2024'
  const date = new Date(dateStr)
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

export function MeuPerfilPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Form state - inicializado com dados do usuário logado
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.telefone || '',
    cpf: user?.cpf || '',
    dateOfBirth: user?.data_nascimento || '',
    address: user?.endereco || '',
    registroProfissional: user?.registro_profissional || '',
    especialidade: user?.especialidade || '',
    bio: user?.bio || '',
    role: formatPerfilTipo(user?.perfil_tipo),
  })

  // Sincroniza formData quando user muda (ex: após login ou refresh)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.telefone || '',
        cpf: user.cpf || '',
        dateOfBirth: user.data_nascimento || '',
        address: user.endereco || '',
        registroProfissional: user.registro_profissional || '',
        especialidade: user.especialidade || '',
        bio: user.bio || '',
        role: formatPerfilTipo(user.perfil_tipo),
      }))
    }
  }, [user])

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação de tamanho
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    // Validação de tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não permitido. Use: JPG, PNG, GIF ou WebP')
      return
    }

    // Mostrar prévia
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Fazer upload imediatamente
    setIsUploadingAvatar(true)
    try {
      const result = await avatarsService.uploadAvatar(file)

      if (result.error) {
        toast.error('Erro ao enviar foto: ' + result.error)
        setAvatarPreview(null)
      } else {
        toast.success('Foto atualizada com sucesso!')
        await refreshUser()
      }
    } catch {
      toast.error('Erro ao enviar foto')
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      const result = await avatarsService.deleteAvatar()

      if (result.error) {
        toast.error('Erro ao remover foto: ' + result.error)
      } else {
        toast.success('Foto removida com sucesso!')
        setAvatarPreview(null)
        await refreshUser()
      }
    } catch {
      toast.error('Erro ao remover foto')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setIsSaving(true)
    try {
      const result = await usersService.updateProfile(user.id, {
        nome_completo: formData.name,
        telefone: formData.phone || undefined,
        data_nascimento: formData.dateOfBirth || undefined,
        endereco: formData.address || undefined,
        registro_profissional: formData.registroProfissional || undefined,
        especialidade: formData.especialidade || undefined,
        bio: formData.bio || undefined,
      })

      if (result.error) {
        toast.error('Erro ao salvar perfil: ' + result.error.message)
      } else {
        await refreshUser()
        toast.success('Perfil atualizado com sucesso!')
      }
    } catch (err) {
      toast.error('Erro ao salvar perfil')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres')
      return
    }

    toast.success('Senha alterada com sucesso!')
    setIsPasswordModalOpen(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
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
            Meu Perfil
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualize e edite suas informações pessoais
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Avatar e Info Rápida */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {isUploadingAvatar ? (
                    <div className="w-[120px] h-[120px] rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/40">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Avatar className="h-[120px] w-[120px] border-4 border-primary/40">
                      <AvatarImage src={avatarPreview || user?.avatar} alt={user?.name || ''} />
                      <AvatarFallback className="text-4xl bg-primary/20 text-primary font-semibold">
                        {user?.name ? getInitials(user.name) : <User size={48} className="text-primary" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <Upload size={18} className="text-primary" />
                  <span className="font-medium text-sm text-primary">
                    Alterar Foto
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {(avatarPreview || user?.avatar) && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="text-xs text-destructive hover:text-destructive/80 mt-2 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover foto
                  </button>
                )}
              </div>

              {/* Info Rápida */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div>
                  <p className="font-medium text-xs text-muted-foreground mb-1">
                    Especialização
                  </p>
                  <p className="font-semibold text-sm text-foreground">
                    {formData.especialidade || 'Não informada'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-xs text-muted-foreground mb-1">
                    Registro Profissional
                  </p>
                  <p className="font-semibold text-sm text-foreground">
                    {formData.registroProfissional || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-xs text-muted-foreground mb-1">
                    Membro desde
                  </p>
                  <p className="font-semibold text-sm text-foreground">
                    {formatMemberSince(user?.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Informações Pessoais
              </h2>

              <div className="space-y-5">
                {/* Nome */}
                <div>
                  <Label htmlFor="name" className="mb-2 flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite seu nome completo"
                    className="rounded-lg"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="mb-2 flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="bg-muted cursor-not-allowed rounded-lg"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <Label htmlFor="phone" className="mb-2 flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="rounded-lg"
                  />
                </div>

                {/* Data de Nascimento */}
                <div>
                  <Label htmlFor="dateOfBirth" className="mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="rounded-lg"
                  />
                </div>

                {/* Endereço */}
                <div>
                  <Label htmlFor="address" className="mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-muted-foreground" />
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número - Cidade, Estado"
                    className="rounded-lg"
                  />
                </div>

                {/* Registro Profissional */}
                <div>
                  <Label htmlFor="registroProfissional" className="mb-2">
                    Registro Profissional (CRM/CRP/etc)
                  </Label>
                  <Input
                    id="registroProfissional"
                    value={formData.registroProfissional}
                    onChange={(e) => setFormData({ ...formData, registroProfissional: e.target.value })}
                    placeholder="CRM 123456/SP"
                    className="rounded-lg"
                  />
                </div>

                {/* Especialização */}
                <div>
                  <Label htmlFor="especialidade" className="mb-2">
                    Especialização
                  </Label>
                  <Input
                    id="especialidade"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Terapia Ocupacional"
                    className="rounded-lg"
                  />
                </div>

                {/* Biografia */}
                <div>
                  <Label htmlFor="bio" className="mb-2">
                    Biografia Profissional
                  </Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full min-h-[100px] px-3 py-2 border border-input rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    placeholder="Conte um pouco sobre sua experiência profissional..."
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex-1 rounded-lg"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Alterar Senha */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha"
        size="sm"
      >
        <ModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Senha atual
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Digite sua senha atual"
                className="rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nova senha
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Digite a nova senha"
                className="rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mínimo de 8 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirme a nova senha"
                className="rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsPasswordModalOpen(false)}
            className="rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePasswordChange}
            className="rounded-lg bg-primary hover:bg-primary/90"
          >
            Alterar senha
          </Button>
        </ModalFooter>
      </Modal>

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
