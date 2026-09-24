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
    // Lazy-load real de los chunks dinámicos: sin el helper modulePreload,
    // Rollup no genera edge estático hacia el chunk "charts" y el import()
    // dinámico de AnalyticsController (módulo de gráficos + Chart.js, ~205 kB)
    // se descarga SOLO al entrar a la pestaña "Progreso". Los <link
    // rel="modulepreload"> manuales de index.html se conservan igual, y el
    // Service Worker cachea los chunks tras la primera descarga (offline-first).
    modulePreload: false,
    // Sourcemaps solo en dev: en prod los subimos aparte si los necesitamos.
    sourcemap: false,
    // Code-splitting: separa vendor y módulos grandes (Chart.js) en chunks
    // dedicados que se pueden cargar lazy o en paralelo.
    rollupOptions: {
      output: {
        // OJO: charts-manager.js NO se fuerza a un manual chunk. Rollup lo
        // separa automáticamente como chunk async (solo se alcanza vía el
        // import() dinámico de AnalyticsController) y el helper __vitePreload
        // compartido queda en el chunk de entrada. Forzarlo con manualChunks
        // re-hoistea el helper AL chunk de gráficos, creando un import estático
        // entry→charts que lo cargaría al arranque y rompería el lazy-load de
        // la pestaña "Progreso" (módulo de gráficos + Chart.js, ~205 kB).
        manualChunks(id) {
          if (id.includes('node_modules/chart.js')) return 'vendor-chart';
          if (id.includes('node_modules')) return 'vendor';
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
