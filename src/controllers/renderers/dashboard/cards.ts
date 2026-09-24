/**
 * src/controllers/renderers/dashboard/cards.ts
 * Tarjetas del Dashboard (quick start, bienestar, cardio, estadísticas, ACWR,
 * periodización, sugerencia, calendario, RM/PRs y landmarks). Funciones puras:
 * reciben datos y devuelven HTML (string). Sin estado.
 */
import * as H from "../../../helpers/dashboard-helpers";
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