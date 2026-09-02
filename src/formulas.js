/**
 * src/formulas.js
 * Fórmulas de estimación de 1RM y calculadora de discos.
 * Depende de: ../src/config.js (CONFIG)
 */

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

/**
 * Tabla de conversión RPE a %1RM (Mike Tuchscherer / Reactive Training Systems).
 * Filas: Repeticiones (1 a 10). Columnas: RPE (6.5 a 10.0).
 */
export const TablaRPE_Tuchscherer = {
    1:  { 10: 1.000, 9.5: 0.978, 9: 0.955, 8.5: 0.939, 8: 0.922, 7.5: 0.907, 7: 0.892, 6.5: 0.878 },
    2:  { 10: 0.955, 9.5: 0.939, 9: 0.922, 8.5: 0.907, 8: 0.892, 7.5: 0.878, 7: 0.863, 6.5: 0.849 },
    3:  { 10: 0.922, 9.5: 0.907, 9: 0.892, 8.5: 0.878, 8: 0.863, 7.5: 0.849, 7: 0.834, 6.5: 0.821 },
    4:  { 10: 0.892, 9.5: 0.878, 9: 0.863, 8.5: 0.849, 8: 0.834, 7.5: 0.821, 7: 0.807, 6.5: 0.793 },
    5:  { 10: 0.863, 9.5: 0.849, 9: 0.834, 8.5: 0.821, 8: 0.811, 7.5: 0.793, 7: 0.779, 6.5: 0.765 },
    6:  { 10: 0.834, 9.5: 0.821, 9: 0.807, 8.5: 0.793, 8: 0.779, 7.5: 0.765, 7: 0.751, 6.5: 0.738 },
    7:  { 10: 0.807, 9.5: 0.793, 9: 0.779, 8.5: 0.765, 8: 0.751, 7.5: 0.738, 7: 0.723, 6.5: 0.707 },
    8:  { 10: 0.779, 9.5: 0.765, 9: 0.751, 8.5: 0.738, 8: 0.723, 7.5: 0.707, 7: 0.694, 6.5: 0.680 },
    9:  { 10: 0.751, 9.5: 0.738, 9: 0.723, 8.5: 0.707, 8: 0.694, 7.5: 0.680, 7: 0.667, 6.5: 0.653 },
    10: { 10: 0.723, 9.5: 0.707, 9: 0.694, 8.5: 0.680, 8: 0.667, 7.5: 0.653, 7: 0.640, 6.5: 0.626 },
};

export const FormulasRM = {
    epley: (peso, reps) => peso * (1 + reps / 30),
    brzycki: (peso, reps) => {
        const r = Math.min(reps, 10);
        return reps > 10 ? peso * (1 + reps / 30) : peso * (36 / (37 - r));
    },
    lombardi: (peso, reps) => peso * Math.pow(reps, 0.10),

    calcularPorcentajeRPE: (reps, rpe) => {
        const r = Math.max(1, Math.min(10, Math.round(reps)));
        const rpeClamp = Math.max(6.5, Math.min(10, Math.round(rpe * 2) / 2));
        if (TablaRPE_Tuchscherer[r] && TablaRPE_Tuchscherer[r][rpeClamp]) {
            return TablaRPE_Tuchscherer[r][rpeClamp];
        }
        // Fallback matemático aproximado si RPE < 6.5
        const rir = Math.max(0, 10 - rpe);
        const repsTotales = r + rir;
        return 1 / (1 + repsTotales / 30);
    },

    calcular1RMPorRPE: (peso, reps, rpe) => {
        if (!peso || peso <= 0 || !reps || reps <= 0 || !rpe) return null;
        const pct = FormulasRM.calcularPorcentajeRPE(reps, rpe);
        if (!pct || pct <= 0) return null;
        const rmEstimado = peso / pct;
        return {
            rm: Math.round(rmEstimado * 10) / 10,
            porcentaje: Math.round(pct * 1000) / 10,
            rpe,
            reps,
        };
    },

    calcularTodos: (peso, reps) => {
        if (peso <= 0 || reps <= 0) return null;
        const epley = FormulasRM.epley(peso, reps);
        const brzycki = FormulasRM.brzycki(peso, reps);
        const lombardi = FormulasRM.lombardi(peso, reps);
        const promedio = (epley + brzycki + lombardi) / 3;

        return {
            epley,
            brzycki,
            lombardi,
            promedio,
            confiable: reps <= 10,
            advertencia: reps > 10 ? "Estimación de resistencia anaeróbica (precisión neural óptima en ≤10 reps)" : null,
        };
    }
};

export const PlateCalculator = {
    // Devuelve el desglose de discos por lado para alcanzar pesoObjetivo con una barra dada.
    calcular(pesoObjetivo, pesoBarra = CONFIG.BARRA_KG_DEFAULT, discosDisponibles = CONFIG.DISCOS_KG) {
        if (pesoObjetivo <= pesoBarra) {
            return { porLado: [], pesoBarra, pesoTotal: pesoBarra, alcanzable: pesoObjetivo === pesoBarra, faltante: 0 };
        }
        let restante = (pesoObjetivo - pesoBarra) / 2;
        const porLado = [];
        const discosOrdenados = [...discosDisponibles].sort((a, b) => b - a);
        for (const disco of discosOrdenados) {
            let cantidad = 0;
            // Margen de tolerancia flotante
            while (restante + 1e-6 >= disco) {
                restante = Math.round((restante - disco) * 1000) / 1000;
                cantidad++;
            }
            if (cantidad > 0) porLado.push({ disco, cantidad });
        }
        const pesoLogrado = pesoBarra + porLado.reduce((t, d) => t + d.disco * d.cantidad, 0) * 2;
        return {
            porLado,
            pesoBarra,
            pesoTotal: pesoLogrado,
            alcanzable: Math.abs(pesoLogrado - pesoObjetivo) < 0.01,
            faltante: Math.round((pesoObjetivo - pesoLogrado) * 100) / 100,
        };
    }
};

// Reexportamos Utils para que fórmulas/autoregulación lo consuman sin import extra donde sea útil.
export { Utils };
