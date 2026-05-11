import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'BV Serviços',
        short_name: 'BV Service',
        description: 'Serviços e vendas online — Condomínio Bella Vittà',
        theme_color: '#059669',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png', // CORRIGIDO: Era svg+xml, mas seu arquivo é PNG
            purpose: 'any',
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png', // CORRIGIDO: Era svg+xml
            purpose: 'any', // CORRIGIDO: Removido "maskable" para não cortar no Android/iOS
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // 1. IMAGENS DO SUPABASE: Salva em cache para carregar rápido (Fotos dos anúncios, avatares)
            urlPattern: /^https:\/\/kdigpnzpaabuxdvgjtcz\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagens-supabase',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
          {
            // 2. DADOS DO BANCO (API): NUNCA guarda em cache. Resolve o problema dos "Fantasmas"
            // Quando você excluir algo, a lista some na hora, sem precisar limpar o cache.
            urlPattern: /^https:\/\/kdigpnzpaabuxdvgjtcz\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})