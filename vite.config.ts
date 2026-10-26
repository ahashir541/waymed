import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const API = process.env.WAYMED_API ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // External registerSW.js keeps the Content-Security-Policy free of inline scripts.
      injectRegister: 'script',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'audio/sd/manifest.json'],
      manifest: {
        name: 'WayMed - Guidance Network',
        short_name: 'WayMed',
        description: 'Find the right hospital department the first time. English, Urdu, Sindhi.',
        theme_color: '#0b0b0b',
        background_color: '#0b0b0b',
        display: 'standalone',
        start_url: '/',
        lang: 'en',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // App shell, translations, floor plan code and route engine are all in the precached bundle,
        // so directions keep working with the network off after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // Take control on the very first visit, so a phone that loses signal right after scanning still has directions.
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/api/public/hospital',
            handler: 'NetworkFirst',
            options: { cacheName: 'wm-hospital', networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/'),
            handler: 'CacheFirst',
            options: { cacheName: 'wm-audio' },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: { '/api': { target: API, changeOrigin: false } },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 15000,
  },
});
