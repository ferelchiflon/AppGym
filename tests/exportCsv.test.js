import { describe, it, expect } from 'vitest';
import { seriesHistorialACSV, formatoRpeRir, escaparCSV } from '../src/export/csv.js';
import { seriesATablaHTML, crearHTMLImprimible } from '../src/export/pdf.js';

describe('escaparCSV', () => {
  it('deja sin comillas los valores simples', () => {
    expect(escaparCSV('abc')).toBe('abc');
    expect(escaparCSV(100)).toBe('100');
    expect(escaparCSV(null)).toBe('');
  });

  it('entrecomilla y duplica comillas en valores con coma, comilla o salto de línea', () => {
    expect(escaparCSV('a,b')).toBe('"a,b"');
    expect(escaparCSV('Peso "molón"')).toBe('"Peso ""molón"""');
    expect(escaparCSV('x\ny')).toBe('"x\ny"');
  });
});

describe('formatoRpeRir', () => {
  it('combina RPE/RIR según estén presentes', () => {
    expect(formatoRpeRir({ rpe: 8, rir: 2 })).toBe('8 RIR 2');
    expect(formatoRpeRir({ rpe: 8, rir: null })).toBe('8');
    expect(formatoRpeRir({ rpe: null, rir: 2 })).toBe('RIR 2');
    expect(formatoRpeRir({})).toBe('');
  });
});

describe('seriesHistorialACSV', () => {
  it('genera la cabecera y la fila correctas (fecha, ejercicio, peso, reps, rpe/rir, esPR)', () => {
    const historial = [
      {
        fecha: '18/08/2026, 10:30',
        ejercicios: [
          { nombre: 'Press banca', series: [{ peso: 100, reps: 5, rpe: 8, rir: 2, esPR: true }] },
        ],
      },
    ];
    const csv = seriesHistorialACSV(historial);
    const lineas = csv.split('\n');
    expect(lineas[0]).toBe('fecha,ejercicio,peso,reps,rpe/rir,esPR');
    // El ejercicio no lleva delimitador/comilla/salto → no se entrecomilla (RFC 4180)
    expect(lineas[1]).toBe('"18/08/2026, 10:30",Press banca,100,5,8 RIR 2,SI');
  });

  it('escapa comas y comillas, y conserva un campo multi-línea entrecomillado', () => {
    const historial = [
      {
        fecha: 'a,b',
        ejercicios: [
          { nombre: 'Peso "molón"\npesado', series: [{ peso: 50, reps: 10, rpe: null, rir: null, esPR: false }] },
        ],
      },
    ];
    const csv = seriesHistorialACSV(historial);
    // El campo "ejercicio" contiene comillas y un salto de línea real: se
    // entrecomilla y las comillas se duplican. El split por '\n' es ambiguo en
    // un campo multi-línea válido, por eso comparamos la cadena completa.
    expect(csv).toBe(
      'fecha,ejercicio,peso,reps,rpe/rir,esPR\n"a,b","Peso ""molón""\npesado",50,10,,NO'
    );
  });

  it('marca esPR como SI/NO', () => {
    const historial = [
      {
        fecha: '01/09/2026',
        ejercicios: [
          {
            nombre: 'Sentadilla',
            series: [
              { peso: 120, reps: 3, esPR: true },
              { peso: 100, reps: 5, esPR: false },
            ],
          },
        ],
      },
    ];
    const lineas = seriesHistorialACSV(historial).split('\n');
    expect(lineas).toEqual(['fecha,ejercicio,peso,reps,rpe/rir,esPR', '01/09/2026,Sentadilla,120,3,,SI', '01/09/2026,Sentadilla,100,5,,NO']);
  });

  it('genera solo la cabecera si no hay historial o es null', () => {
    expect(seriesHistorialACSV([])).toBe('fecha,ejercicio,peso,reps,rpe/rir,esPR');
    expect(seriesHistorialACSV(null)).toBe('fecha,ejercicio,peso,reps,rpe/rir,esPR');
  });

  it('ignora sesiones o ejercicios sin series', () => {
    const historial = [
      { fecha: 'sin ejercicios', ejercicios: [] },
      { fecha: 'ej sin series', ejercicios: [{ nombre: 'Nada', series: [] }] },
      { fecha: 'con una', ejercicios: [{ nombre: 'Uno', series: [{ peso: 10, reps: 5 }] }] },
    ];
    const lineas = seriesHistorialACSV(historial).split('\n');
    expect(lineas).toEqual(['fecha,ejercicio,peso,reps,rpe/rir,esPR', 'con una,Uno,10,5,,NO']);
  });
});

describe('crearHTMLImprimible / seriesATablaHTML (PDF nativo)', () => {
  it('genera una fila de tabla por serie con datos escapados', () => {
    const historial = [
      {
        fecha: '01/09/2026',
        ejercicios: [
          { nombre: 'Sentadilla', series: [{ peso: 120, reps: 3, rpe: 9, rir: 1, esPR: true }] },
        ],
      },
    ];
    const html = crearHTMLImprimible(historial, 'Mi historial');
    expect(html).toContain('<title>Mi historial</title>');
    expect(html).toContain('<th>Fecha</th>');
    expect(html).toContain('<th>esPR</th>');
    expect(html).toContain('<td>01/09/2026</td>');
    expect(html).toContain('<td>Sentadilla</td>');
    expect(html).toContain('<td>9 RIR 1</td>');
    expect(html).toContain('<td>SI</td>');
    expect(html).toContain('window.print()');
  });

  it('escapa caracteres peligrosos y evita ruptura del HTML', () => {
    const historial = [
      {
        fecha: 'x',
        ejercicios: [{ nombre: '<b>&"', series: [{ peso: 1, reps: 1 }] }],
      },
    ];
    const filas = seriesATablaHTML(historial);
    expect(filas).toContain('&lt;b&gt;&amp;&quot;');
    expect(filas).not.toContain('<b>');
  });
});