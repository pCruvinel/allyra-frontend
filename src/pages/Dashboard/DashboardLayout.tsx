import { MainLayout } from '@/components/layout'
import { useModal } from '@/contexts'
import { DashboardPage } from './DashboardPage'

export function DashboardLayout() {
  const { openModal } = useModal()

  return (
    <MainLayout
      title="Início"
      breadcrumb={[{ label: 'Atendimento' }]}
      actionButton={{
        label: 'Adicionar agendamento',
        onClick: () => openModal('appointment'),
      }}
    >
      <DashboardPage />
    </MainLayout>
  )
}
