/**
 * src/gestor-cardio.js
 * Sesiones de cardio (correr / bici / remo / otro), su validación y métricas
 * semanales/mensuales. Persiste en Store bajo `perfil.sesionesCardio` (colección
 * propia, separada del historial de fuerza gestionado por GestorRutina).
 *
 * Depende de: ./utils.js (Utils), ./store.js (Store)
 */

import { Utils } from './utils.js';
import { Store } from './store.js';

/** Tipos de cardio soportados (ids estables para Store). */
export const TIPOS_CARDIO = ['correr', 'bici', 'remo', 'otro'];

export const TIPOS_CARDIO_LABELS = {
    correr: 'Correr',
    bici: 'Bici',
    remo: 'Remo',
    otro: 'Otro',
};

export class GestorCardio {
    constructor(perfilData) {
        this.data = perfilData; // referencia directa al perfil dentro de Store
    }

    /**
     * Acceso seguro a la colección de sesiones. Fallback a [] si el perfil
     * existente (creado antes de esta fase) aún no tiene `sesionesCardio`.
     */
    getSesiones() {
        if (!this.data) return [];
        if (!Array.isArray(this.data.sesionesCardio)) {
            this.data.sesionesCardio = [];
            Store.guardar();
        }
        return this.data.sesionesCardio;
    }

    /**
     * Registra una sesión de cardio y la guarda en Store.
     * Validaciones (Security/Input): tipo restringido a whitelist, números
     * parseados y clampados. La FC es opcional; el RPE se exige y se clamp a 1-10.
     *
     * @param {{ tipo: string, duracion: number|string, distancia?: number|string,
     *           fc?: number|string|null, rpe: number|string, notas?: string }} datos
     * @returns {Object|null} sesión creada o null si `tipo`/`duracion`/`rpe` no son válidos.
     */
    registrar({ tipo, duracion, distancia, fc = null, rpe, notas = '' }) {
        const tipoValido = TIPOS_CARDIO.includes(tipo);
        const duracionNum = parseFloat(duracion);
        const rpeNum = parseFloat(rpe);

        if (!tipoValido || !(duracionNum > 0) || isNaN(rpeNum)) return null;

        const distanciaNum = parseFloat(distancia);
        const fcNum = fc === null || fc === undefined || fc === '' ? null : parseFloat(fc);

        const sesion = {
            id: Utils.generarId(),
            tipo,
            duracion: Math.round(duracionNum * 10) / 10,
            distancia: !isNaN(distanciaNum) && distanciaNum > 0 ? Math.round(distanciaNum * 100) / 100 : null,
            fc: fcNum !== null && !isNaN(fcNum) && fcNum > 0 ? Math.round(fcNum) : null,
            rpe: Math.round(Utils.clamp(rpeNum, 1, 10) * 10) / 10,
            notas: notas || '',
            fecha: Utils.fechaISO(),
            timestamp: new Date().toISOString(),
        };

        // Mantenemos la sesión más reciente primero (lectura directa para el dashboard).
        this.getSesiones().unshift(sesion);
        Store.guardar();
        return sesion;
    }

    /** Elimina una sesión por id. Devuelve true si existía. */
    eliminar(id) {
        const lista = this.getSesiones();
        const idx = lista.findIndex(s => s.id === id);
        if (idx === -1) return false;
        lista.splice(idx, 1);
        Store.guardar();
        return true;
    }

    /** Sesión más reciente (para la card del dashboard) o null. */
    getUltima() {
        const lista = this.getSesiones();
        return lista.length > 0 ? lista[0] : null;
    }

    /** Sesiones de los últimos `dias` (por defecto 7). */
    getRecientes(dias = 7) {
        const desde = Date.now() - dias * 24 * 60 * 60 * 1000;
        return this.getSesiones().filter(s => {
            const t = s.timestamp ? new Date(s.timestamp).getTime() : new Date(s.fecha).getTime();
            return !isNaN(t) && t >= desde;
        });
    }

    /** Filtra por tipo (whitelist) sin mutar la colección. */
    getPorTipo(tipo) {
        if (!TIPOS_CARDIO.includes(tipo)) return [];
        return this.getSesiones().filter(s => s.tipo === tipo);
    }

    /**
     * Resumen para cards: totales de la ventana en minutos, distancia (km),
     * cantidad de sesiones y FC/RPE promedio de los registros que los tengan.
     */
    getResumen(dias = 7) {
        const recientes = this.getRecientes(dias);
        const minutos = recientes.reduce((acc, s) => acc + (Number(s.duracion) || 0), 0);
        const distancia = recientes.reduce((acc, s) => acc + (Number(s.distancia) || 0), 0);
        const conFc = recientes.filter(s => s.fc !== null && s.fc > 0);
        const conRpe = recientes.filter(s => s.rpe !== null && s.rpe > 0);

        return {
            dias,
            sesiones: recientes.length,
            minutos: Math.round(minutos * 10) / 10,
            distancia: Math.round(distancia * 100) / 100,
            fcPromedio: conFc.length ? Math.round(conFc.reduce((a, s) => a + s.fc, 0) / conFc.length) : null,
            rpePromedio: conRpe.length ? Math.round((conRpe.reduce((a, s) => a + s.rpe, 0) / conRpe.length) * 10) / 10 : null,
        };
    }
}