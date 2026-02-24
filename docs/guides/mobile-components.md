# Guia de Componentes Mobile

Este guia descreve os componentes e padrões para criar interfaces mobile-first no Allyra.

## Componentes Principais

### AppDrawer

Drawer fullscreen para formulários complexos em mobile.

```tsx
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'

<AppDrawer
  open={isOpen}
  onOpenChange={(open) => !open && onClose()}
  title="Título do Drawer"
  description="Descrição opcional"
>
  <AppDrawerBody>
    {/* Conteúdo scrollável */}
  </AppDrawerBody>
  <AppDrawerFooter>
    {/* Actions fixas no rodapé */}
  </AppDrawerFooter>
</AppDrawer>
```

**Props:**
- `open`: boolean - Controla visibilidade
- `onOpenChange`: (open: boolean) => void - Callback de mudança
- `title`: string - Título no header
- `description?`: string - Descrição opcional
- `showBackButton?`: boolean - Mostra botão voltar ao invés de X
- `onBack?`: () => void - Callback do botão voltar

### BottomSheet

Sheet parcial para confirmações, detalhes e ações rápidas.

```tsx
import { BottomSheet, BottomSheetFooter } from '@/components/ui/bottom-sheet'

<BottomSheet
  open={isOpen}
  onOpenChange={(open) => !open && onClose()}
  title="Confirmar ação"
  snapPoints={[0.45, 0.65]}
  dismissible
>
  {/* Conteúdo */}
  <BottomSheetFooter>
    {/* Actions */}
  </BottomSheetFooter>
</BottomSheet>
```

**Props:**
- `snapPoints`: number[] - Alturas em % da tela (0.4 = 40%)
- `dismissible`: boolean - Pode fechar arrastando para baixo
- `showHandle`: boolean - Mostra handle de drag (default: true)
- `fullHeight`: boolean - Ocupa altura total do snap

### FormModal

Modal que automaticamente usa AppDrawer em mobile.

```tsx
import { FormModal, FormModalBody, FormModalFooter } from '@/components/ui/form-modal'

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  title="Novo Registro"
>
  <FormModalBody>
    {/* Formulário */}
  </FormModalBody>
  <FormModalFooter>
    {/* Botões */}
  </FormModalFooter>
</FormModal>
```

## Detecção de Mobile

```tsx
import { useIsMobile } from '@/hooks/useMediaQuery'

function MyComponent() {
  const isMobile = useIsMobile() // < 768px

  if (isMobile) {
    return <MobileVersion />
  }
  return <DesktopVersion />
}
```

## Padrões de Layout

### Footer Mobile (Stack Vertical)

```tsx
const mobileActions = (
  <div className="flex flex-col gap-3 w-full">
    <Button className="w-full rounded-full bg-primary hover:bg-primary/90">
      Ação Primária
    </Button>
    <Button variant="outline" className="w-full rounded-full">
      Cancelar
    </Button>
  </div>
)
```

### Grid Responsivo

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input />
  <Input />
</div>
```

## Categorização de Modais

### Usar AppDrawer (Fullscreen)
- Formulários com 4+ campos
- Conteúdo com múltiplas seções
- Modais com tabs
- Tabelas ou listas longas

### Usar BottomSheet (Partial)
- Confirmações (snap: 40-50%)
- Detalhes read-only (snap: 55-75%)
- Seleção de opções (snap: 50-70%)
- Ações rápidas (snap: 40-50%)

## Snap Points Recomendados

| Tipo de Conteúdo | Snap Points |
|------------------|-------------|
| Confirmação simples | [0.4] |
| Confirmação com form | [0.45, 0.55] |
| Detalhes curtos | [0.5, 0.65] |
| Detalhes longos | [0.7, 0.9] |
| Lista de opções | [0.5, 0.75] |

## Exemplo Completo

```tsx
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { AppDrawer, AppDrawerBody, AppDrawerFooter } from '@/components/ui/app-drawer'
import { useIsMobile } from '@/hooks/useMediaQuery'

function MeuModal({ isOpen, onClose }) {
  const isMobile = useIsMobile()

  const content = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nome" />
        <Input label="Email" />
      </div>
    </div>
  )

  const mobileActions = (
    <div className="flex flex-col gap-3 w-full">
      <Button className="w-full rounded-full">Salvar</Button>
      <Button variant="outline" className="w-full rounded-full" onClick={onClose}>
        Cancelar
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <AppDrawer open={isOpen} onOpenChange={(o) => !o && onClose()} title="Novo Item">
        <AppDrawerBody>{content}</AppDrawerBody>
        <AppDrawerFooter>{mobileActions}</AppDrawerFooter>
      </AppDrawer>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Item">
      <ModalBody>{content}</ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button>Salvar</Button>
      </ModalFooter>
    </Modal>
  )
}
```

## Componentes de Página

### ResponsiveFilterBar

Barra de filtros que mostra inline no desktop e em BottomSheet no mobile.

```tsx
import { ResponsiveFilterBar } from '@/components/ui/responsive-filter-bar'

<ResponsiveFilterBar
  title="Filtros"
  hasActiveFilters={hasFilters}
  activeFiltersCount={3}
  onApply={() => applyFilters()}
  onClear={() => clearFilters()}
>
  <Select label="Status" options={statusOptions} ... />
  <Input label="Buscar" ... />
</ResponsiveFilterBar>
```

**Props:**
- `title`: string - Título do BottomSheet (mobile)
- `hasActiveFilters`: boolean - Indica se há filtros ativos
- `activeFiltersCount`: number - Contador de filtros (badge)
- `onApply`: () => void - Callback ao aplicar (mobile)
- `onClear`: () => void - Callback ao limpar filtros

### ResponsiveTabs

Tabs que mostram como TabsList no desktop e Select no mobile.

```tsx
import { ResponsiveTabs, ResponsiveTabsContent } from '@/components/ui/responsive-tabs'

const tabs = [
  { value: 'geral', label: 'Geral' },
  { value: 'config', label: 'Configurações' },
]

<ResponsiveTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab}>
  <ResponsiveTabsContent value="geral">
    {/* Conteúdo da tab Geral */}
  </ResponsiveTabsContent>
  <ResponsiveTabsContent value="config">
    {/* Conteúdo da tab Configurações */}
  </ResponsiveTabsContent>
</ResponsiveTabs>
```

**Props:**
- `tabs`: TabItem[] - Lista de tabs ({ value, label, icon? })
- `value`: string - Tab ativa
- `onValueChange`: (value: string) => void - Callback de mudança

## Checklist de Teste

- [ ] Testar em viewports: 320px, 375px, 414px
- [ ] Testar com teclado virtual aberto
- [ ] Testar gestos de swipe/drag
- [ ] Testar em dark mode
- [ ] Verificar scroll em conteúdo longo
- [ ] Verificar footer sempre visível
