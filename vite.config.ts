import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    host: true, // 允许外部 IP 访问（方便联调）
    proxy: {
      '/api': {
        target: 'http://192.168.64.2:3000', // ！！！这里填你虚拟机的 IP
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://192.168.64.2:3000', // 静态资源也代理到后端
        changeOrigin: true
      }
    }
  },
  build: {
    // 关键：将目标设为更通用的 es2015 或更高兼容性
    target: 'es2015',
    cssTarget: 'chrome61' // 防止 CSS 变量压缩出问题
  }
});