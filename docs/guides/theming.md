# Sistema de Cores e Theming - Allyra

Este documento descreve o sistema de cores e theming do projeto Allyra.

## Arquitetura

O sistema de cores é centralizado em dois arquivos:

| Arquivo | Função |
|---------|--------|
| `src/index.css` | Variáveis CSS com valores HSL |
| `tailwind.config.js` | Mapeamento para classes Tailwind |

## Modo Escuro

O dark mode usa a estratégia `class` do Tailwind:

```javascript
// tailwind.config.js
darkMode: ["class"]
```

Para ativar o modo escuro, adicione a classe `dark` no elemento `<html>`:

```html
<html class="dark">
```

## Variáveis CSS (HSL)

### Cores Base

| Variável | Light | Dark | Uso |
|----------|-------|------|-----|
| `--background` | `0 0% 100%` | `240 10% 4%` | Fundo da página |
| `--foreground` | `240 10% 4%` | `0 0% 97%` | Texto principal |
| `--primary` | `263 70% 76%` | `263 70% 76%` | Cor principal (roxo) |
| `--muted` | `240 5% 93%` | `240 4% 16%` | Fundos secundários |

### Cores do Sidebar

| Variável | Uso |
|----------|-----|
| `--sidebar` | Fundo do sidebar |
| `--sidebar-foreground` | Texto do sidebar |
| `--sidebar-primary` | Item ativo |
| `--sidebar-accent` | Hover de itens |

### Cores Semânticas

```css
--color-success: #10b981;  /* Verde - Sucesso */
--color-warning: #ffc107;  /* Amarelo - Aviso */
--color-error: #dc3545;    /* Vermelho - Erro */
```

### Cores White Label (Personalizáveis)

```css
--brand-primary: #a78bfa;        /* Cor principal da marca */
--brand-primary-hover: #8b5cf6;  /* Hover */
--brand-primary-light: #f5f3ff;  /* Fundo claro */
--brand-primary-accent: #ede9fe; /* Acento */
```

## Classes Tailwind

### Usando cores no código

```tsx
// Cores base
<div className="bg-background text-foreground">

// Cor primária
<button className="bg-primary text-primary-foreground">

// Cor destrutiva
<button className="bg-destructive text-destructive-foreground">

// Cores mutadas
<span className="text-muted-foreground">

// Bordas
<div className="border border-border">

// Sidebar
<nav className="bg-sidebar text-sidebar-foreground">
```

### Cores semânticas

```tsx
<span className="text-success">Sucesso</span>
<span className="text-warning">Aviso</span>
<span className="text-error">Erro</span>
```

## Personalização por Clínica (White Label)

O sistema suporta personalização por clínica via variáveis `--brand-*`.

### Como personalizar

1. Sobrescreva as variáveis CSS no contexto da clínica:

```typescript
// Em um futuro ThemeContext
const applyClinicTheme = (clinicaId: string, cores: ClinicaCores) => {
  document.documentElement.style.setProperty('--brand-primary', cores.primary)
  document.documentElement.style.setProperty('--brand-primary-hover', cores.primaryHover)
}
```

2. Ou via classe CSS por clínica:

```css
.clinica-abc {
  --brand-primary: #3b82f6;
  --primary: 217 91% 60%;
}
```

## Charts

Cores pré-definidas para gráficos:

```css
--chart-1: 12 76% 61%;   /* Laranja */
--chart-2: 173 58% 39%;  /* Verde-azulado */
--chart-3: 197 37% 24%;  /* Azul escuro */
--chart-4: 43 74% 66%;   /* Amarelo */
--chart-5: 27 87% 67%;   /* Laranja claro */
```

```tsx
<div className="bg-chart-1" />
<div className="bg-chart-2" />
```

## Border Radius

```css
--radius: 0.625rem;  /* 10px base */
```

```tsx
<div className="rounded-sm" />  /* 6px */
<div className="rounded-md" />  /* 8px */
<div className="rounded-lg" />  /* 10px */
<div className="rounded-xl" />  /* 14px */
```

## Fontes

```javascript
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
  display: ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
}
```

```tsx
<h1 className="font-display">Título</h1>
<p className="font-sans">Texto</p>
```

## Toggle de Tema (Dark Mode) ✅ IMPLEMENTADO

O toggle de tema está implementado e funcional.

### Arquivos

| Arquivo | Função |
|---------|--------|
| `src/contexts/ThemeContext.tsx` | Context com estado e toggle |
| `src/components/layout/Sidebar.tsx` | Botão de toggle (Sun/Moon) |
| `src/main.tsx` | ThemeProvider na árvore de componentes |

### Uso

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button onClick={toggleTheme}>
      {isDark ? 'Modo claro' : 'Modo escuro'}
    </button>
  )
}
```

### API do ThemeContext

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `theme` | `'light' \| 'dark'` | Tema atual |
| `isDark` | `boolean` | Atalho para `theme === 'dark'` |
| `toggleTheme` | `() => void` | Alterna entre light/dark |
| `setTheme` | `(theme) => void` | Define tema específico |

### Persistência

- Salvo em localStorage: `allyra_theme`
- Aplica classe `dark` no `<html>` automaticamente
- Respeita preferência do sistema se não houver valor salvo
