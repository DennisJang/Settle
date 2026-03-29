import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase SDK
          'vendor-supabase': ['@supabase/supabase-js'],
          // i18n
          'vendor-i18n': ['react-i18next', 'i18next'],
          // UI 라이브러리
          'vendor-ui': ['lucide-react', 'sonner'],
        },
      },
    },
  },
})