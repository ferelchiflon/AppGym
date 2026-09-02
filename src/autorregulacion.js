/**
 * src/autorregulacion.js
 * Sugerencia de peso para próxima serie según RPE reportado vs objetivo.
 * Depende de: ./utils.js
 */

import { Utils } from './utils.js';

export const Autoregulacion = {
    // Sugiere el peso de la próxima serie según el RPE reportado vs el RPE objetivo.
    // Regla: ~2.5% de ajuste de carga por cada punto de diferencia de RPE.
    sugerirProximoPeso(pesoActual, rpeReportado, rpeObjetivo = 8, incremento = 1.25) {
        if (!pesoActual || rpeReportado === null || rpeReportado === undefined) return null;
        const diff = rpeObjetivo - rpeReportado; // positivo: fue más fácil de lo esperado
        const factor = 1 + (diff * 0.025);
        const sugerido = Utils.redondearIncremento(pesoActual * factor, incremento);
        return {
            peso: sugerido,
            direccion: sugerido > pesoActual ? 'subir' : sugerido < pesoActual ? 'bajar' : 'mantener',
            delta: Math.round((sugerido - pesoActual) * 100) / 100,
        };
    }
};
