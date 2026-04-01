import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/productivity/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/app.test.jsx',  // Temporarily skipped — OOM with Supabase SDK in module graph
    ],
  },
});
