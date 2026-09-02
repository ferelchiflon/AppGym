/**
 * src/utils/dashboard-helpers.js
 * Cálculos puros del Dashboard. Reutiliza la lógica existente de
 * FisiologiaCargas (ACWR), VolumeLandmarks (MEV/MAV/MRV) y FormulasRM (1RM).
 * No muta ningún modelo: sólo lee y devuelve datos listos para renderizar.
 */

import { Utils } from "../utils.js";
import { FormulasRM } from "../formulas.js";
import { FisiologiaCargas } from "../fisiologia-cargas.js";
import { VolumeLandmarks, VOLUME_LANDMARKS } from "../landmarks-volumen.js";

const MS_DIA = 86400000;

export const COLORS_SPARKLINE = {
  sueno: "#7DB7FF",
  estres: "#FF7A7A",
  doms: "#FFCB52",
  motivacion: "#54E08A",
};

/** Saludo según la hora local. */
export function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** Fecha formateada: "lunes, 31 de agosto" (es-ES). */
export function fechaFormateada(fecha = new Date()) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
}

/** Fecha ISO (UTC) de hace `dias` días, en formato YYYY-MM-DD. */
function isoHace(dias) {
  const base = new Date(Utils.fechaISO() + "T00:00:00Z");
  return new Date(base.getTime() - dias * MS_DIA).toISOString().slice(0, 10);
}

/** Diagnóstico CMJ básico: último salto vs. media de 30 días. */
export function diagnosticoCMJ(saltos = []) {
  const limite = Date.now() - 30 * MS_DIA;
  const recientes = saltos.filter((s) => new Date(s.fecha || 0).getTime() >= limite);
  const alturas = recientes.map((s) => parseFloat(s.altura)).filter((h) => h > 0 && !isNaN(h));
  if (!alturas.length) return null;
  const ultimoSalto = alturas[alturas.length - 1];
  const media = alturas.reduce((a, b) => a + b, 0) / alturas.length;
  return { ultimoSalto, media, muestras: alturas.length };
}

/**
 * Readiness 0-100 ponderado:
 *  - 40% wellness promedio últimos 3 días (0-100)
 *  - 30% CMJ reciente vs. baseline del último mes (0-100)
 *  - 30% ACWR (escalera de puntos según ratio)
 * Si falta algún componente, se renormaliza sobre los disponibles.
 */
export function calcularReadiness({ wellness = [], saltos = [], historial = [] }) {
  const partes = {};
  let total = 0;
  let pesoAcum = 0;

  const ultimos3 = wellness.slice(-3);
  if (ultimos3.length) {
    const avg =
      ultimos3.reduce((acc, w) => {
        return acc + (w.sueno + w.motivacion + (6 - w.estres) + (6 - w.doms)) / 4;
      }, 0) / ultimos3.length;
    partes.wellness = Math.round(Utils.clamp(avg * 20, 0, 100));
    total += partes.wellness * 0.4;
    pesoAcum += 0.4;
  }

  const diag = diagnosticoCMJ(saltos);
  if (diag && diag.media > 0) {
    partes.cmj = Math.round(Utils.clamp((diag.ultimoSalto / diag.media) * 100, 0, 100));
    total += partes.cmj * 0.3;
    pesoAcum += 0.3;
  }

  const acwr = FisiologiaCargas.calcularACWR(historial);
  if (acwr && acwr.zona !== "sin_datos" && !isNaN(acwr.ratio)) {
    const r = acwr.ratio;
    const pts = r >= 0.8 && r <= 1.3 ? 100 : r > 1.3 && r <= 1.5 ? 70 : r > 1.5 ? 40 : 60;
    partes.acwr = pts;
    total += pts * 0.3;
    pesoAcum += 0.3;
  }

  if (pesoAcum === 0) return null;
  const score = Math.round(total / pesoAcum);
  return {
    score,
    color: score >= 70 ? "#54E08A" : score >= 50 ? "#FFD166" : "#FF7A7A",
    partes,
  };
}

/** Últimos 7 registros de wellness (sólo datos reales). */
export function wellnessSerie(wellness = [], n = 7) {
  return wellness.slice(-n);
}

