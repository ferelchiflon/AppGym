/**
 * src/export/csv.js
 * Generación de CSV desde el historial de series del Store.
 * Funciones puras, sin dependencias. Se testean en tests/exportCsv.test.js.
 */

/**
 * Escapa un valor para una celda/campo de CSV:
 *  - Si contiene coma, comilla o salto de línea → se envuelve entre comillas
 *    y las comillas internas se duplican (regla estándar RFC 4180).
 * @param {*} valor
 * @returns {string}
 */
export function escaparCSV(valor) {
  const s = String(valor ?? '');
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Columna combinada "RPE/RIR" con formato legible y determinista:
 *  - rpe + rir  → "8 RIR 2"
 *  - solo rpe   → "8"
 *  - solo rir   → "RIR 2"
 *  - ninguno    → ""
 * @param {{rpe?: number|null, rir?: number|null}} serie
 * @returns {string}
 */
export function formatoRpeRir(serie = {}) {
  const partes = [];
  if (serie.rpe !== null && serie.rpe !== undefined && serie.rpe !== '') partes.push(String(serie.rpe));
  if (serie.rir !== null && serie.rir !== undefined && serie.rir !== '') partes.push('RIR ' + String(serie.rir));
  return partes.join(' ');
}

/**
 * Convierte el historial de sesiones del Store en una cadena CSV.
 * Una fila por serie: fecha, ejercicio, peso, reps, RPE/RIR, esPR.
 *
 * @param {Array<{fecha?: string, fechaISO?: string, ejercicios?: Array<{nombre?: string, series?: Array}>}>} historial
 * @returns {string}
 */
export function seriesHistorialACSV(historial = []) {
  const sesiones = Array.isArray(historial) ? historial : [];

  const filas = [['fecha', 'ejercicio', 'peso', 'reps', 'rpe/rir', 'esPR']];

  sesiones.forEach((sesion) => {
    if (!sesion || !Array.isArray(sesion.ejercicios)) return;
    const fecha = sesion.fecha || sesion.fechaISO || '';

    sesion.ejercicios.forEach((ejercicio) => {
      if (!ejercicio || !Array.isArray(ejercicio.series)) return;
      ejercicio.series.forEach((serie) => {
        if (!serie) return;
        filas.push([
          fecha,
          ejercicio.nombre || '',
          serie.peso,
          serie.reps,
          formatoRpeRir(serie),
          serie.esPR ? 'SI' : 'NO',
        ]);
      });
    });
  });

  return filas.map((fila) => fila.map(escaparCSV).join(',')).join('\n');
}