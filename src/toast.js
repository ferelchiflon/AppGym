/**
 * src/toast.js
 * Notificaciones tipo toast (no bloqueantes).
 * Sin dependencias. Requiere #toastContainer en el DOM al llamar init().
 */

export const Toast = {
    _contenedor: null,

    init() {
        Toast._contenedor = document.getElementById('toastContainer');
    },

    mostrar(mensaje, tipo = 'info', duracionMs = 3200) {
        if (!Toast._contenedor) return;
        const el = document.createElement('div');
        el.className = `toast toast-${tipo}`;
        el.textContent = mensaje;
        Toast._contenedor.appendChild(el);
        requestAnimationFrame(() => el.classList.add('toast-visible'));
        setTimeout(() => {
            el.classList.remove('toast-visible');
            setTimeout(() => el.remove(), 250);
        }, duracionMs);
    },

    /**
     * Toast accionable que persiste hasta que el usuario elige una acción
     * (o se agota un timeout largo). Usado para avisar de una versión nueva
     * de la app (Service Worker) sin interrumpir un entrenamiento en curso.
     *
     * @param {object} opciones
     * @param {string} opciones.mensaje Texto principal del aviso.
     * @param {string} opciones.accionLabel Etiqueta del botón de acción.
     * @param {function} opciones.onAccion Callback que se ejecuta al pulsar la acción (o al agotarse el timeout).
     * @param {string} [opciones.tipo='info'] Variante visual del toast.
     * @param {number} [opciones.duracionMs=0] 0 = persiste hasta interacción; >0 fuerza auto-acción al agotarse.
     */
    mostrarAccion({ mensaje, accionLabel, onAccion, tipo = 'info', duracionMs = 0 }) {
        if (!Toast._contenedor) return;
        if (typeof onAccion !== 'function') return;

        const el = document.createElement('div');
        el.className = `toast toast-${tipo} toast-accion`;
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
            el.classList.remove('toast-visible');
            setTimeout(() => el.remove(), 250);
            onAccion();
        };

        btn.addEventListener('click', ejecutar);
        // Se permite que el propio toast sea tocable (apertura focal en móvil).
        el.addEventListener('click', ejecutar);

        el.append(texto, btn);
        Toast._contenedor.appendChild(el);
        requestAnimationFrame(() => el.classList.add('toast-visible'));

        if (duracionMs > 0) {
            setTimeout(ejecutar, duracionMs);
        }
    },
};
