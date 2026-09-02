/**
 * src/perfil-atleta.js
 * Datos del atleta + wellness + readiness + saltos CMJ.
 * Depende de: ./utils.js (Utils), ./store.js (Store)
 */

import { Utils } from './utils.js';
import { Store } from './store.js';

export class PerfilAtleta {
    constructor(perfilData) {
        this.data = perfilData; // referencia directa al objeto dentro de Store
    }

    guardar(datos) {
        this.data.perfil = { ...this.data.perfil, ...datos };
        Store.guardar();
    }

    getEdad() { return this.data.perfil.edad; }
    getAltura() { return this.data.perfil.altura; }
    getPeso() { return this.data.perfil.peso; }
    getGrasa() { return this.data.perfil.grasa; }
    getObjetivo() { return this.data.perfil.objetivo; }
    getNivel() { return this.data.perfil.nivel; }

    registrarWellness({ sueno, estres, doms, motivacion }) {
        const entry = {
            fecha: Utils.fechaISO(),
            sueno: Utils.clamp(sueno, 1, 5),
            estres: Utils.clamp(estres, 1, 5),
            doms: Utils.clamp(doms, 1, 5),
            motivacion: Utils.clamp(motivacion, 1, 5),
        };
        // Si ya existe un registro de hoy, lo reemplaza en vez de duplicar
        const idxHoy = this.data.wellness.findIndex(w => w.fecha === entry.fecha);
        if (idxHoy >= 0) this.data.wellness[idxHoy] = entry;
        else this.data.wellness.push(entry);
        Store.guardar();
        return entry;
    }

    getWellnessUltimo() {
        return this.data.wellness.length > 0 ? this.data.wellness[this.data.wellness.length - 1] : null;
    }

    // Score de readiness ponderado sobre una ventana móvil de registros recientes,
    // en vez de mirar solo el último día (más estable, menos ruido de un mal día puntual).
    getEstadoGeneral(ventana = 5) {
        const recientes = this.data.wellness.slice(-ventana);
        if (recientes.length === 0) return null;

        const avgSueno = Utils.promedio(recientes.map(w => w.sueno));
        const avgEstres = Utils.promedio(recientes.map(w => w.estres));
        const avgDoms = Utils.promedio(recientes.map(w => w.doms));
        const avgMotivacion = Utils.promedio(recientes.map(w => w.motivacion));

        const score = (avgSueno + avgMotivacion + (6 - avgEstres) + (6 - avgDoms)) / 4;

        let estado;
        if (score >= 4) estado = 'Óptimo';
        else if (score >= 3) estado = 'Normal';
        else if (score >= 2) estado = 'Fatigado';
        else estado = 'Alerta';

        return {
            score: Math.round(score * 10) / 10,
            estado,
            muestras: recientes.length,
            promedios: { sueno: avgSueno, estres: avgEstres, doms: avgDoms, motivacion: avgMotivacion },
        };
    }

    // Señal de riesgo de sobreentrenamiento: requiere días consecutivos reales (no solo los últimos N).
    isSobreentrenado(minDias = 3) {
        const recientes = this.data.wellness.slice(-minDias);
        if (recientes.length < minDias) return false;

        const consecutivos = recientes.every((w, i) => {
            if (i === 0) return true;
            const anterior = new Date(recientes[i - 1].fecha);
            const actual = new Date(w.fecha);
            const diffDias = Math.round((actual - anterior) / 86400000);
            return diffDias <= 2;
        });
        if (!consecutivos) return false;

        return recientes.every(w => w.estres >= 4 && w.doms >= 4 && w.sueno <= 2 && w.motivacion <= 2);
    }

    registrarSalto(alturaCm, fecha = new Date()) {
        const entry = { fecha: Utils.fechaISO(fecha), altura: alturaCm };
        this.data.saltos.push(entry);
        Store.guardar();
        return entry;
    }

    getSaltosRecientes(dias = 30) {
        const limite = new Date();
        limite.setDate(limite.getDate() - dias);
        return this.data.saltos.filter(s => new Date(s.fecha) >= limite);
    }

