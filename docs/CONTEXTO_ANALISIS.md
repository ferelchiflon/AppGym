# CONTEXTO_ANALISIS — AppGymPro v6.0.0

> **Proyecto:** AppGymPro · **Version:** 6.0.0 · **Generado:** 23/09/2026 20:53
>
> **Ambito:** src/ completo (65 archivos), configuracion raiz y tests/ (40 archivos).
>
> No incluye `node_modules/`, `dist/` ni archivos binarios.

**Indice**

1. Arbol completo de `src/`
2. Contenido integro: `src/main.js`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.js`, `vitest.config.js`
3. Contenido integro: `src/controllers/` (incluye `renderers/`)
4. Contenido integro: `src/services/` (si existe)
5. Listado con tamano en lineas: `src/components/` y `src/types/`
6. Listado con tamano en lineas: `tests/`
7. Ultimos 20 commits (`git log --oneline -20`)

---

## 1. Arbol completo de `src/`

```text
app.js
autorregulacion.js
components
config.ts
controllers
charts-manager.js
data
dialog.js
dnd.js
error-handler.js
export
fisiologia-cargas.js
formulas.js
gestor-cardio.js
gestor-periodizacion.js
gestor-rutina.js
gestor-timer.js
i18n.js
landmarks-volumen.js
locales
main.js
navigation
perfil-atleta.js
store.js
sync.js
toast.js
types
utils
utils.ts
views
wellness-correlation.js

src//components:
Button.js
Card.js
ExercisePicker.js
Modal.js
Timer.js
cardio-form.js
dashboard-widgets.js
exercise-guide.js

src//controllers:
analytics.controller.js
dashboard.controller.js
history.controller.js
profile.controller.js
renderers
workout.controller.js

src//controllers/renderers:
dashboard
workout

src//controllers/renderers/dashboard:
banner.ts
cards.ts
common.ts
events.ts
sparkline.ts
sparkline.ts.tmp

src//controllers/renderers/workout:
events.ts
renders.ts

src//data:
exercises.js
plantillas-predefinidas.js

src//export:
csv.js
pdf.js

src//locales:
en.js
es.js

src//navigation:
navigator.js

src//types:
components.d.ts
gym.d.ts
workout-controller.d.ts

src//utils:
backup-reminder.ts
dashboard-helpers.ts

src//views:
chrome.js
dashboard.js
drawer.js
header.js
history.js
index.js
profile.js
progress.js
workout.js
```

## 2. Contenido integro: entrada y configuracion

### `src/main.js` — 33 lineas

````javascript
/**
 * src/main.js
 * Punto de entrada. Ensambla las vistas modulares (src/views/*) en #app de
 * forma SÍNCRONA y después arranca la app. El binding centralizado por ID de
 * AppGymPro (this.el) requiere que el DOM exista antes de instanciar.
 */

import { ErrorHandler } from './error-handler.js';
import { Toast } from './toast.js';
import { AppGymPro } from './app.js';
import appLayout from './views/index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0) Registrar la captura global de errores lo antes posible: antes de
    //    montar vistas, para que cualquier fallo de arranque también se loguee
    //    (console.error) y se notifique al usuario con un Toast de error.
    ErrorHandler.init();

    // 1) Montar el shell de vistas dentro del contenedor raíz #app.
    //    Debe ser síncrono y previo al constructor para que _bindDOM()
    //    resuelva todos los IDs sin nulls.
    const root = document.getElementById('app');
    if (root) {
        root.innerHTML = appLayout.join('\n');
    } else {
        console.warn('[main] No se encontró <div class="app" id="app">; las vistas no se montaron.');
    }

    // 2) Arrancar la app (Toast.init es idempotente; se mantiene por compat).
    Toast.init();
    window.app = new AppGymPro();
    console.log('GYM PRO v6.0.0 iniciado (modular)');
});

````

### `index.html` — 206 lineas

````html
 <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>GYM PRO — Registro de entrenamiento profesional</title>
  <meta name="description" content="Registro de entrenamiento profesional, periodización y cálculo de 1RM">
  <meta name="theme-color" content="#0B0E14">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="application-name" content="GYM PRO">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="GYM PRO">


  <!-- Icons & Manifest -->
  <link rel="icon" type="image/svg+xml" href="icons/icon.svg">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="apple-touch-icon" sizes="192x192" href="icons/icon-192.png">
  <link rel="apple-touch-icon" sizes="512x512" href="icons/icon-512.png">
  <link rel="manifest" href="manifest.json">

  <!-- ============================================================
       CRITICAL CSS INLINE (above-the-fold, ~1KB)
       ============================================================ -->
  <style>
    :root {
      --canvas: #0B0E14;
      --surface: #131822;
      --surface-alt: #1A2030;
      --text-primary: #F4F6FB;
      --text-secondary: #9AA4BD;
      --border: rgba(255, 255, 255, .07);
      --accent: #C6FF3D;
      --accent-soft: rgba(198, 255, 61, .14);
      --radius-card: clamp(14px, 2vw, 18px);
      --info-bg: rgba(86, 156, 255, .16);
      --info-text: #7DB7FF;
      --success-bg: rgba(72, 209, 122, .16);
      --success-text: #54E08A;
      --danger-bg: rgba(255, 95, 95, .16);
      --danger-text: #FF7A7A;
      --space-2: 0.5rem;
      --space-4: 1rem;
      --font-body: 'Inter', sans-serif;
    }

    /* Skip link: invisible until focused */
    .skip-link {
      position: absolute;
      left: -9999px;
      top: -9999px;
      background: var(--accent);
      color: var(--canvas);
      padding: .5rem 1rem;
      border-radius: var(--radius-card);
      z-index: 3000;
      font-size: .85rem;
      transition: left .2s ease, top .2s ease;
    }

    .skip-link:focus-visible {
      left: 1rem;
      top: 1rem;
      outline: none;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: var(--font-body);
    }

    html {
      font-size: 100%;
      scroll-behavior: smooth;
    }

    body {
      background: var(--canvas);
      color: var(--text-primary);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      min-height: 100dvh;
      padding: clamp(.5rem, 2.5vw, 2.5rem) clamp(.75rem, 2vw, 1.5rem) calc(5.5rem + env(safe-area-inset-bottom, 0px));
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    main,
    #main-content {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .app {
      max-width: 1300px;
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 2rem) clamp(1.5rem, 3vw, 2.5rem);
    }

    h1 {
      font-weight: 700;
      font-size: clamp(1.3rem, 1rem + 2vw, 1.9rem);
      letter-spacing: -.03em;
      line-height: 1.1;
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
      border-bottom: 1px solid var(--border);
      padding-bottom: clamp(.75rem, 1.8vw, 1.1rem);
      flex-wrap: wrap;
    }

    h1 span.version-tag {
      background: var(--accent-soft);
      color: var(--accent);
      font-weight: 700;
      text-transform: uppercase;
      padding: .3rem .75rem;
      border-radius: 9999px;
      font-size: .7rem;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr;
      gap: clamp(1rem, 2vw, 1.5rem);
    }

    @media (min-width: 768px) {
      .grid-2 {
        grid-template-columns: 1fr 1fr;
      }
    }

    .card {
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: clamp(1.1rem, 2.5vw, 1.75rem);
      margin-bottom: 0;
    }

    .card h2 {
      font-weight: 600;
      font-size: clamp(1.05rem, .95rem + .8vw, 1.25rem);
      letter-spacing: -.01em;
      margin-bottom: clamp(.9rem, 2vw, 1.25rem);
      display: flex;
      align-items: center;
      gap: .5rem;
      flex-wrap: wrap;
    }

    button {
      font: inherit;
    }

    .hidden {
      display: none !important;
    }

    .empty-message {
      color: var(--text-secondary);
      font-size: .9rem;
      padding: .5rem 0;
    }

    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }
  </style>

  <!-- CSS e Inicios de Script -->
  <link rel="preload" href="styles/index.css" as="style">
  <link rel="stylesheet" href="styles/index.css">

  <!-- charts-manager.js NO se pre-carga: es un chunk lazy que se descarga con
       import() dinámico al entrar a la pestaña "Progreso" (code-splitting). -->
  <link rel="modulepreload" href="src/gestor-periodizacion.js">
</head>

<body>
  <!-- Skip link para navegación teclado -->
  <a href="#main-content" class="skip-link">Saltar al contenido principal</a>

  <main id="main-content" tabindex="-1">
    <div class="app" id="app"></div>
  </main>

  <script type="module" src="./src/main.js"></script>
</body>
</html>
````

### `package.json` — 33 lineas

````json
{
  "name": "gym-pro",
  "private": true,
  "version": "6.0.0",
  "type": "module",
  "description": "Registro de entrenamiento, periodización y seguimiento de progreso.",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js,.ts",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{js,css}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^2.1.9",
    "eslint": "^9.13.0",
    "globals": "^15.11.0",
    "jsdom": "^25.0.1",
    "prettier": "^3.3.3",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.69.0",
    "vite": "^5.4.10",
    "vitest": "^2.1.9"
  },
  "dependencies": {
    "chart.js": "^4.5.1",
    "terser": "^5.50.0"
  }
}

````

### `tsconfig.json` — 26 lineas

````json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    /* Linting / Type checking */
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "checkJs": false
  },
  "include": ["src", "tests"]
}

````

### `vite.config.js` — 63 lineas

````javascript
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

````

### `vitest.config.js` — 44 lineas

````javascript
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
        // Recalibrado el 2026-07-09 tras ampliar tests/workout.test.js
        // (workout.controller.js: lines 74.50% → 99.33%, functions 75.00% → 100%, branches 65.94% → 80.56%):
        //   lines 81.22% · statements 81.22% · functions 77.29% · branches 70.64%
        // Margen de seguridad: ~1-2 puntos por debajo de lo medido para estabilidad.
        lines: 79,
        statements: 79,
        functions: 74,
        branches: 68,
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
````

## 3. Contenido integro: `src/controllers/` (incluye `renderers/`)

### `src/controllers/analytics.controller.js` — 288 lineas

````javascript
/**
 * src/controllers/analytics.controller.js
 * Controlador de la vista "Progreso y Métricas".
 * Maneja gráficos de evolución de 1RM, volumen muscular histórico,
 * volumen por sesión y análisis de correlación wellness ↔ rendimiento.
 *
 * Code-splitting offline-first: ChartsManager (y Chart.js detrás) NO se
 * importa estáticamente. Se carga bajo demanda con import() dinámico la
 * primera vez que esta vista se renderiza (app.js → setOnTabEnter("progress")),
 * separando del bundle inicial los chunks "charts" y "vendor-chart".
 */

import { Store } from "../store.js";
import { WellnessCorrelation } from "../wellness-correlation.js";
import { VolumeLandmarks } from "../landmarks-volumen.js";

/** Promesa en caché del módulo de gráficos: solo se descarga una vez por sesión. */
let _ChartsManagerPromise = null;

/**
 * Carga lazy de ChartsManager vía import() dinámico. Nunca rechaza: si el
 * chunk no está disponible (p.ej. primera visita offline), devuelve null
 * para degradar la vista sin romper el render y reintenta en el próximo.
 */
function _cargarModuloCharts() {
  if (!_ChartsManagerPromise) {
    _ChartsManagerPromise = import("../charts-manager.js")
      .then((mod) => mod.ChartsManager)
      .catch((err) => {
        _ChartsManagerPromise = null; // reintenta en el próximo render
        console.warn("[Analytics] No se pudo cargar el módulo de gráficos:", err);
        return null;
      });
  }
  return _ChartsManagerPromise;
}

export class AnalyticsController {
  constructor({ el, rutina, perfil }) {
    this.el = el;
    this.rutina = rutina;
    this.perfil = perfil;

    this._bindEvents();
    this._subscribeStore();
  }

  actualizarInstancias({ rutina, perfil }) {
    if (rutina) this.rutina = rutina;
    if (perfil) this.perfil = perfil;
    this.render();
  }

  _bindEvents() {
    this.el.chartEjercicioSelect.addEventListener("change", () => this.renderRM());
  }

  _subscribeStore() {
    Store.on("session:completed", () => {
      this.render();
    });

    Store.on("exercises:updated", () => {
      this._renderSelectorGrafico();
    });

    Store.on("wellness:updated", () => {
      this.renderWellnessCorrelacion();
    });
  }

  async render() {
    this._renderSelectorGrafico();
    this.renderLandmarks();
    // Los tres gráficos se renderizan en paralelo apenas resuelve el import()
    // dinámico de ChartsManager (la promesa se cachea tras la primera carga).
    await Promise.all([this.renderRM(), this.renderVolumen(), this.renderWellnessCorrelacion()]);
  }

  renderLandmarks() {
    const container = this.el.landmarksContainer;
    if (!container) return;
    container.replaceChildren();

    const analisis = VolumeLandmarks.analizarSemana(this.rutina.historial, 7);
    // Sort by effective sets (most worked first), filter out muscles with 0 total sets
    const grupos = Object.entries(analisis)
      .filter(([, d]) => d.total > 0)
      .sort((a, b) => b[1].efectivas - a[1].efectivas);

    if (grupos.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "Registra sesiones en la semana para ver los landmarks de volumen.";
      container.appendChild(empty);
      return;
    }

    // Legend
    const legend = document.createElement("div");
    legend.className = "vl-legend";
    legend.innerHTML = [
      { color: "rgba(255,255,255,0.08)", label: "< MEV" },
      { color: "rgba(86,156,255,0.35)", label: "Zona efectiva (MEV–MAV)" },
      { color: "rgba(255,170,50,0.35)", label: "Zona máxima (MAV–MRV)" },
      { color: "rgba(255,95,95,0.30)", label: "Sobrecarga (> MRV)" },
    ]
      .map(
        (z) =>
          `<span class="vl-legend-item"><span class="vl-legend-swatch" style="background:${z.color};"></span>${z.label}</span>`
      )
      .join("");
    container.appendChild(legend);

    // How many to show initially
    const INITIAL_SHOW = 6;
    const needsToggle = grupos.length > INITIAL_SHOW;

    const list = document.createElement("div");
    list.className = "vl-list";
    container.appendChild(list);

    grupos.forEach(([, data], idx) => {
      const row = this._crearFilaTermometro(data);
      if (needsToggle && idx >= INITIAL_SHOW) {
        row.classList.add("vl-row--hidden");
        row.style.display = "none";
      }
      list.appendChild(row);
    });

    if (needsToggle) {
      const toggle = document.createElement("button");
      toggle.className = "vl-toggle";
      toggle.type = "button";
      const hiddenCount = grupos.length - INITIAL_SHOW;
      toggle.textContent = `Ver todos los grupos musculares (+${hiddenCount})`;
      let expanded = false;

      toggle.addEventListener("click", () => {
        expanded = !expanded;
        list.querySelectorAll(".vl-row--hidden").forEach((el) => {
          el.style.display = expanded ? "" : "none";
        });
        toggle.textContent = expanded
          ? "Ocultar grupos musculares"
          : `Ver todos los grupos musculares (+${hiddenCount})`;
      });
      container.appendChild(toggle);
    }
  }

  /**
   * Builds a single thermometer row for a muscle group.
   * @private
   */
  _crearFilaTermometro(data) {
    const row = document.createElement("div");
    row.className = "vl-row";

    // The bar scale goes from 0 to maxScale (MRV + 20% headroom)
    const maxScale = Math.ceil(data.mrv * 1.2);

    // Zone widths as percentages
    const pctMev = (data.mev / maxScale) * 100;
    const pctMav = ((data.mavMax - data.mev) / maxScale) * 100;
    const pctMrv = ((data.mrv - data.mavMax) / maxScale) * 100;
    const pctOver = 100 - pctMev - pctMav - pctMrv;

    // Indicator position (clamped to 0–100%)
    const indicatorPct = Math.min(100, Math.max(0, (data.efectivas / maxScale) * 100));

    // Pick indicator color by state
    const indicatorColors = {
      sub_mev: "#FFCB52",
      en_mev: "#7DB7FF",
      en_mav: "#54E08A",
      sobre_mrv: "#FF7A7A",
    };
    const triColor = indicatorColors[data.estado] || "#C6FF3D";

    // SVG triangle pointing down into the bar
    const svgTriangle = `<svg class="vl-indicator" style="left:${indicatorPct}%;" width="12" height="26" viewBox="0 0 12 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="6,0 12,8 0,8" fill="${triColor}"/>
      <line x1="6" y1="8" x2="6" y2="26" stroke="${triColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

    row.innerHTML = `
      <div class="vl-header">
        <span class="vl-muscle-name">${data.nombre}</span>
        <span class="vl-series-count">${data.efectivas} series efectivas</span>
      </div>
      <div class="vl-bar-wrap">
        <div class="vl-zone vl-zone--sub" style="width:${pctMev}%;"></div>
        <div class="vl-zone vl-zone--mev" style="width:${pctMav}%;"></div>
        <div class="vl-zone vl-zone--mav" style="width:${pctMrv}%;"></div>
        <div class="vl-zone vl-zone--mrv" style="width:${pctOver}%;"></div>
        ${svgTriangle}
      </div>
      <div class="vl-ticks">
        <span>0</span>
        <span>MEV ${data.mev}</span>
        <span>MAV ${data.mavMax}</span>
        <span>MRV ${data.mrv}</span>
      </div>
      <div class="vl-status vl-status--${data.estado}">${data.etiqueta}</div>
    `;

    return row;
  }


  _renderSelectorGrafico() {
    const todos = Store.getEjerciciosDisponibles();
    const frag = document.createDocumentFragment();
    todos.forEach((ej) => {
      const opt = document.createElement("option");
      opt.value = ej.id;
      opt.textContent = ej.nombre;
      frag.appendChild(opt);
    });
    this.el.chartEjercicioSelect.replaceChildren(frag);
  }

  async renderRM() {
    const ChartsManager = await _cargarModuloCharts();
    if (!ChartsManager) return;

    const todos = Store.getEjerciciosDisponibles();
    const ejercicioId = this.el.chartEjercicioSelect.value || (todos[0] ? todos[0].id : "sentadilla");
    const ej = todos.find(e => e.id === ejercicioId);
    const progreso = this.rutina.getProgresoRM(ejercicioId);
    ChartsManager.renderProgresoRM("chartRM", progreso, ej ? ej.nombre : ejercicioId);
  }

  async renderVolumen() {
    const ChartsManager = await _cargarModuloCharts();
    if (!ChartsManager) return;

    ChartsManager.renderVolumenPorMusculo("chartVolumenMusculo", this.rutina.getVolumenPorMusculoHistorico());
    ChartsManager.renderVolumenPorSesion("chartVolumenSesion", this.rutina.getVolumenPorSesion(10));
  }

  async renderWellnessCorrelacion() {
    const ChartsManager = await _cargarModuloCharts();
    if (!ChartsManager) return;

    const analisis = WellnessCorrelation.analizar(this.rutina.historial, this.perfil.data.wellness);
    ChartsManager.renderCorrelacionWellness("chartWellness", analisis);

    const container = this.el.wellnessInsight;
    container.replaceChildren();

    if (!analisis || !analisis.suficienteDatos) {
      const nota = document.createElement("div");
      nota.className = "small-note";
      nota.textContent = "Se necesitan al menos 2 sesiones con wellness registrado el mismo día para calcular la correlación (hay " + (analisis ? analisis.cruces : 0) + ").";
      container.appendChild(nota);
      return;
    }

    const etiquetas = { sueno: "sueño", estres: "estrés", doms: "DOMS", motivacion: "motivación" };
    const frag = document.createDocumentFragment();
    let insightCount = 0;

    ["sueno", "estres", "doms", "motivacion"].forEach((m) => {
      const d = analisis[m];
      if (d.diffPct !== null) {
        const etiqueta = etiquetas[m];
        const signo = d.diffPct >= 0 ? "+" : "";
        const linea = document.createElement("div");
        linea.className = "insight-linea";
        linea.innerHTML = "Con " + etiqueta + " alto vs bajo: <strong>" + signo + d.diffPct + "%</strong> de volumen promedio";
        frag.appendChild(linea);
        insightCount += 1;
      }
    });

    if (insightCount === 0) {
      const nota = document.createElement("div");
      nota.className = "small-note";
      nota.textContent = "Datos insuficientes por métrica todavía.";
      frag.appendChild(nota);
    }

    container.appendChild(frag);
  }
}

