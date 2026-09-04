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
        // Margen de seguridad: ~1-2 puntos por debajo de lo medido para estabilidad.
        lines: 74,
        statements: 74,
        functions: 70,
        branches: 65,
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