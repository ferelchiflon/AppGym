/**
 * src/gestor-periodizacion.js
 * Periodización contemporánea (ATR, DUP, Lineal) con microciclos progresivos,
 * cálculo dinámico de semanas transcurridas y prescripción de carga por sesión.
 * Depende de: ./utils.js (Utils), ./store.js (Store)
 */

import { Utils } from './utils.js';
import { Store } from './store.js';

export const MODELOS_PERIODIZACION = {
  acumulacion: {
    nombre: "Acumulación / Hipertrofia",
    desc: "Alto volumen, RPE moderado, foco en hipertrofia y capacidad de trabajo",
    semanas: [
      { semana: 1, fase: "Introducción", seriesRango: "3-4", repsRango: "8-12", pct1RM: "65-70%", rpeObjetivo: 7.0, volumenRel: 75 },
      { semana: 2, fase: "Sobrecarga", seriesRango: "4-5", repsRango: "8-12", pct1RM: "70-75%", rpeObjetivo: 7.5, volumenRel: 85 },
      { semana: 3, fase: "Sobrecarga Alta", seriesRango: "4-5", repsRango: "8-10", pct1RM: "75-77%", rpeObjetivo: 8.0, volumenRel: 95 },
      { semana: 4, fase: "Pico / Overreach", seriesRango: "5-6", repsRango: "6-8", pct1RM: "77-80%", rpeObjetivo: 8.5, volumenRel: 100 },
      { semana: 5, fase: "Descarga (Deload)", seriesRango: "2-3", repsRango: "8-10", pct1RM: "60-65%", rpeObjetivo: 6.0, volumenRel: 50 },
    ]
  },
  intensificacion: {
    nombre: "Intensificación / Fuerza Máxima",
    desc: "Volumen medio, cargas pesadas, foco en reclutamiento neural y fuerza",
    semanas: [
      { semana: 1, fase: "Adaptación Carga", seriesRango: "3-4", repsRango: "5-6", pct1RM: "75-80%", rpeObjetivo: 7.5, volumenRel: 70 },
      { semana: 2, fase: "Intensificación I", seriesRango: "4-5", repsRango: "4-5", pct1RM: "80-84%", rpeObjetivo: 8.0, volumenRel: 75 },
      { semana: 3, fase: "Intensificación II", seriesRango: "4-5", repsRango: "3-4", pct1RM: "85-88%", rpeObjetivo: 8.5, volumenRel: 80 },
      { semana: 4, fase: "Pico de Fuerza", seriesRango: "3-4", repsRango: "2-3", pct1RM: "88-92%", rpeObjetivo: 9.0, volumenRel: 85 },
      { semana: 5, fase: "Descarga Técnica", seriesRango: "2-3", repsRango: "4-5", pct1RM: "65-70%", rpeObjetivo: 6.0, volumenRel: 45 },
    ]
  },
  realizacion: {
    nombre: "Realización / Tapering & Peaking",
    desc: "Bajo volumen, máxima especificidad, test de 1RM o competición",
    semanas: [
      { semana: 1, fase: "Afinamiento I", seriesRango: "3-4", repsRango: "3-4", pct1RM: "85-88%", rpeObjetivo: 8.0, volumenRel: 60 },
      { semana: 2, fase: "Afinamiento II", seriesRango: "3", repsRango: "2-3", pct1RM: "90-93%", rpeObjetivo: 8.5, volumenRel: 50 },
      { semana: 3, fase: "Test 1RM / Peaking", seriesRango: "2-3", repsRango: "1-2", pct1RM: "95-100%", rpeObjetivo: 9.5, volumenRel: 40 },
      { semana: 4, fase: "Transición / Deload", seriesRango: "2", repsRango: "6-8", pct1RM: "60%", rpeObjetivo: 5.5, volumenRel: 30 },
    ]
  },
  dup: {
    nombre: "DUP (Ondulante Diaria)",
    desc: "Rotación diaria de estímulos: Día A Hipertrofia (8-12), Día B Fuerza (4-6), Día C Potencia (1-3)",
    semanas: [
      { semana: 1, fase: "Microciclo Ondulante 1", seriesRango: "3-5", repsRango: "Varía (1-12)", pct1RM: "70-90%", rpeObjetivo: 7.5, volumenRel: 80 },
      { semana: 2, fase: "Microciclo Ondulante 2", seriesRango: "4-5", repsRango: "Varía (1-12)", pct1RM: "72-92%", rpeObjetivo: 8.0, volumenRel: 85 },
      { semana: 3, fase: "Microciclo Ondulante 3", seriesRango: "4-5", repsRango: "Varía (1-12)", pct1RM: "75-95%", rpeObjetivo: 8.5, volumenRel: 90 },
      { semana: 4, fase: "Descarga DUP", seriesRango: "2-3", repsRango: "6-8", pct1RM: "60-65%", rpeObjetivo: 6.0, volumenRel: 50 },
    ]
  },
  deload: {
    nombre: "Descarga / Regeneración Activa",
    desc: "Disipación de fatiga acumulada neuromuscular y articular",
    semanas: [
      { semana: 1, fase: "Deload Activo", seriesRango: "2-3", repsRango: "6-10", pct1RM: "55-65%", rpeObjetivo: 6.0, volumenRel: 40 },
    ]
  }
};

