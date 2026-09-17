/**
 * src/controllers/dashboard.controller.js
 * Vista "Inicio" (Dashboard): resumen diario con readiness, fatiga,
 * volumen, ADT/PRs, MGV (landmarks) y sugiere el focus del día.
 * No muta Store: sólo lee datos y dispara navegación/acciones.
 */

import { Store } from "../store.js";
import { Toast } from "../toast.js";
import { Utils, esc } from "../utils.ts";
import { EJERCICIOS_DISPONIBLES } from "../config.ts";
import { ExerciseGuide } from "../components/exercise-guide.js";
import { CardioForm } from "../components/cardio-form.js";
import { renderSeguimiento } from "../components/dashboard-widgets.js";
import { GestorTimer } from "../gestor-timer.js";
import * as H from "../utils/dashboard-helpers.ts";
import { WellnessCorrelation } from "../wellness-correlation.js";
// Renderers puros extraídos (tarjetas del dashboard): única fuente de HTML.
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
} from "./renderers/dashboard/cards.ts";
import { sparkline, sparklinePoints } from "./renderers/dashboard/sparkline.ts";

// Etiquetas de wellness y constantes de render viven en renderers/dashboard/common.ts.
const WELLNESS_KEYS = ["sueno", "motivacion", "estres", "doms", "energia", "fatiga", "alimentacion", "hidratacion"];

const STAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg>';

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

  _esc(s) {
    // Wrapper fino: la lógica vive en utils.esc (única fuente compartida).
    return esc(s);
  }

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
              const zona = zonaVolumen(l);
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
            <h3>${this._esc(nombre)}</h3>
            <p class="muted">${this._esc(ult)}</p>
          </div>
        </div>
        <button class="btn-scale cta-block" id="sugerenciaBtn">Empezar rutina de ${this._esc(nombre.toLowerCase())}</button>
        ${tecnicaBtn}
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

  /**
   * Banner único del estado del atleta: readiness (score + semáforo), desglose por
   * componente con flecha de tendencia (hoy vs. ventana anterior) y alertas de
   * senalesFatiga. Reemplaza a las 2 tarjetas separadas (ring de readiness + fatiga).
   * SEÑAL/heurística, nunca diagnóstico médico ni causalidad.
   */
  _estadoAtletaBanner() {
    const hist = this.rutina ? this.rutina.historial || [] : [];
    const perfil = this.perfil;
    const wellness = (perfil && perfil.data && perfil.data.wellness) || [];
    const saltos = (perfil && perfil.data && perfil.data.saltos) || [];

    const hoy = H.calcularReadiness({ wellness, saltos, historial: hist });
    // Estado vacío: mismo comportamiento que la tarjeta vieja sin datos.
    if (!hoy) return `<div class="panel-card card--hero estado-banner">${this._noReadiness()}</div>`;

    const senales = H.senalesFatiga({ perfil, historial: hist });
    const acwr = H.acwrDatos(hist);
    const ventana = H.ventanaAnteriorReadiness({ wellness, saltos, historial: hist }, 4);
    const anterior = H.calcularReadiness(ventana);
    const tend = H.tendenciaReadiness(hoy, anterior);

    const color = hoy.color;
    let titulo;
    let circleSvg;
    if (hoy.score >= 70) {
      titulo = "BUEN MOMENTO PARA ENTRENAR";
      circleSvg = '<svg viewBox="0 0 24 24" width="16" height="16" class="semaphore-circle"><circle cx="8" cy="8" r="6" fill="var(--success-text)"/></svg>';
    } else if (hoy.score >= 50) {
      titulo = "RECUPERACIÓN MODERADA";
      circleSvg = '<svg viewBox="0 0 24 24" width="16" height="16" class="semaphore-circle"><circle cx="8" cy="8" r="6" fill="var(--warning-text)"/></svg>';
    } else {
      titulo = "NECESITÁS DESCANSAR";
      circleSvg = '<svg viewBox="0 0 24 24" width="16" height="16" class="semaphore-circle"><circle cx="8" cy="8" r="6" fill="var(--danger-text)"/></svg>';
    }

    const filas = [
      { key: "wellness", icon: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 6h18M3 12h18M3 18h18\"/></svg>", label: "Bienestar" },
      { key: "acwr", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h4M14 12h4M6 18h4M14 18h4"/></svg>', label: "Carga · ACWR" },
      { key: "cmj", icon: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/></svg>", label: "Potencia · CMJ" },
    ];

    const desglose = filas
      .map((f) => {
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
            ? `<span class="estado-sub">${this._esc(acwr.etiqueta || "")}</span>`
            : "";
        const labelCell = `<span class="estado-label">${this._esc(f.label)}${subEtiqueta}</span>`;
        return `<div class="estado-row">${f.icon}${labelCell}${bar}${score}${flecha}${delta}</div>`;
      })
      .join("");

    const alertas = senales.length
      ? `<div class="estado-alertas">${senales.map((s) => `<p>⚠️ ${this._esc(s)}</p>`).join("")}</div>`
      : "";

    const insight = this._correlacionWellnessBanner();

    return `
      <div class="panel-card card--hero estado-banner" style="border-left:4px solid ${color};border-color:${color}66;background:linear-gradient(135deg,${color}1f,${color}08)">
        <div class="estado-head">
          <span class="eyebrow" style="color:${color}">ESTADO DEL ATLETA · HOY</span>
          <span class="estado-score" style="color:${color}">${hoy.score} · READY</span>
          <button class="link-safe" id="fatigaAjustarBtn">Ajustar</button>
        </div>
        <h3 class="estado-titulo">${circleSvg} ${titulo}</h3>
        <p class="estado-sugerencia">${this._sugerenciaReadiness(hoy.score)}</p>
        <div class="estado-desglose">${desglose}</div>
        ${alertas}
        ${insight}
      </div>`;
  }

  /**
   * Asociación observada (bajo volumen) entre las métricas wellness y el volumen de
   * las sesiones del mismo día. Reusa WellnessCorrelation y el MISMO criterio de
   * datos suficientes que analytics.controller.js (≥2 cruces). Si no hay data
   * suficiente devuelve cadena vacía (el banner no muestra nada, a diferencia de
   * analytics que sí muestra una nota). Por ahora cruza SOLO contra volumenTotal
   * (como analizar()); no lo extendemos a fuerza/salto en este paso.
   * Sección chica debajo del desglose: señal/asociación, nunca causalidad.
   */
  _correlacionWellnessBanner() {
    const hist = this.rutina ? this.rutina.historial || [] : [];
    const perfil = this.perfil;
    const wellness = (perfil && perfil.data && perfil.data.wellness) || [];

    const analisis = WellnessCorrelation.analizar(hist, wellness);
    if (!analisis || !analisis.suficienteDatos) return "";

    const etiquetas = {
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

    const lineas = [];
    orden.forEach((m) => {
      const d = analisis[m];
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
        WELLNESS_KEYS.forEach((k) => {
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

    // Stepper de nutrición (+/- comidas)
    this.container.querySelectorAll('.stepper-chip[data-step-target="nutricionComidas"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const input = this.container.querySelector("#nutricionComidas");
        if (!input) return;
        const stepVal = parseFloat(btn.getAttribute("data-step-val")) || 0;
        const current = parseInt(input.value, 10) || 0;
        const next = Math.max(0, Math.min(8, Math.round(current + stepVal)));
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        GestorTimer?.vibrarCorto?.();
      });
    });

    // Chips toggle de proteína y agua
    ["#nutricionProteinaBtn", "#nutricionAguaBtn"].forEach((id) => {
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
        const input = this.container.querySelector("#nutricionComidas");
        const comidas = input ? parseInt(input.value, 10) || 0 : 0;
        const protBtn = qs("#nutricionProteinaBtn");
        const aguaBtn = qs("#nutricionAguaBtn");
        const proteina = protBtn ? protBtn.getAttribute("aria-pressed") === "true" : false;
        const agua = aguaBtn ? aguaBtn.getAttribute("aria-pressed") === "true" : false;
        this._guardarNutricion({ comidas, proteina, agua });
      });
    }
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

/* ===== Funciones auxiliares puras (formato / zonas) ===== */
// formatNum/fechaCorta/zonaAcwr viven en renderers/dashboard/common.ts (las usan las tarjetas).

function zonaVolumen(l) {
  const map = {
    sobre_mrv: { color: "#FF7A7A", label: "Riesgo de sobrecarga" },
    en_mav: { color: "#54E08A", label: "Zona óptima" },
    en_mev: { color: "#7DB7FF", label: "Mantenimiento" },
    sub_mev: { color: "#77829C", label: "Bajo estímulo" },
  };
  return map[l.estado] || map.sub_mev;
}
function verificarYMostrarRecordatorioBackup() {
  // Helper: obtener fecha del registro más viejo en historial
  function fechaPrimerRegistro() {
    const data = Store.cargar ? Store.cargar() : {};
    const perfiles = data.profiles || {};
    const historial = Object.values(perfiles).flatMap(p => p.historial || []);
    const fechas = historial.filter(f => f && f.fecha).map(f => new Date(f.fecha));
    if (fechas.length === 0) return null;
    return new Date(Math.min(...fechas));
  }

  // Caso 1: Nunca hizo backup Y ya pasaron 14 días desde el primer uso (proxy: fecha más vieja del historial)
  const nuncaHizoBackup = Store.getUltimoBackup() === null;
  const primerUso = fechaPrimerRegistro();
  const catorceDiasMs = 14 * 24 * 60 * 60 * 1000;

  if (nuncaHizoBackup && primerUso && Date.now() - primerUso.getTime() > catorceDiasMs) {
    Toast.mostrarAccion({
      mensaje: "Hacé un backup de tus datos para no perderlos",
      accionLabel: "Exportar backup ahora",
      tipo: "info",
      onAccion: () => {
        const json = Store.exportarTodo();
        Utils.descargarArchivo("gympro_backup_completo.json", json);
        Toast.mostrar("Backup descargado con éxito", "success");
      },
      duracionMs: 0,
    });
    return;
  }

  // Caso 2: Ya hizo backup alguna vez pero pasaron más de 30 días desde el último
  const ultimoBackup = Store.getUltimoBackup();
  const treintaDiasMs = 30 * 24 * 60 * 60 * 1000;

  if (ultimoBackup && Date.now() - Number(ultimoBackup) > treintaDiasMs) {
    Toast.mostrarAccion({
      mensaje: "Hace más de 30 días que no haces backup. Exportar backup ahora para tener una copia segura.",
      accionLabel: "Exportar backup ahora",
      tipo: "warning",
      onAccion: () => {
        const json = Store.exportarTodo();
        Utils.descargarArchivo("gympro_backup_completo.json", json);
        Toast.mostrar("Backup descargado con éxito", "success");
      },
      duracionMs: 0,
    });
    return;
  }
}
