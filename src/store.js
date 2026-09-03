/**
 * src/store.js
 * Persistencia unificada con versionado y migración desde v4.
 * Depende de: ./config.js (CONFIG), ./utils.js (Utils), ./toast.js (Toast)
 *
 * Estrategia de almacenamiento:
 *  - Por defecto usa localStorage (sincrono, simple, <5MB).
 *  - Cuando el JSON serializado supera UMBRAL_MIGRACION_IDB (5MB), se migra
 *    automáticamente a IndexedDB para no romper con QuotaExceededError.
 *  - Store.guardar() está envuelto en debounce (250ms) y la serialización
 *    se difiere con requestIdleCallback para no bloquear el hilo principal.
 *
 * Toast.init() debe ejecutarse antes de que Store.guardar() pueda fallar;
 * es seguro porque Toast.init() es idempotente y Toast.mostrar es no-op
 * si el contenedor no existe.
 */

import { CONFIG, EJERCICIOS_DISPONIBLES } from './config.js';
import { Utils } from './utils.js';
import { Toast } from './toast.js';

// Umbral: si el JSON serializado pasa este tamaño, migramos a IndexedDB.
// localStorage típico tiene 5MB; dejamos 4MB de margen para evitar QuotaExceeded.
const UMBRAL_MIGRACION_IDB = 4 * 1024 * 1024; // 4MB
const IDB_NAME = 'gympro';
const IDB_STORE = 'kv';
const IDB_KEY = 'gympro_data';

/**
 * Acceso seguro a localStorage. En entornos sin storage (p. ej. Node >20
 * sin --localstorage-file, o tests sin polyfill), devuelve null en lugar de
 * lanzar ReferenceError. Así Store sigue funcionando en memoria.
 */
function _ls() {
    return typeof globalThis !== 'undefined' && globalThis.localStorage ? globalThis.localStorage : null;
}