````

### `src/controllers/dashboard.controller.js` — 359 lineas

````javascript
/**
 * src/controllers/dashboard.controller.js
 * Vista "Inicio" (Dashboard): resumen diario con readiness, fatiga,
 * volumen, ADT/PRs, MGV (landmarks) y sugiere el focus del día.
 * No muta Store: sólo lee datos y dispara navegación/acciones.
 *
 * Controlador delgado (Fase 2 · refactor): TODO el HTML vive en
 * renderers/dashboard/ (cards.ts, sparkline.ts, banner.ts), el wiring de
 * eventos en renderers/dashboard/events.ts y el recordatorio de backup en
 * utils/backup-reminder.ts. Acá queda sólo la orquestación: leer datos,
 * delegar el render y ejecutar las acciones de negocio (guardar/navegar).
 */

import { Store } from "../store.js";
import { Toast } from "../toast.js";
import { EJERCICIOS_DISPONIBLES } from "../config.ts";
import { renderSeguimiento } from "../components/dashboard-widgets.js";
import * as H from "../utils/dashboard-helpers.ts";
// Renderers puros extraídos (tarjetas y banners del dashboard): única fuente de HTML.
import {
  quickStart,
  wellnessCard,
  acwrCard,
  periodizacionCard,
  nutricionCard,
  cardioCard,
  quickStatsRow,
  rmCard,
  prsCard,
  landmarksCard,
  sugerenciaCard,
  calendario,
} from "./renderers/dashboard/cards.ts";
import { estadoAtletaBanner, correlacionWellnessBanner } from "./renderers/dashboard/banner.ts";
import { sparkline, sparklinePoints } from "./renderers/dashboard/sparkline.ts";
// Constantes compartidas de wellness (única fuente: renderers/dashboard/common.ts).
import { WELLNESS_KEYS } from "./renderers/dashboard/common.ts";
// Wiring de eventos tras el render (listeners del contenedor renderizado).
import { bindDashboardActions } from "./renderers/dashboard/events.ts";
// Recordatorio de backup (toast con acción "Exportar backup ahora").
import { verificarYMostrarRecordatorioBackup } from "../utils/backup-reminder.ts";

export class DashboardController {
  /**
   * @param {Object} opts
   * @param {Object|null} [opts.app]
   * @param {Object|null} [opts.rutina]
   * @param {Object|null} [opts.periodizacion]
   * @param {Object|null} [opts.perfil]
   * @param {Object|null} [opts.el]
   */
  constructor({ app = null, rutina = null, periodizacion = null, perfil = null, cardio = null, el = null } = {}) {
    this.app = app;
    this.rutina = rutina;
    this.periodizacion = periodizacion;
    this.perfil = perfil;
    this.cardio = cardio;
    this.container = (el && el.container) || document.getElementById("dashboardContainer");
    verificarYMostrarRecordatorioBackup();
  }

  /** Actualiza referencias tras cambiar de perfil y re-renderiza. */
  actualizarInstancias({ rutina = null, periodizacion = null, perfil = null, cardio = null } = {}) {
    if (rutina) this.rutina = rutina;
    if (periodizacion) this.periodizacion = periodizacion;
    if (perfil) this.perfil = perfil;
    if (cardio) this.cardio = cardio;
    this.render();
  }

  /** Navega a una pestaña usando el AppNavigator si está disponible. */
  _ir(tab, scroll = true) {
    if (this.app && this.app.navigator) this.app.navigator.goTo(tab, scroll);
  }

  /** Nombre del operador (perfil) para el saludo. */
  _operadorNombre() {
    // El nombre vive en el perfil activo (PerfilAtleta), no en `app.operador`.
    if (this.perfil && this.perfil.data && this.perfil.data.nombre) {
      return this.perfil.data.nombre;
    }
    if (this.app && this.app.perfil && this.app.perfil.data && this.app.perfil.data.nombre) {
      return this.app.perfil.data.nombre;
    }
    return "";
  }

  // Nota (Fase 2): sin _esc propio. La única fuente de escape HTML del dashboard
  // es `esc` de utils.ts, usada por los renderers puros (cards.ts / banner.ts).

  /** Tarjeta de arranque rápido (3 casos según estado). Delgado: el render vive en renderers/dashboard/cards.ts. */
  _quickStart() {
    const hist = this.rutina ? this.rutina.historial || [] : [];
    const { modo, html } = quickStart({
      hist,
      ult: this._operadorNombre(),
      tieneRutinaHoy: this._tieneRutinaHoy(),
    });
    // Modo del botón rápido: "continuar" = la rutina ya está armada (solo navega);
    // "armar" = hay que crear la rutina sugerida antes de navegar a Entrenar.
    this._quickStartModo = modo;
    return html;
  }

  /** ¿Hay ejercicios cargados hoy en la rutina activa? */
  _tieneRutinaHoy() {
    if (!this.rutina) return false;
    const listo = this.rutina.data && this.rutina.data.rutina;
    return !!listo && listo.length > 0;
  }

  /** Tarjeta de wellness + sparkline. Render puro en renderers/dashboard/cards.ts. */
  _wellnessCard(wellness, readiness) {
    return wellnessCard({ wellness, readiness });
  }

  /** Puntos (x,y) de una métrica para el sparkline de 7 días. Render en renderers/dashboard/sparkline.ts. */
  _sparklinePoints(wellness, key) {
    return sparklinePoints(wellness, key);
  }

  /** Sparkline SVG suavizado de los 4 marcadores (7 días) + leyenda. Render en renderers/dashboard/sparkline.ts. */
  _sparkline(wellness) {
    return sparkline(wellness);
  }

  /** Tarjeta ACWR con barra semáforo y leyenda. Render en renderers/dashboard/cards.ts. */
  _acwrCard(acwr) {
    return acwrCard(acwr);
  }

  /** Tarjeta de periodización (bloque activo + progreso). Render en renderers/dashboard/cards.ts. */
  _periodizacionCard() {
    return periodizacionCard(H.datosPeriodizacion(this.periodizacion));
  }

  /** Acceso seguro a las sesiones de cardio (gestor propio o readonly fallback). */
  _sesionesCardio() {
    if (this.cardio && typeof this.cardio.getSesiones === "function") return this.cardio.getSesiones();
    if (this.perfil && this.perfil.data && Array.isArray(this.perfil.data.sesionesCardio)) {
      return this.perfil.data.sesionesCardio;
    }
    return [];
  }

  /** Tarjeta de hábitos diarios de nutrición. Render en renderers/dashboard/cards.ts. */
  _nutricionCard(nutricionHoy = null) {
    return nutricionCard(nutricionHoy);
  }

  /** Tarjeta cardio: resumen de la última semana sin romper el layout. Render en renderers/dashboard/cards.ts. */
  _cardioCard() {
    const gestor = this.cardio && typeof this.cardio.getResumen === "function" ? this.cardio : null;
    return cardioCard({
      sesiones: this._sesionesCardio(),
      resumen: gestor ? gestor.getResumen(7) : null,
    });
  }

  /** Fila horizontal scrolleable (scroll-snap) con 5 mini-cards de stats. Render en renderers/dashboard/cards.ts. */
  _quickStatsRow(vol, se, stre, best, acwr) {
    return quickStatsRow({ vol, se, stre, best, acwr });
  }

  /** Tarjeta 1RM estimado destacado con tendencia semanal. Render en renderers/dashboard/cards.ts. */
  _rmCard(best) {
    return rmCard(best);
  }

  /** Tarjeta de PRs recientes (14 días) + mejor histórico. Render en renderers/dashboard/cards.ts. */
  _prsCard(prs) {
    return prsCard(prs);
  }

  /** Landmarks MGV por grupo con sectores MEV/MAV/MRV. Render puro en renderers/dashboard/cards.ts. */
  _landmarksCard(lmks) {
    return landmarksCard(lmks);
  }

  /** Sugerencia del grupo muscular del día. Render puro en renderers/dashboard/cards.ts. */
  _sugerenciaCard(grupo, ultimo) {
    return sugerenciaCard({ grupo, ultimo });
  }

  /** Franja de calendario (7 días). Render puro en renderers/dashboard/cards.ts. */
  _calendario(days) {
    return calendario(days);
  }

  /** Renderiza el dashboard completo (reconstruye el contenedor). */
  render() {
    if (!this.container) return;
    const hist = this.rutina ? this.rutina.historial || [] : [];
    const perfil = this.perfil;
    const wellness = (perfil && perfil.data && perfil.data.wellness) || [];
    const saltos = (perfil && perfil.data && perfil.data.saltos) || [];
    const nutricionHoy = perfil && typeof perfil.getNutricionHoy === "function" ? perfil.getNutricionHoy() : null;

    const readiness = H.calcularReadiness({ wellness, saltos, historial: hist });
    const vol = H.volumenSemanal(hist);
    const se = H.seriesEfectivas(hist, 7);
    const stre = H.racha(hist);
    const acwr = H.acwrDatos(hist);
    const best = H.bestRM(hist);
    const prs = H.prsRecientes(hist);
    const lmks = H.landmarks(hist);
    const grupo = H.sugerirGrupoMuscular({
      historial: hist,
      bloque: this.periodizacion ? this.periodizacion.getBloqueActual() : null,
    });
    const ultimo = H.ultimoTrabajoPorMusculo(hist, grupo);
    const days = H.ultimos7Dias(hist);

    const html = `
      <div class="dashboard">
        ${this._quickStart()}
        ${this._estadoAtletaBanner()}
        <div class="dashboard-section">
          ${this._wellnessCard(wellness, readiness)}
        </div>

        <div class="dashboard-section">
          ${this._quickStatsRow(vol, se, stre, best, acwr)}
          ${this._calendario(days)}
          ${this._acwrCard(acwr)}
          ${this._nutricionCard(nutricionHoy)}
          ${this._cardioCard()}
          ${this._periodizacionCard()}
          ${this._sugerenciaCard(grupo, ultimo)}
        </div>

        <h2 class="section-title">Performance</h2>
        <div class="dashboard-section">
          ${this._rmCard(best)}
          ${this._prsCard(prs)}
          ${this._landmarksCard(lmks)}
        </div>

        ${renderSeguimiento({
          historial: hist,
          periodizacion: this.periodizacion,
          grupo,
          prs,
          stre,
          best,
        })}
      </div>`;

    this.container.innerHTML = html;
    this._bindActions();
  }

  /**
   * Banner único del estado del atleta: readiness (score + semáforo), desglose por
   * componente con flecha de tendencia (hoy vs. ventana anterior) y alertas de
   * senalesFatiga. Reemplaza a las 2 tarjetas separadas (ring de readiness + fatiga).
   * SEÑAL/heurística, nunca diagnóstico médico ni causalidad.
   * Render puro en renderers/dashboard/banner.ts.
   */
  _estadoAtletaBanner() {
    return estadoAtletaBanner({ rutina: this.rutina, perfil: this.perfil });
  }

  /**
   * Asociación observada (bajo volumen) entre las métricas wellness y el volumen de
   * las sesiones del mismo día. Reusa WellnessCorrelation y el MISMO criterio de
   * datos suficientes que analytics.controller.js (≥2 cruces). Si no hay data
   * suficiente devuelve cadena vacía (el banner no muestra nada, a diferencia de
   * analytics que sí muestra una nota). Por ahora cruza SOLO contra volumenTotal
   * (como analizar()); no lo extendemos a fuerza/salto en este paso.
   * Sección chica debajo del desglose: señal/asociación, nunca causalidad.
   * Render puro en renderers/dashboard/banner.ts.
   */
  _correlacionWellnessBanner() {
    return correlacionWellnessBanner({ rutina: this.rutina, perfil: this.perfil });
  }

  /** Vincula todos los eventos tras renderizar (reconstrucción idempotente). */
  _bindActions() {
    bindDashboardActions(this);
  }

  /** Marca la estrella pulsada y sincroniza el grupo (mismo valor en todas). */
  _marcarStar(btn) {
    const group = btn.parentElement;
    const val = parseInt(btn.getAttribute("data-val"), 10);
    group.querySelectorAll(".wstar").forEach((star) => {
      star.classList.toggle("on", parseInt(star.getAttribute("data-val"), 10) <= val);
    });
  }

  /** Guarda un registro de wellness en el perfil activo. */
  _guardarWellness(valores = {}) {
    const perfil = this.perfil;
    if (!perfil || !perfil.data || typeof perfil.registrarWellness !== "function") {
      Toast.mostrar("No hay un perfil activo para guardar el bienestar", "danger");
      return;
    }
    const datos = {};
    WELLNESS_KEYS.forEach((k) => {
      datos[k] = Math.max(1, Number(valores[k]) || 1);
    });
    perfil.registrarWellness(datos);
    Store.guardar();
    Store.emit("wellness:updated", perfil.data.wellness);
    Toast.mostrar("Bienestar guardado", "success");
    this.render();
  }

  /** Guarda un registro de nutrición en el perfil activo. */
  _guardarNutricion({ comidas = 0, proteina = false, agua = false } = {}) {
    const perfil = this.perfil;
    if (!perfil || !perfil.data || typeof perfil.registrarNutricion !== "function") {
      Toast.mostrar("No hay un perfil activo para guardar la nutrición", "danger");
      return;
    }
    const c = Math.max(0, Math.min(8, parseInt(comidas, 10) || 0));
    perfil.registrarNutricion({
      comidas: c,
      proteina: Boolean(proteina),
      agua: Boolean(agua),
    });
    Store.guardar();
    Store.emit("nutricion:updated", perfil.data.nutricion);
    Toast.mostrar("Nutrición guardada", "success");
    this.render();
  }

  /** Continuar rutina de hoy (navega a Entrenar). */
  _iniciarRutina() {
    this._ir("workout", true);
  }

  /** Crea/recarga una rutina rápida del grupo muscular del día y navega a Entrenar. */
  _iniciarRutinaSugerida() {
    if (!this.rutina) return;
    const grupo = H.sugerirGrupoMuscular({
      historial: this.rutina.historial || [],
      bloque: this.periodizacion ? this.periodizacion.getBloqueActual() : null,
    });
    const pool = (EJERCICIOS_DISPONIBLES || []).filter((e) => e.musculo === grupo);
    const seleccion = (pool.length ? pool : (EJERCICIOS_DISPONIBLES || []).slice())
      .slice(0, 4)
      .map((e) => e.id);

    this.rutina.data.rutina = seleccion;
    this.rutina.data.progreso = {};
    this.rutina.data.seriesPorEjercicio = {};
    seleccion.forEach((id) => {
      this.rutina.data.seriesPorEjercicio[id] = [];
      this.rutina.data.progreso[id] = { completado: false };
    });
    this.rutina.ejercicioSeleccionado = seleccion[0] || null;
    Store.guardar();
    Store.emit("routine:updated", seleccion);
    Toast.mostrar(`Rutina de ${H.nombreMusculo(grupo).toLowerCase()} cargada`, "success");
    this._ir("workout", true);
  }
}

````

### `src/controllers/history.controller.js` — 290 lineas

````javascript
/**
 * src/controllers/history.controller.js
 * Controlador de la vista "Historial y Plan".
 * Maneja historial de sesiones, periodización por bloques, wellness diario y test CMJ.
 */

import { Store } from "../store.js";
import { Utils, wellnessScore, esc } from "../utils.ts";
import { Toast } from "../toast.js";
import { Dialog } from "../dialog.js";
import { seriesHistorialACSV } from "../export/csv.js";
import { imprimirHistorial } from "../export/pdf.js";