export class GestorPeriodizacion {
    constructor(bloquesData) {
        this.data = bloquesData || [];
    }

    get bloques() { return this.data; }

    crearBloque({ nombre, tipo = 'acumulacion', semanas, duracionSemanas, objetivo = '', ejercicios = [] }) {
        const totalSemanas = parseInt(semanas || duracionSemanas, 10) || 4;
        const bloque = {
            id: Utils.generarId(),
            nombre: nombre || `Bloque de ${tipo}`,
            tipo,
            semanas: totalSemanas,
            duracionSemanas: totalSemanas,
            objetivo,
            ejercicios: ejercicios || [],
            fechaInicio: new Date().toISOString(),
            fechaFin: null,
            completado: false,
        };
        this.data.push(bloque);
        Store.guardar();
        return bloque;
    }

    getBloqueActual() {
        return this.data.find(b => !b.completado) || null;
    }

    completarBloque(id) {
        const bloque = this.data.find(b => b.id === id);
        if (bloque) {
            bloque.completado = true;
            bloque.fechaFin = new Date().toISOString();
            Store.guardar();
        }
    }

    getSemanaActual(bloque) {
        if (!bloque || !bloque.fechaInicio) return 1;
        const inicio = new Date(bloque.fechaInicio);
        const hoy = new Date();
        const diffDias = Math.max(0, Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24)));
        const semana = Math.floor(diffDias / 7) + 1;
        const duracion = bloque.semanas || bloque.duracionSemanas || 4;
        return Math.min(semana, duracion);
    }

    getPrescripcionActual() {
        const bloque = this.getBloqueActual();
        if (!bloque) return null;
        const semanaNum = this.getSemanaActual(bloque);
        return this.getPrescripcionSemana(bloque, semanaNum);
    }

    getPrescripcionSemana(bloque, semanaNum = 1) {
        if (!bloque) return null;
        const modelo = MODELOS_PERIODIZACION[bloque.tipo] || MODELOS_PERIODIZACION.acumulacion;
        const listaSemanas = modelo.semanas;
        const idx = Math.max(0, Math.min(semanaNum - 1, listaSemanas.length - 1));
        const prescripcion = { ...listaSemanas[idx] };
        prescripcion.semana = semanaNum;
        prescripcion.modeloNombre = modelo.nombre;
        prescripcion.modeloDesc = modelo.desc;
        prescripcion.totalSemanas = bloque.semanas || bloque.duracionSemanas || 4;
        return prescripcion;
    }

    getIntensidadRecomendada(bloque) {
        if (!bloque) return { volumen: 70, intensidad: 70 };
        const prescripcion = this.getPrescripcionActual();
        if (prescripcion) {
            const vol = prescripcion.volumenRel || 70;
            const rpe = prescripcion.rpeObjetivo || 7.5;
            const intens = Math.round(rpe * 10);
            return { volumen: vol, intensidad: intens, rpeObjetivo: rpe, fase: prescripcion.fase };
        }
        switch (bloque.tipo) {
            case 'acumulacion': return { volumen: 80, intensidad: 60 };
            case 'intensificacion': return { volumen: 60, intensidad: 80 };
            case 'realizacion': return { volumen: 40, intensidad: 90 };
            case 'dup': return { volumen: 75, intensidad: 80 };
            case 'deload': return { volumen: 30, intensidad: 40 };
            default: return { volumen: 70, intensidad: 70 };
        }
    }
}
