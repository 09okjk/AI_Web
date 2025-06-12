import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    // 修复 exports 未定义的问题
    'process.env': process.env
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'element-plus', 'axios']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})