    /**
     * Diagnóstico neuromuscular del SNC comparando el salto más reciente
     * contra la línea base de los últimos 30 días (Media y Desviación Estándar).
     */
    getDiagnosticoCMJ(dias = 30) {
        const saltos = this.getSaltosRecientes(dias);
        if (saltos.length === 0) return null;

        const alturas = saltos.map(s => parseFloat(s.altura)).filter(h => !isNaN(h) && h > 0);
        if (alturas.length === 0) return null;

        const ultimo = alturas[alturas.length - 1];
        const media = Utils.promedio(alturas);
        const varianza = alturas.reduce((acc, h) => acc + Math.pow(h - media, 2), 0) / alturas.length;
        const desvStd = Math.sqrt(varianza) || 1.0;

        const zScore = Math.round(((ultimo - media) / desvStd) * 100) / 100;
        const dropPct = Math.round(((ultimo - media) / media) * 1000) / 10;

        let estado = "Óptimo (Potencia SNC)";
        let color = "success";
        let recomendacion = "SNC plenamente recuperado. Apto para levantamientos pesados, sprints y potencia máxima.";

        if (zScore < -1.5 || dropPct <= -8.0) {
            estado = "Fatiga Central / SNC";
            color = "danger";
            recomendacion = `Caída neural del ${Math.abs(dropPct)}% respecto a tu media de 30 días. Reduce el volumen en 20-30% o evita series al fallo (RIR ≥ 3).`;
        } else if (zScore < -0.5 || dropPct < -3.0) {
            estado = "Fatiga Moderada";
            color = "warning";
            recomendacion = "Fatiga neuromuscular leve detectada. Mantén cargas controladas con RIR 2-3.";
        }

        return {
            ultimoSalto: ultimo,
            media: Math.round(media * 10) / 10,
            desvStd: Math.round(desvStd * 10) / 10,
            zScore,
            dropPct,
            muestras: alturas.length,
            estado,
            color,
            recomendacion
        };
    }

    /**
     * Cálculo de antropometría avanzada y composición corporal
     * (FFMI, BMR Katch-McArdle, WHtR, WHR).
     */
    static calcularAntropometriaAvanzada({ peso, altura, grasa, cintura, cadera }) {
        const p = parseFloat(peso) || 0;
        const h = parseFloat(altura) || 0;
        const g = parseFloat(grasa) || 0;
        const c = parseFloat(cintura) || 0;
        const cad = parseFloat(cadera) || 0;

        if (p <= 0 || h <= 0) return null;

        const alturaM = h / 100;
        const imc = Math.round((p / (alturaM * alturaM)) * 10) / 10;

        let masaGrasaKg = 0;
        let masaMagraKg = p;
        let ffmi = null;
        let ffmiNorm = null;
        let bmr = null;

        if (g > 0 && g < 100) {
            masaGrasaKg = Math.round((p * (g / 100)) * 10) / 10;
            masaMagraKg = Math.round((p - masaGrasaKg) * 10) / 10;
            const rawFfmi = masaMagraKg / (alturaM * alturaM);
            ffmi = Math.round(rawFfmi * 10) / 10;
            ffmiNorm = Math.round((rawFfmi + 6.1 * (1.8 - alturaM)) * 10) / 10;
            // BMR Katch-McArdle
            bmr = Math.round(370 + 21.6 * masaMagraKg);
        } else {
            // BMR Harris-Benedict simplificado si no hay % graso
            bmr = Math.round(10 * p + 6.25 * h - 5 * 25 + 5);
        }

        // WHtR (Waist-to-Height Ratio)
        const whtr = c > 0 ? Math.round((c / h) * 100) / 100 : null;
        // WHR (Waist-to-Hip Ratio)
        const whr = (c > 0 && cad > 0) ? Math.round((c / cad) * 100) / 100 : null;

        return {
            imc,
            masaMagraKg,
            masaGrasaKg,
            ffmi,
            ffmiNorm,
            bmr,
            whtr,
            whr,
            categoriaFFMI: ffmi ? (ffmi >= 22 ? "Avanzado / Culturista Natural" : ffmi >= 20 ? "Atlético Superior" : ffmi >= 18 ? "Promedio Saludable" : "Bajo Estímulo") : null,
            saludWHtR: whtr ? (whtr < 0.5 ? "Óptimo (<0.50)" : "Riesgo Metabólico Aumentado") : null
        };
    }
}
