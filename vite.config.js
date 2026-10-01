import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) return 'vendor-chart'
            if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/') || id.includes('@vue/')) {
              return 'vendor-vue'
            }
            if (id.includes('axios')) return 'vendor-axios'
          }
        },
      },
    },
  },
})