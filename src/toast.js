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
};