/** Datos del bloque de periodización activo más progreso. */
export function datosPeriodizacion(periodizacion) {
  const bloque = periodizacion.getBloqueActual();
  if (!bloque) return null;
  const semanaActual = periodizacion.getSemanaActual(bloque);
  const totalSemanas = bloque.semanas || bloque.duracionSemanas || 4;
  return {
    bloque,
    nombre: bloque.nombre,
    tipo: bloque.tipo,
    semanaActual,
    totalSemanas,
    progresoPct: Math.min(100, Math.round((semanaActual / totalSemanas) * 100)),
    fechaInicio: bloque.fechaInicio,
  };
}

/** Tonelaje de esta semana vs. la anterior. */
export function volumenSemanal(historial = []) {
  const hoy = Utils.fechaISO();
  const hace7 = isoHace(7);
  const hace14 = isoHace(14);
  let esta = 0;
  let anterior = 0;
  historial.forEach((s) => {
    const d = (s.fechaISO || s.timestamp || s.fecha || "").slice(0, 10);
    const v = s.volumenTotal || 0;
    if (d > hace7 && d <= hoy) esta += v;
    else if (d > hace14 && d <= hace7) anterior += v;
  });
  const deltaPct =
    anterior > 0 ? Math.round(((esta - anterior) / anterior) * 100) : esta > 0 ? 100 : 0;
  return { esta: Math.round(esta), anterior: Math.round(anterior), deltaPct };
}

/** Series efectivas (RPE >= 7 / RIR <= 3) en los últimos 7 días. */
export function seriesEfectivas(historial = [], dias = 7) {
  const limite = Date.now() - dias * MS_DIA;
  let count = 0;
  historial.forEach((s) => {
    const t = new Date(s.timestamp || s.fecha || s.fechaISO || 0).getTime();
    if (isNaN(t) || t < limite) return;
    (s.ejercicios || []).forEach((e) => {
      (e.series || []).forEach((sr) => {
        if (VolumeLandmarks.esSerieEfectiva(sr)) count += 1;
      });
    });
  });
  return count;
}

/** Racha de días consecutivos con entrenamiento. */
export function racha(historial = []) {
  const set = new Set(
    historial
      .map((s) => (s.fechaISO || s.timestamp || s.fecha || "").slice(0, 10))
      .filter(Boolean)
  );
  if (set.size === 0) return 0;
  const hoy = new Date(Utils.fechaISO() + "T00:00:00Z").getTime();
  let i = 0;
  if (!set.has(new Date(hoy).toISOString().slice(0, 10))) i = 1;
  let count = 0;
  for (; i < 4000; i++) {
    const d = new Date(hoy - i * MS_DIA).toISOString().slice(0, 10);
    if (set.has(d)) count += 1;
    else break;
  }
  return count;
}

/** ACWR con su zona y color. */
export function acwrDatos(historial = []) {
  return FisiologiaCargas.calcularACWR(historial);
}

/** Mapas de RM por ejercicio: mejor RM, mejor reciente y por-fecha. */
export function rmPorEjercicio(historial = []) {
  const map = new Map();
  historial.forEach((s) => {
    const d = (s.fechaISO || s.timestamp || s.fecha || "").slice(0, 10);
    (s.ejercicios || []).forEach((e) => {
      (e.series || []).forEach((sr) => {
        const rm = FormulasRM.calcularTodos(sr.peso, sr.reps);
        if (!rm) return;
        let rec = map.get(e.id);
        if (!rec) {
          rec = {
            id: e.id,
            nombre: e.nombre || e.id,
            musculo: e.musculo,
            max: 0,
            maxFecha: null,
            maxCarga: null,
            ultimoRm: 0,
            ultimoFecha: null,
            porFecha: new Map(),
          };
          map.set(e.id, rec);
        }
        if (rm.promedio > rec.max) {
          rec.max = rm.promedio;
          rec.maxFecha = d;
          rec.maxCarga = { peso: sr.peso, reps: sr.reps, rpe: sr.rpe };
        }
        rec.ultimoRm = rm.promedio;
        rec.ultimoFecha = d;
        const prevFecha = rec.porFecha.get(d);
        if (prevFecha === undefined || rm.promedio > prevFecha) rec.porFecha.set(d, rm.promedio);
      });
    });
  });
  return [...map.values()];
}

