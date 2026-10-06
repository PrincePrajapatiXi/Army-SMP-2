import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Army SMP 2 Store',
        short_name: 'ArmySMP',
        description: 'Premium Minecraft Store for Army SMP 2',
        theme_color: '#ff6b35',
        background_color: '#0a0a0f',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    // SECURITY: Never expose source maps in production — they reveal your full source code
    sourcemap: false,
    // Minify and strip all console.log / debugger statements from the production bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,   // Remove all console.* calls
        drop_debugger: true,  // Remove all debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
      }
    }
  }
})
