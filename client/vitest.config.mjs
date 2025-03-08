import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugin: [react()],
  test: {
    // ... Specify options here.
    environment: 'jsdom',
    globals: true,
    setupFiles: './testSetup.js',
  },
});
