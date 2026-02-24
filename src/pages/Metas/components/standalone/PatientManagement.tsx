/**
 * PatientManagement - Gestão de pacientes no modo stand-alone
 * CRUD completo com tabela e modais
 */

import { useState, useMemo } from 'react'
import { Users, Plus, Upload, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { useStandalonePatients, type StandalonePatientFormData } from '../../hooks/useStandalonePatients'
import type { StandalonePatient } from '@/services/metas-standalone.service'
import { toast } from 'sonner'

interface PatientManagementProps {
  searchQuery?: string
}

export function PatientManagement({ searchQuery = '' }: PatientManagementProps) {
  const {
    patients,
    isLoading,
    createPatient,
    updatePatient,
    deletePatient,
    togglePatientStatus,
  } = useStandalonePatients()

  // Filtrar pacientes pela busca
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients
    const query = searchQuery.toLowerCase()
    return patients.filter(
      (p) =>
        p.nome.toLowerCase().includes(query) ||
        p.responsavel?.toLowerCase().includes(query) ||
        p.telefone?.includes(query)
    )
  }, [patients, searchQuery])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<StandalonePatient | null>(null)
  const [formData, setFormData] = useState<StandalonePatientFormData>({
    nome: '',
    dataNascimento: '',
    responsavel: '',
    telefone: '',
  })

  const handleOpenDialog = (patient?: StandalonePatient) => {
    if (patient) {
      setEditingPatient(patient)
      setFormData({
        nome: patient.nome,
        dataNascimento: patient.data_nascimento || '',
        responsavel: patient.responsavel || '',
        telefone: patient.telefone || '',
      })
    } else {
      setEditingPatient(null)
      setFormData({
        nome: '',
        dataNascimento: '',
        responsavel: '',
        telefone: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingPatient(null)
    setFormData({
      nome: '',
      dataNascimento: '',
      responsavel: '',
      telefone: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast.error('O nome do paciente é obrigatório')
      return
    }

    if (editingPatient) {
      updatePatient(editingPatient.id, formData)
    } else {
      createPatient(formData)
    }

    handleCloseDialog()
  }

  const handleDelete = (patient: StandalonePatient) => {
    if (confirm(`Tem certeza que deseja excluir o paciente "${patient.nome}"?`)) {
      deletePatient(patient.id)
    }
  }

  const handleImportData = () => {
    toast.info('Funcionalidade de importação em desenvolvimento')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gestão de Pacientes</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie os pacientes do consultório
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => handleOpenDialog()}>
            <Plus size={16} className="mr-2" />
            Novo Paciente
          </Button>
          <Button variant="outline" onClick={handleImportData}>
            <Upload size={16} className="mr-2" />
            Importar Dados
          </Button>
        </div>
      </div>

      {/* Content */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          description={
            searchQuery
              ? `Não encontramos pacientes para "${searchQuery}". Tente outro termo de busca.`
              : 'Cadastre pacientes para criar planos terapêuticos e registrar atendimentos.'
          }
          action={
            !searchQuery
              ? {
                  label: 'Novo Paciente',
                  onClick: () => handleOpenDialog(),
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Nome do Paciente</TableHead>
                <TableHead className="font-semibold">Idade</TableHead>
                <TableHead className="font-semibold">Responsável</TableHead>
                <TableHead className="font-semibold">Contato</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">
                    {patient.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.idade ? `${patient.idade} anos` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.responsavel || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.telefone || '—'}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => togglePatientStatus(patient.id)}
                      className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                    >
                      {patient.status === 'ativo' ? (
                        <>
                          <CheckCircle size={14} className="text-emerald-500" />
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Ativo
                          </Badge>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="text-muted-foreground" />
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            Inativo
                          </Badge>
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(patient)}
                        className="text-primary hover:bg-primary/10"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(patient)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Dica:</span>{' '}
          Os pacientes cadastrados aqui estarão disponíveis para criação de planos terapêuticos e registro de atendimentos.
        </p>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do paciente. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefone">Contato</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPatient ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
