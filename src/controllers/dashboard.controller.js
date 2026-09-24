/**
 * src/controllers/dashboard.controller.js
 * Vista "Inicio" (Dashboard): resumen diario con readiness, fatiga,
 * volumen, ADT/PRs, MGV (landmarks) y sugiere el focus del día.
 * No muta Store: sólo lee datos y dispara navegación/acciones.
 *
 * Controlador delgado (Fase 2 · refactor): TODO el HTML vive en
 * renderers/dashboard/ (cards.ts, sparkline.ts, banner.ts), el wiring de
 * eventos en renderers/dashboard/events.ts y el recordatorio de backup en
 * helpers/backup-reminder.ts. Acá queda sólo la orquestación: leer datos,
 * delegar el render y ejecutar las acciones de negocio (guardar/navegar).
 */

import { Store } from "../store.js";
import { Toast } from "../toast.js";
import { EJERCICIOS_DISPONIBLES } from "../config.ts";
import { renderSeguimiento } from "../components/dashboard-widgets.js";
import * as H from "../helpers/dashboard-helpers.ts";
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
import { verificarYMostrarRecordatorioBackup } from "../helpers/backup-reminder.ts";

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
