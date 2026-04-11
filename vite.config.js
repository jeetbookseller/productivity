import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

function appVersion() {
  try {
    const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));
    const [major, minor] = version.split('.');
    const patch = execSync('git rev-list --count HEAD').toString().trim();
    return `${major}.${minor}.${patch}`;
  } catch {
    return '0.0.0';
  }
}

const APP_VERSION = appVersion();

export default defineConfig({
  base: '/productivity/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
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
