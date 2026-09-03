// vitest.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        // Umbrales calibrados a la métrica REAL de src/ (excluye tests, *.d.ts,
        // dist, public, config y src/main.js). Se midieron con el reporter v8:
        //   lines 67.48% · statements 67.48% · functions 62.74% · branches 61.56%
        // Subir cada umbral a medida que crezca la cobertura (especialmente la de
        // src/controllers, la más baja) para no perder la red de seguridad.
        lines: 67,
        statements: 67,
        functions: 62,
        branches: 61,
      },
      // IMPORTANTE: definir `exclude` REEMPLAZA la lista por defecto de Vitest.
      // La lista anterior omitía tests/*.d.ts/coverage/dist, por lo que se
      // contaban archivos de test y tipos como si fueran código de producción.
      exclude: [
        'tests/**',
        'src/main.js',
        '**/*.d.ts',
        'coverage/**',
        'dist/**',
        'public/**',
        '**/*.config.js',
      ],
    },
  },
});