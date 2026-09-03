/**
 * src/main.js
 * Punto de entrada. Ensambla las vistas modulares (src/views/*) en #app de
 * forma SÍNCRONA y después arranca la app. El binding centralizado por ID de
 * AppGymPro (this.el) requiere que el DOM exista antes de instanciar.
 */

import { ErrorHandler } from './error-handler.js';
import { Toast } from './toast.js';
import { AppGymPro } from './app.js';
import appLayout from './views/index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0) Registrar la captura global de errores lo antes posible: antes de
    //    montar vistas, para que cualquier fallo de arranque también se loguee
    //    (console.error) y se notifique al usuario con un Toast de error.
    ErrorHandler.init();

    // 1) Montar el shell de vistas dentro del contenedor raíz #app.
    //    Debe ser síncrono y previo al constructor para que _bindDOM()
    //    resuelva todos los IDs sin nulls.
    const root = document.getElementById('app');
    if (root) {
        root.innerHTML = appLayout.join('\n');
    } else {
        console.warn('[main] No se encontró <div class="app" id="app">; las vistas no se montaron.');
    }

    // 2) Arrancar la app (Toast.init es idempotente; se mantiene por compat).
    Toast.init();
    window.app = new AppGymPro();
    console.log('GYM PRO v5 iniciado (modular)');
});
