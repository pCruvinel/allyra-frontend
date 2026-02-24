import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Manual chunks para melhor code splitting
        manualChunks: {
          // Vendor chunks - bibliotecas externas
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['@tanstack/react-router'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-ui': ['lucide-react', 'sonner', 'clsx', 'tailwind-merge'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Aumentar limite do aviso (opcional, após otimização)
    chunkSizeWarningLimit: 600,
  },
})
