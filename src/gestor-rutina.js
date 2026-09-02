/**
 * src/gestor-rutina.js
 * Rutina, series, PRs, superseries, historial, métricas de progreso.
 * Depende de: ./utils.js (Utils), ./formulas.js (FormulasRM),
 *              ./autorregulacion.js (Autoregulacion), ./store.js (Store),
 *              ./config.js (EJERCICIOS_DISPONIBLES)
 */

import { Utils } from './utils.js';
import { FormulasRM } from './formulas.js';
import { Autoregulacion } from './autorregulacion.js';
import { Store } from './store.js';
import { EJERCICIOS_DISPONIBLES } from './config.js';

export class GestorRutina {
    constructor(rutinaData) {
        this.data = rutinaData;
        this.ejercicioSeleccionado = this.data.rutina.length > 0 ? this.data.rutina[0] : null;
    }

    get rutina() { return this.data.rutina; }
    get seriesPorEjercicio() { return this.data.seriesPorEjercicio; }
    get historial() { return this.data.historial; }
    get superseries() { return this.data.superseries; }

    agregarEjercicio(id) {
        if (!this.data.rutina.includes(id)) {
            this.data.rutina.push(id);
            this.data.seriesPorEjercicio[id] = [];
            this.ejercicioSeleccionado = id;
            Store.guardar();
            return true;
        }
        return false;
    }

    eliminarEjercicio(id) {
        const idx = this.data.rutina.indexOf(id);
        this.data.rutina = this.data.rutina.filter(e => e !== id);
        delete this.data.seriesPorEjercicio[id];
        delete this.data.superseries[idx];
        if (this.ejercicioSeleccionado === id) {
            this.ejercicioSeleccionado = this.data.rutina.length > 0 ? this.data.rutina[0] : null;
        }
        Store.guardar();
    }

    seleccionarEjercicio(id) {
        if (this.data.rutina.includes(id)) {
            this.ejercicioSeleccionado = id;
            return true;
        }
        return false;
    }

    getEjercicioActual() {
        return this.ejercicioSeleccionado;
    }

    getSeriesActuales() {
        if (!this.ejercicioSeleccionado) return [];
        return this.data.seriesPorEjercicio[this.ejercicioSeleccionado] || [];
    }

    toggleSuperserie(index) {
        if (this.data.superseries[index]) {
            delete this.data.superseries[index];
        } else {
            this.data.superseries[index] = true;
        }
        Store.guardar();
    }

    estaEnlazadoConSiguiente(index) {
        return !!this.data.superseries[index];
    }

    agregarSerie(ejercicioId, { peso, reps, rpe = null, rir = null, notas = '' }) {
        if (!this.data.seriesPorEjercicio[ejercicioId]) {
            this.data.seriesPorEjercicio[ejercicioId] = [];
        }
        const pesoNum = parseFloat(peso) || 0;
        const repsNum = parseInt(reps) || 0;
        const serie = {
            id: Utils.generarId(),
            peso: pesoNum,
            reps: repsNum,
            rpe: rpe !== null ? parseFloat(rpe) : null,
            rir: rir !== null ? parseFloat(rir) : null,
            notas: notas || '',
            timestamp: new Date().toISOString(),
            esPR: false,
        };

        const { esRecordNuevo } = this._evaluarYActualizarRecord(ejercicioId, serie);
        serie.esPR = esRecordNuevo;

        this.data.seriesPorEjercicio[ejercicioId].push(serie);
        Store.guardar();
        return serie;
    }

    _evaluarYActualizarRecord(ejercicioId, serie) {
        const rm = FormulasRM.calcularTodos(serie.peso, serie.reps);
        const volumenSerie = serie.peso * serie.reps;
        const recordActual = this.data.records[ejercicioId];

        const esRecordPeso = !recordActual || serie.peso > recordActual.peso;
        const esRecordRM = !recordActual || (rm && rm.promedio > recordActual.rm);

        if (esRecordPeso || esRecordRM) {
            this.data.records[ejercicioId] = {
                peso: Math.max(serie.peso, recordActual ? recordActual.peso : 0),
                volumen: Math.max(volumenSerie, recordActual ? recordActual.volumen : 0),
                rm: Math.max(rm ? rm.promedio : 0, recordActual ? recordActual.rm : 0),
                fecha: Utils.fechaISO(),
            };
            return { esRecordNuevo: true };
        }
        return { esRecordNuevo: false };
    }

    getRecord(ejercicioId) {
        return this.data.records[ejercicioId] || null;
    }

    eliminarSerie(ejercicioId, serieId) {
        if (this.data.seriesPorEjercicio[ejercicioId]) {
            this.data.seriesPorEjercicio[ejercicioId] = this.data.seriesPorEjercicio[ejercicioId]
                .filter(s => s.id !== serieId);
            Store.guardar();
        }
    }

    eliminarTodasSeries(ejercicioId) {
        if (this.data.seriesPorEjercicio[ejercicioId]) {
            this.data.seriesPorEjercicio[ejercicioId] = [];
            Store.guardar();
        }
    }

    calcularVolumen(ejercicioId) {
        const series = this.data.seriesPorEjercicio[ejercicioId] || [];
        return series.reduce((total, s) => total + (s.peso * s.reps), 0);
    }

    calcularRM(ejercicioId) {
        const series = this.data.seriesPorEjercicio[ejercicioId] || [];
        if (series.length === 0) return null;
        const ultima = series[series.length - 1];
        return FormulasRM.calcularTodos(ultima.peso, ultima.reps);
    }

