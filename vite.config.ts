import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: 'localhost',
        proxy: {
          // Proxy for Ollama during development
          // Allows the browser to call /api/ollama-proxy which forwards to localhost:11434
          '/api/ollama-proxy': {
            target: 'http://localhost:11434',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/ollama-proxy/, '/v1/chat/completions'),
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
