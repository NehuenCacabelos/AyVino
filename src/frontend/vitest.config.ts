import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const frontendDir = path.dirname(__filename);
const repoRoot = path.resolve(frontendDir, '../..');

export default defineConfig({
  root: repoRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(frontendDir, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(repoRoot, 'tests/frontend/setup.ts')],
    include: ['tests/frontend/**/*.{test,spec}.{ts,tsx}'],
  },
});
