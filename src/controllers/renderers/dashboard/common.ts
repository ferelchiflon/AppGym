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