/** Tarjeta "1RM estimado": ejercicio con mejor RM reciente + tendencia semanal. */
export function bestRM(historial = []) {
  const todos = rmPorEjercicio(historial);
  if (!todos.length) return null;
  const top = todos.reduce((a, b) => (b.ultimoRm > a.ultimoRm ? b : a));
  const hoy = Utils.fechaISO();
  const hace7 = isoHace(7);
  const hace14 = isoHace(14);
  let esta = 0;
  let anterior = 0;
  top.porFecha.forEach((rm, d) => {
    if (d > hace7 && d <= hoy) esta = Math.max(esta, rm);
    else if (d > hace14 && d <= hace7) anterior = Math.max(anterior, rm);
  });
  return {
    nombre: top.nombre,
    rm: Math.round(top.ultimoRm * 10) / 10,
    esta: Math.round(esta * 10) / 10,
    anterior: Math.round(anterior * 10) / 10,
    delta: anterior > 0 ? esta - anterior : null,
  };
}

/** PRs recientes (últimos 14 días) + mejor PR histórico como motivación. */
export function prsRecientes(historial = []) {
  const byEx = new Map();
  historial.forEach((s) => {
    const d = (s.fechaISO || s.timestamp || s.fecha || "").slice(0, 10);
    (s.ejercicios || []).forEach((e) => {
      (e.series || []).forEach((sr) => {
        const rm = FormulasRM.calcularTodos(sr.peso, sr.reps);
        if (!rm) return;
        const arr = byEx.get(e.id) || [];
        arr.push({ d, rm: rm.promedio, peso: sr.peso, reps: sr.reps, rpe: sr.rpe, nombre: e.nombre || e.id });
        byEx.set(e.id, arr);
      });
    });
  });

  const hoy = new Date(Utils.fechaISO() + "T00:00:00Z").getTime();
  const limite = hoy - 14 * MS_DIA;
  const recientes = [];
  const mejores = [];

  byEx.forEach((arr) => {
    let max = null;
    arr.forEach((a) => {
      if (!max || a.rm > max.rm) max = a;
    });
    if (!max) return;
    let prev = null;
    arr.forEach((a) => {
      if (a.d < max.d && (!prev || a.rm > prev.rm)) prev = a;
    });
    mejores.push(max);
    if (new Date(max.d + "T00:00:00Z").getTime() >= limite) {
      recientes.push({
        nombre: max.nombre,
        rm: max.rm,
        delta: prev ? max.rm - prev.rm : null,
        carga: `${max.peso}kg x${max.reps}`,
        d: max.d,
      });
    }
  });

  recientes.sort((a, b) => b.d.localeCompare(a.d));
  const mejor = mejores.length ? mejores.reduce((a, b) => (b.rm > a.rm ? b : a)) : null;
  return { recientes: recientes.slice(0, 3), mejor };
}

/** Landmarks MEV/MAV/MRV por grupo muscular (últimos 7 días), ordenados por series efectivas. */
export function landmarks(historial = []) {
  const analisis = VolumeLandmarks.analizarSemana(historial, 7);
  return Object.entries(analisis)
    .map(([k, v]) => ({ musculo: k, ...v }))
    .filter((m) => (m.efectivas || 0) > 0)
    .sort((a, b) => b.efectivas - a.efectivas);
}

const DIAS_ABREV = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export function abreviaturaDia(weekday) {
  return DIAS_ABREV[weekday] || "";
}

function diasEntre(a, b) {
  const ta = new Date(a + "T00:00:00Z").getTime();
  const tb = new Date(b + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((ta - tb) / MS_DIA));
}