export const Store = {
    _cache: null,
    _modoIDB: false, // se activa cuando los datos pasan el umbral
    _idb: null,
    _listeners: {}, // event bus reactivo

    // Sistema de eventos reactivo
    on(event, callback) {
        if (!Store._listeners[event]) Store._listeners[event] = [];
        Store._listeners[event].push(callback);
        return () => Store.off(event, callback);
    },

    off(event, callback) {
        if (!Store._listeners[event]) return;
        Store._listeners[event] = Store._listeners[event].filter(cb => cb !== callback);
    },

    emit(event, payload) {
        if (!Store._listeners[event]) return;
        Store._listeners[event].forEach(cb => {
            try { cb(payload); } catch (err) { console.error('Error en listener reactivo:', err); }
        });
    },

    _estructuraVacia() {
        return {
            version: CONFIG.VERSION,
            activeProfileId: 'default',
            profiles: {
                default: Store._perfilVacio('Atleta principal', 'default'),
            },
        };
    },

    _perfilVacio(nombre, id = null) {
        return {
            id: id || Utils.generarId(),
            nombre,
            perfil: {
                edad: 25,
                altura: CONFIG.DEFAULT_ALTURA,
                peso: CONFIG.DEFAULT_PESO,
                grasa: null,
                objetivo: 'hipertrofia',
                nivel: 'intermedio',
                genero: 'masculino',
            },
            wellness: [],
            saltos: [],
            sesionesCardio: [],
            rutina: [],
            seriesPorEjercicio: {},
            superseries: {},
            historial: [],
            bloques: [],
            plantillas: [],
            records: {},
            acumulados: { fuerza: 0, kcal: 0, volumen: 0 },
            medidas: {
                pecho: 0, cintura: 0, cadera: 0, pesoCorporal: 0, altura: CONFIG.DEFAULT_ALTURA,
                historial: [],
            },
            ejerciciosPersonalizados: [],
        };
    },

    // Obtener catálogo unificado (ejercicios por defecto + personalizados del perfil activo)
    getEjerciciosDisponibles() {
        const perfil = Store.getPerfilActivo();
        const customs = (perfil && Array.isArray(perfil.ejerciciosPersonalizados)) ? perfil.ejerciciosPersonalizados : [];
        return [...EJERCICIOS_DISPONIBLES, ...customs];
    },

    agregarEjercicioPersonalizado(ejercicio) {
        const perfil = Store.getPerfilActivo();
        if (!perfil.ejerciciosPersonalizados) perfil.ejerciciosPersonalizados = [];
        
        const nuevo = {
            ...ejercicio,
            id: ejercicio.id || `custom_${Utils.generarId()}`,
            personalizado: true,
        };

        perfil.ejerciciosPersonalizados.push(nuevo);
        Store.guardarInmediato();
        Store.emit('exercises:updated', Store.getEjerciciosDisponibles());
        return nuevo;
    },

    cargar() {
        if (Store._cache) return Store._cache;

        // Primero intentamos desde localStorage (caso habitual).
        const ls = _ls();
        const raw = ls ? ls.getItem(CONFIG.STORAGE_KEY) : null;
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data && data.profiles) {
                    if (!data.version) data.version = CONFIG.VERSION;
                    if (!data.activeProfileId || !data.profiles[data.activeProfileId]) {
                        data.activeProfileId = Object.keys(data.profiles)[0];
                    }
                    Store._asegurarColeccionesNuevas(data);
                    Store._cache = data;
                    // Si ya pasa el umbral, marcamos modo IDB para futuras escrituras.
                    if (raw.length >= UMBRAL_MIGRACION_IDB) {
                        Store._modoIDB = true;
                    }
                    return data;
                }
            } catch (e) {
                console.warn('Error leyendo storage, se migra a estructura nueva', e);
            }
        }

        // Si no hay nada en localStorage, podría estar en IDB (migración previa).
        // Hacemos una carga síncrona inicial con cache vacía y disparamos IDB async.
        const migrado = Store._migrarDesdeV4();
        Store._asegurarColeccionesNuevas(migrado);
        Store._cache = migrado;
        Store.guardar();
        return migrado;
    },

    /**
     * Apertura lazy de IndexedDB. Devuelve Promise<IDBDatabase>.
     * Si el navegador no soporta IDB, devuelve null y Store sigue en localStorage.
     */
    _abrirIDB() {
        if (Store._idb) return Promise.resolve(Store._idb);
        if (typeof indexedDB === 'undefined') return Promise.resolve(null);
        return new Promise((resolve) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE);
                }
            };
            req.onsuccess = () => {
                Store._idb = req.result;
                resolve(req.result);
            };
            req.onerror = () => {
                console.warn('IndexedDB no disponible, seguimos en localStorage');
                resolve(null);
            };
        });
    },

    async _cargarDesdeIDB() {
        const db = await Store._abrirIDB();
        if (!db) return null;
        return new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    },

    async _guardarEnIDB(json) {
        const db = await Store._abrirIDB();
        if (!db) return false;
        return new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(json, IDB_KEY);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    },

    _migrarDesdeV4() {
        const base = Store._estructuraVacia();
        const ls = _ls();
        if (!ls) return base;
        try {
            const perfilRaw = ls.getItem('gympro_perfil');
            const rutinaRaw = ls.getItem('gympro_rutina');
            const bloquesRaw = ls.getItem('gympro_bloques');
            const p = base.profiles.default;
            if (perfilRaw) {
                const d = JSON.parse(perfilRaw);
                if (d.perfil) p.perfil = { ...p.perfil, ...d.perfil };
                if (d.wellness) p.wellness = d.wellness;
                if (d.saltos) p.saltos = d.saltos;
            }
            if (rutinaRaw) {
                const d = JSON.parse(rutinaRaw);
                if (d.rutina) p.rutina = d.rutina;
                if (d.series) p.seriesPorEjercicio = d.series;
                if (d.historial) p.historial = d.historial;
            }
            if (bloquesRaw) {
                const d = JSON.parse(bloquesRaw);
                if (Array.isArray(d)) p.bloques = d;
            }
        } catch (e) {
            console.warn('No se pudo migrar datos v4', e);
        }
        return base;
    },

    /**
     * Backfill de colecciones añadidas en versiones posteriores (p. ej.
     * `sesionesCardio` en Fase 2). Se ejecuta al cargar cualquier perfil para
     * que los datos legacy convivan con las colecciones nuevas sin migrar bytes.
     */
    _asegurarColeccionesNuevas(data) {
        if (!data || !data.profiles || typeof data.profiles !== 'object') return;
        Object.values(data.profiles).forEach(perfil => {
            if (perfil && !Array.isArray(perfil.sesionesCardio)) {
                perfil.sesionesCardio = [];
            }
        });
    },

    /**
     * Persistencia diferida. Debounce 250ms + requestIdleCallback para que
     * la serialización (JSON.stringify puede ser cara con historiales grandes)
     * no bloquee el hilo principal tras un click.
     */
    guardar: Utils.debounce(function () {
        if (!Store._cache) return;
        Utils.whenIdle(() => {
            Store._serializarYGuardar();
            Store.emit('state:saved', Store._cache);
        });
    }, 250),

    guardarInmediato() {
        if (!Store._cache) return;
        Store._serializarYGuardar();
        Store.emit('state:saved', Store._cache);
    },

    _serializarYGuardar() {
        if (!Store._cache) return;
        let json;
        try {
            json = JSON.stringify(Store._cache);
        } catch (e) {
            console.error('No se pudo serializar el estado', e);
            return;
        }

        // Si ya estamos en modo IDB, vamos directo a IDB.
        if (Store._modoIDB) {
            Store._guardarEnIDB(json).then((ok) => {
                if (!ok) Store._escribirLocalStorage(json, true);
            });
            return;
        }

        // Si el JSON pasa el umbral, migramos: primero guardamos en IDB y
        // borramos localStorage para liberar espacio.
        if (json.length >= UMBRAL_MIGRACION_IDB) {
            Store._modoIDB = true;
            Store._guardarEnIDB(json).then((ok) => {
                if (ok) {
                    try { const ls = _ls(); if (ls) ls.removeItem(CONFIG.STORAGE_KEY); } catch { /* noop */ }
                } else {
                    Store._escribirLocalStorage(json);
                }
            });
            return;
        }

        Store._escribirLocalStorage(json);
    },

    _escribirLocalStorage(json) {
        const ls = _ls();
        if (!ls) return;
        try {
            ls.setItem(CONFIG.STORAGE_KEY, json);
        } catch (e) {
            console.error('No se pudo guardar en localStorage', e);
            if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
                Store._modoIDB = true;
                Store._guardarEnIDB(json);
                Toast.mostrar('Datos migrados a IndexedDB (localStorage lleno).', 'info');
            } else {
                Toast.mostrar('No se pudo guardar (error de almacenamiento).', 'error');
            }
        }
    },

    /**
     * Bootstrap async: si localStorage está vacío pero existe copia en IDB,
     * la hidrata en cache. Llamar una sola vez al arrancar la app.
     */
    async hidratarDesdeIDB() {
        if (Store._cache) return Store._cache;
        const ls = _ls();
        const raw = ls ? ls.getItem(CONFIG.STORAGE_KEY) : null;
        if (raw) return Store._cache; // ya hay datos en localStorage, nada que hacer
        const data = await Store._cargarDesdeIDB();
        if (data && data.profiles) {
            Store._cache = data;
            Store._modoIDB = true;
            return data;
        }
        return null;
    },

    getPerfilActivo() {
        const data = Store.cargar();
        return data.profiles[data.activeProfileId];
    },

    getData() {
        return Store.cargar();
    },

    crearPerfil(nombre) {
        const data = Store.cargar();
        const nuevo = Store._perfilVacio(nombre || `Atleta ${Object.keys(data.profiles).length + 1}`);
        data.profiles[nuevo.id] = nuevo;
        data.activeProfileId = nuevo.id;
        Store.guardarInmediato();
        return nuevo;
    },

    cambiarPerfil(id) {
        const data = Store.cargar();
        if (data.profiles[id]) {
            data.activeProfileId = id;
            Store.guardarInmediato();
            return true;
        }
        const key = Object.keys(data.profiles).find(k => data.profiles[k].id === id);
        if (key) {
            data.activeProfileId = key;
            Store.guardarInmediato();
            return true;
        }
        return false;
    },

    eliminarPerfil(id) {
        const data = Store.cargar();
        const targetKey = data.profiles[id] ? id : Object.keys(data.profiles).find(k => data.profiles[k].id === id);
        if (!targetKey) return false;

        const keys = Object.keys(data.profiles);
        if (keys.length <= 1) {
            Toast.mostrar('Tiene que quedar al menos un perfil', 'warning');
            return false;
        }
        delete data.profiles[targetKey];
        if (data.activeProfileId === targetKey) {
            data.activeProfileId = Object.keys(data.profiles)[0];
        }
        Store.guardarInmediato();
        return true;
    },

    // ===== Plantillas de rutina =====
    // Viven dentro del perfil activo como `planillas: []`. Cada plantilla es
    // { id, nombre, ejercicios: [idEjercicio, ...], creadaEn: fechaISO }.

    crearPlantilla(nombre, ejercicios) {
        const perfil = Store.getPerfilActivo();
        if (!perfil) return null;
        if (!Array.isArray(perfil.plantillas)) perfil.plantillas = [];

        const nueva = {
            id: Utils.generarId(),
            nombre: nombre || 'Plantilla sin nombre',
            ejercicios: Array.isArray(ejercicios) ? [...ejercicios] : [],
            creadaEn: new Date().toISOString(),
        };
        perfil.plantillas.push(nueva);
        Store.guardarInmediato();
        Store.emit('plantillas:updated', perfil.plantillas);
        return nueva;
    },

    listarPlantillas() {
        const perfil = Store.getPerfilActivo();
        if (!perfil) return [];
        return Array.isArray(perfil.plantillas) ? perfil.plantillas : [];
    },

    eliminarPlantilla(id) {
        const perfil = Store.getPerfilActivo();
        if (!perfil) return false;
        if (!Array.isArray(perfil.plantillas)) return false;

        const idx = perfil.plantillas.findIndex(p => p.id === id);
        if (idx === -1) return false;

        perfil.plantillas.splice(idx, 1);
        Store.guardarInmediato();
        Store.emit('plantillas:updated', perfil.plantillas);
        return true;
    },

    actualizarPlantilla(id, cambios) {
        const perfil = Store.getPerfilActivo();
        if (!perfil) return null;
        if (!Array.isArray(perfil.plantillas)) return null;

        const plantilla = perfil.plantillas.find(p => p.id === id);
        if (!plantilla) return null;

        if (cambios && typeof cambios === 'object') {
            if (cambios.nombre !== undefined) plantilla.nombre = cambios.nombre;
            if (Array.isArray(cambios.ejercicios)) plantilla.ejercicios = [...cambios.ejercicios];
            if (cambios.creadaEn !== undefined) plantilla.creadaEn = cambios.creadaEn;
        }
        Store.guardarInmediato();
        Store.emit('plantillas:updated', perfil.plantillas);
        return plantilla;
    },

    exportarTodo() {
        return JSON.stringify(Store.cargar(), null, 2);
    },

    importarTodo(jsonStr) {
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch {
            throw new Error('El archivo no es un JSON válido');
        }
        if (!data || typeof data !== 'object' || !data.profiles || typeof data.profiles !== 'object') {
            throw new Error('Formato de backup inválido: falta la sección "profiles"');
        }
        if (Object.keys(data.profiles).length === 0) {
            throw new Error('El backup no contiene ningún perfil');
        }
        if (!data.profiles[data.activeProfileId]) {
            data.activeProfileId = Object.keys(data.profiles)[0];
        }
        if (!data.version) data.version = CONFIG.VERSION;
        Store._cache = data;
        Store.guardarInmediato();
        return data;
    },
};
