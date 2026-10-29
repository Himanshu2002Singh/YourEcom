import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Sends /api to the backend (`npm run dev` in backend/, port 4000). API_PROXY points it elsewhere.
    proxy: { '/api': process.env.API_PROXY || 'http://localhost:4000' },
  },
});
