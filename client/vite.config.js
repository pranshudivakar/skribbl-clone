import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // ✅ Force port 5173, agar use ho toh error throw kare
    host: true, // ✅ Network pe expose kare
    proxy: {
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      },
      '/api': {
        target: 'http://localhost:5000'
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});