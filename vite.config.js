/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  // ── Vitest ──────────────────────────────────────────────────────
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
  },
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: true,
    // Minificación agresiva: terser elimina comentarios, reduce nombres,
    // y tree-shake dead code. Esencial para el target 3G.
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // mantenemos console.warn/error útiles
        passes: 2,
        pure_funcs: ['console.log'],
      },
      format: { comments: false },
    },
    cssMinify: true,
    // Sourcemaps solo en dev: en prod los subimos aparte si los necesitamos.
    sourcemap: false,
    // Code-splitting: separa vendor y módulos grandes (Chart.js) en chunks
    // dedicados que se pueden cargar lazy o en paralelo.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/chart.js')) return 'vendor-chart';
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/src/charts-manager.js')) return 'charts';
          if (id.includes('/src/gestor-periodizacion.js')) return 'periodizacion';
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
