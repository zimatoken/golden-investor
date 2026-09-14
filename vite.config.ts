// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Золотой Инвестор',
        short_name: 'Инвестор',
        description: 'Тайминг-навигатор для инвесторов. Знай, когда действовать, а когда — ждать.',
        theme_color: '#0c1426',
        background_color: '#f5f7fa',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/golden-investor/',
        start_url: '/golden-investor/',
        lang: 'ru',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: '/golden-investor/',
  server: {
    port: 5173,
    open: true,
  },
});