export class HistoryController {
  constructor({ el, rutina, periodizacion, perfil }) {
    this.el = el;
    this.rutina = rutina;
    this.periodizacion = periodizacion;
    this.perfil = perfil;

    this._bindEvents();
    this._subscribeStore();
    this.render();
  }

  actualizarInstancias({ rutina, periodizacion, perfil }) {
    if (rutina) this.rutina = rutina;
    if (periodizacion) this.periodizacion = periodizacion;
    if (perfil) this.perfil = perfil;
    this.render();
  }

  _bindEvents() {
    // Exportar y borrar historial
    this.el.exportHistorialBtn.addEventListener("click", () => this._exportarHistorialCSV());
    this.el.exportHistorialPdfBtn.addEventListener("click", () => this._exportarHistorialPDF());
    this.el.clearHistorialBtn.addEventListener("click", () => this._borrarHistorial());

    // Periodización
    this.el.crearBloqueBtn.addEventListener("click", () => this._crearBloque());

    // Wellness
    this.el.registrarWellnessBtn.addEventListener("click", () => this._registrarWellness());

    // Salto CMJ
    this.el.registrarSaltoBtn.addEventListener("click", () => this._registrarSalto());
  }

  _subscribeStore() {
    Store.on("session:completed", () => {
      this._renderHistorial();
    });

    Store.on("wellness:updated", () => {
      this._renderWellness();
    });

    Store.on("salto:updated", () => {
      this._renderSaltos();
    });

    Store.on("blocks:updated", () => {
      this._renderPeriodizacion();
    });
  }

  render() {
    this._renderHistorial();
    this._renderPeriodizacion();
    this._renderWellness();
    this._renderSaltos();
  }

  _renderHistorial() {
    const container = this.el.historialContainer;
    container.replaceChildren();

    const historial = this.rutina.historial || [];
    if (historial.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "No hay sesiones guardadas en el historial todavía.";
      container.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    historial.slice().reverse().forEach((sesion) => {
      const card = document.createElement("div");
      card.className = "badge session-card";

      const header = document.createElement("div");
      header.className = "session-header";
      header.innerHTML = "<strong>" + esc(sesion.fecha || "Sesión") + "</strong> (" + (sesion.duracionMinutos || 45) + " min) — Vol: <strong>" + (sesion.volumenTotal || 0) + "kg</strong>";

      const list = document.createElement("ul");
      list.className = "session-details";

      if (Array.isArray(sesion.ejercicios)) {
        sesion.ejercicios.forEach((e) => {
          const li = document.createElement("li");
          li.textContent = e.nombre + ": " + (e.series ? e.series.length : 0) + " series (1RM est: " + (e.rmEstimado ? e.rmEstimado.toFixed(1) : "--") + "kg)";
          list.appendChild(li);
        });
      }

      card.append(header, list);
      frag.appendChild(card);
    });

    container.appendChild(frag);
  }

  _renderPeriodizacion() {
    const info = this.el.bloqueActualInfo;
    const prescripcionContainer = this.el.bloquePrescripcionInfo;
    info.replaceChildren();
    if (prescripcionContainer) prescripcionContainer.replaceChildren();

    const bloque = this.periodizacion.getBloqueActual();
    if (!bloque) {
      info.textContent = "No hay bloque activo de periodización.";
      return;
    }

    const semanaActual = this.periodizacion.getSemanaActual(bloque);
    const totalSemanas = bloque.semanas || bloque.duracionSemanas || 4;
    const progresoSemana = semanaActual / totalSemanas;

    // Determinar color basado en el progreso usando tokens CSS
    let colorClase = 'var(--color-primary)';
    const progresoPct = Math.round(progresoSemana * 100);
    if (progresoSemana >= 0.8) {
      colorClase = 'var(--color-error)';
    } else if (progresoSemana >= 0.5) {
      colorClase = 'var(--color-warning)';
    }

    // Barra de progreso
    const progressHTML = `
      <div class="progress-wrapper">
        <label class="progress-label">
          ${progresoPct}% completado
          <span>${semanaActual}/${totalSemanas} semanas</span>
        </label>
        <div class="progress-bar" style="width: ${progresoPct}%;">
          <div class="progress-fill" style="background: ${colorClase}"></div>
        </div>
      </div>
      <p class="progress-text">Semanas restantes: ${totalSemanas - semanaActual}</p>
    `;

    const box = document.createElement("div");
    box.className = "stats-grid";
    box.innerHTML =
      '<div class="stat-box"><div class="number">' + esc(bloque.nombre) + '</div><div class="label">Bloque</div></div>' +
      '<div class="stat-box"><div class="number">' + esc(bloque.tipo) + '</div><div class="label">Tipo</div></div>' +
      '<div class="stat-box"><div class="number">Semana ' + semanaActual + '/' + totalSemanas + '</div><div class="label">Microciclo</div></div>';

    info.appendChild(box);
    info.insertAdjacentHTML('beforeend', progressHTML);

    const prescripcion = this.periodizacion.getPrescripcionActual();
    if (prescripcion && prescripcionContainer) {
      const prescBox = document.createElement("div");
      prescBox.className = "autoreg-box mt-1";
      prescBox.innerHTML = `
        <strong><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> Prescripción Semanal (${prescripcion.fase}):</strong><br>
        • Series por ejercicio: <strong>${prescripcion.seriesRango} series</strong><br>
        • Repeticiones objetivo: <strong>${prescripcion.repsRango} reps</strong><br>
        • Carga sugerida: <strong>${prescripcion.pct1RM} 1RM</strong> (RPE objetivo: <strong>${prescripcion.rpeObjetivo}</strong>)
      `;
      prescripcionContainer.appendChild(prescBox);
    }
  }

  _renderWellness() {
    const estadoDiv = this.el.wellnessEstado;
    estadoDiv.replaceChildren();

    const registros = this.perfil.data.wellness || [];
    if (registros.length === 0) {
      estadoDiv.textContent = "Sin registros de wellness hoy.";
      return;
    }

    const ultimo = registros[registros.length - 1];
    // Misma fuente de verdad que getEstadoGeneral()/calcularReadiness(): score 1-5
    // (promedio plano de las 8 métricas) vía wellnessScore(). Escalamos *4 para
    // conservar los mismos umbrales 0-20 (>=16 Óptimo / >=11 Moderado / <11 fatiga).
    const { score } = wellnessScore([ultimo]);
    const total = Math.round(score * 4 * 10) / 10;
    const estado = total >= 16 ? "Óptimo para entrenar pesado" : total >= 11 ? "Moderado (ajustar RPE)" : "Fatiga alta (considerar deload/descanso)";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.innerHTML = "Estado actual: <strong>" + estado + "</strong> (" + esc(ultimo.fecha) + ")";
    estadoDiv.appendChild(badge);
  }

  _renderSaltos() {
    const cont = this.el.saltosRecientes;
    cont.replaceChildren();

    const saltos = this.perfil.data.saltos || [];
    if (saltos.length === 0) {
      cont.textContent = "Sin registros de salto CMJ.";
      return;
    }

    const ultimo = saltos[saltos.length - 1];
    const div = document.createElement("div");
    div.className = "badge";
    div.textContent = "Último salto CMJ: " + ultimo.altura + "cm (" + ultimo.fecha + ")";
    cont.appendChild(div);
  }

  _crearBloque() {
    const nombre = this.el.bloqueNombre.value.trim() || "Bloque principal";
    const tipo = this.el.bloqueTipo.value;
    const semanas = parseInt(this.el.bloqueSemanas.value, 10) || 4;

    this.periodizacion.crearBloque({ nombre, tipo, semanas });
    Store.guardar();
    Store.emit("blocks:updated");
    Toast.mostrar("Bloque de periodización activado", "success");
  }

  _registrarWellness() {
    const sueno = parseInt(this.el.wellnessSueno.value, 10) || 3;
    const estres = parseInt(this.el.wellnessEstres.value, 10) || 3;
    const doms = parseInt(this.el.wellnessDoms.value, 10) || 3;
    const motivacion = parseInt(this.el.wellnessMotivacion.value, 10) || 3;

    this.perfil.registrarWellness({ sueno, estres, doms, motivacion });
    Store.guardar();
    Store.emit("wellness:updated");
    Toast.mostrar("Wellness de hoy registrado", "success");
  }

  _registrarSalto() {
    const altura = parseFloat(this.el.saltoAltura.value);
    if (!altura || altura <= 0) {
      Toast.mostrar("Ingresa una altura de salto válida en cm", "warning");
      return;
    }

    this.perfil.registrarSalto(altura);
    Store.guardar();
    Store.emit("salto:updated");
    Toast.mostrar("Salto CMJ registrado (" + altura + "cm)", "success");
  }

  _exportarHistorialCSV() {
    const historial = this.rutina.historial || [];
    if (historial.length === 0) {
      Toast.mostrar("No hay sesiones para exportar", "warning");
      return;
    }
    const csv = seriesHistorialACSV(historial);
    Utils.descargarArchivo("gympro_series.csv", csv, "text/csv");
    Toast.mostrar("Historial exportado en CSV", "success");
  }

  _exportarHistorialPDF() {
    const historial = this.rutina.historial || [];
    const haySeries = historial.some((sesion) =>
      (sesion.ejercicios || []).some((e) => (e.series || []).length > 0)
    );
    if (!haySeries) {
      Toast.mostrar("No hay series para imprimir", "warning");
      return;
    }
    const abierta = imprimirHistorial(historial, "Historial de series");
    Toast.mostrar(
      abierta ? "Vista imprimible abierta: guarda como PDF" : "El navegador bloqueó la ventana de impresión",
      abierta ? "info" : "warning"
    );
  }

  async _borrarHistorial() {
    const ok = await Dialog.confirm("¿Seguro que deseas borrar todo el historial?", { peligroso: true });
    if (ok) {
      this.rutina.data.historial = [];
      Store.guardar();
      Store.emit("session:completed");
      Toast.mostrar("Historial borrado", "info");
    }
  }
}

````

### `src/controllers/profile.controller.js` — 217 lineas

````javascript
/**
 * src/controllers/profile.controller.js
 * Controlador de la vista "Atleta y Ajustes".
 * Maneja perfil del atleta, medidas corporales, IMC, métricas acumuladas y centro de backup.
 */

import { Store, LIMITE_BACKUP_BYTES } from "../store.js";
import { Utils } from "../utils.ts";
import { Toast } from "../toast.js";
import { Dialog } from "../dialog.js";
import { seriesHistorialACSV } from "../export/csv.js";
import { imprimirHistorial } from "../export/pdf.js";

export class ProfileController {
  constructor({ app, el, perfil, rutina }) {
    this.app = app;
    this.el = el;
    this.perfil = perfil;
    this.rutina = rutina;

    this._bindEvents();
    this.render();
  }

  actualizarInstancias({ perfil, rutina }) {
    if (perfil) this.perfil = perfil;
    if (rutina) this.rutina = rutina;
    this.render();
  }

  _bindEvents() {
    // Guardar perfil
    this.el.guardarPerfilBtn.addEventListener("click", () => this._guardarPerfil());

    // Medidas corporales & IMC
    this.el.guardarMedidasBtn.addEventListener("click", () => this._guardarMedidas());
    this.el.calcularIMCBtn.addEventListener("click", () => this._calcularIMC());

    // Métricas de sesión y acumular
    this.el.calcularBtn.addEventListener("click", () => this._calcularYAcumularMetricas());
    this.el.resetProgresoBtn.addEventListener("click", () => this._resetProgresoAcumulado());

    // Backup
    this.el.exportTodoBtn.addEventListener("click", () => this._exportarBackup());
    this.el.importTodoInput.addEventListener("change", (e) => this._importarBackup(e));

    // Exportar historial de series (CSV / PDF)
    this.el.exportarSeriesBtn.addEventListener("click", () => this._exportarSeriesCSV());
    this.el.printSeriesBtn.addEventListener("click", () => this._exportarSeriesPDF());
  }

  render() {
    this._cargarPerfil();
    this._cargarMedidas();
    this._actualizarMetricasUI();
  }

  _cargarPerfil() {
    const p = this.perfil.data.perfil || {};
    if (this.el.perfilEdad) this.el.perfilEdad.value = p.edad || 25;
    if (this.el.perfilGrasa) this.el.perfilGrasa.value = p.grasa || "";
    if (this.el.perfilObjetivo) this.el.perfilObjetivo.value = p.objetivo || "hipertrofia";
    if (this.el.perfilNivel) this.el.perfilNivel.value = p.nivel || "intermedio";
  }

  _guardarPerfil() {
    const edad = parseInt(this.el.perfilEdad.value, 10) || 25;
    const grasa = parseFloat(this.el.perfilGrasa.value) || null;
    const objetivo = this.el.perfilObjetivo.value;
    const nivel = this.el.perfilNivel.value;

    this.perfil.guardar({ edad, grasa, objetivo, nivel });
    Store.guardar();
    Toast.mostrar("Perfil actualizado", "success");
  }

  _cargarMedidas() {
    const m = this.perfil.data.medidas || {};
    if (this.el.pechoCm) this.el.pechoCm.value = m.pecho || "";
    if (this.el.cinturaCm) this.el.cinturaCm.value = m.cintura || "";
    if (this.el.caderaCm) this.el.caderaCm.value = m.cadera || "";
    if (this.el.pesoCorporalKg) this.el.pesoCorporalKg.value = m.pesoCorporal || 72.5;
    if (this.el.alturaCm) this.el.alturaCm.value = m.altura || 175;
  }

  _guardarMedidas() {
    const pecho = parseFloat(this.el.pechoCm.value) || 0;
    const cintura = parseFloat(this.el.cinturaCm.value) || 0;
    const cadera = parseFloat(this.el.caderaCm.value) || 0;
    const pesoCorporal = parseFloat(this.el.pesoCorporalKg.value) || 72.5;
    const altura = parseFloat(this.el.alturaCm.value) || 175;

    this.perfil.data.medidas = { pecho, cintura, cadera, pesoCorporal, altura };
    Store.guardar();
    Toast.mostrar("Medidas guardadas", "success");
  }

  _calcularIMC() {
    const peso = parseFloat(this.el.pesoCorporalKg.value);
    const alturaCm = parseFloat(this.el.alturaCm.value);
    if (!peso || !alturaCm) {
      Toast.mostrar("Ingresa peso y altura válidos", "warning");
      return;
    }

    const alturaM = alturaCm / 100;
    const imc = peso / (alturaM * alturaM);
    this.el.imcValor.textContent = imc.toFixed(1);

    let estado = "Normal";
    if (imc < 18.5) estado = "Bajo peso";
    else if (imc >= 25 && imc < 30) estado = "Sobrepeso";
    else if (imc >= 30) estado = "Obesidad";

    this.el.estadoIMC.textContent = estado;
  }

  _calcularYAcumularMetricas() {
    const peso = parseFloat(this.el.pesoKg.value) || 72.5;
    const tiempoMin = parseInt(this.el.tiempoMin.value, 10) || 30;

    // Cálculo aproximado de kcal quemadas en entrenamiento de fuerza (MET ~ 6.0)
    const kcalSesion = Math.round((6.0 * 3.5 * peso / 200) * tiempoMin);
    const volumenTotal = this.rutina.rutina.reduce((t, id) => t + this.rutina.calcularVolumen(id), 0);
    const indiceFuerza = Math.round(volumenTotal / (peso || 1));

    this.el.kcalDisplay.textContent = kcalSesion;
    this.el.fuerzaDisplay.textContent = indiceFuerza;
    this.el.volumenTotalDisplay.textContent = volumenTotal + "kg";

    const acum = this.perfil.data.acumulados || { fuerza: 0, kcal: 0, volumen: 0 };
    acum.kcal += kcalSesion;
    acum.fuerza += indiceFuerza;
    acum.volumen += volumenTotal;

    this.perfil.data.acumulados = acum;
    Store.guardar();

    this._actualizarMetricasUI();
    Toast.mostrar("Métricas calculadas y acumuladas", "success");
  }

  _actualizarMetricasUI() {
    const acum = this.perfil.data.acumulados || { fuerza: 0, kcal: 0, volumen: 0 };
    if (this.el.kcalAcumuladas) this.el.kcalAcumuladas.textContent = acum.kcal || 0;
    if (this.el.fuerzaAcumulada) this.el.fuerzaAcumulada.textContent = acum.fuerza || 0;
    if (this.el.volumenAcumulado) this.el.volumenAcumulado.textContent = (acum.volumen || 0) + "kg";
  }

  async _resetProgresoAcumulado() {
    const ok = await Dialog.confirm("¿Reiniciar todo el progreso acumulado?", { peligroso: true });
    if (ok) {
      this.perfil.data.acumulados = { fuerza: 0, kcal: 0, volumen: 0 };
      Store.guardar();
      this._actualizarMetricasUI();
      Toast.mostrar("Progreso acumulado reiniciado", "info");
    }
  }

  _exportarBackup() {
    const json = Store.exportarTodo();
    Utils.descargarArchivo("gympro_backup_completo.json", json);
    Toast.mostrar("Backup descargado con éxito", "success");
  }

  _exportarSeriesCSV() {
    const historial = this.rutina.historial || [];
    if (historial.length === 0) {
      Toast.mostrar("No hay series para exportar", "warning");
      return;
    }
    const csv = seriesHistorialACSV(historial);
    Utils.descargarArchivo("gympro_series.csv", csv, "text/csv");
    Toast.mostrar("Historial de series exportado en CSV", "success");
  }

  _exportarSeriesPDF() {
    const historial = this.rutina.historial || [];
    const haySeries = historial.some((sesion) =>
      (sesion.ejercicios || []).some((e) => (e.series || []).length > 0)
    );
    if (!haySeries) {
      Toast.mostrar("No hay series para imprimir", "warning");
      return;
    }
    const nombre = (this.perfil && this.perfil.data && this.perfil.data.nombre) || "Atleta";
    const abierta = imprimirHistorial(historial, "Historial de series — " + nombre);
    Toast.mostrar(
      abierta ? "Vista imprimible abierta: guarda como PDF" : "El navegador bloqueó la ventana de impresión",
      abierta ? "info" : "warning"
    );
  }

