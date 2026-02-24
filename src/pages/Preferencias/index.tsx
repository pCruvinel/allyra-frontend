import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Bell, Lock, Globe, Palette, Moon, Sun, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { useTheme } from '@/contexts/ThemeContext'
import { toast } from 'sonner'

interface UserSettings {
  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  appointmentReminders: boolean
  reportUpdates: boolean
  // Privacy
  showProfile: boolean
  allowDataAnalytics: boolean
  // Language
  language: string
  // Appearance
  compactMode: boolean
  animationsEnabled: boolean
}

const STORAGE_KEY = 'allyra_user_settings'

function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return {
    emailNotifications: true,
    pushNotifications: false,
    appointmentReminders: true,
    reportUpdates: true,
    showProfile: true,
    allowDataAnalytics: false,
    language: 'pt-BR',
    compactMode: false,
    animationsEnabled: true,
  }
}

export function PreferenciasPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings>(loadSettings)

  const isDarkMode = theme === 'dark'

  const handleToggleDarkMode = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    toast.success('Configurações salvas com sucesso!')
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
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>

        <div className="space-y-6 max-w-[800px]">
          {/* Appearance Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">
                  Aparência
                </h2>
                <p className="text-muted-foreground text-[13px]">
                  Personalize a interface do sistema
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon size={20} className="text-primary" />
                  ) : (
                    <Sun size={20} className="text-primary" />
                  )}
                  <div>
                    <Label className="font-medium text-sm text-foreground">
                      Modo Escuro
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Ativar tema escuro para reduzir cansaço visual
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={handleToggleDarkMode}
                />
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Modo Compacto
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Reduzir espaçamentos para exibir mais informações
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, compactMode: checked })}
                />
              </div>

              {/* Animations */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Animações
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Habilitar animações e transições
                  </p>
                </div>
                <Switch
                  checked={settings.animationsEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, animationsEnabled: checked })}
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">
                  Notificações
                </h2>
                <p className="text-muted-foreground text-[13px]">
                  Gerencie como você recebe notificações
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Notificações por E-mail
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Receber atualizações importantes por e-mail
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Notificações Push
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Receber notificações em tempo real no navegador
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Lembretes de Atendimento
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Receber lembretes 30 minutos antes dos atendimentos
                  </p>
                </div>
                <Switch
                  checked={settings.appointmentReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, appointmentReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Atualizações de Relatórios
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Notificar quando relatórios forem visualizados pela família
                  </p>
                </div>
                <Switch
                  checked={settings.reportUpdates}
                  onCheckedChange={(checked) => setSettings({ ...settings, reportUpdates: checked })}
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">
                  Privacidade e Segurança
                </h2>
                <p className="text-muted-foreground text-[13px]">
                  Controle suas informações e privacidade
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Perfil Público
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Permitir que outros usuários vejam seu perfil
                  </p>
                </div>
                <Switch
                  checked={settings.showProfile}
                  onCheckedChange={(checked) => setSettings({ ...settings, showProfile: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="font-medium text-sm text-foreground">
                    Análise de Dados
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Permitir coleta de dados anônimos para melhorar o sistema
                  </p>
                </div>
                <Switch
                  checked={settings.allowDataAnalytics}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowDataAnalytics: checked })}
                />
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">
                  Idioma e Região
                </h2>
                <p className="text-muted-foreground text-[13px]">
                  Configure idioma e formatos regionais
                </p>
              </div>
            </div>

            <div>
              <Select
                label="Idioma do Sistema"
                value={settings.language}
                onChange={(value) => setSettings({ ...settings, language: value })}
                options={[
                  { value: 'pt-BR', label: 'Português (Brasil)' },
                  { value: 'en-US', label: 'English (US)' },
                  { value: 'es-ES', label: 'Español' },
                ]}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={handleBack} className="rounded-lg">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-lg bg-primary hover:bg-primary/90">
              <Save size={18} className="mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
