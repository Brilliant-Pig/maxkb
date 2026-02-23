import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  // ✨ 新增服务器配置
  server: {
    port: 5173, // 前端运行端口
    proxy: {
      // 这里的 '/api' 对应你 axios 请求的前缀
      '/api': {
        target: 'http://127.0.0.1:33001', // 你的后端服务地址
        changeOrigin: true,
      }
    }
  }
})