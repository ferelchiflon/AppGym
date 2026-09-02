/**
 * src/dialog.js
 * Diálogos modales (reemplazan confirm()/prompt() nativos).
 * Devuelve Promises. Sin dependencias.
 */

export const Dialog = {
    _resolver: null,

    _crearDOM() {
        if (document.getElementById('dialogOverlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'dialogOverlay';
        overlay.className = 'dialog-overlay hidden';

        // Construcción nativa del DOM (sin innerHTML). HTML estático, sin
        // interpolación de variables → sin riesgo de XSS, pero más rápido
        // y consistente con el resto del proyecto.
        const box = document.createElement('div');
        box.className = 'dialog-box';
        box.setAttribute('role', 'alertdialog');
        box.setAttribute('aria-modal', 'true');

        const mensaje = document.createElement('p');
        mensaje.className = 'dialog-mensaje';
        mensaje.id = 'dialogMensaje';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'dialogInput';
        input.className = 'dialog-input hidden';

        const acciones = document.createElement('div');
        acciones.className = 'dialog-acciones';

        const btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.id = 'dialogCancelar';
        btnCancelar.className = 'secondary';
        btnCancelar.textContent = 'Cancelar';

        const btnConfirmar = document.createElement('button');
        btnConfirmar.type = 'button';
        btnConfirmar.id = 'dialogConfirmar';
        btnConfirmar.textContent = 'Confirmar';

        acciones.append(btnCancelar, btnConfirmar);
        box.append(mensaje, input, acciones);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        btnCancelar.addEventListener('click', () => Dialog._cerrar(null));
        btnConfirmar.addEventListener('click', () => {
            const esPrompt = !input.classList.contains('hidden');
            Dialog._cerrar(esPrompt ? input.value.trim() : true);
        });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) Dialog._cerrar(null); });
        document.addEventListener('keydown', (e) => {
            if (overlay.classList.contains('hidden')) return;
            if (e.key === 'Escape') Dialog._cerrar(null);
            if (e.key === 'Enter' && !input.classList.contains('hidden')) {
                btnConfirmar.click();
            }
        });
    },

    _cerrar(valor) {
        document.getElementById('dialogOverlay').classList.add('hidden');
        if (Dialog._resolver) { Dialog._resolver(valor); Dialog._resolver = null; }
    },

    _abrir({ mensaje, tipo, valorDefault, textoConfirmar, peligroso }) {
        Dialog._crearDOM();
        const overlay = document.getElementById('dialogOverlay');
        const input = overlay.querySelector('#dialogInput');
        const btnConfirmar = overlay.querySelector('#dialogConfirmar');

        overlay.querySelector('#dialogMensaje').textContent = mensaje;
        btnConfirmar.textContent = textoConfirmar || 'Confirmar';
        btnConfirmar.className = peligroso ? 'danger' : '';
        input.classList.toggle('hidden', tipo !== 'prompt');
        if (tipo === 'prompt') input.value = valorDefault || '';

        overlay.classList.remove('hidden');
        requestAnimationFrame(() => (tipo === 'prompt' ? input : btnConfirmar).focus());
        return new Promise((resolve) => { Dialog._resolver = resolve; });
    },

    // Devuelve Promise<boolean>
    confirm(mensaje, { textoConfirmar, peligroso } = {}) {
        return Dialog._abrir({ mensaje, tipo: 'confirm', textoConfirmar, peligroso }).then(v => v === true);
    },

    // Alias para mantener paridad de nombres en inglés (confirm/confirmar).
    confirmar(mensaje, opts = {}) {
        return Dialog.confirm(mensaje, opts);
    },

    // Devuelve Promise<string|null>
    pedirTexto(mensaje, valorDefault = '') {
        return Dialog._abrir({ mensaje, tipo: 'prompt', valorDefault, textoConfirmar: 'Guardar' })
            .then(v => (v === null || v === '') ? null : v);
    },
};
