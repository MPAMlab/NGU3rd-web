import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'], // Auto import Vue, Vue Router, Pinia APIs
      dts: 'auto-imports.d.ts', // Generate TypeScript declaration file
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'components.d.ts', // Generate TypeScript declaration file
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // If your Worker is running locally on 8787 and frontend on 5173,
    // uncomment this proxy to forward /api requests to the worker.
    // For production deployment where frontend and worker are on the same domain/route,
    // this proxy is not needed.
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8787', // Your Worker's local dev address
    //     changeOrigin: true,
    //     // rewrite: (path) => path.replace(/^\/api/, '') // If your worker doesn't expect /api prefix
    //   }
    // }
  }
})
