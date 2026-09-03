/**
 * src/controllers/dashboard.controller.js
 * Vista "Inicio" (Dashboard): resumen diario con readiness, fatiga,
 * volumen, ADT/PRs, MGV (landmarks) y sugiere el focus del día.
 * No muta Store: sólo lee datos y dispara navegación/acciones.
 */

import { Store } from "../store.js";
import { Toast } from "../toast.js";
import { EJERCICIOS_DISPONIBLES } from "../config.js";
import { ExerciseGuide } from "../components/exercise-guide.js";
import { CardioForm } from "../components/cardio-form.js";
import * as H from "../utils/dashboard-helpers.js";

const WELLNESS_LABELS = ["Sueño", "Motivación", "Estrés", "DOMS"];
const WELLNESS_KEYS = ["sueno", "motivacion", "estres", "doms"];

const USUARIOS_ESPECIALES = ["Invitado", "Cargando…"];

const STAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg>';

/** último registro de hoy (weekday 1-5) para la tarjeta wellness. */
function dryLast(wellness) {
  return wellness[wellness.length - 1] || null;
}

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

  _esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Anillo de readiness 100% SVG (sin librerías). */
  _readinessRing(score, color) {
    const r = 42;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - score / 100);
    return `
      <svg class="readiness-ring" viewBox="0 0 100 100" role="img" aria-label="Readiness ${score} puntos">
        <circle class="readiness-bg" cx="50" cy="50" r="${r}"></circle>
        <circle class="readiness-val" cx="50" cy="50" r="${r}"
          stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
          transform="rotate(-90 50 50)"></circle>
        <text x="50" y="53" text-anchor="middle" class="readiness-score">${score}</text>
        <text x="50" y="69" text-anchor="middle" class="readiness-label">READY</text>
      </svg>`;
  }

  /** Tarjeta de arranque rápido (3 casos según estado). */
  _quickStart() {
    const hist = this.rutina.historial || [];
    const yaEntreno = H.ultimos7Dias(hist)[6] && H.ultimos7Dias(hist)[6].entrenado;
    const ult = this._operadorNombre();
    const nombre = !ult || USUARIOS_ESPECIALES.includes(ult) ? "" : `, ${this._esc(ult)}`;

    let botonTexto;
    let botonInfo;
    // Modo del botón rápido: "continuar" = la rutina ya está armada (solo navega);
    // "armar" = hay que crear la rutina sugerida antes de navegar a Entrenar.
    this._quickStartModo = "armar";
    if (this._tieneRutinaHoy()) {
      botonTexto = "Continuar rutina de hoy";
      botonInfo = "Tu entrenamiento de hoy está cargado y listo para empezar.";
      this._quickStartModo = "continuar";
    } else if (yaEntreno && hist.length) {
      botonTexto = "Iniciar rutina sugerida";
      botonInfo = "Enfocate en el grupo muscular con menor work-volume semanal.";
    } else {
      botonTexto = "Iniciar mi primer entrenamiento";
      botonInfo = "Arrancá con una rutina enfocada en tu grupo muscular del día.";
    }

    return `
      <div class="quick-card">
        <div class="quick-copy">
          <div class="eyebrow">HOY</div>
          <h2 class="greeting">${this._esc(H.saludo())}${nombre}</h2>
          <p class="greeting-date">${this._esc(H.fechaFormateada())}</p>
          <p class="quick-info">${botonInfo}</p>
        </div>
        <div class="quick-actions">
          <button class="btn-scale cta-block" id="quickStartBtn" data-modo="${this._quickStartModo}">${botonTexto}</button>
        </div>
      </div>`;
  }

  /** ¿Hay ejercicios cargados hoy en la rutina activa? */
  _tieneRutinaHoy() {
    if (!this.rutina) return false;
    const listo = this.rutina.data && this.rutina.data.rutina;
    return !!listo && listo.length > 0;
  }

  /** Tarjeta de wellness con selector por días + sparkline de 7 días. */
  _wellnessCard(wellness, readiness) {
    const serie = H.wellnessSerie(wellness, 7);
    const sueno = dryLast(wellness);
    const color = readiness ? readiness.color : "#77829C";
    const tieneRecientes = serie.length > 0;

    // Estado vacío: no hay wellness reciente → CTA para registrar hoy.
    if (!tieneRecientes) {
      return `
      <div class="panel-card">
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
      <div class="panel-card">
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
        <div class="wellness-serie"><div class="eyebrow">ÚLTIMOS 7 DÍAS</div>${this._sparkline(serie)}</div>
        <div class="wellness-note" style="color:${color}">
          ${readiness ? "Tu readiness se basa en sueño, motivación, estrés y DOMS." : "Registrá tu bienestar para obtener tu score de readiness."}
        </div>
      </div>`;
  }

  /** Puntos (x,y) de una métrica para el sparkline de 7 días. */
  _sparklinePoints(wellness, key) {
    const n = wellness.length;
    const W = 260;
    const Hgt = 40;
    const padX = 8;
    const padY = 6;
    return wellness.map((w, i) => {
      const raw = w[key] || 1;
      // estrés y DOMS son "invertidos": mayor = peor, así que se invierten para
      // que "bienestar alto" siempre quede arriba en todas las líneas.
      const val = key === "estres" || key === "doms" ? 6 - raw : raw;
      const x = n === 1 ? W / 2 : padX + (i * (W - 2 * padX)) / (n - 1);
      const y = Hgt - padY - ((val - 1) / 4) * (Hgt - 2 * padY);
      return [x, y];
    });
  }

  /**
   * Convierte puntos en un path SVG suavizado (Catmull-Rom → bezier cúbico).
   * Devuelve un string `d` listo para <path>, sin usar librerías.
   */
  _suavePath(puntos) {
    if (!puntos.length) return "";
    if (puntos.length === 1) {
      const [x, y] = puntos[0];
      // Un único punto: dibujamos un segmento mínimo para que el stroke se vea.
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

  /** Sparkline SVG suavizado de los 4 marcadores (7 días) + leyenda. */
  _sparkline(wellness) {
    const W = 260;
    const Hgt = 40;
    const keys = [
      ["sueno", H.COLORS_SPARKLINE.sueno, "Sueño"],
      ["motivacion", H.COLORS_SPARKLINE.motivacion, "Motivación"],
      ["estres", H.COLORS_SPARKLINE.estres, "Estrés"],
      ["doms", H.COLORS_SPARKLINE.doms, "DOMS"],
    ];

    const trazos = keys
      .map(([k, color]) => {
        const puntos = this._sparklinePoints(wellness, k);
        const d = this._suavePath(puntos);
        // Cada día es un punto visible (círculo) sobre la línea.
        const dots = puntos
          .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${color}" fill-opacity="0.7"/>`)
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
      <svg class="wellness-spark" viewBox="0 0 ${W} ${Hgt}" preserveAspectRatio="none" aria-hidden="true">${trazos}</svg>
      <div class="spark-legend" role="list" aria-label="Leyenda de bienestar">${leyenda}</div>`;
  }

  /** Tarjeta ACWR con barra semáforo y leyenda. */
  _acwrCard(acwr) {
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
        <p>${this._esc(zonaAcwr(r))}</p>
      </div>`;
  }

  /** Tarjeta de periodización (bloque activo + progreso). */
  _periodizacionCard() {
    const per = H.datosPeriodizacion(this.periodizacion);
    if (!per) {
      return `
        <div class="panel-card">
          <div class="eyebrow">PERIODIZACIÓN</div>
          <h3>Sin bloque activo</h3>
          <p>Creá un bloque en la sección Periodización para ver tu progreso aquí.</p>
          <button class="btn-scale" id="goPeriodizacionBtn">Crear bloque</button>
        </div>`;
    }
    const tipoLabel = {
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
            <h3>${this._esc(per.nombre || "Bloque activo")}</h3>
          </div>
          <span class="tag" style="color:#7DB7FF;border-color:#7DB7FF55;background:#7DB7FF18">${tipoLabel[per.tipo] || per.tipo}</span>
        </div>
        <div class="periodizacion-row">
          <div class="ring-small" style="--pct:${per.progresoPct}"><span>${per.progresoPct}%</span></div>
          <div class="periodizacion-meta">
            <span class="label">Semana <strong>${per.semanaActual}</strong> de ${per.totalSemanas}</span>
            <div class="mini-progress"><i style="width:${per.progresoPct}%"></i></div>
            <span class="muted">Inicio: ${this._esc(fechaCorta(per.fechaInicio))}</span>
          </div>
        </div>
        <button class="btn-scale" id="goPeriodizacionBtn">Ver plan completo</button>
      </div>`;
  }

  /** Acceso seguro a las sesiones de cardio (gestor propio o readonly fallback). */
  _sesionesCardio() {
    if (this.cardio && typeof this.cardio.getSesiones === "function") return this.cardio.getSesiones();
    if (this.perfil && this.perfil.data && Array.isArray(this.perfil.data.sesionesCardio)) {
      return this.perfil.data.sesionesCardio;
    }
    return [];
  }

  /** Tarjeta cardio: resumen de la última semana sin romper el layout. */
  _cardioCard() {
    const sesiones = this._sesionesCardio();
    const gestor = this.cardio && typeof this.cardio.getResumen === "function" ? this.cardio : null;
    const resumen = gestor ? gestor.getResumen(7) : null;

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
    const tipoLabel = {
      correr: "Correr",
      bici: "Bici",
      remo: "Remo",
      otro: "Otro",
    };
    const nombreTipo = tipoLabel[ultima?.tipo] || (ultima?.tipo ? String(ultima.tipo) : "Cardio");
    const detalleUltima =
      `${this._esc(nombreTipo)} · ${formatNum(ultima?.duracion)} min` +
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

  /** Fila horizontal scrolleable (scroll-snap) con 5 mini-cards de stats. */
  _quickStatsRow(vol, se, stre, best, acwr) {
    // --- 1. 1RM Estimado ---
    const rmIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18V6"/><path d="M18 18V6"/><rect x="2" y="8" width="8" height="8" rx="1"/><rect x="14" y="8" width="8" height="8" rx="1"/><path d="M6 12h12"/></svg>';
    let rmValue, rmLabel, rmDelta;
    if (best) {
      rmValue = `${best.rm}<small>kg</small>`;
      rmLabel = this._esc(best.nombre);
      const noDelta = best.delta === null || best.delta === undefined;
      if (noDelta) {
        rmDelta = '<span class="qs-delta muted">—</span>';
      } else {
        const arrow = best.delta >= 0 ? "↑" : "↓";
        const cls = best.delta >= 0 ? "pos" : "neg";
        rmDelta = `<span class="qs-delta ${cls}">${arrow} ${best.delta >= 0 ? "+" : ""}${formatNum(best.delta)}kg</span>`;
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
        <div class="qs-card" title="${this._esc(acwrTooltip)}">
          <div class="qs-icon" style="color:${acwrColor}">${acwrIcon}</div>
          <strong class="qs-value" style="color:${acwrColor}">${formatNum(acwrRatio)}</strong>
          <span class="qs-label">ACWR</span>
          <span class="qs-delta" style="color:${acwrColor}">${this._esc(acwrTooltip)}</span>
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
  _rmCard(best) {
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
            <h3>${this._esc(best.nombre)}</h3>
          </div>
          <strong class="metric metric-lg">${best.rm}<small> kg</small></strong>
        </div>
        <div class="mini-progress" style="background:#77829C33"><i style="width:80%"></i></div>
        <span class="${cls}">${txt}</span>
      </div>`;
  }

  /** Tarjeta de PRs recientes (14 días) + mejor histórico. */
  _prsCard(prs) {
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
            (pr) => `
        <div class="pr-item">
          <strong>${this._esc(pr.nombre)}</strong>
          <span>${this._esc(pr.carga)}</span>
          <em class="delta ${(pr.delta || 0) >= 0 ? "pos" : "neg"}">${pr.delta === null || pr.delta === undefined ? "" : (pr.delta >= 0 ? "+" : "") + formatNum(pr.delta) + " kg"}</em>
        </div>`
          )
          .join("")
      : `<p class="muted">Ningún PR en los últimos 14 días.</p>`;
    const mejor = prs.mejor
      ? `<div class="pr-best"><span>Mejor histórico</span><strong>${this._esc(prs.mejor.nombre)} · ${formatNum(prs.mejor.rm)} kg</strong></div>`
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
  _landmarksCard(lmks) {
    const items = lmks.slice(0, 4);
    const head =
      items.length === 0
        ? `<p class="muted">Datos insuficientes esta semana.</p>`
        : items
            .map((l) => {
              const max = Math.max(25, l.mrv || l.mav || 1);
              const width = Math.min(100, Math.round(((l.efectivas || 0) / max) * 100));
              const zona = zonaVolumen(l, width);
              return `
            <div class="lmk-item">
              <div class="lmk-row">
                <span class="label">${this._esc(H.nombreMusculo(l.musculo))}</span>
                <span class="muted">${l.efectivas || 0} SE</span>
              </div>
              <div class="lmk-bar">
                <i style="width:${width}%;background:${zona.color}"></i>
              </div>
            </div>`;
            })
            .join("");
    return `
      <div class="panel-card">
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
  _sugerenciaCard(grupo, ultimo) {
    const nombre = H.nombreMusculo(grupo);
    const ult = ultimo
      ? `Última vez: ${this._esc(ultimo.nombre)} ${ultimo.peso}kg x${ultimo.reps} hace ${ultimo.dias === 0 ? "hoy" : ultimo.dias + " días"}`
      : "Aún no hay registros de este grupo.";

    // "Ver técnica": abre la guía del primer ejercicio del grupo que la tenga.
    const guiado = (EJERCICIOS_DISPONIBLES || []).find((e) => e.musculo === grupo && ExerciseGuide.porId(e.id));
    const tecnicaBtn = guiado
      ? `<button class="btn-scale secondary w-100 mt-1" id="sugerenciaGuiaBtn" data-ej-id="${this._esc(guiado.id)}">Ver técnica · ${this._esc(guiado.nombre)}</button>`
      : "";

    return `
      <div class="panel-card">
        <div class="eyebrow">FOCO DEL DÍA</div>
        <div class="sugerencia-main">
          <span class="sugerencia-icon" aria-hidden="true">${STAR_ICON}</span>
          <div>
            <h3>${nombre}</h3>
            <p class="muted">${this._esc(ult)}</p>
          </div>
        </div>
        <button class="btn-scale cta-block" id="sugerenciaBtn">Empezar rutina de ${this._esc(nombre.toLowerCase())}</button>
        ${tecnicaBtn}
      </div>`;
  }

  /** Alerta de fatiga ajustable (baja readiness). */
  _fatigaCard(senales, diag) {
    if (!senales.length) return "";
    const color = diag && diag.ultimoSalto < diag.media * 0.9 ? "#FF7A7A" : "#FFD166";
    return `
      <div class="panel-card fatiga-card" style="border-color:${color}66;background:${color}12">
        <div class="fatiga-head">
          <div class="eyebrow" style="color:${color}">ALERTA · FATIGA</div>
          <button class="link-safe" id="fatigaAjustarBtn">Ajustar</button>
        </div>
        ${senales.map((s) => `<p>${this._esc(s)}</p>`).join("")}
      </div>`;
  }

  /** Franja de calendario (7 días). */
  _calendario(days) {
    const cells = days
      .map((d) => {
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
      <div class="panel-card">
        <div class="panel-card-head">
          <div>
            <div class="eyebrow">CONSISTENCIA</div>
            <h3>Últimos 7 días</h3>
          </div>
        </div>
        <div class="week-strip">${cells}</div>
      </div>`;
  }

  /** Renderiza el dashboard completo (reconstruye el contenedor). */
  render() {
    if (!this.container) return;
    const hist = this.rutina ? this.rutina.historial || [] : [];
    const perfil = this.perfil;
    const wellness = (perfil && perfil.data && perfil.data.wellness) || [];
    const saltos = (perfil && perfil.data && perfil.data.saltos) || [];

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
    const senales = H.senalesFatiga({ perfil, historial: hist });
    const diag = H.diagnosticoCMJ(saltos);
    const days = H.ultimos7Dias(hist);

    const html = `
      <div class="dashboard">
        ${this._quickStart()}
        ${this._fatigaCard(senales, diag)}
        <div class="dashboard-section">
          <div class="panel-card readiness-card">
            <div class="eyebrow">READINESS</div>
            ${readiness ? this._readinessRing(readiness.score, readiness.color) : this._noReadiness()}
            ${readiness ? `<div class="readiness-chips">${this._readinessChips(readiness)}</div>` : ""}
            <p class="readiness-sugerencia">${readiness ? this._sugerenciaReadiness(readiness.score) : ""}</p>
          </div>
          ${this._wellnessCard(wellness, readiness)}
        </div>

        <div class="dashboard-section">
          ${this._quickStatsRow(vol, se, stre, best, acwr)}
          ${this._calendario(days)}
          ${this._acwrCard(acwr)}
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
      </div>`;

    this.container.innerHTML = html;
    this._bindActions();
  }

  _noReadiness() {
    return `
      <div class="readiness-empty">
        <span class="readiness-empty-score">—</span>
        <span class="muted">Registrá tu bienestar para obtener tu readiness.</span>
      </div>`;
  }

  _sugerenciaReadiness(score) {
    if (score >= 70) return "Listo para rendir a plena capacidad 💪";
    if (score >= 50) return "Cuidá la fatiga antes de cargar pesado.";
    return "Priorizá recuperación: dormí, hidratate y ajustá el volumen.";
  }

  /** Vincula todos los eventos tras renderizar (reconstrucción idempotente). */
  _bindActions() {
    const qs = (id) => this.container.querySelector(id);

    const quick = qs("#quickStartBtn");
    if (quick) {
      quick.addEventListener("click", () => {
        // "Continuar rutina de hoy" ya está armada → solo navega.
        // Cualquier otro estado ("Iniciar mi primer entrenamiento" / "Iniciar
        // rutina sugerida") debe armar la rutina antes de navegar a Entrenar.
        if (this._quickStartModo === "continuar") this._iniciarRutina();
        else this._iniciarRutinaSugerida();
      });
    }

    const guardar = qs("#wellnessGuardarBtn");
    if (guardar) {
      guardar.addEventListener("click", () => {
        const valores = {};
        ["sueno", "motivacion", "estres", "doms"].forEach((k) => {
          const group = this.container.querySelector(`.wellness-stars[data-var="${k}"]`);
          valores[k] = group ? group.querySelectorAll(".wstar.on").length : 1;
        });
        this._guardarWellness(valores);
      });
    }

    const ajFatiga = qs("#fatigaAjustarBtn");
    if (ajFatiga) ajFatiga.addEventListener("click", () => this._ir("profile", true));
    const ajWell = qs("#wellnessAjustarBtn");
    if (ajWell) ajWell.addEventListener("click", () => this._ir("profile", true));

    // Botón del estado vacío: navega al formulario de wellness (tab perfil).
    const irRegistrar = qs("#wellnessIrRegistrarBtn");
    if (irRegistrar) irRegistrar.addEventListener("click", () => this._ir("profile", true));

    // Botón "+ Registrar cardio": abre el modal para registrar una sesión.
    const cardioBtn = qs("#cardioRegistrarBtn");
    if (cardioBtn) {
      cardioBtn.addEventListener("click", () => {
        if (!this.cardio) return;
        CardioForm.abrir(this.cardio, { onGuardado: () => this.render() });
      });
    }

    this.container.querySelectorAll(".wstar").forEach((star) =>
      star.addEventListener("click", () => this._marcarStar(star))
    );

    this.container.querySelectorAll("#goPeriodizacionBtn").forEach((b) =>
      b.addEventListener("click", () => this._ir("history", true))
    );
    const sug = qs("#sugerenciaBtn");
    if (sug) sug.addEventListener("click", () => this._iniciarRutinaSugerida());

    // Botón "Ver técnica": abre la guía del ejercicio guiado del día.
    this.container.querySelectorAll("#sugerenciaGuiaBtn").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-ej-id");
        if (!id) return;
        if (!ExerciseGuide.abrirPorEjercicio(id)) {
          Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
        }
      });
    });
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
    const datos = {
      sueno: Math.max(1, Number(valores.sueno) || 1),
      motivacion: Math.max(1, Number(valores.motivacion) || 1),
      estres: Math.max(1, Number(valores.estres) || 1),
      doms: Math.max(1, Number(valores.doms) || 1),
    };
    perfil.registrarWellness(datos);
    Store.guardar();
    Store.emit("wellness:updated", perfil.data.wellness);
    Toast.mostrar("Bienestar guardado", "success");
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

/* ===== Funciones auxiliares puras (formato / zonas) ===== */

function formatNum(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const num = Number(n);
  if (Math.abs(num) >= 1000) return Math.round(num).toLocaleString("es-ES");
  if (num % 1 === 0) return Math.round(num).toString();
  return num.toFixed(1);
}

function fechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(d);
}

function zonaAcwr(r) {
  if (r === 0) return "Sin datos suficientes.";
  if (r >= 0.8 && r <= 1.3) return "Carga equilibrada. Buen momento para entrenar fuerte.";
  if (r > 1.3 && r <= 1.5) return "Carga media. Cerca del límite superior.";
  if (r > 1.5) return "Carga muy alta. Riesgo de lesión.";
  return "Carga baja. Podés sumar volumen.";
}

function zonaVolumen(l, _width) {
  const map = {
    sobre_mrv: { color: "#FF7A7A", label: "Riesgo de sobrecarga" },
    en_mav: { color: "#54E08A", label: "Zona óptima" },
    en_mev: { color: "#7DB7FF", label: "Mantenimiento" },
    sub_mev: { color: "#77829C", label: "Bajo estímulo" },
  };
  return map[l.estado] || map.sub_mev;
}