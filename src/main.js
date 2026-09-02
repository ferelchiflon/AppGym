/**
 * src/main.js
 * Punto de entrada. Solo importa y arranca la app.
 * La lógica vive en /src/*.js
 */

import { Toast } from './toast.js';
import { AppGymPro } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    window.app = new AppGymPro();
    console.log('GYM PRO v5 iniciado (modular)');
});
