import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'], globals: true },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@payload-config': resolve(__dirname, './payload.config.ts'),
    },
  },
});
