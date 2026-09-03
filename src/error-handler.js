/**
 * src/error-handler.js
 * Captura global de errores no controlados (runtime + promesas rechazadas) para
 * que la app nunca falle en silencio:
 *   - Registra el detalle en consola (mensaje, stack, ubicación / razón de
 *     rechazo) para facilitar la depuración en producción.
 *   - Avisa al usuario con un Toast de error amigable.
 * Idempotente (init() no duplica listeners) y a prueba de fallos (un error en
 * la notificación no provoca recursión).
 *
 * Requiere que #toastContainer exista y que Toast.init() ya se haya llamado;
 * si el contenedor no existe, Toast.mostrar() descarta silenciosamente (guarda
 * propia de Toast).
 */

import { Toast } from './toast.js';

const MENSAJE_ERROR = 'Ocurrió un error inesperado. Por favor, reintenta.';

/** Muestra el Toast sin permitir que un fallo aquí rompa el flujo ni recuse. */
function notificar() {
    try {
        Toast.mostrar(MENSAJE_ERROR, 'error', 4200);
    } catch (e) {
        console.error('[error-handler] No se pudo notificar el error al usuario:', e);
    }
}

export const ErrorHandler = {
    _instanciado: false,

    /** Registra los listeners globales. Llamar varias veces no los duplica. */
    init() {
        if (ErrorHandler._instanciado) return;
        ErrorHandler._instanciado = true;

        // Errores de runtime no capturados (throw dentro de callbacks/manejadores).
        window.addEventListener('error', (event) => {
            const lado = event.message || 'Error de runtime desconocido';
            const errorTexto = (event.error && event.error.stack) || event.stack;
            const ubicacion = event.filename
                ? `${event.filename}:${event.lineno}:${event.colno}`
                : undefined;
            console.error(
                '[error-handler] Error de runtime no capturado:',
                lado,
                { stack: errorTexto, location: ubicacion }
            );
            notificar();
        });

        // Promesas rechazadas sin catch.
        window.addEventListener('unhandledrejection', (event) => {
            const razon = event.reason;
            const detalle =
                razon instanceof Error ? (razon.stack || razon.message) : razon;
            console.error('[error-handler] Promesa rechazada no manejada:', detalle);
            // Marcar como manejado evita el warning extra de "Unhandled Promise".
            event.preventDefault();
            notificar();
        });
    },
};