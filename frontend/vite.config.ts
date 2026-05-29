/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import istanbul from 'vite-plugin-istanbul';

// Instrumentation du code pour la couverture E2E (Cypress), activée à la demande
// via INSTRUMENT_COVERAGE=true afin de ne jamais impacter le build de production.
const instrument = process.env.INSTRUMENT_COVERAGE === 'true';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(instrument
      ? [
          istanbul({
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: [
              'node_modules',
              'src/test',
              'src/**/*.test.ts',
              'src/**/*.test.tsx',
              'src/types',
              'src/main.tsx',
              'src/vite-env.d.ts',
            ],
            extension: ['.ts', '.tsx'],
            requireEnv: false,
          }),
        ]
      : []),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/types/**',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
      ],
    },
  },
});