    calcularWarmUp(ejercicioId, porcentajes = [20, 40, 60, 80]) {
        const rm = this.calcularRM(ejercicioId);
        if (!rm) return null;
        const base = rm.promedio;
        return porcentajes.map(pct => ({
            porcentaje: pct,
            peso: Math.round((base * pct) / 100 * 2) / 2,
            reps: pct <= 40 ? 5 : pct <= 60 ? 3 : 2,
        }));
    }

    sugerirAutorregulacion(ejercicioId, rpeObjetivo = 8) {
        const series = this.data.seriesPorEjercicio[ejercicioId] || [];
        if (series.length === 0) return null;
        const ultima = series[series.length - 1];
        if (ultima.rpe === null) return null;
        return Autoregulacion.sugerirProximoPeso(ultima.peso, ultima.rpe, rpeObjetivo);
    }

    guardarSesion() {
        if (this.data.rutina.length === 0) return null;

        const sesion = {
            id: Utils.generarId(),
            fecha: Utils.fechaFormateada(),
            fechaISO: Utils.fechaISO(),
            timestamp: new Date().toISOString(),
            ejercicios: this.data.rutina.map(id => {
                const ej = EJERCICIOS_DISPONIBLES.find(e => e.id === id);
                const series = this.data.seriesPorEjercicio[id] || [];
                return {
                    id,
                    nombre: ej ? ej.nombre : id,
                    musculo: ej ? ej.musculo : 'desconocido',
                    series: series.map(s => ({ ...s })),
                    volumen: this.calcularVolumen(id),
                };
            }),
            volumenTotal: this.data.rutina.reduce((total, id) => total + this.calcularVolumen(id), 0),
        };

        this.data.historial.push(sesion);
        this.data.rutina.forEach(id => { this.data.seriesPorEjercicio[id] = []; });
        Store.guardar();
        return sesion;
    }

    /**
     * Guarda la rutina activa (this.data.rutina) como plantilla nueva.
     * Devuelve la plantilla creada o null si la rutina está vacía.
     */
    guardarComoPlantilla(nombre) {
        if (!this.data.rutina || this.data.rutina.length === 0) return null;
        return Store.crearPlantilla(nombre, this.data.rutina);
    }

    /**
     * Reemplaza la rutina actual por la de una plantilla. Reinicializa
     * seriesPorEjercicio para los nuevos ejercicios (igual que agregarEjercicio),
     * preservando el estado de superseries/records. Devuelve true si la plantilla
     * existía y se aplicó, false en caso contrario.
     */
    cargarPlantilla(plantillaId) {
        const plantillas = Store.listarPlantillas();
        const plantilla = plantillas.find(p => p.id === plantillaId);
        if (!plantilla) return false;

        const nuevosIds = Array.isArray(plantilla.ejercicios) ? [...plantilla.ejercicios] : [];

        // Reconstruimos la rutina y reinicializamos series vacías para cada
        // ejercicio, preservando las series de ejercicios que ya estaban si
        // coincide el id (decisión que toma la capa de UI antes de llamar). En
        // cualquier caso, garantizamos que cada ejercicio nuevo tenga su key.
        this.data.rutina = nuevosIds;
        const seriesPrevias = this.data.seriesPorEjercicio || {};
        this.data.seriesPorEjercicio = {};
        nuevosIds.forEach(id => {
            this.data.seriesPorEjercicio[id] = seriesPrevias[id] ? seriesPrevias[id] : [];
        });

        // Purgamos superseries huérfanas (índices fuera del nuevo rango).
        const superseries = this.data.superseries || {};
        Object.keys(superseries).forEach(idx => {
            if (!nuevosIds[idx]) delete superseries[idx];
        });

        this.ejercicioSeleccionado = nuevosIds.length > 0 ? nuevosIds[0] : null;
        Store.guardar();
        return true;
    }

    getVolumenPorMusculo() {
        const resultado = {};
        this.data.rutina.forEach(id => {
            const ej = EJERCICIOS_DISPONIBLES.find(e => e.id === id);
            if (ej) {
                resultado[ej.musculo] = (resultado[ej.musculo] || 0) + this.calcularVolumen(id);
            }
        });
        return resultado;
    }

    getVolumenPorMusculoHistorico() {
        const resultado = {};
        this.data.historial.forEach(sesion => {
            sesion.ejercicios.forEach(e => {
                resultado[e.musculo] = (resultado[e.musculo] || 0) + e.volumen;
            });
        });
        return resultado;
    }

    getProgresoRM(ejercicioId) {
        const historialEjercicio = this.data.historial
            .flatMap(sesion => sesion.ejercicios.filter(e => e.id === ejercicioId).map(e => ({ ...e, fecha: sesion.fecha, fechaISO: sesion.fechaISO })))
            .filter(e => e.series.length > 0);

        return historialEjercicio.map((e, idx) => {
            const ultima = e.series[e.series.length - 1];
            const rm = FormulasRM.calcularTodos(ultima.peso, ultima.reps);
            return {
                sesion: idx + 1,
                fecha: e.fecha,
                fechaISO: e.fechaISO,
                rm: rm ? rm.promedio : 0,
            };
        });
    }

    getVolumenPorSesion(n = 10) {
        return this.data.historial.slice(-n).map(s => ({
            fecha: s.fecha,
            fechaISO: s.fechaISO,
            volumen: s.volumenTotal,
        }));
    }
}
