/**
 * src/utils.ts
 * Funciones utilitarias puras. Sin dependencias.
 * Migrado de .js a .ts (Fase 1). Comportamiento idéntico al original.
 */

export interface UseCallbackOptions {
  timeout?: number;
}

/** Argumentos genéricos para conservar la firma de la función a debouncear. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms = 300
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Convertir un valor a número (cuidado: para redes neuronales usar parseFloat). */
export const Utils = {
  /**
   * Genera un ID único. Usa crypto.randomUUID() (sin colisiones, rápido)
   * y cae a un fallback Date.now+random solo si la API no está disponible
   * (navegadores muy viejos o contextos sin window.crypto).
   */
  generarId: (): string => {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
    return (
      Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
    );
  },

  fechaFormateada: (fecha: Date = new Date()): string =>
    fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),

  fechaISO: (fecha: Date = new Date()): string =>
    fecha.toISOString().slice(0, 10),

  clamp: (val: number, min: number, max: number): number =>
    Math.min(Math.max(val, min), max),

  promedio: (arr: number[]): number =>
    arr.reduce((a, b) => a + b, 0) / (arr.length || 1),

  redondearIncremento: (valor: number, incremento = 1.25): number =>
    Math.round(valor / incremento) * incremento,

  debounce: <A extends unknown[]>(
    fn: (...args: A) => void,
    ms = 300
  ): ((...args: A) => void) => debounce(fn, ms),

  /**
   * requestIdleCallback con fallback a setTimeout. Sirve para diferir
   * trabajo no crítico hasta que el hilo principal esté libre.
   */
  whenIdle: (
    cb: () => void,
    { timeout = 1000 }: UseCallbackOptions = {}
  ): number => {
    if (
      typeof window !== 'undefined' &&
      typeof window.requestIdleCallback === 'function'
    ) {
      return window.requestIdleCallback(cb, { timeout });
    }
    return setTimeout(cb, 0);
  },

  /**
   * Cancelador de whenIdle.
   */
  cancelIdle: (id: number): void => {
    if (
      typeof window !== 'undefined' &&
      typeof window.cancelIdleCallback === 'function'
    ) {
      window.cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  },

  /**
   * Descarga un archivo de texto/JSON en el navegador creando un objeto Blob.
   */
  descargarArchivo: (
    nombre: string,
    contenido: string,
    tipo = 'application/json'
  ): void => {
    const blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
/**
 * Única fuente de verdad para la dirección de cada métrica wellness (escala 1-5).
 * La usan `PerfilAtleta.getEstadoGeneral()` y `calcularReadiness()` (dashboard) para
 * NO volver a divergir: si cambiás una dirección acá, cambia en ambos lados.
 *  - "directa":   mayor puntaje = mejor  → sueño, motivación, energía, alimentación, hidratación.
 *  - "invertida": menor puntaje = mejor  → estrés, DOMS, fatiga (se normalizan como 6 - valor).
 */
export const WELLNESS_DIRECCION: Record<string, "directa" | "invertida"> = {
    sueno: "directa", motivacion: "directa", energia: "directa",
    alimentacion: "directa", hidratacion: "directa",
    estres: "invertida", doms: "invertida", fatiga: "invertida",
};

/** Registros wellness viejos sin los campos nuevos se leen como "neutral" (3/5). */
export const WELLNESS_NEUTRAL = 3;

export interface WellnessScored {
    /** Score 1-5: promedio PLANO de las 8 métricas ya ajustadas por dirección. */
    score: number;
    /** Promedios CRUDOS por métrica (sin invertir), con WELLNESS_NEUTRAL si el campo falta. */
    promedios: Record<string, number>;
}

/**
 * Score de bienestar agregado (1-5) a partir de una lista de registros wellness.
 * Promedio PLANO de las 8 métricas ajustadas por dirección: las invertidas se dan
 * vuelta (6 - valor); las directas pasan tal cual. Los campos que faltan (registros
 * viejos) cuentan como WELLNESS_NEUTRAL (3) y NO contaminan el cálculo (sin NaN).
 * Mismo algoritmo que getEstadoGeneral(); no hace clasificación por tramos.
 */
export function wellnessScore(registros: Array<Record<string, unknown>>): WellnessScored {
    const promedios: Record<string, number> = {};
    const keys = Object.keys(WELLNESS_DIRECCION);

    keys.forEach((k) => {
        promedios[k] = Utils.promedio(
            registros.map((w) => {
                const v = (typeof w[k] === 'number' && !Number.isNaN(w[k])) ? (w[k] as number) : WELLNESS_NEUTRAL;
                return v;
            })
        );
    });

    const score = Utils.promedio(
        keys.map((k) => (WELLNESS_DIRECCION[k] === 'invertida' ? 6 - promedios[k] : promedios[k]))
    );

    return { score, promedios };
}
