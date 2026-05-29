import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Les tests d'intégration partagent la BDD de test : on exécute les fichiers en série
    // pour éviter les courses entre suites (le truncate beforeEach reste local au fichier).
    fileParallelism: false,
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: ['./src/test/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/test/**',
        'src/**/*.test.ts',
        // Consigne autoéval : ne pas tester / exclure les Schémas Zod et DTOs.
        'src/dto/**',
        'src/server.ts',
        'src/prisma.ts',
        'src/types/**',
      ],
    },
  },
});
