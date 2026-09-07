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
