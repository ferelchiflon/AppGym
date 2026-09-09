/**
 * src/modules/ToastManager.js
 * Gestor de notificaciones flotantes (Toasts) no bloqueantes.
 *
 * Implementa una clase que encapsula la creación, animación de entrada/salida
 * y auto-eliminación de las notificaciones visuales. Soporta cuatro variantes
 * (`success`, `error`, `warning`, `info`) y un modo "accionable" que persiste
 * hasta que el usuario interactúa (o se agota un timeout opcional).
 *
 * Es compatible con el `Toast` histórico de `src/toast.js`: expone métodos
 * `mostrar` / `mostrarAccion` y espera el contenedor `#toastContainer` en el
 * DOM, pero además puede crear su propio contenedor si no existe.
 *
 * Sin dependencias. Requiere un entorno con `document`.
 */

/** Tipos de notificación soportados. */
const TIPOS_VALIDOS = ['success', 'error', 'warning', 'info'];

/** Duración por defecto en milisegundos para la auto-eliminación. */
const DURACION_POR_DEFECTO = 3200;

/** Duración (ms) de la transición de salida antes de remover el nodo del DOM. */
const TRANSICION_SALIDA_MS = 250;

/**
 * Genera el nombre de clase CSS para el toast según su variante.
 * @param {string} tipo Variante de la notificación.
 * @returns {string} Clase compuesta, p. ej. `toast toast-success`.
 */
function claseToast(tipo) {
    const seguro = TIPOS_VALIDOS.includes(tipo) ? tipo : 'info';
    return `toast toast-${seguro}`;
}

export class ToastManager {
    /**
     * @param {object} [opciones]
     * @param {HTMLElement|null} [opciones.contenedor=null] Contenedor donde
     *   se insertan los toasts. Si se omite, se busca `#toastContainer` y,
     *   si no existe, se crea uno automáticamente al llamar `init()`.
     * @param {number} [opciones.duracionMs=3200] Duración por defecto.
     */
    constructor({ contenedor = null, duracionMs = DURACION_POR_DEFECTO } = {}) {
        this._contenedor = contenedor;
        this._duracionMs = duracionMs;
        this._activos = new Set();
    }

    /**
     * Resuelve y prepara el contenedor de notificaciones.
     * Idempotente: llamar varias veces no duplica ni pierde estado.
     * @returns {HTMLElement|null}
     */
    init() {
        if (this._contenedor) return this._contenedor;
        if (typeof document === 'undefined') return null;

        let contenedor = document.getElementById('toastContainer');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'toastContainer';
            contenedor.setAttribute('role', 'region');
            contenedor.setAttribute('aria-live', 'polite');
            contenedor.setAttribute('aria-label', 'Notificaciones');
            document.body.appendChild(contenedor);
        }
        this._contenedor = contenedor;
        return contenedor;
    }

    /**
     * Muestra una notificación y la elimina automáticamente tras la duración.
     * @param {string} mensaje Texto a mostrar.
     * @param {'success'|'error'|'warning'|'info'} [tipo='info'] Variante visual.
     * @param {number} [duracionMs] Duración personalizada (por defecto la del gestor).
     * @returns {HTMLElement|null} El elemento creado, o null si no hay contenedor.
     */
    mostrar(mensaje, tipo = 'info', duracionMs) {
        const contenedor = this.init();
        if (!contenedor) return null;

        const el = document.createElement('div');
        el.className = claseToast(tipo);
        el.setAttribute('role', 'status');
        el.textContent = mensaje;

        contenedor.appendChild(el);
        // Forzar reflow para que la transición de entrada CSS parta del estado
        // inicial antes de añadir la clase "visible".
        void el.offsetHeight;
        el.classList.add('toast-visible');
        this._activos.add(el);

        const dMs = typeof duracionMs === 'number' ? duracionMs : this._duracionMs;
        this._programarEliminacion(el, dMs);

        return el;
    }

    /**
     * Toast accionable que persiste hasta la interacción del usuario
     * (o hasta agotarse un timeout si `duracionMs > 0`).
     * @param {object} opciones
     * @param {string} opciones.mensaje Texto principal del aviso.
     * @param {string} opciones.accionLabel Etiqueta del botón.
     * @param {function} opciones.onAccion Callback al ejecutar la acción.
     * @param {'success'|'error'|'warning'|'info'} [opciones.tipo='info'] Variante.
     * @param {number} [opciones.duracionMs=0] 0 = persiste hasta interacción.
     * @returns {HTMLElement|null}
     */
    mostrarAccion({ mensaje, accionLabel, onAccion, tipo = 'info', duracionMs = 0 }) {
        const contenedor = this.init();
        if (!contenedor) return null;
        if (typeof onAccion !== 'function') return null;

        const el = document.createElement('div');
        el.className = `${claseToast(tipo)} toast-accion`;
        el.setAttribute('role', 'alertdialog');

        const texto = document.createElement('span');
        texto.className = 'toast-texto';
        texto.textContent = mensaje;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toast-action-btn';
        btn.textContent = accionLabel;

        let ejecutado = false;
        const ejecutar = () => {
            if (ejecutado) return;
            ejecutado = true;
            this._eliminar(el);
            onAccion();
        };

        btn.addEventListener('click', ejecutar);
        el.addEventListener('click', ejecutar);

        el.append(texto, btn);
        contenedor.appendChild(el);
        // Forzar reflow para que la transición de entrada CSS parta del estado
        // inicial antes de añadir la clase "visible".
        void el.offsetHeight;
        el.classList.add('toast-visible');
        this._activos.add(el);

        if (duracionMs > 0) {
            this._programarEliminacion(el, duracionMs, ejecutar);
        }

        return el;
    }

    /** Elimina un toast con la transición de salida y luego lo remueve del DOM. */
    _eliminar(el) {
        if (!el || !this._activos.has(el)) return;
        this._activos.delete(el);
        el.classList.remove('toast-visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        // Fallback por si el navegador no emite `transitionend` (p. ej. en tests).
        setTimeout(() => el.remove(), TRANSICION_SALIDA_MS);
    }

    /** Programa la auto-eliminación tras `duracionMs`. */
    _programarEliminacion(el, duracionMs, onTiempoAgotado = null) {
        setTimeout(() => {
            if (typeof onTiempoAgotado === 'function') {
                // Para toasts accionables con timeout: ejecuta la acción y cierra.
                if (this._activos.has(el)) onTiempoAgotado();
            } else {
                this._eliminar(el);
            }
        }, duracionMs);
    }

    /** Elimina inmediatamente todos los toasts activos. */
    limpiarTodo() {
        [...this._activos].forEach((el) => this._eliminar(el));
    }
}

/** Instancia singleton compartida para reutilizar en toda la app. */
export const toastManager = new ToastManager();

export default ToastManager;