  async _importarBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Defensa en profundidad vs vuelco de un archivo local sobredimensionado
      // (además del límite interno de Store.importarTodo).
      if (file.size > LIMITE_BACKUP_BYTES) {
        throw new Error("El backup supera el tamaño máximo permitido (10 MB)");
      }

      const text = await file.text();
      Store.importarTodo(text);
      Toast.mostrar("Backup restaurado con éxito", "success");
      if (this.app && typeof this.app.actualizarPerfilActual === "function") {
        this.app.actualizarPerfilActual();
      } else {
        Store.emit("profile:changed");
      }
    } catch (err) {
      Toast.mostrar(err.message || "Error al importar el archivo", "error");
    }
  }
}

````

### `src/controllers/renderers/dashboard/banner.ts` — 180 lineas

````typescript
/**
 * src/controllers/renderers/dashboard/banner.ts
 * Banner "Estado del atleta · HOY" y banner de correlación bienestar↔rendimiento.
 * Funciones puras: reciben `rutina` y `perfil` y devuelven HTML (string). Sin estado.
 */
import * as H from "../../../utils/dashboard-helpers.ts";
import { esc } from "../../../utils.ts";
import { WellnessCorrelation } from "../../../wellness-correlation.js";
import type { SesionEntrenamiento, PerfilAtletaData, Readiness, TendenciaReadiness } from "../../../types/gym.d.ts";

/** Banner vacío cuando no hay readiness calculable. */
export function noReadiness(): string {
  return `
      <div class="readiness-empty">
        <span class="readiness-empty-score">—</span>
        <span class="muted">Registrá tu bienestar para obtener tu readiness.</span>
      </div>`;
}

/** Sugerencia textual según el score de readiness. */
export function sugerenciaReadiness(opts: { score: number }): string {
  const { score } = opts;
  if (score >= 70) return "Listo para rendir a plena capacidad 💪";
  if (score >= 50) return "Cuidá la fatiga antes de cargar pesado.";
  return "Priorizá recuperación: dormí, hidratate y ajustá el volumen.";
}

const ICONO_WELLNESS =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
const ICONO_ACWR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h4M14 12h4M6 18h4M14 18h4"/></svg>';
const ICONO_CMJ =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="4"/></svg>';

/** Círculo semáforo de la cabecera según la variable CSS de estado. */
function circuloEstado(varCss: string): string {
  return `<svg viewBox="0 0 24 24" width="16" height="16" class="semaphore-circle"><circle cx="8" cy="8" r="6" fill="var(${varCss})"/></svg>`;
}

