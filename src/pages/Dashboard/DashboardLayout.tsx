import { MainLayout } from '@/components/layout'
import { DashboardPage } from './DashboardPage'

export function DashboardLayout() {
  return (
    <MainLayout
      title="Início"
      breadcrumb={[{ label: 'Atendimento' }]}
    >
      <DashboardPage />
    </MainLayout>
  )
}
