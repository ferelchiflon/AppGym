/**
 * src/export/pdf.js
 * Exportación del historial de series a PDF usando la vía NATIVA del navegador:
 * se genera un documento HTML imprimible y se abre window.print() (el usuario
 * elige "Guardar como PDF"). Cero dependencias externas.
 *
 * Las funciones `seriesATablaHTML` y `crearHTMLImprimible` son puras y se
 * testean en tests/exportCsv.test.js. `imprimirHistorial` se usa solo en el
 * navegador.
 */

import { formatoRpeRir } from './csv.js';

/** Escapa texto para HTML (evita romper el documento / inyección). */
function esc(valor) {
  return String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Devuelve las filas `<tr>` de la tabla con una fila por serie.
 * @param {Array} historial
 * @returns {string}
 */
export function seriesATablaHTML(historial = []) {
  const sesiones = Array.isArray(historial) ? historial : [];
  let filas = '';

  sesiones.forEach((sesion) => {
    if (!sesion || !Array.isArray(sesion.ejercicios)) return;
    const fecha = sesion.fecha || sesion.fechaISO || '';

    sesion.ejercicios.forEach((ejercicio) => {
      if (!ejercicio || !Array.isArray(ejercicio.series)) return;
      ejercicio.series.forEach((serie) => {
        if (!serie) return;
        filas +=
          '<tr>' +
          '<td>' + esc(fecha) + '</td>' +
          '<td>' + esc(ejercicio.nombre || '') + '</td>' +
          '<td>' + esc(serie.peso) + '</td>' +
          '<td>' + esc(serie.reps) + '</td>' +
          '<td>' + esc(formatoRpeRir(serie)) + '</td>' +
          '<td>' + (serie.esPR ? 'SI' : 'NO') + '</td>' +
          '</tr>';
      });
    });
  });

  return filas;
}

/**
 * Devuelve el documento HTML imprimible completo (con auto print al cargar).
 * @param {Array} historial
 * @param {string} titulo
 * @returns {string}
 */
export function crearHTMLImprimible(historial = [], titulo = 'Historial de series') {
  const tituloSeguro = esc(titulo);
  const filas = seriesATablaHTML(historial) || '';

  return [
    '<!doctype html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + tituloSeguro + '</title>',
    '<style>',
    'body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#1a1a1a}',
    'h1{font-size:20px;margin:0 0 4px}',
    '.meta{color:#666;font-size:12px;margin:0 0 16px}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}',
    'th{background:#f2f2f2}',
    'tr:nth-child(even) td{background:#fafafa}',
    '@media print{.no-print{display:none}}',
    '</style>',
    '</head>',
    '<body>',
    '<h1>' + tituloSeguro + '</h1>',
    '<p class="meta">Generado por GYM PRO el ' + esc(new Date().toLocaleString('es-ES')) + '</p>',
    '<table>',
    '<thead><tr><th>Fecha</th><th>Ejercicio</th><th>Peso (kg)</th><th>Reps</th><th>RPE/RIR</th><th>esPR</th></tr></thead>',
    '<tbody>' + filas + '</tbody>',
    '</table>',
    '<div class="no-print"><p style="margin-top:16px;color:#666;font-size:12px">En el diálogo de impresión elegí "Guardar como PDF" como destino.</p></div>',
    '<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>',
    '</body>',
    '</html>',
  ].join('\n');
}

/**
 * Abre una ventana imprimible con el historial y dispara window.print().
 * Devuelve true si la ventana se pudo abrir.
 * @param {Array} historial
 * @param {string} titulo
 * @returns {boolean}
 */
export function imprimirHistorial(historial = [], titulo = 'Historial de series') {
  if (typeof window === 'undefined' || typeof window.open !== 'function') return false;

  const win = window.open('', '_blank', 'width=820,height=620');
  if (!win) return false;

  win.document.open();
  win.document.write(crearHTMLImprimible(historial, titulo));
  win.document.close();
  win.focus();
  return true;
}