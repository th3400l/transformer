import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },

      server: {
        host: true,
        allowedHosts: [
          '3cc048a316ae.ngrok-free.app'
        ]
      },

      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts']
      }
    };
});