/** Último trabajo real de un grupo muscular con formato amigable. */
export function ultimoTrabajoPorMusculo(historial = [], musculo) {
  for (let i = historial.length - 1; i >= 0; i--) {
    const s = historial[i];
    const ej = (s.ejercicios || []).filter((x) => x.musculo === musculo);
    if (!ej.length) continue;
    let carga = null;
    ej.forEach((e) => {
      const sr = [...(e.series || [])].reverse().find((x) => x.peso > 0 && x.reps > 0);
      if (sr) carga = sr;
    });
    if (!carga) continue;
    const d = (s.fechaISO || s.timestamp || s.fecha || "").slice(0, 10);
    const dias = diasEntre(isoHace(0), d);
    return {
      nombre: ej[0].nombre,
      peso: carga.peso,
      reps: carga.reps,
      rpe: carga.rpe,
      dias,
    };
  }
  return null;
}

/** Sugiere el grupo muscular del día: el menos entrenado entre los primarios del bloque. */
export function sugerirGrupoMuscular({ historial = [], bloque = null } = {}) {
  const analisis = VolumeLandmarks.analizarSemana(historial, 7);
  const counts = {};
  Object.keys(VOLUME_LANDMARKS).forEach((m) => {
    counts[m] = (analisis[m] && analisis[m].efectivas) || 0;
  });
  const primarios = {
    acumulacion: ["pecho", "espalda", "piernas", "hombros"],
    intensificacion: ["pecho", "espalda", "piernas", "hombros"],
    realizacion: ["piernas", "pecho", "espalda"],
    dup: ["pecho", "espalda", "piernas", "hombros"],
    deload: ["gluteos", "core", "gemelos"],
  };
  const set = new Set(primarios[bloque && bloque.tipo] || ["pecho", "espalda", "piernas", "hombros"]);
  const candidatos = [...set].sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
  return candidatos[0];
}

/** Nombre legible de un grupo muscular. */
export function nombreMusculo(musculo) {
  const lms = VOLUME_LANDMARKS[musculo];
  if (lms) return lms.nombre;
  const mapa = {
    pecho: "Pecho",
    espalda: "Espalda",
    piernas: "Piernas",
    gluteos: "Glúteos",
    hombros: "Hombros",
    biceps: "Bíceps",
    triceps: "Tríceps",
    core: "Core",
    gemelos: "Gemelos",
    antebrazos: "Antebrazos",
  };
  return mapa[musculo] || musculo;
}

/**
 * Señales de fatiga. Devuelve un array de mensajes. Vacío = sin fatiga.
 */
export function senalesFatiga({ perfil, historial = [] } = {}) {
  const senales = [];
  const wellness = (perfil && perfil.data && perfil.data.wellness) || [];
  const last3 = wellness.slice(-3);
  if (last3.length) {
    const avg =
      last3.reduce((acc, w) => {
        return acc + (w.sueno + w.motivacion + (6 - w.estres) + (6 - w.doms)) / 4;
      }, 0) / last3.length;
    if (avg < 2.5)
      senales.push("Fatiga acumulada detectada. Considera un deload o día de descanso activo.");
  }

  const acwr = FisiologiaCargas.calcularACWR(historial);
  if (acwr && acwr.ratio > 1.5)
    senales.push("Carga muy alta. Riesgo de lesión elevado. Reduce volumen un 20%.");

  const saltos = (perfil && perfil.data && perfil.data.saltos) || [];
  const diag = diagnosticoCMJ(saltos);
  if (diag && diag.media > 0 && diag.ultimoSalto < diag.media * 0.9)
    senales.push("Potencia reducida. Tu sistema neuromuscular necesita recuperación.");

  return senales;
}

/** Últimos 7 días de calendario (ISO) con flag de entrenamiento y día de la semana. */
export function ultimos7Dias(historial = []) {
  const set = new Set(
    historial.map((s) => (s.fechaISO || s.timestamp || s.fecha || "").slice(0, 10)).filter(Boolean)
  );
  const hoy = new Date(Utils.fechaISO() + "T00:00:00Z");
  const arr = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy.getTime() - i * MS_DIA);
    const iso = d.toISOString().slice(0, 10);
    arr.push({
      iso,
      entrenado: set.has(iso),
      weekday: d.getUTCDay(),
      numero: d.getUTCDate(),
      esHoy: iso === Utils.fechaISO(),
    });
  }
  return arr;
}