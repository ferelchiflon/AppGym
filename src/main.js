/**
 * src/main.js
 * Punto de entrada. Ensambla las vistas modulares (src/views/*) en #app de
 * forma SÍNCRONA y después arranca la app. El binding centralizado por ID de
 * AppGymPro (this.el) requiere que el DOM exista antes de instanciar.
 */

import { Toast } from './toast.js';
import { AppGymPro } from './app.js';
import appLayout from './views/index.js';

document.addEventListener('DOMContentLoaded', () => {
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
