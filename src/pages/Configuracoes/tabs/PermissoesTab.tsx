import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, Plus, X, Check } from 'lucide-react'
import { useConfigurations } from '@/hooks/useConfigurations'
import { toast } from 'sonner'

interface Role {
  id: string
  label: string
  isCustom?: boolean
}

const defaultRoles: Role[] = [
  { id: 'admin', label: 'Administrador' },
  { id: 'atendente', label: 'Atendente' },
  { id: 'medico', label: 'Médico' },
  { id: 'financeiro', label: 'Financeiro' },
]

const permissionCategories = [
  {
    id: 'atendimento',
    label: 'Atendimento',
    permissions: [
      { id: 'atendimento_visualizar', label: 'Visualizar atendimentos' },
      { id: 'atendimento_criar', label: 'Criar atendimentos' },
      { id: 'atendimento_editar', label: 'Editar atendimentos' },
      { id: 'atendimento_excluir', label: 'Excluir atendimentos' },
    ],
  },
  {
    id: 'agenda',
    label: 'Agenda',
    permissions: [
      { id: 'agenda_visualizar', label: 'Visualizar agenda' },
      { id: 'agenda_agendar', label: 'Criar agendamentos' },
      { id: 'agenda_editar', label: 'Editar agendamentos' },
      { id: 'agenda_cancelar', label: 'Cancelar agendamentos' },
    ],
  },
  {
    id: 'pacientes',
    label: 'Pacientes',
    permissions: [
      { id: 'pacientes_visualizar', label: 'Visualizar pacientes' },
      { id: 'pacientes_criar', label: 'Cadastrar pacientes' },
      { id: 'pacientes_editar', label: 'Editar pacientes' },
      { id: 'pacientes_desativar', label: 'Desativar pacientes' },
      { id: 'pacientes_bloquear', label: 'Bloquear pacientes' },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    permissions: [
      { id: 'relatorios_visualizar', label: 'Visualizar relatórios' },
      { id: 'relatorios_exportar', label: 'Exportar relatórios' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    permissions: [
      { id: 'financeiro_visualizar', label: 'Visualizar financeiro' },
      { id: 'financeiro_faturar', label: 'Faturar consultas' },
      { id: 'financeiro_estornar', label: 'Estornar pagamentos' },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    permissions: [
      { id: 'config_visualizar', label: 'Visualizar configurações' },
      { id: 'config_editar', label: 'Editar configurações' },
      { id: 'config_permissoes', label: 'Gerenciar permissões' },
    ],
  },
]

export function PermissoesTab() {
  const { updatePermissoes, isLoading } = useConfigurations({ autoFetch: false })
  const [selectedRole, setSelectedRole] = useState('admin')
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({})
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['atendimento'])
  const [searchTerm, setSearchTerm] = useState('')
  const [customRoles, setCustomRoles] = useState<Role[]>([])
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const newRoleInputRef = useRef<HTMLInputElement>(null)

  const allRoles = [...defaultRoles, ...customRoles]

  // Focus no input ao abrir
  useEffect(() => {
    if (isAddingRole && newRoleInputRef.current) {
      newRoleInputRef.current.focus()
    }
  }, [isAddingRole])

  const handleAddRole = () => {
    setIsAddingRole(true)
  }

  const handleConfirmNewRole = () => {
    const trimmed = newRoleName.trim()
    if (!trimmed) {
      toast.error('Digite um nome para o nível de permissão')
      return
    }

    const roleId = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (allRoles.some((r) => r.id === roleId)) {
      toast.error('Já existe um nível com esse nome')
      return
    }

    const newRole: Role = { id: roleId, label: trimmed, isCustom: true }
    setCustomRoles((prev) => [...prev, newRole])
    setSelectedRole(roleId)
    setNewRoleName('')
    setIsAddingRole(false)
    toast.success(`Nível "${trimmed}" criado`)
  }

  const handleCancelNewRole = () => {
    setNewRoleName('')
    setIsAddingRole(false)
  }

  const handleRemoveCustomRole = (roleId: string) => {
    setCustomRoles((prev) => prev.filter((r) => r.id !== roleId))
    if (selectedRole === roleId) {
      setSelectedRole('admin')
    }
    toast.success('Nível de permissão removido')
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const togglePermission = (permissionId: string) => {
    setRolePermissions((prev) => ({
      ...prev,
      [permissionId]: !prev[permissionId],
    }))
  }

  const handleSave = async () => {
    await updatePermissoes({
      role: selectedRole,
      permissions: rolePermissions,
    })
  }

  const handleCancel = () => {
    setRolePermissions({})
  }

  const filteredCategories = permissionCategories.filter(
    (category) =>
      category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.permissions.some((p) =>
        p.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
  )

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="space-y-6">
        {/* Role Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nível de permissão
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {allRoles.map((role) => (
              <div key={role.id} className="relative group">
                <button
                  onClick={() => setSelectedRole(role.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedRole === role.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {role.label}
                </button>
                {role.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveCustomRole(role.id)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover nível"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Inline input para novo role */}
            {isAddingRole ? (
              <div className="flex items-center gap-1">
                <Input
                  ref={newRoleInputRef}
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmNewRole()
                    if (e.key === 'Escape') handleCancelNewRole()
                  }}
                  placeholder="Nome do nível..."
                  className="h-9 w-40 text-sm"
                />
                <button
                  onClick={handleConfirmNewRole}
                  className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                  title="Confirmar"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelNewRole}
                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddRole}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Novo
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div>
          <Input
            placeholder="Pesquisar por categoria ou permissão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Permission Categories */}
        <div className="border border-border rounded-xl divide-y divide-border">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground">{category.label}</span>
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {expandedCategories.includes(category.id) && (
                <div className="px-4 pb-3 space-y-2">
                  {category.permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={rolePermissions[permission.id] || false}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <span className="text-sm text-foreground">{permission.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="rounded-full px-8">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading} className="rounded-full px-8">
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
