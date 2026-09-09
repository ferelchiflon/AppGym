/**
 * src/perfil-atleta.js
 * Datos del atleta + wellness + readiness + saltos CMJ.
 * Depende de: ./utils.ts (Utils), ./store.js (Store)
 */

import { Utils, wellnessScore } from './utils.ts';
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

    registrarWellness({ sueno, estres, doms, motivacion, energia, fatiga, alimentacion, hidratacion }) {
        const entry = {
            fecha: Utils.fechaISO(),
            sueno: Utils.clamp(sueno, 1, 5),
            estres: Utils.clamp(estres, 1, 5),
            doms: Utils.clamp(doms, 1, 5),
            motivacion: Utils.clamp(motivacion, 1, 5),
            // Campos nuevos (Fase 3): valor por defecto neutral (3) si no se proveen.
            energia: Utils.clamp(energia ?? 3, 1, 5),
            fatiga: Utils.clamp(fatiga ?? 3, 1, 5),
            alimentacion: Utils.clamp(alimentacion ?? 3, 1, 5),
            hidratacion: Utils.clamp(hidratacion ?? 3, 1, 5),
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

        // El score de wellness (1-5) y los promedios crudos viven en wellnessScore()
        // (utils.ts), única fuente de verdad compartida con calcularReadiness() del
        // dashboard. Si cambiás direcciones/neutral, cambia en ambos lados sin divergir.
        const { score, promedios } = wellnessScore(recientes);

        let estado;
        if (score >= 4) estado = 'Óptimo';
        else if (score >= 3) estado = 'Normal';
        else if (score >= 2) estado = 'Fatigado';
        else estado = 'Alerta';

        return {
            score: Math.round(score * 10) / 10,
            estado,
            muestras: recientes.length,
            promedios,
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
/**
     * Detección avanzada de sobreentrenamiento combinando tres señales:
     *   1. Frecuencia cardíaca / esfuerzo percibido reciente (cardio → FC/RPE).
     *   2. Volumen acumulado de fuerza (historial) respecto a la línea base.
     *   3. Días consecutivos de alta intensidad (volumen o carga elevada).
     *
     * Devuelve un diagnóstico con nivel de fatiga (`nivel`: 'bajo'|'moderado'|
     * 'alto'|'critico') y una puntuación 0-100 para mostrarlo como alerta o
     * indicador de advertencia en la UI.
     *
     * @param {object} [opciones]
     * @param {number} [opciones.dias=7] Ventana de análisis en días.
     * @param {number} [opciones.umbralDiasAltaIntensidad=3] Días consecutivos para marcar alerta.
     * @returns {{fatiga: string, puntuacion: number, nivel: string,
     *   senales: string[], recomendacion: string, rachaAltaIntensidad: number,
     *   volumenTotal: number, fcMedia: number|null, rpeMedio: number|null}|null}
     */
    getRiesgoSobreentrenamiento({ dias = 7, umbralDiasAltaIntensidad = 3 } = {}) {
        const limite = new Date();
        limite.setDate(limite.getDate() - dias);
        const recientes = (this.data.historial || []).filter(
            (s) => new Date(s.fechaISO || s.fecha || s.timestamp) >= limite
        );

        if (recientes.length === 0) return null;

        // --- Señal 1: esfuerzo cardiovascular (FC / RPE) -------------------
        const cardios = (this.data.sesionesCardio || []).filter(
            (c) => new Date(c.fecha || c.timestamp) >= limite
        );
        const fcs = cardios.map((c) => parseFloat(c.fc)).filter((f) => !isNaN(f) && f > 0);
        const rpes = cardios.map((c) => parseFloat(c.rpe)).filter((r) => !isNaN(r) && r > 0);

        // --- Señal 2: volumen acumulado -------------------------------------
        const volumenes = recientes.map((s) => parseFloat(s.volumenTotal)).filter((v) => !isNaN(v) && v >= 0);
        const volumenTotal = volumenes.reduce((a, b) => a + b, 0);
        const volumenMedio = volumenes.length ? volumenTotal / volumenes.length : 0;
        const volumenMax = Math.max(0, ...volumenes);

        // --- Señal 3: días consecutivos de alta intensidad ------------------
        const diasAltaIntensidad = recientes.map((s) => {
            const v = parseFloat(s.volumenTotal) || 0;
            const esAltoVol = volumenMax > 0 && v >= volumenMax * 0.8;
            const fecha = s.fechaISO || s.fecha || s.timestamp || '';
            const cardioIntensoEseDia = cardios.some(
                (c) => (c.fecha || c.timestamp) === fecha && (parseFloat(c.rpe) || 0) >= 8
            );
            return esAltoVol || cardioIntensoEseDia;
        });

        let racha = 0;
        for (let i = diasAltaIntensidad.length - 1; i >= 0; i--) {
            if (diasAltaIntensidad[i]) racha++;
            else break;
        }

        const fcMedia = fcs.length ? Utils.promedio(fcs) : null;
        const rpeMedio = rpes.length ? Utils.promedio(rpes) : null;

        const senales = [];
        let puntuacion = 0;

        if (fcMedia !== null && fcMedia >= 140) {
            puntuacion += 30;
            senales.push(`FC media elevada (${Math.round(fcMedia)} ppm)`);
        }
        if (rpeMedio !== null && rpeMedio >= 8) {
            puntuacion += 20;
            senales.push(`Esfuerzo percibido alto sostenido (RPE ${Math.round(rpeMedio * 10) / 10})`);
        }
        if (racha >= umbralDiasAltaIntensidad) {
            puntuacion += 35;
            senales.push(`${racha} días consecutivos de alta intensidad`);
        }
        if (volumenTotal > 0 && volumenes.length >= 3 && volumenTotal > volumenMedio * (volumenes.length * 0.9)) {
            puntuacion += 10;
            senales.push(`Volumen acumulado elevado (${Math.round(volumenTotal)} kg en ${dias} días)`);
        }

        puntuacion = Utils.clamp(puntuacion, 0, 100);

        let nivel;
        let recomendacion;
        if (puntuacion >= 65) {
            nivel = 'critico';
            recomendacion = 'Fatiga crítica detectada. Considerá un deload completo o una semana de descarga (reduce volumen 40-50%).';
        } else if (puntuacion >= 45) {
            nivel = 'alto';
            recomendacion = 'Fatiga acumulada elevada. Reducí volumen un 20-30% y priorizá recuperación (sueño, hidratación).';
        } else if (puntuacion >= 25) {
            nivel = 'moderado';
            recomendacion = 'Fatiga moderada. Mantené cargas controladas con RIR 2-3 y vigilá el sueño.';
        } else {
            nivel = 'bajo';
            recomendacion = 'Nivel de fatiga normal. Podés continuar con la planificación.';
        }

        return {
            fatiga: nivel === 'bajo' ? 'Baja' : nivel === 'moderado' ? 'Moderada' : nivel === 'alto' ? 'Alta' : 'Crítica',
            puntuacion,
            nivel,
            senales,
            recomendacion,
            rachaAltaIntensidad: racha,
            volumenTotal,
            fcMedia: fcMedia !== null ? Math.round(fcMedia) : null,
            rpeMedio: rpeMedio !== null ? Math.round(rpeMedio * 10) / 10 : null,
        };
    }

    /**
     * Booleano de sobreentrenamiento avanzado (atajo sobre
     * `getRiesgoSobreentrenamiento`): true si el nivel es 'alto' o 'critico'.
     * @param {object} [opciones] Igual que getRiesgoSobreentrenamiento.
     * @returns {boolean}
     */
    isSobreentrenadoAvanzado(opciones = {}) {
        const riesgo = this.getRiesgoSobreentrenamiento(opciones);
        return !!riesgo && (riesgo.nivel === 'alto' || riesgo.nivel === 'critico');
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
