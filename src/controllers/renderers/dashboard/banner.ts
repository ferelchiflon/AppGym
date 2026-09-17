/**
 * src/controllers/renderers/dashboard/banner.ts
 * Banner "Estado del atleta · HOY" y banner de correlación bienestar↔rendimiento.
 * Funciones puras: reciben `rutina` y `perfil` y devuelven HTML (string). Sin estado.
 */
import * as H from "../../../utils/dashboard-helpers.ts";
import { esc } from "../../../utils.ts";
import { WellnessCorrelation } from "../../../wellness-correlation.js";

/** Banner vacío cuando no hay readiness calculable. */
export function noReadiness(): string {
  return `
      <div class="readiness-empty">
        <span class="readiness-empty-score">—</span>
        <span class="muted">Registrá tu bienestar para obtener tu readiness.</span>
      </div>`;
}

/** Sugerencia textual según el score de readiness. */
export function sugerenciaReadiness(opts: { score: any }): string {
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
export function correlacionWellnessBanner(opts: { rutina: any; perfil: any }): string {
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
  lineas.sort((a: any, b: any) => b.fuerza - a.fuerza);
  const top = lineas
    .slice(0, 2)
    .map((l: any) => `<p>${l.html}</p>`)
    .join("");

  return `
      <div class="estado-insight">
        ${top}
        <p class="insight-note">Asociación observada con tu volumen, no causalidad.</p>
      </div>`;
}
/** Banner principal "Estado del atleta · HOY". */
export function estadoAtletaBanner(opts: { rutina: any; perfil: any }): string {
  const { rutina, perfil } = opts;
  const hist = rutina ? rutina.historial || [] : [];
  const wellness = (perfil && perfil.data && perfil.data.wellness) || [];
  const saltos = (perfil && perfil.data && perfil.data.saltos) || [];

  const hoy: any = H.calcularReadiness({ wellness, saltos, historial: hist });
  if (!hoy) return `<div class="panel-card card--hero estado-banner">${noReadiness()}</div>`;

  const senales = H.senalesFatiga({ perfil, historial: hist });
  const acwr = H.acwrDatos(hist);
  const ventana = H.ventanaAnteriorReadiness({ wellness, saltos, historial: hist }, 4);
  const anterior: any = H.calcularReadiness(ventana);
  const tend: any = H.tendenciaReadiness(hoy, anterior);

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
    .map((f: any) => {
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
    ? `<div class="estado-alertas">${senales.map((s: any) => `<p>⚠️ ${esc(s)}</p>`).join("")}</div>`
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