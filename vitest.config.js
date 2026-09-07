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
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: {
        // Umbrales calibrados a la métrica REAL de src/ (excluye tests, scripts,
        // *.d.ts, dist, public, config y src/main.js).
        // Calibrado el 2026-09-04 con el reporter v8 tras añadir tests para controllers:
        //   lines 76.18% · statements 76.18% · functions 71.88% · branches 66.91%
        // Recalibrado el 2026-07-09 tras añadir tests/history.controller.test.js
        // (history.controller.js: lines 50.94% → 98.11%, functions 53.33% → 100%, branches 34.78% → 75.32%):
        //   lines 78.39% · statements 78.39% · functions 73.84% · branches 68.52%
        // Margen de seguridad: ~1-2 puntos por debajo de lo medido para estabilidad.
        lines: 76,
        statements: 76,
        functions: 71,
        branches: 66,
      },
      // IMPORTANTE: definir `exclude` REEMPLAZA la lista por defecto de Vitest.
      // La lista anterior omitía tests/*.d.ts/coverage/dist, por lo que se
      // contaban archivos de test y tipos como si fueran código de producción.
      exclude: [
        'tests/**',
        'scripts/**',
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