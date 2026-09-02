/**
 * src/utils.js
 * Funciones utilitarias puras. Sin dependencias.
 */

export const Utils = {
    /**
     * Genera un ID único. Usa crypto.randomUUID() (sin colisiones, rápido)
     * y cae a un fallback Date.now+random solo si la API no está disponible
     * (navegadores muy viejos o contextos sin window.crypto).
     */
    generarId: () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    },
    fechaFormateada: (fecha = new Date()) => fecha.toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }),
    fechaISO: (fecha = new Date()) => fecha.toISOString().slice(0, 10),
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    promedio: (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1),
    redondearIncremento: (valor, incremento = 1.25) => Math.round(valor / incremento) * incremento,
    debounce: (fn, ms = 300) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    },

    /**
     * requestIdleCallback con fallback a setTimeout. Sirve para diferir
     * trabajo no crítico hasta que el hilo principal esté libre.
     */
    whenIdle: (cb, { timeout = 1000 } = {}) => {
        if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
            return window.requestIdleCallback(cb, { timeout });
        }
        return setTimeout(cb, 0);
    },

    /**
     * Cancelador de whenIdle.
     */
    cancelIdle: (id) => {
        if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(id);
        } else {
            clearTimeout(id);
        }
    },

    /**
     * Descarga un archivo de texto/JSON en el navegador creando un objeto Blob.
     */
    descargarArchivo: (nombre, contenido, tipo = 'application/json') => {
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
