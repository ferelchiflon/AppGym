import { describe, it, expect } from 'vitest';
import { WellnessCorrelation } from '../src/wellness-correlation.js';

describe('WellnessCorrelation.analizar', () => {
  // 1. Sin cruces posibles
  it('should handle no matches between history and wellness safely', () => {
    const historial = [{ fechaISO: '2026-08-18', volumenTotal: 1000 }];
    const wellness = [{ fecha: '2026-08-19', sueno: 4, estres: 2, doms: 2, motivacion: 4 }];
    const result = WellnessCorrelation.analizar(historial, wellness);
    expect(result).toEqual({ suficienteDatos: false, cruces: 0 });
  });

  // 2. Menos de 2 cruces
  it('should return insufficient data with one overlapping date', () => {
    const historial = [
      { fechaISO: '2026-08-18', volumenTotal: 1000 },
      { fechaISO: '2026-08-19', volumenTotal: 1200 }
    ];
    const wellness = [{ fecha: '2026-08-18', sueno: 4, estres: 2, doms: 2, motivacion: 4 }];
    const result = WellnessCorrelation.analizar(historial, wellness);
    expect(result).toEqual({ suficienteDatos: false, cruces: 1 });
  });

  // 3. Signo correcto del diff
  it('should calculate positive/negative diffPct correctly based on sleep levels', () => {
    // Caso Sueño alto con MÁS volumen que sueño bajo -> diffPct positivo
    const h1 = [
      { fechaISO: '2026-08-18', volumenTotal: 1200 },
      { fechaISO: '2026-08-19', volumenTotal: 800 }
    ];
    const w1 = [
      { fecha: '2026-08-18', sueno: 5, estres: 3, doms: 3, motivacion: 3 },
      { fecha: '2026-08-19', sueno: 1, estres: 3, doms: 3, motivacion: 3 }
    ];
    const res1 = WellnessCorrelation.analizar(h1, w1);
    expect(res1.sueno.diffPct).toBe(50); // ((1200 - 800) / 800) * 100 = 50%
    expect(res1.sueno.diffPct).toBeGreaterThan(0);

    // Caso invertido: Sueño alto con MENOS volumen -> diffPct negativo
    const h2 = [
      { fechaISO: '2026-08-18', volumenTotal: 600 },
      { fechaISO: '2026-08-19', volumenTotal: 1200 }
    ];
    const res2 = WellnessCorrelation.analizar(h2, w1);
    expect(res2.sueno.diffPct).toBe(-50); // ((600 - 1200) / 1200) * 100 = -50%
    expect(res2.sueno.diffPct).toBeLessThan(0);
  });

  // 4. Consistencia entre métricas
  it('should calculate correct metrics for estres/doms against manual calculations', () => {
    const historial = [
      { fechaISO: '2026-08-01', volumenTotal: 1200 }, // estres: 1 (B)
      { fechaISO: '2026-08-02', volumenTotal: 800 },  // estres: 2 (B)
      { fechaISO: '2026-08-03', volumenTotal: 600 },  // estres: 4 (A)
      { fechaISO: '2026-08-04', volumenTotal: 400 },  // estres: 5 (A)
      { fechaISO: '2026-08-05', volumenTotal: 1500 }, // doms: 2 (B)
      { fechaISO: '2026-08-06', volumenTotal: 500 }   // doms: 5 (A)
    ];
    const wellness = [
      { fecha: '2026-08-01', sueno: 3, estres: 1, doms: 3, motivacion: 3 },
      { fecha: '2026-08-02', sueno: 3, estres: 2, doms: 3, motivacion: 3 },
      { fecha: '2026-08-03', sueno: 3, estres: 4, doms: 3, motivacion: 3 },
      { fecha: '2026-08-04', sueno: 3, estres: 5, doms: 3, motivacion: 3 },
      { fecha: '2026-08-05', sueno: 3, estres: 3, doms: 2, motivacion: 3 },
      { fecha: '2026-08-06', sueno: 3, estres: 3, doms: 5, motivacion: 3 }
    ];

    const result = WellnessCorrelation.analizar(historial, wellness);
    expect(result.suficienteDatos).toBe(true);

    // estres: Bajos [1200, 800] -> avg 1000. Altos [600, 400] -> avg 500. diffPct = -50
    expect(result.estres.avgBajos).toBe(1000);
    expect(result.estres.avgAltos).toBe(500);
    expect(result.estres.diffPct).toBe(-50);

    // doms: Bajos [1500] -> avg 1500. Altos [500] -> avg 500. diffPct = -66.7
    expect(result.doms.avgBajos).toBe(1500);
    expect(result.doms.avgAltos).toBe(500);
    expect(result.doms.diffPct).toBe(-66.7);
  });

  // 5. Bucket vacío
  it('should return null for avgAltos and diffPct if high-wellness group is empty', () => {
    const historial = [
      { fechaISO: '2026-08-18', volumenTotal: 1000 },
      { fechaISO: '2026-08-19', volumenTotal: 1200 }
    ];
    const wellness = [
      { fecha: '2026-08-18', sueno: 3, estres: 2, doms: 3, motivacion: 3 },
      { fecha: '2026-08-19', sueno: 3, estres: 3, doms: 3, motivacion: 3 }
    ];

    const result = WellnessCorrelation.analizar(historial, wellness);
    expect(result.suficienteDatos).toBe(true);
    expect(result.estres.avgBajos).toBe(1000);
    expect(result.estres.avgAltos).toBeNull();
    expect(result.estres.diffPct).toBeNull();
    expect(result.estres.nBajos).toBe(1);
    expect(result.estres.nAltos).toBe(0);
  });
});
