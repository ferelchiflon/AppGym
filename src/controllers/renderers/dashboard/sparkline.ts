/**
 * src/controllers/renderers/dashboard/sparkline.ts
 * Render del sparkline de bienestar: SPA (spline de Catmull-Rom) suavizado
 * por los últimos 7 días, con leyenda. Sin estado.
 */
import * as H from "../../../utils/dashboard-helpers.ts";

const W = 260;
const HGT = 40;
const PAD_X = 8;
const PAD_Y = 6;

type Punto = [number, number];

/** Proyecta la serie de una clave de bienestar a coordenadas del SVG. */
export function sparklinePoints(wellness: any[], key: string): Punto[] {
  const n = wellness.length;
  return wellness.map((w: any, i: number): Punto => {
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
export function sparkline(wellness: any[]): string {
  const keys: [string, string, string][] = [
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
      <div class="spark-legend" role="list" aria-label="Leyenda de bienestar">${leyenda}</div>`;
}