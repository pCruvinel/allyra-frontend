import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import { ModalProvider, ThemeProvider } from './contexts'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { Toaster } from './components/ui/sonner'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <SidebarProvider>
            <ModalProvider>
              <RouterProvider router={router} />
              <Toaster />
            </ModalProvider>
          </SidebarProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
