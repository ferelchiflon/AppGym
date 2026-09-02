/**
 * src/wellness-correlation.js
 * Cruza sesiones con wellness del mismo día para ver el impacto en volumen.
 * Depende de: ./utils.js (Utils)
 */

import { Utils } from './utils.js';

export const WellnessCorrelation = {
    analizar(historial, wellness) {
        if (historial.length === 0 || wellness.length === 0) return null;
        const wellnessPorFecha = {};
        wellness.forEach(w => { wellnessPorFecha[w.fecha] = w; });

        const cruces = historial
            .map(s => ({ sesion: s, w: wellnessPorFecha[s.fechaISO] }))
            .filter(c => c.w);

        if (cruces.length < 2) return { suficienteDatos: false, cruces: cruces.length };

        const bucket = (metrica) => {
            const bajos = cruces.filter(c => c.w[metrica] <= 2);
            const altos = cruces.filter(c => c.w[metrica] >= 4);
            const avgBajos = bajos.length ? Utils.promedio(bajos.map(c => c.sesion.volumenTotal)) : null;
            const avgAltos = altos.length ? Utils.promedio(altos.map(c => c.sesion.volumenTotal)) : null;
            let diffPct = null;
            if (avgBajos !== null && avgAltos !== null && avgBajos > 0) {
                diffPct = Math.round(((avgAltos - avgBajos) / avgBajos) * 1000) / 10;
            }
            return { avgBajos, avgAltos, diffPct, nBajos: bajos.length, nAltos: altos.length };
        };

        return {
            suficienteDatos: true,
            cruces: cruces.length,
            sueno: bucket('sueno'),
            estres: bucket('estres'),
            doms: bucket('doms'),
            motivacion: bucket('motivacion'),
        };
    },
};
