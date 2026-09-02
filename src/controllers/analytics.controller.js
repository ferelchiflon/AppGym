/**
 * src/controllers/analytics.controller.js
 * Controlador de la vista "Progreso y Métricas".
 * Maneja gráficos de evolución de 1RM, volumen muscular histórico,
 * volumen por sesión y análisis de correlación wellness ↔ rendimiento.
 */

import { Store } from "../store.js";
import { ChartsManager } from "../charts-manager.js";
import { WellnessCorrelation } from "../wellness-correlation.js";
import { VolumeLandmarks } from "../landmarks-volumen.js";

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

  render() {
    this._renderSelectorGrafico();
    this.renderRM();
    this.renderVolumen();
    this.renderWellnessCorrelacion();
    this.renderLandmarks();
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

  renderRM() {
    const todos = Store.getEjerciciosDisponibles();
    const ejercicioId = this.el.chartEjercicioSelect.value || (todos[0] ? todos[0].id : "sentadilla");
    const ej = todos.find(e => e.id === ejercicioId);
    const progreso = this.rutina.getProgresoRM(ejercicioId);
    ChartsManager.renderProgresoRM("chartRM", progreso, ej ? ej.nombre : ejercicioId);
  }

  renderVolumen() {
    ChartsManager.renderVolumenPorMusculo("chartVolumenMusculo", this.rutina.getVolumenPorMusculoHistorico());
    ChartsManager.renderVolumenPorSesion("chartVolumenSesion", this.rutina.getVolumenPorSesion(10));
  }

  renderWellnessCorrelacion() {
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