/** Banner de correlación bienestar ↔ rendimiento (top 2 variables). */
export function correlacionWellnessBanner(opts: { 
  rutina: { historial: SesionEntrenamiento[] }; 
  perfil: { data: PerfilAtletaData } | null 
}): string {
  const { rutina, perfil } = opts;
  const hist = rutina ? rutina.historial || [] : [];
  const wellness = (perfil && perfil.data && perfil.data.wellness) || [];
  const analisis = WellnessCorrelation.analizar(hist, wellness);
  if (!analisis || !analisis.suficienteDatos) return "";

  const etiquetas: Record<string, string> = {
    sueno: "sueño",
    estres: "estrés",
    doms: "DOMS",
    motivacion: "motivación",
    energia: "energía",
    fatiga: "fatiga",
    alimentacion: "alimentación",
    hidratacion: "hidratación",
  };
  const orden = Object.keys(etiquetas);
  const lineas: Array<{ fuerza: number; html: string }> = [];

  orden.forEach((m: string) => {
    const d = (analisis as unknown as Record<
      string,
      { diffPct: number | null; nBajos: number; nAltos: number } | undefined
    >)[m];
    if (!d || d.diffPct === null || d.nBajos === 0 || d.nAltos === 0) return;
    const signo = d.diffPct >= 0 ? "+" : "";
    lineas.push({
      fuerza: Math.abs(d.diffPct),
      html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/></svg> Con ${etiquetas[m]} alto vs bajo: <strong>${signo}${d.diffPct}%</strong> de volumen promedio.`,
    });
  });

  if (!lineas.length) return "";
  // Solo las 2 asociaciones más fuertes (mayor |%| primero) para no saturar el banner.
  lineas.sort((a, b) => b.fuerza - a.fuerza);
  const top = lineas
    .slice(0, 2)
    .map((l) => `<p>${l.html}</p>`)
    .join("");

  return `
      <div class="estado-insight">
        ${top}
        <p class="insight-note">Asociación observada con tu volumen, no causalidad.</p>
      </div>`;
}
/** Banner principal "Estado del atleta · HOY". */
export function estadoAtletaBanner(opts: { rutina: { historial: SesionEntrenamiento[] }; perfil: ({ data: PerfilAtletaData } | null) }): string {
  const { rutina, perfil } = opts;
  const hist = rutina ? rutina.historial || [] : [];
  const historialConv = hist.map((s) => ({
    fechaISO: s.isoDate,
    fecha: s.fecha,
    timestamp: undefined,
    volumenTotal: s.volumenTotal,
    ejercicios: undefined,
  }));
  const wellness = (perfil && perfil.data && perfil.data.wellness) || [];
  const saltos = (perfil && perfil.data && perfil.data.saltos) || [];

  const hoy: Readiness | null = H.calcularReadiness({ wellness, saltos, historial: historialConv });
  if (!hoy) return `<div class="panel-card card--hero estado-banner">${noReadiness()}</div>`;

  const senales = H.senalesFatiga({ perfil, historial: historialConv });
  const acwr = H.acwrDatos(historialConv);
  const ventana = H.ventanaAnteriorReadiness({ wellness, saltos, historial: historialConv }, 4);
  const anterior: Readiness | null = H.calcularReadiness(ventana);
  const tend: TendenciaReadiness = H.tendenciaReadiness(hoy, anterior);

  const color = hoy.color;
  let titulo: string;
  let circleSvg: string;
  if (hoy.score >= 70) {
    titulo = "BUEN MOMENTO PARA ENTRENAR";
    circleSvg = circuloEstado("--success-text");
  } else if (hoy.score >= 50) {
    titulo = "RECUPERACIÓN MODERADA";
    circleSvg = circuloEstado("--warning-text");
  } else {
    titulo = "NECESITÁS DESCANSAR";
    circleSvg = circuloEstado("--danger-text");
  }

  const filas = [
    { key: "wellness", icon: ICONO_WELLNESS, label: "Bienestar" },
    { key: "acwr", icon: ICONO_ACWR, label: "Carga · ACWR" },
    { key: "cmj", icon: ICONO_CMJ, label: "Potencia · CMJ" },
  ];

  const desglose = filas
    .map((f: { key: string; icon: string; label: string }) => {
      const t = tend[f.key] || { actual: null, anterior: null, direccion: "nuevo", delta: null };
      const actual = t.actual;
      const bar =
        actual !== null
          ? `<span class="estado-barra"><i style="width:${Math.max(0, Math.min(100, actual))}%"></i></span>`
          : `<span class="estado-barra estado-barra--empty"></span>`;
      const score = actual !== null ? `<b>${Math.round(actual)}</b>` : "<b>—</b>";
      const flecha =
        t.direccion === "subio"
          ? '<span class="trend up" title="Subió">▲</span>'
          : t.direccion === "bajo"
          ? '<span class="trend down" title="Bajó">▼</span>'
          : t.direccion === "estable"
          ? '<span class="trend flat" title="Estable">→</span>'
          : '<span class="trend flat" title="Sin dato previo">—</span>';
      const delta =
        t.delta !== null ? `<span class="trend-delta">${t.delta >= 0 ? "+" : ""}${t.delta}</span>` : "";
      const subEtiqueta =
        f.key === "acwr" && actual !== null && acwr && acwr.zona !== "sin_datos"
          ? `<span class="estado-sub">${esc(acwr.etiqueta || "")}</span>`
          : "";
      const labelCell = `<span class="estado-label">${esc(f.label)}${subEtiqueta}</span>`;
      return `<div class="estado-row">${f.icon}${labelCell}${bar}${score}${flecha}${delta}</div>`;
    })
    .join("");

  const alertas = senales.length
    ? `<div class="estado-alertas">${senales.map((s: string) => `<p>⚠️ ${esc(s)}</p>`).join("")}</div>`
    : "";

  const insight = correlacionWellnessBanner({ rutina, perfil });

  return `
      <div class="panel-card card--hero estado-banner" style="border-left:4px solid ${color};border-color:${color}66;background:linear-gradient(135deg,${color}1f,${color}08)">
        <div class="estado-head">
          <span class="eyebrow" style="color:${color}">ESTADO DEL ATLETA · HOY</span>
          <span class="estado-score" style="color:${color}">${hoy.score} · READY</span>
          <button class="link-safe" id="fatigaAjustarBtn">Ajustar</button>
        </div>
        <h3 class="estado-titulo">${circleSvg} ${titulo}</h3>
        <p class="estado-sugerencia">${sugerenciaReadiness({ score: hoy.score })}</p>
        <div class="estado-desglose">${desglose}</div>
        ${alertas}
        ${insight}
      </div>`;
}
````

### `src/controllers/renderers/dashboard/cards.ts` — 590 lineas

````typescript
/**
 * src/controllers/renderers/dashboard/cards.ts
 * Tarjetas del Dashboard (quick start, bienestar, cardio, estadísticas, ACWR,
 * periodización, sugerencia, calendario, RM/PRs y landmarks). Funciones puras:
 * reciben datos y devuelven HTML (string). Sin estado.
 */
import * as H from "../../../utils/dashboard-helpers.ts";
import { esc } from "../../../utils.ts";
import { EJERCICIOS_DISPONIBLES } from "../../../config.ts";
import { ExerciseGuide } from "../../../components/exercise-guide.js";
import {
  WELLNESS_LABELS,
  WELLNESS_KEYS,
  USUARIOS_ESPECIALES,
  STAR_ICON,
  formatNum,
  fechaCorta,
  zonaAcwr,
  zonaVolumen,
  dryLast,
} from "./common.ts";
import { sparkline } from "./sparkline.ts";
import type { WellnessRegistro, SesionEntrenamiento, Readiness, SesionCardio, ResumenCardio, BloquePeriodizacion, NutricionRegistro } from "../../../types/gym.d.ts";

/** 1RM destacado (H.bestRM): mejor ejercicio por RM estimado + delta semanal. */
export interface RmDestacado {
  nombre: string;
  rm: number;
  delta?: number | null;
}

/** Un PR reciente de los últimos 14 días (H.prsRecientes.recientes). */
export interface PrReciente {
  nombre: string;
  carga: string;
  delta?: number | null;
}

/** PRs recientes + mejor PR histórico (H.prsRecientes). */
export interface PrsResumen {
  recientes: PrReciente[];
  mejor: { nombre: string; rm: number } | null;
}

/** Ratio de carga aguda:crónica (FisiologiaCargas.calcularACWR). */
export interface AcwrResumen {
  ratio: number;
}

/** Landmark de volumen semanal por grupo muscular (VolumeLandmarks.analizarSemana). */
export interface LandmarkGrupo {
  musculo: string;
  efectivas?: number;
  mev?: number;
  mav?: number;
  mrv?: number;
  estado: string;
}

/** Último trabajo registrado de un grupo muscular (H.ultimoTrabajoPorMusculo). */
export interface UltimoTrabajoGrupo {
  nombre: string;
  peso: number;
  reps: number;
  rpe?: number | null;
  dias: number;
}

/** Celda de la franja de calendario de 7 días (H.ultimos7Dias). */
export interface DiaCalendario {
  iso: string;
  entrenado: boolean;
  weekday: number;
  numero: number;
  esHoy: boolean;
}

/** Tarjeta de inicio rápido con saludo + CTA. */
export function quickStart(opts: { hist: SesionEntrenamiento[]; ult: string; tieneRutinaHoy: boolean }): {
  modo: "armar" | "continuar";
  html: string;
} {
  const { hist, ult, tieneRutinaHoy } = opts;
  const historialConv = hist.map((s) => ({
    fechaISO: s.fechaISO,
  }));
  const yaEntreno = H.ultimos7Dias(historialConv)[6] && H.ultimos7Dias(historialConv)[6].entrenado;
  const nombre = !ult || USUARIOS_ESPECIALES.includes(ult) ? "" : `, ${esc(ult)}`;
  let botonTexto: string;
  let botonInfo: string;
  let modo: "armar" | "continuar" = "armar";

  if (tieneRutinaHoy) {
    botonTexto = "Continuar rutina de hoy";
    botonInfo = "Tu entrenamiento de hoy está cargado y listo para empezar.";
    modo = "continuar";
  } else if (yaEntreno && hist.length) {
    botonTexto = "Iniciar rutina sugerida";
    botonInfo = "Enfocate en el grupo muscular con menor work-volume semanal.";
  } else {
    botonTexto = "Iniciar mi primer entrenamiento";
    botonInfo = "Arrancá con una rutina enfocada en tu grupo muscular del día.";
  }

  return {
    modo,
    html: `
      <div class="quick-card">
        <div class="quick-copy">
          <div class="eyebrow">HOY</div>
          <h2 class="greeting">${esc(H.saludo())}${nombre}</h2>
          <p class="greeting-date">${esc(H.fechaFormateada())}</p>
          <p class="quick-info">${botonInfo}</p>
        </div>
        <div class="quick-actions">
          <button class="btn-scale cta-block" id="quickStartBtn" data-modo="${modo}">${botonTexto}</button>
        </div>
      </div>`,
  };
}

/** Tarjeta de wellness con selector por días + sparkline de 7 días. */
export function wellnessCard(opts: { wellness: WellnessRegistro[]; readiness: Readiness }): string {
  const serie = H.wellnessSerie(opts.wellness, 7);
  const sueno = dryLast(opts.wellness);
  const color = opts.readiness ? opts.readiness.color : "#77829C";
  const tieneRecientes = serie.length > 0;

  // Estado vacío: no hay wellness reciente → CTA para registrar hoy.
  if (!tieneRecientes) {
    return `
      <div class="panel-card full">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">BIENESTAR</div>
            <h3>¿Cómo te sentís hoy?</h3>
          </div>
        </div>
        <p class="wellness-empty-copy">Registra tu wellness de hoy para ver tu evolución y obtener tu score de readiness.</p>
        <button class="btn-scale cta-block" id="wellnessIrRegistrarBtn">Registra tu wellness de hoy</button>
      </div>`;
  }

  return `
      <div class="panel-card full">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">BIENESTAR</div>
            <h3>¿Cómo te sentís hoy?</h3>
          </div>
          <button class="btn-scale link-safe" id="wellnessAjustarBtn">Descanso / fatiga</button>
        </div>
        <div class="wellness-tracker">
          ${WELLNESS_LABELS.map((lb, i) => {
            const key = WELLNESS_KEYS[i];
            const val = sueno ? sueno[key] : 1;
            return `
            <div class="wellness-row">
              <span class="wellness-label">${lb}</span>
              <div class="wellness-stars" data-var="${key}">
                ${[1, 2, 3, 4, 5]
                  .map((n) => `<button class="wstar${val >= n ? " on" : ""}" data-dfa="${val >= n ? "on" : ""}" data-val="${n}" aria-label="${lb} ${n}">${n}</button>`)
                  .join("")}
              </div>
            </div>`;
          }).join("")}
          <button class="btn-scale" id="wellnessGuardarBtn">Guardar hoy</button>
        </div>
        <div class="wellness-serie"><div class="eyebrow">ÚLTIMOS 7 DÍAS</div>${sparkline(serie)}</div>
        <div class="wellness-note" style="color:${color}">
          ${opts.readiness ? "Tu readiness se basa en 8 métricas: sueño, energía, fatiga, alimentación, hidratación, motivación, estrés y DOMS." : "Registrá tu bienestar para obtener tu score de readiness."}
        </div>
      </div>`;
}

/** Tarjeta cardio: resumen de la última semana sin romper el layout. */
export function cardioCard(opts: { sesiones: SesionCardio[]; resumen: ResumenCardio }): string {
  const { sesiones, resumen } = opts;

  if (!resumen || resumen.sesiones === 0) {
    return `
      <div class="panel-card">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">CARDIO</div>
            <h3>Semana sin cardio</h3>
          </div>
        </div>
        <p class="muted">Registrá sesiones de correr, bici, remo u otro para ver tu volumen semanal aquí.</p>
        <div class="cardio-stats">
          <div class="cardio-stat"><strong>0</strong><span>sesiones</span></div>
          <div class="cardio-stat"><strong>0</strong><span>min</span></div>
          <div class="cardio-stat"><strong>0</strong><span>km</span></div>
        </div>
        <div class="cardio-acciones">
          <button class="btn-scale" id="cardioRegistrarBtn" type="button">+ Registrar cardio</button>
        </div>
      </div>`;
  }

  const ultima = sesiones[0];
  const tipoLabel: Record<string, string> = {
    correr: "Correr",
    bici: "Bici",
    remo: "Remo",
    otro: "Otro",
  };
  const nombreTipo = tipoLabel[ultima?.tipo] || (ultima?.tipo ? String(ultima.tipo) : "Cardio");
  const detalleUltima =
    `${esc(nombreTipo)} · ${formatNum(ultima?.duracion)} min` +
    `${ultima?.distancia ? " · " + formatNum(ultima.distancia) + " km" : ""}` +
    `${ultima?.fc ? " · FC " + formatNum(ultima.fc) + " ppm" : ""}`;

  return `
      <div class="panel-card">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">CARDIO</div>
            <h3>Resumen semanal</h3>
          </div>
          <span class="tag cardio-tag">7 días</span>
        </div>
        <div class="cardio-stats">
          <div class="cardio-stat"><strong>${formatNum(resumen.sesiones)}</strong><span>sesiones</span></div>
          <div class="cardio-stat"><strong>${formatNum(resumen.minutos)}</strong><span>min</span></div>
          <div class="cardio-stat"><strong>${formatNum(resumen.distancia)}</strong><span>km</span></div>
        </div>
        <div class="cardio-extra">
          ${resumen.fcPromedio ? `<span class="label">FC media <strong>${formatNum(resumen.fcPromedio)}</strong> ppm</span>` : ""}
          ${resumen.rpePromedio ? `<span class="label">RPE medio <strong>${formatNum(resumen.rpePromedio)}</strong>/10</span>` : ""}
        </div>
        <p class="muted cardio-last">Última: ${detalleUltima}</p>
        <div class="cardio-acciones">
          <button class="btn-scale" id="cardioRegistrarBtn" type="button">+ Registrar cardio</button>
        </div>
      </div>`;
}

/** Tarjeta ACWR con barra semáforo y leyenda. */
export function acwrCard(acwr: AcwrResumen | null): string {
  const r = acwr && !isNaN(acwr.ratio) ? acwr.ratio : 0;
  const color =
    r === 0 ? "#77829C" : r >= 0.8 && r <= 1.3 ? "#54E08A" : r > 1.3 && r <= 1.5 ? "#FFD166" : "#FF7A7A";
  const pct = Math.min(100, (r / 1.5) * 100) || 0;
  return `
      <div class="panel-card">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">CARGA SEMANAL</div>
            <h3>ACWR</h3>
          </div>
          <strong class="metric" style="color:${color}">${formatNum(r)}</strong>
        </div>
        <div class="acwr-bar" aria-label="ACWR ${formatNum(r)}">
          <div class="acwr-seg low"></div>
          <div class="acwr-seg ok"></div>
          <div class="acwr-marker" style="left:${pct}%"></div>
        </div>
        <div class="acwr-leyenda">Poco volumen&nbsp;·&nbsp;Equilibrio&nbsp;·&nbsp;Mucho volumen</div>
        <p>${esc(zonaAcwr(r))}</p>
      </div>`;
}

/** Tarjeta de periodización (bloque activo + progreso). */
export function periodizacionCard(per: BloquePeriodizacion): string {
  if (!per) {
    return `
        <div class="panel-card">
          <div class="eyebrow">PERIODIZACIÓN</div>
          <h3>Sin bloque activo</h3>
          <p>Creá un bloque en la sección Periodización para ver tu progreso aquí.</p>
          <button class="btn-scale" id="goPeriodizacionBtn">Crear bloque</button>
        </div>`;
  }
  const tipoLabel: Record<string, string> = {
    acumulacion: "Acumulación",
    intensificacion: "Intensificación",
    realizacion: "Realización",
    dup: "DUP",
    deload: "Deload",
  };
  return `
      <div class="panel-card">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">PERIODIZACIÓN</div>
            <h3>${esc(per.nombre || "Bloque activo")}</h3>
          </div>
          <span class="tag" style="color:#7DB7FF;border-color:#7DB7FF55;background:#7DB7FF18">${esc(tipoLabel[per.tipo] || per.tipo)}</span>
        </div>
        <div class="periodizacion-row">
          <div class="ring-small" style="--pct:${per.progresoPct}"><span>${per.progresoPct}%</span></div>
          <div class="periodizacion-meta">
            <span class="label">Semana <strong>${per.semanaActual}</strong> de ${per.totalSemanas}</span>
            <div class="mini-progress"><i style="width:${per.progresoPct}%"></i></div>
            <span class="muted">Inicio: ${esc(fechaCorta(per.fechaInicio))}</span>
          </div>
        </div>
        <button class="btn-scale" id="goPeriodizacionBtn">Ver plan completo</button>
      </div>`;
}

/** Tarjeta de hábitos diarios de nutrición (nivel normal). */
export function nutricionCard(nutricionHoy: NutricionRegistro | null = null): string {
  const comidas = nutricionHoy ? Math.max(0, Math.min(8, Number(nutricionHoy.comidas) || 0)) : 0;
  const proteina = Boolean(nutricionHoy && nutricionHoy.proteina);
  const agua = Boolean(nutricionHoy && nutricionHoy.agua);

  return `
      <div class="panel-card" id="nutricionCard">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">NUTRICIÓN</div>
            <h3>Hábitos de hoy</h3>
          </div>
        </div>
        <div class="nutricion-body">
          <div class="nutricion-row">
            <span class="nutricion-label">Comidas hoy</span>
            <div class="nutricion-stepper">
              <button type="button" class="stepper-chip" data-step-target="nutricionComidas" data-step-val="-1" aria-label="Restar comida">-1</button>
              <input type="number" id="nutricionComidas" class="nutricion-input" min="0" max="8" step="1" value="${comidas}" readonly inputmode="numeric" aria-label="Comidas hoy">
              <button type="button" class="stepper-chip" data-step-target="nutricionComidas" data-step-val="1" aria-label="Sumar comida">+1</button>
            </div>
          </div>
          <div class="nutricion-row">
            <span class="nutricion-label">Objetivos</span>
            <div class="nutricion-toggles">
              <button type="button" class="toggle-chip${proteina ? " is-active" : ""}" id="nutricionProteinaBtn" aria-pressed="${proteina ? "true" : "false"}">Proteína ✓</button>
              <button type="button" class="toggle-chip${agua ? " is-active" : ""}" id="nutricionAguaBtn" aria-pressed="${agua ? "true" : "false"}">Agua ✓</button>
            </div>
          </div>
          <button class="btn-scale" id="nutricionGuardarBtn" type="button">Guardar hoy</button>
        </div>
      </div>`;
}

/** Fila horizontal scrolleable (scroll-snap) con 5 mini-cards de stats. */
export function quickStatsRow(opts: { vol: { esta: number; anterior: number; deltaPct: number }; se: number; stre: number; best: RmDestacado | null; acwr: AcwrResumen | null }): string {
  const { vol, se, stre, best, acwr } = opts;
  // --- 1. 1RM Estimado ---
  const rmIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18V6"/><path d="M18 18V6"/><rect x="2" y="8" width="8" height="8" rx="1"/><rect x="14" y="8" width="8" height="8" rx="1"/><path d="M6 12h12"/></svg>';
  let rmValue: string;
  let rmLabel: string;
  let rmDelta: string;
  if (best) {
    rmValue = `${best.rm}<small>kg</small>`;
    rmLabel = esc(best.nombre);
    const delta = best.delta;
    const noDelta = delta === null || delta === undefined;
    if (noDelta) {
      rmDelta = '<span class="qs-delta muted">—</span>';
    } else {
      const arrow = delta >= 0 ? "↑" : "↓";
      const cls = delta >= 0 ? "pos" : "neg";
      rmDelta = `<span class="qs-delta ${cls}">${arrow} ${delta >= 0 ? "+" : ""}${formatNum(delta)}kg</span>`;
    }
  } else {
    rmValue = "—";
    rmLabel = "1RM Estimado";
    rmDelta = '<span class="qs-delta muted">Sin datos</span>';
  }

  // --- 2. Volumen Semanal ---
  const volIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>';
  const volDeltaCls = vol.deltaPct >= 0 ? "pos" : "neg";
  const volArrow = vol.deltaPct > 0 ? "↑" : vol.deltaPct < 0 ? "↓" : "";
  const volDeltaTxt = (vol.deltaPct > 0 ? "+" : "") + vol.deltaPct + "%";

  // --- 3. Series Efectivas ---
  const seIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';

  // --- 4. ACWR ---
  const acwrIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
  const acwrRatio = acwr && !isNaN(acwr.ratio) ? acwr.ratio : 0;
  const acwrColor = acwrRatio === 0
    ? "#77829C"
    : acwrRatio >= 0.8 && acwrRatio <= 1.3
      ? "#54E08A"
      : acwrRatio > 1.3 && acwrRatio <= 1.5
        ? "#FFD166"
        : "#FF7A7A";
  const acwrTooltip = acwrRatio === 0
    ? "Sin datos suficientes"
    : acwrRatio >= 0.8 && acwrRatio <= 1.3
      ? "Carga equilibrada"
      : acwrRatio > 1.3 && acwrRatio <= 1.5
        ? "Carga alta — Precaución"
        : acwrRatio > 1.5
          ? "Carga muy alta — Riesgo"
          : "Carga baja — Subir volumen";

  // --- 5. Racha ---
  const streakIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';

  return `
      <div class="quick-stats-row">
        <div class="qs-card">
          <div class="qs-icon">${rmIcon}</div>
          <strong class="qs-value">${rmValue}</strong>
          <span class="qs-label">${rmLabel}</span>
          ${rmDelta}
        </div>
        <div class="qs-card">
          <div class="qs-icon">${volIcon}</div>
          <strong class="qs-value">${formatNum(vol.esta)}<small>kg</small></strong>
          <span class="qs-label">Volumen Semanal</span>
          <span class="qs-delta ${volDeltaCls}">${volArrow} ${volDeltaTxt}</span>
        </div>
        <div class="qs-card">
          <div class="qs-icon">${seIcon}</div>
          <strong class="qs-value">${se}</strong>
          <span class="qs-label">Series Efectivas</span>
          <span class="qs-delta muted">RPE ≥ 7 · 7d</span>
        </div>
        <div class="qs-card" title="${esc(acwrTooltip)}">
          <div class="qs-icon" style="color:${acwrColor}">${acwrIcon}</div>
          <strong class="qs-value" style="color:${acwrColor}">${formatNum(acwrRatio)}</strong>
          <span class="qs-label">ACWR</span>
          <span class="qs-delta" style="color:${acwrColor}">${esc(acwrTooltip)}</span>
        </div>
        <div class="qs-card">
          <div class="qs-icon">${streakIcon}</div>
          <strong class="qs-value">${stre}</strong>
          <span class="qs-label">Racha</span>
          <span class="qs-delta muted">${stre === 1 ? "día" : "días"} consecutivos</span>
        </div>
      </div>`;
}

/** Tarjeta 1RM estimado destacado con tendencia semanal. */
export function rmCard(best: RmDestacado | null): string {
  if (!best) {
    return `
        <div class="panel-card">
          <div class="eyebrow">1RM ESTIMADO</div>
          <p>Guardá sesiones con peso y repeticiones para ver tu estimación de 1RM.</p>
        </div>`;
  }
  const delta = best.delta;
  const noDelta = delta === null || delta === undefined;
  const arrow = noDelta ? "" : delta >= 0 ? "▲" : "▼";
  const cls = noDelta ? "muted" : delta >= 0 ? "delta pos" : "delta neg";
  const txt =
    noDelta
      ? "Sin comparación semanal"
      : `${arrow} ${delta >= 0 ? "+" : ""}${best.delta} kg esta semana`;
  return `
      <div class="panel-card">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">1RM ESTIMADO</div>
            <h3>${esc(best.nombre)}</h3>
          </div>
          <strong class="metric metric-lg">${best.rm}<small> kg</small></strong>
        </div>
        <div class="mini-progress" style="background:#77829C33"><i style="width:80%"></i></div>
        <span class="${cls}">${txt}</span>
      </div>`;
}

/** Tarjeta de PRs recientes (14 días) + mejor histórico. */
export function prsCard(prs: PrsResumen): string {
  if (!prs || (!prs.recientes.length && !prs.mejor)) {
    return `
        <div class="panel-card">
          <div class="eyebrow">PRs Y RECORDS</div>
          <p>Aún no hay registros con peso y series para calcular PRs.</p>
        </div>`;
  }
  const recientesHtml = prs.recientes.length
    ? prs.recientes
        .map(
          (pr: PrReciente) => `
        <div class="pr-item">
          <strong>${esc(pr.nombre)}</strong>
          <span>${esc(pr.carga)}</span>
          <em class="delta ${(pr.delta || 0) >= 0 ? "pos" : "neg"}">${pr.delta === null || pr.delta === undefined ? "" : (pr.delta >= 0 ? "+" : "") + formatNum(pr.delta) + " kg"}</em>
        </div>`
        )
        .join("")
    : `<p class="muted">Ningún PR en los últimos 14 días.</p>`;
  const mejor = prs.mejor
    ? `<div class="pr-best"><span>Mejor histórico</span><strong>${esc(prs.mejor.nombre)} · ${formatNum(prs.mejor.rm)} kg</strong></div>`
    : "";
  return `
      <div class="panel-card">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">PRs Y RECORDS</div>
            <h3>Últimos 14 días</h3>
          </div>
        </div>
        ${recientesHtml}
        ${mejor}
      </div>`;
}

/** Landmarks MGV por grupo con sectores MEV/MAV/MRV. */
export function landmarksCard(lmks: LandmarkGrupo[]): string {
  const items = lmks.slice(0, 4);
  const head =
    items.length === 0
      ? `<p class="muted">Datos insuficientes esta semana.</p>`
      : items
          .map((l: LandmarkGrupo) => {
            const max = Math.max(25, l.mrv || l.mav || 1);
            const width = Math.min(100, Math.round(((l.efectivas || 0) / max) * 100));
            const zona = zonaVolumen(l);
            return `
            <div class="lmk-item">
              <div class="lmk-row">
                <span class="label">${esc(H.nombreMusculo(l.musculo))}</span>
                <span class="muted">${l.efectivas || 0} SE</span>
              </div>
              <div class="lmk-bar">
                <i style="width:${width}%;background:${zona.color}"></i>
              </div>
            </div>`;
          })
          .join("");
  return `
      <div class="panel-card full">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">MGV · VOLUMEN SEMANAL</div>
            <h3>Margen de crecimiento</h3>
          </div>
        </div>
        <div class="lmk-zone-leyenda">
          <span><i class="z mev"></i>MEV</span>
          <span><i class="z mav"></i>MAV</span>
          <span><i class="z mrv"></i>MRV</span>
        </div>
        ${head}
      </div>`;
}

/** Sugerencia del grupo muscular del día. */
export function sugerenciaCard(opts: { grupo: string; ultimo: UltimoTrabajoGrupo | null }): string {
  const nombre = H.nombreMusculo(opts.grupo);
  const ult = opts.ultimo
    ? `Última vez: ${esc(opts.ultimo.nombre)} ${opts.ultimo.peso}kg x${opts.ultimo.reps} hace ${opts.ultimo.dias === 0 ? "hoy" : opts.ultimo.dias + " días"}`
    : "Aún no hay registros de este grupo.";

  // "Ver técnica": abre la guía del primer ejercicio del grupo que la tenga.
  const guiado = (EJERCICIOS_DISPONIBLES || []).find((e) => e.musculo === opts.grupo && ExerciseGuide.porId(e.id));
  const tecnicaBtn = guiado
    ? `<button class="btn-scale secondary w-100 mt-1" id="sugerenciaGuiaBtn" data-ej-id="${esc(guiado.id)}">Ver técnica · ${esc(guiado.nombre)}</button>`
    : "";

  return `
      <div class="panel-card">
        <div class="eyebrow">FOCO DEL DÍA</div>
        <div class="sugerencia-main">
          <span class="sugerencia-icon" aria-hidden="true">${STAR_ICON}</span>
          <div>
            <h3>${esc(nombre)}</h3>
            <p class="muted">${esc(ult)}</p>
          </div>
        </div>
        <button class="btn-scale cta-block" id="sugerenciaBtn">Empezar rutina de ${esc(nombre.toLowerCase())}</button>
        ${tecnicaBtn}
      </div>`;
}

/** Franja de calendario (7 días). */
export function calendario(days: DiaCalendario[]): string {
  const cells = days
    .map((d: DiaCalendario) => {
      const cls = ["day-cell", d.entrenado ? "trained" : "", d.esHoy ? "today" : ""]
        .filter(Boolean)
        .join(" ");
      return `
        <div class="${cls}">
          <span class="dow">${H.abreviaturaDia(d.weekday)}</span>
          <span class="num">${d.numero}</span>
        </div>`;
    })
    .join("");
  return `
      <div class="panel-card full">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">CONSISTENCIA</div>
            <h3>Últimos 7 días</h3>
          </div>
        </div>
        <div class="week-strip">${cells}</div>
      </div>`;
}
````

### `src/controllers/renderers/dashboard/common.ts` — 84 lineas

````typescript
/**
 * src/controllers/renderers/dashboard/common.ts
 * Helpers y constantes compartidas de las tarjetas del Dashboard.
 * Funciones puras de formateo/zonas sin estado. La única fuente de escape es
 * `esc` de utils (aquí se usa `esc` como nombre por consistencia entre módulos).
 */
import type { WellnessRegistro } from "../../../types/gym.d.ts";
interface VolumenLookup {
  estado: string;
}
import { esc } from "../../../utils.ts";

export { esc };

export const WELLNESS_LABELS = [
  "Sueño",
  "Motivación",
  "Estrés",
  "DOMS",
  "Energía",
  "Fatiga",
  "Alimentación",
  "Hidratación",
];

export const WELLNESS_KEYS = [
  "sueno",
  "motivacion",
  "estres",
  "doms",
  "energia",
  "fatiga",
  "alimentacion",
  "hidratacion",
] as const;

export const USUARIOS_ESPECIALES = ["Invitado", "Cargando…"];

export const STAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg>';

/** Formatea un número para mostrar en las tarjetas (es-ES). */
export function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const num = Number(n);
  if (Math.abs(num) >= 1000) return Math.round(num).toLocaleString("es-ES");
  if (num % 1 === 0) return Math.round(num).toString();
  return num.toFixed(1);
}

/** Fecha corta ("16 sep") a partir de un ISO de día (YYYY-MM-DD). */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(d);
}

/** Lectura textual de la zona de carga aguda:crónica. */
export function zonaAcwr(r: number): string {
  if (r === 0) return "Sin datos suficientes.";
  if (r >= 0.8 && r <= 1.3) return "Carga equilibrada. Buen momento para entrenar fuerte.";
  if (r > 1.3 && r <= 1.5) return "Carga media. Cerca del límite superior.";
  if (r > 1.5) return "Carga muy alta. Riesgo de lesión.";
  return "Carga baja. Podés sumar volumen.";
}

/** Metadatos (color + etiqueta) de la zona de volumen de un grupo. */
export function zonaVolumen(l: VolumenLookup): { color: string; label: string } {
  const map: Record<string, { color: string; label: string }> = {
    sobre_mrv: { color: "#FF7A7A", label: "Riesgo de sobrecarga" },
    en_mav: { color: "#54E08A", label: "Zona óptima" },
    en_mev: { color: "#7DB7FF", label: "Mantenimiento" },
    sub_mev: { color: "#77829C", label: "Bajo estímulo" },
  };
  return map[l.estado] || map.sub_mev;
}

/** Retorna el último registro de bienestar o null si la serie está vacía. */
export function dryLast(wellness: WellnessRegistro[]): WellnessRegistro | null {
  return wellness[wellness.length - 1] || null;
}
````

### `src/controllers/renderers/dashboard/events.ts` — 133 lineas

````typescript
/**
 * src/controllers/renderers/dashboard/events.ts
 * Wiring de eventos del Dashboard: conecta los listeners del contenedor
 * renderizado con los métodos del controlador. Extraído de
 * DashboardController._bindActions (Fase 2) para dejar el controlador delgado.
 *
 * Sin estado propio: recibe el controlador (`c`), que expone `container`,
 * `cardio`, `_quickStartModo` y los métodos de acción (`_ir`, `_marcarStar`,
 * `_guardarWellness`, `_guardarNutricion`, `_iniciarRutina`,
 * `_iniciarRutinaSugerida`, `render`). Reconstrucción idempotente: el
 * contenedor se re-renderiza completo y los listeners viejos mueren con el
 * DOM viejo.
 */
import { Toast } from "../../../toast.js";
import { ExerciseGuide } from "../../../components/exercise-guide.js";
import { CardioForm } from "../../../components/cardio-form.js";
import { GestorTimer } from "../../../gestor-timer.js";
import { WELLNESS_KEYS } from "./common.ts";
import type { DashboardController } from "../../dashboard.controller";

/** Vincula todos los eventos tras renderizar. Recibe el DashboardController. */
export function bindDashboardActions(c: DashboardController): void {
  const container: HTMLElement = c.container;
  const qs = (id: string): Element | null => container.querySelector(id);

  const quick = qs("#quickStartBtn");
  if (quick) {
    quick.addEventListener("click", () => {
      // "Continuar rutina de hoy" ya está armada → solo navega.
      // Cualquier otro estado ("Iniciar mi primer entrenamiento" / "Iniciar
      // rutina sugerida") debe armar la rutina antes de navegar a Entrenar.
      if (c._quickStartModo === "continuar") c._iniciarRutina();
      else c._iniciarRutinaSugerida();
    });
  }

  const guardar = qs("#wellnessGuardarBtn");
  if (guardar) {
    guardar.addEventListener("click", () => {
      const valores: Record<string, number> = {};
      WELLNESS_KEYS.forEach((k: string) => {
        const group = container.querySelector(`.wellness-stars[data-var="${k}"]`);
        valores[k] = group ? group.querySelectorAll(".wstar.on").length : 1;
      });
      c._guardarWellness(valores);
    });
  }

  const ajFatiga = qs("#fatigaAjustarBtn");
  if (ajFatiga) ajFatiga.addEventListener("click", () => c._ir("profile", true));
  const ajWell = qs("#wellnessAjustarBtn");
  if (ajWell) ajWell.addEventListener("click", () => c._ir("profile", true));

  // Botón del estado vacío: navega al formulario de wellness (tab perfil).
  const irRegistrar = qs("#wellnessIrRegistrarBtn");
  if (irRegistrar) irRegistrar.addEventListener("click", () => c._ir("profile", true));

  // Botón "+ Registrar cardio": abre el modal para registrar una sesión.
  const cardioBtn = qs("#cardioRegistrarBtn");
  if (cardioBtn) {
    cardioBtn.addEventListener("click", () => {
      if (!c.cardio) return;
      CardioForm.abrir(c.cardio, { onGuardado: () => c.render() });
    });
  }

  container.querySelectorAll(".wstar").forEach((star: Element) =>
    star.addEventListener("click", () => c._marcarStar(star as HTMLElement))
  );

  container.querySelectorAll("#goPeriodizacionBtn").forEach((b: Element) =>
    b.addEventListener("click", () => c._ir("history", true))
  );
  const sug = qs("#sugerenciaBtn");
  if (sug) sug.addEventListener("click", () => c._iniciarRutinaSugerida());

  // Botón "Ver técnica": abre la guía del ejercicio guiado del día.
  container.querySelectorAll("#sugerenciaGuiaBtn").forEach((b: Element) => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-ej-id");
      if (!id) return;
      if (!ExerciseGuide.abrirPorEjercicio(id)) {
        Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
      }
    });
  });

  // Stepper de nutrición (+/- comidas)
  container.querySelectorAll('.stepper-chip[data-step-target="nutricionComidas"]').forEach((btn: Element) => {
    btn.addEventListener("click", (e: Event) => {
      e.preventDefault();
      const inputEl = container.querySelector("#nutricionComidas");
      if (!inputEl) return;
       const input = inputEl as HTMLInputElement;
       const stepValAttr = btn.getAttribute("data-step-val");
        const stepVal = stepValAttr ? parseFloat(stepValAttr) : 0;
      const current = parseInt(input.value, 10) || 0;
      const next = Math.max(0, Math.min(8, Math.round(current + stepVal)));
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      GestorTimer?.vibrarCorto?.();
    });
  });

  // Chips toggle de proteína y agua
  ["#nutricionProteinaBtn", "#nutricionAguaBtn"].forEach((id: string) => {
    const btn = qs(id);
    if (btn) {
      btn.addEventListener("click", () => {
        const pressed = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", String(!pressed));
        btn.classList.toggle("is-active", !pressed);
        GestorTimer?.vibrarCorto?.();
      });
    }
  });

  // Guardar nutrición
  const guardarNutricion = qs("#nutricionGuardarBtn");
  if (guardarNutricion) {
    guardarNutricion.addEventListener("click", () => {
      const inputEl = container.querySelector("#nutricionComidas");
       if (!inputEl) return;
       const input = inputEl as HTMLInputElement;
      const comidas = input ? parseInt(input.value, 10) || 0 : 0;
      const protBtn = qs("#nutricionProteinaBtn");
      const aguaBtn = qs("#nutricionAguaBtn");
      const proteina = protBtn ? protBtn.getAttribute("aria-pressed") === "true" : false;
      const agua = aguaBtn ? aguaBtn.getAttribute("aria-pressed") === "true" : false;
      c._guardarNutricion({ comidas, proteina, agua });
    });
  }
}

````

### `src/controllers/renderers/dashboard/sparkline.ts` — 88 lineas

````typescript
/**
 * src/controllers/renderers/dashboard/sparkline.ts
 * Render del sparkline de bienestar: SPA (spline de Catmull-Rom) suavizado
 * por los últimos 7 días, con leyenda. Sin estado.
 */
import * as H from "../../../utils/dashboard-helpers.ts";
import type { WellnessRegistro } from "../../../types/gym.d.ts";

const W = 260;
const HGT = 40;
const PAD_X = 8;
const PAD_Y = 6;

type Punto = [number, number];

/** Proyecta la serie de una clave de bienestar a coordenadas del SVG. */
export function sparklinePoints(wellness: WellnessRegistro[], key: "sueno" | "motivacion" | "estres" | "doms" | "fatiga"): Punto[] {
  const n = wellness.length;
  return wellness.map((w: WellnessRegistro, i: number): Punto => {
    const raw = w[key] || 1;
    const val =
      key === "estres" || key === "doms" || key === "fatiga" ? 6 - raw : raw;
    const x = n === 1 ? W / 2 : PAD_X + (i * (W - 2 * PAD_X)) / (n - 1);
    const y = HGT - PAD_Y - ((val - 1) / 4) * (HGT - 2 * PAD_Y);
    return [x, y];
  });
}

/** Trazo suavizado (Catmull-Rom → Bezier cúbico) a partir de los puntos. */
function suavePath(puntos: Punto[]): string {
  if (!puntos.length) return "";
  if (puntos.length === 1) {
    const [x, y] = puntos[0];
    return `M ${x} ${y} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  let d = `M ${puntos[0][0].toFixed(1)} ${puntos[0][1].toFixed(1)}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[Math.max(0, i - 1)];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[Math.min(puntos.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Render del sparkline multi-métrica con su leyenda. */
export function sparkline(wellness: WellnessRegistro[]): string {
  const keys: Array<["sueno" | "motivacion" | "estres" | "doms" | "fatiga", string, string]> = [
    ["sueno", H.COLORS_SPARKLINE.sueno, "Sueño"],
    ["motivacion", H.COLORS_SPARKLINE.motivacion, "Motivación"],
    ["estres", H.COLORS_SPARKLINE.estres, "Estrés"],
    ["doms", H.COLORS_SPARKLINE.doms, "DOMS"],
  ];

  const trazos = keys
    .map(([k, color]) => {
      const puntos = sparklinePoints(wellness, k);
      const d = suavePath(puntos);
      const dots = puntos
        .map(
          ([x, y]) =>
            `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${color}" fill-opacity="0.7"/>`
        )
        .join("");
      return (
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" ` +
        `stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.7"/>${dots}`
      );
    })
    .join("");

  const leyenda = keys
    .map(
      ([, color, label]) =>
        `<span class="spark-legend-item"><i style="background:${color}" aria-hidden="true"></i>${label}</span>`
    )
    .join("");

  return `
       <svg class="wellness-spark" viewBox="0 0 ${W} ${HGT}" preserveAspectRatio="none" aria-hidden="true">${trazos}</svg>
       <div class="spark-legend" role="list" aria-label="Leyenda de bienestar">${leyenda}</div>
  `;
}

````

### `src/controllers/renderers/dashboard/sparkline.ts.tmp` — omitido (extension no reconocida como texto; 0 bytes)

### `src/controllers/renderers/workout/events.ts` — 214 lineas

````typescript
/**
 * src/controllers/renderers/workout/events.ts
 * Wiring de eventos de la vista "Entrenar": conecta los listeners estáticos de el
 * (filtros, selector, botones de rutina, formulario de series, warm-up, discos,
 * timer, búsqueda y drag & drop) con los métodos del controlador. Extraído de
 * WorkoutController._bindEvents (Paso B) para dejar el controlador delgado.
 *
 * Sin estado propio: recibe el controlador (c), que expone el, rutina, timer y
 * los métodos de acción (_renderSelectorEjercicios, _abrirModalCrearEjercicio,
 * _guardarComoPlantilla, _agregarSerie, _guardarSesionCompleta, _calcularWarmUp,
 * _calcularDiscos, _syncGuiaBtn). Se vincula UNA sola vez en el constructor: la
 * vista es HTML estático; el contenido dinámico (rutina, series, plantillas)
 * re-vincula sus propios listeners al renderizarse.
 */
import { Store } from "../../../store.js";
import type { WorkoutController } from "../../../types/workout-controller";
import { Utils } from "../../../utils.ts";
import { Toast } from "../../../toast.js";
import { Dialog } from "../../../dialog.js";
import { FormulasRM } from "../../../formulas.js";
import { GestorTimer } from "../../../gestor-timer.js";
import { ExerciseGuide } from "../../../components/exercise-guide.js";
import { hacerReordenable } from "../../../dnd.js";

/** Vincula los listeners estáticos de la vista. Recibe el WorkoutController. */
export function bindWorkoutEvents(c: WorkoutController): void {
    // Filtro de grupo muscular
    if (c.el.filtroMusculoSelect) {
      c.el.filtroMusculoSelect.addEventListener("change", () => {
        c._grupoFiltroActual = c.el.filtroMusculoSelect.value;
        c._renderSelectorEjercicios();
      });
    }

    // Filtro de patrón de movimiento biomecánico
    if (c.el.filtroPatronSelect) {
      c.el.filtroPatronSelect.addEventListener("change", () => {
        c._patronFiltroActual = c.el.filtroPatronSelect.value;
        c._renderSelectorEjercicios();
      });
    }

    // Botón para crear ejercicio personalizado
    if (c.el.crearEjercicioBtn) {
      c.el.crearEjercicioBtn.addEventListener("click", () => c._abrirModalCrearEjercicio());
    }

    // Botón para guardar la rutina actual como plantilla
    if (c.el.guardarPlantillaBtn) {
      c.el.guardarPlantillaBtn.addEventListener("click", () => c._guardarComoPlantilla());
    }

    // Agregar ejercicio a la rutina
    c.el.agregarBtn.addEventListener("click", () => {
      const id = c.el.selectEjercicio.value;
      if (!id) return;
      if (c.rutina.agregarEjercicio(id)) {
        Store.guardar();
        Store.emit("routine:updated", c.rutina.data.rutina);
        GestorTimer.vibrarCorto();
        Toast.mostrar("Ejercicio agregado a la rutina", "success");
      } else {
        Toast.mostrar("Este ejercicio ya está en la rutina", "error");
      }
    });

    // Botón "Guía" junto al selector: abre la guía del ejercicio seleccionado.
    const guiaBtn = document.getElementById("guiaBtn");
    if (guiaBtn) {
      guiaBtn.addEventListener("click", () => {
        const id = c.el.selectEjercicio.value;
        if (!id) return;
        if (!ExerciseGuide.abrirPorEjercicio(id)) {
          Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
        }
      });
    }

    // Actualiza el estado visual del botón "Guía" al cambiar de ejercicio.
    if (c.el.selectEjercicio) {
      c.el.selectEjercicio.addEventListener("change", () => c._syncGuiaBtn());
    }

    // Reiniciar rutina completa
    c.el.resetRutinaBtn.addEventListener("click", async () => {
      const ok = await Dialog.confirm("¿Reiniciar toda la rutina de hoy?", {
        peligroso: true,
        textoConfirmar: "Reiniciar",
      });
      if (ok) {
        c.rutina.data.rutina = [];
        c.rutina.data.seriesPorEjercicio = {};
        c.rutina.data.superseries = {};
        c.rutina.ejercicioSeleccionado = null;
        Store.guardar();
        Store.emit("routine:updated", []);
        Toast.mostrar("Rutina reiniciada", "info");
      }
    });

    // Agregar serie individual
    c.el.addSerieBtn.addEventListener("click", () => c._agregarSerie());

    // Limpiar series del ejercicio actual
    c.el.limpiarSeriesBtn.addEventListener("click", async () => {
      const id = c.rutina.getEjercicioActual();
      if (!id) return;
      const ok = await Dialog.confirm("¿Borrar todas las series de este ejercicio?", { peligroso: true });
      if (ok) {
        c.rutina.eliminarTodasSeries(id);
        Store.guardar();
        Store.emit("series:updated", { ejercicioId: id });
        Toast.mostrar("Series eliminadas", "info");
      }
    });

    // Guardar sesión completa de entrenamiento
    c.el.guardarSesionBtn.addEventListener("click", () => c._guardarSesionCompleta());

    // Cálculos de RPE/RIR automáticos y cálculo de %1RM RTS en tiempo real
    const actualizarRPE1RMRealTime = () => {
      const peso = parseFloat(c.el.seriePeso?.value) || 0;
      const reps = parseInt(c.el.serieReps?.value, 10) || 0;
      const rpe = parseFloat(c.el.serieRPE?.value) || null;
      if (c.el.rpePorcentajeDisplay) {
        if (peso > 0 && reps > 0 && rpe) {
          const calc = FormulasRM.calcular1RMPorRPE(peso, reps, rpe);
          if (calc) {
            c.el.rpePorcentajeDisplay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/></svg> Carga: <strong>${calc.porcentaje}% 1RM</strong> (Tuchscherer RTS) → 1RM est: <strong>${calc.rm} kg</strong>`;
            return;
          }
        }
        c.el.rpePorcentajeDisplay.textContent = "";
      }
    };

    c.el.serieRPE.addEventListener("input", () => {
      if (!c._rirTocadoPorUsuario) {
        const rpe = parseFloat(c.el.serieRPE.value);
        if (!isNaN(rpe)) {
          c.el.serieRIR.value = String(Math.max(0, 10 - rpe));
        }
      }
      actualizarRPE1RMRealTime();
    });

    c.el.serieRIR.addEventListener("input", () => {
      c._rirTocadoPorUsuario = true;
      const rir = parseFloat(c.el.serieRIR.value);
      if (!isNaN(rir)) {
        c.el.serieRPE.value = String(Math.max(1, Math.min(10, 10 - rir)));
      }
      actualizarRPE1RMRealTime();
    });

    c.el.seriePeso?.addEventListener("input", actualizarRPE1RMRealTime);
    c.el.serieReps?.addEventListener("input", actualizarRPE1RMRealTime);

    // Atajo de teclado: Enter en los campos numéricos de la serie agrega la serie rápido.
    // No se vincula a textareas/selects para no interferir con la edición de texto.
    ["seriePeso", "serieReps", "serieRPE", "serieRIR"].forEach((id: string) => {
      const inp = document.getElementById(id);
      if (inp) {
        inp.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            c._agregarSerie();
          }
        });
      }
    });

    // Warm-up calculator
    c.el.calcularWarmUpBtn.addEventListener("click", () => c._calcularWarmUp());

    // Plate calculator
    c.el.calcularDiscosBtn.addEventListener("click", () => c._calcularDiscos());

    // Timer controls
    c.el.setTimerBtn.addEventListener("click", () => {
      const min = parseInt(c.el.timerMinutes.value, 10) || 0;
      const sec = parseInt(c.el.timerSeconds.value, 10) || 0;
      c.timer.setTiempo(min, sec);
      Toast.mostrar("Tiempo fijado", "info");
    });

    c.el.startTimerBtn.addEventListener("click", () => c.timer.iniciar());
    c.el.pauseTimerBtn.addEventListener("click", () => c.timer.pausar());
    c.el.resetTimerBtn.addEventListener("click", () => c.timer.reset());
  // Búsqueda por texto dentro del selector de ejercicios (Feature: Búsqueda + Filtros)
    if (c.el.ejercicioBusqueda) {
      c.el.ejercicioBusqueda.addEventListener(
        "input",
        Utils.debounce((e: Event) => {
          c._busquedaActual = ((e.target as HTMLInputElement).value || "").trim().toLowerCase();
          c._renderSelectorEjercicios();
        }, 180)
      );
    }

    // Drag & Drop para reordenar ejercicios (escritorio + táctil vía Pointer Events)
    if (c.el.rutinaContainer) {
      hacerReordenable(c.el.rutinaContainer, {
        selector: ".badge.routine-badge",
        handleSel: ".drag-handle",
        onReorder: (fromIdx: number, toIdx: number) => {
          if (c.rutina.reordenarEjercicio(fromIdx, toIdx)) {
            Store.emit("routine:updated", c.rutina.data.rutina);
            GestorTimer.vibrarCorto();
          }
        },
      });
    }
}

````

### `src/controllers/renderers/workout/renders.ts` — 401 lineas

````typescript
/**
 * src/controllers/renderers/workout/renders.ts
 * Renders DOM de la vista "Entrenar": filtros del catálogo, selector de ejercicios
 * con búsqueda, badges de la rutina, plantillas guardadas y predefinidas, series
 * del ejercicio actual y sugerencia de autorregulación. Extraídos de
 * WorkoutController (Paso B): el controlador queda delgado (delegación fina +
 * lógica de negocio) y aquí vive la construcción del DOM.
 *
 * Seguridad: todo se construye con createElement + textContent; nunca innerHTML
 * con datos del usuario (nombres de ejercicios/plantillas son input del usuario).
 * Sin estado propio: reciben el controlador (c), que expone el, rutina y los
 * métodos de acción; mutan directamente sus contenedores.
 */
import { Store } from "../../../store.js";
import { Toast } from "../../../toast.js";
import { ExerciseGuide } from "../../../components/exercise-guide.js";
import { GRUPOS_MUSCULARES, PATRONES_MOVIMIENTO } from "../../../data/exercises.js";
import { EJERCICIOS_DISPONIBLES } from "../../../config.ts";
import { PLANTILLAS_PREDEFINIDAS } from "../../../data/plantillas-predefinidas.js";
import { t } from "../../../i18n.js";
import type { WorkoutController } from "../../../types/workout-controller";
import type { Ejercicio, MusculoGrupo, Plantilla, PlantillaPredefinida, Serie } from "../../../types/gym.d.ts";
interface AutoregSugerencia {
  peso: number;
  direccion: string;
  delta: number;
}

export function renderFiltroGrupos(c: WorkoutController): void {
    if (!c.el.filtroMusculoSelect) return;
    const frag = document.createDocumentFragment();
    GRUPOS_MUSCULARES.forEach((g: { id: string; nombre: string }) => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.nombre;
      frag.appendChild(opt);
    });
    c.el.filtroMusculoSelect.replaceChildren(frag);
}

export function renderFiltroPatrones(c: WorkoutController): void {
    if (!c.el.filtroPatronSelect) return;
    const frag = document.createDocumentFragment();
    PATRONES_MOVIMIENTO.forEach((p: { id: string; nombre: string }) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      frag.appendChild(opt);
    });
    c.el.filtroPatronSelect.replaceChildren(frag);
}

export function renderSelectorEjercicios(c: WorkoutController): void {
    const todos: Ejercicio[] = Store.getEjerciciosDisponibles();
    let filtrados = todos;

    if (c._grupoFiltroActual !== "todos") {
      filtrados = filtrados.filter(
        (e: Ejercicio) => e.musculo === c._grupoFiltroActual || (e.musculosSecundarios && e.musculosSecundarios.includes(c._grupoFiltroActual as MusculoGrupo))
      );
    }

    if (c._patronFiltroActual !== "todos") {
      filtrados = filtrados.filter((e: Ejercicio) => e.patron === c._patronFiltroActual);
    }

    // Búsqueda por texto: nombre del ejercicio y grupos musculares (principal y secundarios).
    if (c._busquedaActual) {
      const q = c._busquedaActual;
      filtrados = filtrados.filter(
        (e: Ejercicio) =>
          (e.nombre || "").toLowerCase().includes(q) ||
          String(e.musculo || "").toLowerCase().includes(q) ||
          (e.musculosSecundarios || []).some((m: string) => String(m).toLowerCase().includes(q))
      );
    }

    const frag = document.createDocumentFragment();
    filtrados.forEach((ej: Ejercicio) => {
      const opt = document.createElement("option");
      opt.value = ej.id;
      const customPrefix = ej.personalizado ? "⭐ " : "";
      const tieneGuia = ExerciseGuide.porId(ej.id) ? " 📘" : "";
      opt.textContent = `${customPrefix}${ej.nombre} (${ej.musculo} • ${ej.patron || "general"})${tieneGuia}`;
      frag.appendChild(opt);
    });

    if (filtrados.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Sin resultados para tu búsqueda / filtros";
      frag.appendChild(opt);
    }

    c.el.selectEjercicio.replaceChildren(frag);

    // Nota de conteo de resultados según búsqueda/filtros activos.
    if (c.el.ejercicioCountNote) {
      const filtrosActivos = c._grupoFiltroActual !== "todos" || c._patronFiltroActual !== "todos" || !!c._busquedaActual;
      c.el.ejercicioCountNote.textContent = filtrosActivos
        ? t("workout.resultado", { n: filtrados.length })
        : "";
    }

    c._syncGuiaBtn();
}

export function renderRutina(c: WorkoutController): void {
    const container = c.el.rutinaContainer;
    container.replaceChildren();

    const rutina = c.rutina.rutina;
    const countEl = c.el.ejerciciosCount;
    if (countEl) countEl.textContent = String(rutina.length);

    if (rutina.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = t("workout.emptyRutina");
      container.appendChild(empty);
      return;
    }

    const todos: Ejercicio[] = Store.getEjerciciosDisponibles();
    const actual = c.rutina.getEjercicioActual();

    const frag = document.createDocumentFragment();
    rutina.forEach((id) => {
      const ej = todos.find((e: Ejercicio) => e.id === id) || { nombre: id, musculo: "general" };
      const seriesCount = (c.rutina.seriesPorEjercicio[id] || []).length;

      const badge = document.createElement("div");
      badge.className = "badge routine-badge" + (actual === id ? " active" : "");
      badge.setAttribute("role", "button");
      badge.setAttribute("tabindex", "0");

      // Manejador de arrastre (handle). Sin él no se inicia el drag, para no
      // interferir con el click de selección ni con los botones ⓘ / ×.
      const dragHandle = document.createElement("span");
      dragHandle.className = "drag-handle";
      dragHandle.setAttribute("aria-label", "Arrastrar " + ej.nombre + " para reordenar");
      dragHandle.title = "Arrastrar para reordenar";
      dragHandle.textContent = "≡";

      const nombreSpan = document.createElement("span");
      nombreSpan.textContent = ej.nombre;

      const seriesTag = document.createElement("span");
      seriesTag.className = "count-tag";
      seriesTag.textContent = t("workout.seriesTag", { n: seriesCount });

      const guideBtn = document.createElement("button");
      guideBtn.type = "button";
      guideBtn.className = "badge-guide";
      guideBtn.setAttribute("aria-label", "Ver guía de " + ej.nombre);
      guideBtn.title = "Ver guía de " + ej.nombre;
      guideBtn.textContent = "ⓘ";
      guideBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!ExerciseGuide.abrirPorEjercicio(id)) {
          Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "badge-delete";
      deleteBtn.setAttribute("aria-label", "Quitar " + ej.nombre);
      deleteBtn.textContent = "×";

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        c.rutina.eliminarEjercicio(id);
        Store.guardar();
        Store.emit("routine:updated", c.rutina.data.rutina);
      });

      badge.addEventListener("click", () => {
        c.rutina.seleccionarEjercicio(id);
        c._renderRutina();
        c._renderSeries();
      });

      badge.append(dragHandle, nombreSpan, seriesTag, guideBtn, deleteBtn);
      frag.appendChild(badge);
    });

    container.appendChild(frag);
}

export function renderPlantillas(c: WorkoutController): void {
    const container = c.el.plantillasContainer;
    if (!container) return;
    container.replaceChildren();

    const plantillas: Plantilla[] = Store.listarPlantillas();

    if (plantillas.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "No hay plantillas guardadas.";
      container.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();

    plantillas.forEach((p) => {
      const item = document.createElement("div");
      item.className = "plantilla-item";

      const info = document.createElement("div");
      info.className = "plantilla-info";

      const nombre = document.createElement("span");
      nombre.className = "plantilla-nombre";
      nombre.textContent = p.nombre;

      const detalle = document.createElement("span");
      detalle.className = "plantilla-detalle";
      const fecha = p.creadaEn ? new Date(p.creadaEn).toLocaleDateString("es-ES") : "";
      detalle.textContent = (p.ejercicios ? p.ejercicios.length : 0) + " ejercicios" + (fecha ? " · " + fecha : "");

      info.append(nombre, detalle);

      const ejercicios = document.createElement("span");
      ejercicios.className = "plantilla-ejercicios";
      ejercicios.textContent = (p.ejercicios || [])
        .map((id) => {
          const ej = EJERCICIOS_DISPONIBLES.find((e) => e.id === id);
          return ej ? ej.nombre : id;
        })
        .join(", ");

      const acciones = document.createElement("div");
      acciones.className = "plantilla-acciones";

      const cargarBtn = document.createElement("button");
      cargarBtn.type = "button";
      cargarBtn.textContent = "Cargar";
      cargarBtn.addEventListener("click", () => c._cargarPlantilla(p.id));

      const eliminarBtn = document.createElement("button");
      eliminarBtn.type = "button";
      eliminarBtn.className = "danger";
      eliminarBtn.textContent = "Eliminar";
      eliminarBtn.addEventListener("click", () => c._eliminarPlantilla(p.id));

      acciones.append(cargarBtn, eliminarBtn);

      item.append(info, ejercicios, acciones);
      frag.appendChild(item);
    });

    container.appendChild(frag);
}

export function renderPlantillasPredefinidas(c: WorkoutController): void {
    const container = c.el.plantillasPredefinidasContainer;
    if (!container) return;
    container.replaceChildren();

    const frag = document.createDocumentFragment();

    PLANTILLAS_PREDEFINIDAS.forEach((tpl: PlantillaPredefinida) => {
      const card = document.createElement("article");
      card.className = "predef-card";

      const head = document.createElement("div");
      head.className = "predef-head";

      const titulo = document.createElement("h4");
      titulo.textContent = tpl.nombre;

      const badges = document.createElement("span");
      badges.className = "predef-tags";
      badges.textContent = (tpl.etiquetas || []).join(" · ");

      head.append(titulo, badges);

      const desc = document.createElement("p");
      desc.className = "predef-desc";
      desc.textContent = tpl.descripcion || "";

      const ejList = document.createElement("p");
      ejList.className = "predef-ejercicios";
      ejList.textContent = (tpl.ejercicios || [])
        .map((id) => {
          const ej = EJERCICIOS_DISPONIBLES.find((e) => e.id === id);
          return ej ? ej.nombre : id;
        })
        .join(" · ");

      const acciones = document.createElement("div");
      acciones.className = "predef-acciones";

      const importarBtn = document.createElement("button");
      importarBtn.type = "button";
      importarBtn.className = "primary";
      importarBtn.textContent = "Importar y usar";
      importarBtn.addEventListener("click", () => c._importarPlantillaPredefinida(tpl));

      acciones.appendChild(importarBtn);

      card.append(head, desc, ejList, acciones);
      frag.appendChild(card);
    });

    container.appendChild(frag);
}

export function renderSeries(c: WorkoutController): void {
    const ejercicioId = c.rutina.getEjercicioActual();
    const serieForm = c.el.serieForm;
    const emptyMsg = c.el.serieFormEmpty;

    if (!ejercicioId) {
      if (serieForm) serieForm.classList.add("hidden");
      if (emptyMsg) {
        emptyMsg.classList.remove("hidden");
        emptyMsg.textContent = "Selecciona o agrega un ejercicio de la rutina para registrar series.";
      }
      return;
    }

    if (serieForm) serieForm.classList.remove("hidden");
    if (emptyMsg) emptyMsg.classList.add("hidden");

    // Recordatorio "última vez": qué hizo el usuario en este ejercicio la última
    // vez, para reducir la fricción de cargar series. Solo texto de contexto.
    const ultima = c.rutina.getUltimaSesionEjercicio(ejercicioId);
    const ultimaVezEl = c.el.serieUltimaVez;
    if (ultimaVezEl) {
      if (ultima && (ultima.peso !== null || ultima.reps !== null)) {
        const rpeTxt = ultima.rpe ? " · RPE " + ultima.rpe : "";
        ultimaVezEl.textContent =
          "Última vez: " +
          (ultima.peso !== null ? ultima.peso : "—") + "kg × " +
          (ultima.reps !== null ? ultima.reps : "—") + " reps" +
          rpeTxt +
          (ultima.fechaISO ? " (" + ultima.fechaISO.slice(0, 10) + ")" : "");
      } else {
        ultimaVezEl.textContent = "";
      }
    }

    // Prefill opcional: si el usuario todavía no tocó peso/reps de la serie nueva,
    // precargamos el valor real (editable) de la última vez. Guardamos con valor
    // vacío para no pisar lo que ya haya escrito (ej. al cambiar de ejercicio).
    if (ultima) {
      if (c.el.seriePeso && c.el.seriePeso.value === "" && ultima.peso !== null) {
        c.el.seriePeso.value = String(ultima.peso);
      }
      if (c.el.serieReps && c.el.serieReps.value === "" && ultima.reps !== null) {
        c.el.serieReps.value = String(ultima.reps);
      }
    }

    const series = c.rutina.seriesPorEjercicio[ejercicioId] || [];
    const container = c.el.seriesContainer;
    container.replaceChildren();

    const frag = document.createDocumentFragment();
    series.forEach((s: Serie, idx: number) => {
      const item = document.createElement("div");
      item.className = "badge serie-item";

      const info = document.createElement("span");
      const rpeTxt = s.rpe ? " | RPE " + s.rpe : "";
      const rirTxt = s.rir !== undefined && s.rir !== null ? " | RIR " + s.rir : "";
      info.textContent = "#" + (idx + 1) + " — " + s.peso + "kg × " + s.reps + " reps" + rpeTxt + rirTxt;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "badge-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => {
        c.rutina.eliminarSerie(ejercicioId, s.id);
        Store.guardar();
        Store.emit("series:updated", { ejercicioId });
      });

      item.append(info, delBtn);
      frag.appendChild(item);
    });

    container.appendChild(frag);
    c._actualizarMetricasEjercicio(ejercicioId, series);
}

export function renderAutoreg(c: WorkoutController, sug: AutoregSugerencia | null): void {
    const cont = c.el.autoregSugerencia;
    cont.replaceChildren();
    if (!sug) return;

    const div = document.createElement("div");
    div.className = "autoreg-box";
    const deltaSign = sug.delta > 0 ? "+" : "";
    div.textContent = "💡 Sugerencia prox. serie: " + sug.peso + "kg (" + deltaSign + sug.delta + "kg para RPE obj.)";
    cont.appendChild(div);
}

````

### `src/controllers/workout.controller.js` — 463 lineas

````javascript
/**
 * src/controllers/workout.controller.js
 * Controlador de la vista "Entrenar".
 * Maneja catálogo de ejercicios, filtro por grupo muscular, creación de ejercicios personalizados,
 * rutina del día, formulario rápido de series, cálculo de 1RM, warm-up y calculadora de discos.
 *
 * Fase 2 (Paso B): renders DOM en renderers/workout/renders.ts y wiring de eventos en
 * renderers/workout/events.ts. Aquí queda la lógica de negocio (series, plantillas, 1RM,
 * warm-up, discos, métricas) + delegación fina que conserva los nombres de los métodos.
 */

import { Store } from "../store.js";
import { Utils } from "../utils.ts";
import { Toast } from "../toast.js";
import { Dialog } from "../dialog.js";
import { FormulasRM, PlateCalculator } from "../formulas.js";
import { Autoregulacion } from "../autorregulacion.js";
import { GestorTimer } from "../gestor-timer.js";
import { ExerciseGuide } from "../components/exercise-guide.js";
import { bindWorkoutEvents } from "./renderers/workout/events.ts";
import {
  renderFiltroGrupos,
  renderFiltroPatrones,
  renderSelectorEjercicios,
  renderRutina,
  renderPlantillas,
  renderPlantillasPredefinidas,
  renderSeries,
  renderAutoreg,
} from "./renderers/workout/renders.ts";

export class WorkoutController {
  constructor({ app, el, rutina, timer }) {
    this.app = app;
    this.el = el;
    this.rutina = rutina;
    this.timer = timer;
    this._rirTocadoPorUsuario = false;
    this._grupoFiltroActual = "todos";
    this._patronFiltroActual = "todos";
    this._busquedaActual = "";

    this._bindEvents();
    this._bindSteppers();
    this._subscribeStore();
    this.render();
  }

  actualizarInstancias({ rutina, timer }) {
    if (rutina) this.rutina = rutina;
    if (timer) this.timer = timer;
    this.render();
  }

  _bindSteppers() {
    const chips = document.querySelectorAll(".stepper-chip");
    chips.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute("data-step-target");
        const stepVal = parseFloat(btn.getAttribute("data-step-val")) || 0;
        const input = document.getElementById(targetId);
        if (!input) return;
        const current = parseFloat(input.value) || 0;
        const next = Math.max(0, Math.round((current + stepVal) * 100) / 100);
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        GestorTimer.vibrarCorto();
      });
    });
  }

  /**
   * Vincula una sola vez los listeners estáticos de la vista (el HTML base no se
   * reconstruye; el contenido dinámico re-vincula al renderizarse).
   * Wiring completo en renderers/workout/events.ts.
   */
  _bindEvents() {
    bindWorkoutEvents(this);
  }

  _subscribeStore() {
    Store.on("routine:updated", () => {
      this._renderRutina();
      this._renderSeries();
    });

    Store.on("series:updated", () => {
      this._renderSeries();
    });

    Store.on("exercises:updated", () => {
      this._renderSelectorEjercicios();
    });

    Store.on("plantillas:updated", () => {
      this._renderPlantillas();
    });
  }

  render() {
    this._renderFiltroGrupos();
    this._renderFiltroPatrones();
    this._renderSelectorEjercicios();
    this._renderRutina();
    this._renderPlantillas();
    this._renderPlantillasPredefinidas();
    this._renderSeries();
    this._syncGuiaBtn();
  }

  /** Refleja en el botón "Guía" si el ejercicio seleccionado tiene guía. */
  _syncGuiaBtn() {
    const btn = document.getElementById("guiaBtn");
    if (!btn) return;
    const id = this.el.selectEjercicio ? this.el.selectEjercicio.value : "";
    const disponible = !!id && !!ExerciseGuide.porId(id);
    btn.classList.toggle("is-unavailable", !disponible);
    btn.setAttribute("aria-disabled", disponible ? "false" : "true");
    btn.title = disponible ? "Ver guía de ejecución" : "Este ejercicio no tiene guía disponible";
  }

  /** Filtro de grupos musculares. Render en renderers/workout/renders.ts. */
  _renderFiltroGrupos() {
    renderFiltroGrupos(this);
  }

  /** Filtro de patrones de movimiento. Render en renderers/workout/renders.ts. */
  _renderFiltroPatrones() {
    renderFiltroPatrones(this);
  }

  /** Selector de ejercicios con filtros + búsqueda. Render en renderers/workout/renders.ts. */
  _renderSelectorEjercicios() {
    renderSelectorEjercicios(this);
  }

  /** Badges de la rutina del día (con drag & drop). Render en renderers/workout/renders.ts. */
  _renderRutina() {
    renderRutina(this);
  }

  /** Plantillas guardadas por el usuario. Render en renderers/workout/renders.ts. */
  _renderPlantillas() {
    renderPlantillas(this);
  }

  async _guardarComoPlantilla() {
    const rutina = this.rutina.rutina;
    if (!rutina || rutina.length === 0) {
      Toast.mostrar("La rutina está vacía. Agrega ejercicios primero.", "warning");
      return;
    }

    const nombre = await Dialog.pedirTexto("Nombre de la plantilla:");
    if (!nombre) return;

    const plantilla = this.rutina.guardarComoPlantilla(nombre);
    if (plantilla) {
      Toast.mostrar('Plantilla "' + plantilla.nombre + '" guardada', "success");
      this._renderPlantillas();
    }
  }

  async _cargarPlantilla(id) {
    const plantillas = Store.listarPlantillas();
    const plantilla = plantillas.find((p) => p.id === id);
    if (!plantilla) return;

    // Si la rutina actual tiene series cargadas, confirmar antes de pisarlas.
    const tieneSeries = this.rutina.rutina.some((ejId) => {
      return (this.rutina.seriesPorEjercicio[ejId] || []).length > 0;
    });

    if (tieneSeries) {
      const ok = await Dialog.confirm(
        "Cargar esta plantilla reemplazará la rutina actual y sus series. ¿Continuar?",
        { textoConfirmar: "Cargar", peligroso: true }
      );
      if (!ok) return;
    }

    if (this.rutina.cargarPlantilla(id)) {
      Store.emit("routine:updated", this.rutina.data.rutina);
      Toast.mostrar('Plantilla "' + plantilla.nombre + '" cargada', "success");
    }
  }

  async _eliminarPlantilla(id) {
    const plantillas = Store.listarPlantillas();
    const plantilla = plantillas.find((p) => p.id === id);
    if (!plantilla) return;

    const ok = await Dialog.confirm(
      '¿Eliminar la plantilla "' + plantilla.nombre + '"? Esta acción no se puede deshacer.',
      { textoConfirmar: "Eliminar", peligroso: true }
    );
    if (!ok) return;

    if (Store.eliminarPlantilla(id)) {
      Toast.mostrar("Plantilla eliminada", "info");
      this._renderPlantillas();
    }
  }

  /** Plantillas predefinidas del sistema. Render en renderers/workout/renders.ts. */
  _renderPlantillasPredefinidas() {
    renderPlantillasPredefinidas(this);
  }

  /** Importa una plantilla predefinida: la guarda en "Plantillas guardadas" y la carga. */
  async _importarPlantillaPredefinida(tpl) {
    if (!tpl || !Array.isArray(tpl.ejercicios) || tpl.ejercicios.length === 0) {
      Toast.mostrar("Esta plantilla no tiene ejercicios definidos", "warning");
      return;
    }

    // La copia queda persistida en el perfil activo para que el usuario pueda
    // editarla y reutilizarla después ("Importar y usar").
    const plantilla = Store.crearPlantilla(tpl.nombre, [...tpl.ejercicios]);
    if (!plantilla) return;

    // Si la rutina actual tiene series, confirmar antes de pisarlas (igual que `_cargarPlantilla`).
    const tieneSeries = this.rutina.rutina.some((ejId) => {
      return (this.rutina.seriesPorEjercicio[ejId] || []).length > 0;
    });

    if (tieneSeries) {
      const ok = await Dialog.confirm(
        "Importar esta plantilla reemplazará la rutina actual y sus series. ¿Continuar?",
        { textoConfirmar: "Importar", peligroso: true }
      );
      if (!ok) {
        // No se carga, pero la copia ya quedó en "Plantillas guardadas".
        Toast.mostrar("Plantilla importada a 'Plantillas guardadas'", "info");
        return;
      }
    }

    const id = plantilla.id;
    if (this.rutina.cargarPlantilla(id)) {
      Store.emit("routine:updated", this.rutina.data.rutina);
      Toast.mostrar('Plantilla "' + tpl.nombre + '" importada y cargada', "success");
    }
  }

  /** Formulario + lista de series del ejercicio actual (con prefill "última vez"). Render en renderers/workout/renders.ts. */
  _renderSeries() {
    renderSeries(this);
  }

  _actualizarMetricasEjercicio(ejercicioId, series) {
    if (series.length === 0) {
      this._actualizarRM(null);
      this.el.autoregSugerencia.replaceChildren();
      return;
    }

    // Mejor serie para 1RM
    let mejorRM = 0;
    let mejorStats = null;
    const ultimaSerie = series[series.length - 1];

    series.forEach((s) => {
      if (s.peso > 0 && s.reps > 0) {
        const rm = FormulasRM.calcularTodos(s.peso, s.reps);
        if (rm.promedio > mejorRM) {
          mejorRM = rm.promedio;
          mejorStats = rm;
        }
      }
    });

    this._actualizarRM(mejorStats);

    // Sugerencia de autorregulación
    if (ultimaSerie && ultimaSerie.rpe) {
      const rpeObj = parseFloat(this.el.rpeObjetivoInput.value) || 8;
      const sugerencia = Autoregulacion.sugerirProximoPeso(ultimaSerie.peso, ultimaSerie.rpe, rpeObj);
      this._renderAutoreg(sugerencia);
    } else {
      this.el.autoregSugerencia.replaceChildren();
    }
  }

  _actualizarRM(rm) {
    if (!rm) {
      this.el.rmEpley.textContent = "--";
      this.el.rmBrzycki.textContent = "--";
      this.el.rmLombardi.textContent = "--";
      this.el.rmPromedio.textContent = "--";
      return;
    }
    this.el.rmEpley.textContent = rm.epley.toFixed(1);
    this.el.rmBrzycki.textContent = rm.brzycki.toFixed(1);
    this.el.rmLombardi.textContent = rm.lombardi.toFixed(1);
    this.el.rmPromedio.textContent = rm.promedio.toFixed(1);
  }

  /** Sugerencia de autorregulación para la próxima serie. Render en renderers/workout/renders.ts. */
  _renderAutoreg(sug) {
    renderAutoreg(this, sug);
  }

  _agregarSerie() {
    const ejercicioId = this.rutina.getEjercicioActual();
    if (!ejercicioId) {
      Toast.mostrar("Selecciona un ejercicio primero", "error");
      return;
    }

    const peso = parseFloat(this.el.seriePeso.value);
    const reps = parseInt(this.el.serieReps.value, 10);
    const rpe = parseFloat(this.el.serieRPE.value) || null;
    const rir = parseFloat(this.el.serieRIR.value) || null;
    const notas = this.el.serieNotas.value.trim();

    if (isNaN(peso) || peso < 0 || isNaN(reps) || reps <= 0) {
      Toast.mostrar("Ingresa peso (>=0) y repeticiones (>0) válidos", "warning");
      return;
    }

   // 1. Validaciones y sanitización de tipos numéricos
    const pesoNum = parseFloat(peso);
    const repsNum = parseInt(reps, 10);
    const rpeNum = rpe !== null && rpe !== undefined && rpe !== "" ? parseFloat(rpe) : null;
    const rirNum = rir !== null && rir !== undefined && rir !== "" ? parseFloat(rir) : null;

    if (isNaN(pesoNum) || pesoNum < 0 || isNaN(repsNum) || repsNum <= 0) {
      Toast.mostrar("Por favor ingresa valores válidos para peso y repeticiones", "warning");
      return;
    }

    try {
      // 2. Ejecución segura de la adición de la serie
      const serie = this.rutina.agregarSerie(ejercicioId, {
        peso: pesoNum,
        reps: repsNum,
        rpe: rpeNum,
        rir: rirNum,
        notas: (notas || "").trim()
      });

      // 3. Persistencia y emisión de eventos con try/catch explícito
      Store.guardar();
      Store.emit("series:updated", { ejercicioId, peso: pesoNum, reps: repsNum });

      // 4. Notificación y feedback (Uso de template literals `` para evitar conflicto de comillas)
      if (serie && serie.esPR) {
        GestorTimer.vibrarPR?.();
        Toast.mostrar("🏆 ¡Nuevo récord personal (PR) registrado!", "success");
      } else {
        GestorTimer.vibrarExito?.();
        Toast.mostrar("Serie agregada", "success");
      }
    } catch (error) {
      console.error("[WorkoutController] Error al agregar serie:", error);
      Toast.mostrar("No se pudo guardar la serie. Inténtalo de nuevo.", "error");
    }

    // Iniciar timer de descanso automáticamente si el usuario lo desea
    if (this.timer && !this.timer.corriendo) {
      this.timer.iniciar();
    }
  }

  _guardarSesionCompleta() {
    const rutina = this.rutina.rutina;
    if (rutina.length === 0) {
      Toast.mostrar("No hay ejercicios en la rutina", "warning");
      return;
    }

    let totalSeries = 0;
    rutina.forEach((id) => {
      totalSeries += (this.rutina.seriesPorEjercicio[id] || []).length;
    });

    if (totalSeries === 0) {
      Toast.mostrar("Registra al menos una serie antes de guardar", "warning");
      return;
    }

    const sesion = this.rutina.guardarSesion();
    Store.guardar();
    Store.emit("session:completed", sesion);
    Toast.mostrar("¡Sesión guardada en el historial!", "success");
  }

  _calcularWarmUp() {
    const peso = parseFloat(this.el.seriePeso.value);
    if (!peso || peso <= 20) {
      Toast.mostrar("Ingresa un peso de trabajo mayor a 20kg", "warning");
      return;
    }
    const container = this.el.warmUpContainer;
    container.replaceChildren();

    const seriesWarm = [
      { pct: 0.4, reps: 5, desc: "Calentamiento 40%" },
      { pct: 0.6, reps: 3, desc: "Aproximación 60%" },
      { pct: 0.8, reps: 2, desc: "Aproximación 80%" },
      { pct: 0.9, reps: 1, desc: "Activación 90%" },
    ];

    const frag = document.createDocumentFragment();
    seriesWarm.forEach((sw) => {
      const p = Utils.redondearIncremento(peso * sw.pct, 2.5);
      const row = document.createElement("div");
      row.className = "small-note-inline";
      row.textContent = "• " + sw.desc + ": " + p + "kg × " + sw.reps + " reps";
      frag.appendChild(row);
    });

    container.appendChild(frag);
  }

  _calcularDiscos() {
    const objetivo = parseFloat(this.el.discoPesoObjetivo.value);
    const barra = parseFloat(this.el.discoPesoBarra.value) || 20;

    if (!objetivo || objetivo <= barra) {
      Toast.mostrar("El peso objetivo debe ser mayor que el peso de la barra", "warning");
      return;
    }

    const res = PlateCalculator.calcular(objetivo, barra);
    const container = this.el.discosResultado;
    container.replaceChildren();

    if (!res.alcanzable && res.porLado.length === 0) {
      container.textContent = "No es posible armar con los discos estándar.";
      return;
    }

    const div = document.createElement("div");
    div.className = "badge-list";
    res.porLado.forEach((d) => {
      const span = document.createElement("span");
      span.className = "badge";
      const valorDisco = d.disco ?? d.peso;
      span.textContent = valorDisco + "kg × " + d.cantidad + " (por lado)";
      div.appendChild(span);
    });
    container.appendChild(div);
  }

  async _abrirModalCrearEjercicio() {
    const nombre = await Dialog.pedirTexto("Nombre del nuevo ejercicio:");
    if (!nombre) return;

    const musculo = this._grupoFiltroActual !== "todos" ? this._grupoFiltroActual : "pecho";
    Store.agregarEjercicioPersonalizado({
      nombre,
      musculo,
      intensidad: 7,
      patron: "aislamiento",
      equipamiento: "mancuerna",
    });

    Toast.mostrar("Ejercicio " + nombre + " guardado en tu catálogo", "success");
  }
}

````

## 4. Contenido integro: `src/services/`

El directorio `src/services/` **no existe** en este proyecto.

## 5. Listado con tamano en lineas: `src/components/` y `src/types/`

### src/components

```text
      73 src/components/Button.js
      72 src/components/Card.js
     108 src/components/ExercisePicker.js
     129 src/components/Modal.js
      95 src/components/Timer.js
     365 src/components/cardio-form.js
     136 src/components/dashboard-widgets.js
     243 src/components/exercise-guide.js
    1221 total
```

### src/types

```text
      43 src/types/components.d.ts
     274 src/types/gym.d.ts
     160 src/types/workout-controller.d.ts
     477 total
```

## 6. Listado con tamano en lineas: `tests/`

```text
     435 tests/analytics.controller.test.js
      57 tests/appReactivity.test.js
      38 tests/bootSmoke.test.js
     184 tests/cardioForm.test.js
      43 tests/components/Button.test.js
      46 tests/components/ExercisePicker.test.js
      33 tests/components/Timer.test.js
      39 tests/components/Toast.test.js
     434 tests/chartsManager.test.js
      52 tests/dashboardEscape.test.js
     169 tests/dashboardEstadoAtleta.test.js
     212 tests/dashboardNavigation.test.js
      98 tests/dashboardQuickStart.test.js
     260 tests/dashboardWellness.test.js
      76 tests/dashboardWidgets.test.js
     113 tests/dialogAndAutoregulacion.test.js
      97 tests/drawer.test.js
     150 tests/errorHandler.test.js
     143 tests/exerciseGuide.test.js
      73 tests/exercisesAndStore.test.js
     175 tests/exportCsv.test.js
     165 tests/features.test.js
      58 tests/formulas.test.js
     151 tests/gestorCardio.test.js
     989 tests/gestorRutina.test.js
      74 tests/gestorTimer.test.js
     569 tests/history.controller.test.js
     103 tests/navigator.test.js
     290 tests/nutricion.test.js
     118 tests/phase2Engine.test.js
     113 tests/plantillas.test.js
     113 tests/plateCalculator.test.js
     408 tests/profile.test.js
     136 tests/serviceWorker.test.js
      41 tests/setup.js
     113 tests/storeImport.test.js
      84 tests/usability.test.js
     175 tests/utils.test.js
     101 tests/wellnessCorrelation.test.js
     887 tests/workout.test.js
    7615 total
```

## 7. Ultimos 20 commits — `git log --oneline -20`

```text
b802731 fix: correct types in events.ts, sparkline.ts, and backup-reminder.ts
017adb8 ajuste
4bf381d mejora alimnetacion
0a4edf1 feat: registro liviano de nutrición diaria con tarjeta en dashboard y tests
bfbebfc fix: eliminar carga duplicada de Google Fonts, ya autohosteadas
b5d9f56 emoji
0882fe1 ajuste
f6d4e17 ajuste'
bb38de3 ajuste de vista entrenar
453df2d design(gym): reemplazar ícono diagonal por barbell visible en drawer y header
9f9dd01 design(drawer): reemplazar emojis por íconos SVG y arreglar visibilidad del modo gym
ee0af26 fix(security): unificar escape de HTML en todos los controladores
8094d29 ajuste
0ad355f ajuste de vista
d234613 fix(responsive): arregla overflow horizontal y elementos tapados en móvil
c134704 fix: add gap:8px to header in max-width:640px media query for 450px viewport support
18334e0 fix: reduce header gap on narrow screens and verify icon-btn override
3a4d66c fix: override icon-btn in media query and verify dashboard scroll styles
32799d0 feat: fix header button overflow and exercise routine scroll
c4378eb fix: completar reemplazo de emojis y actualizar tests del banner
```

