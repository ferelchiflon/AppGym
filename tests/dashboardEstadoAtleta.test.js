import { describe, it, expect } from "vitest";
import { DashboardController } from "../src/controllers/dashboard.controller.js";
import {
  tendenciaReadiness,
  ventanaAnteriorReadiness,
  UMBRAL_TENDENCIA,
} from "../src/utils/dashboard-helpers.ts";

/**
 * Tests del banner único de estado del atleta: los 3 colores del semáforo, las
 * flechas de tendencia (hoy vs. ventana anterior) y el estado sin datos.
 * El banner es una SEÑAL/heurística; estos tests sólo fijan su comportamiento.
 */

function makeController() {
  return new DashboardController({ el: { container: document.createElement("div") } });
}

// Bienestar (score 1-5) = promedio PLANO de las 8 métricas ya ajustadas por
// dirección (wellnessScore). ×20 → 0-100. Directa: sueño/motivación/energía/
// alimentación/hidratación; invertida (6−v): estrés/DOMS/fatiga.
const ALTO = { sueno: 5, motivacion: 5, estres: 1, doms: 1, energia: 5, fatiga: 1, alimentacion: 5, hidratacion: 5 }; // 5.0 → 100
const NEUTRAL = { sueno: 3, motivacion: 3, estres: 3, doms: 3, energia: 3, fatiga: 3, alimentacion: 3, hidratacion: 3 }; // 3.0 → 60
const BAJO = { sueno: 1, motivacion: 1, estres: 5, doms: 5, energia: 1, fatiga: 5, alimentacion: 1, hidratacion: 1 }; // 1.0 → 20

/** Controller con solo wellness (una componente) para dirigir el score 0-100. */
function controllerCon(wellness) {
  const c = makeController();
  c.perfil = { data: { wellness, saltos: [] } };
  c.rutina = { historial: [] };
  return c;
}

describe("banner · semáforo de colores (indicador circular)", () => {
  it("verde (score ≥ 70): 'BUEN MOMENTO PARA ENTRENAR' + flecha de tendencia en bienestar", () => {
    // índice 0 viejo/bajo; los últimos 3 altos → hoy 100, ventana anterior 20.
    const c = controllerCon([BAJO, ALTO, ALTO, ALTO, ALTO]);
    const html = c._estadoAtletaBanner();

    expect(html).toContain("class=\"semaphore-circle\"");
    expect(html).toContain("BUEN MOMENTO PARA ENTRENAR");
    // tendencia: bienestar 100 vs 40 = +60 (> umbral) → subió ▲
    expect(html).toContain('class="trend up"');
    // desglose: 3 filas (Bienestar / Carga·ACWR / Potencia·CMJ)
    expect(html.match(/class="estado-row"/g)).toHaveLength(3);
  });

  it("amarillo (score 50-69): 'RECUPERACIÓN MODERADA'", () => {
    const c = controllerCon([NEUTRAL]);
    const html = c._estadoAtletaBanner();

    expect(html).toContain("class=\"semaphore-circle\"");
    expect(html).toMatch(/fill="var\(--warning-text\)"/);
    expect(html).toContain("RECUPERACIÓN MODERADA");
  });

  it("rojo (score < 50): 'NECESITÁS DESCANSAR'", () => {
    const c = controllerCon([BAJO]);
    const html = c._estadoAtletaBanner();

    expect(html).toContain("class=\"semaphore-circle\"");
    expect(html).toMatch(/fill="var\(--danger-text\)"/);
    expect(html).toContain("NECESITÁS DESCANSAR");
  });

  it("sin datos suficientes: mismo comportamiento que _noReadiness", () => {
    const c = controllerCon([]);
    const html = c._estadoAtletaBanner();

    expect(html).toContain("readiness-empty");
    expect(html).toContain("Registrá tu bienestar para obtener tu readiness.");
  });
});

describe("tendenciaReadiness · flechas por componente (±5 = estable)", () => {
  const hoy = { partes: { wellness: 70, cmj: 80, acwr: 70 } };

  it("sube cuando el delta es > +5", () => {
    const t = tendenciaReadiness(hoy, { partes: { wellness: 60, cmj: 76, acwr: 72 } });
    expect(t.wellness.direccion).toBe("subio");
    expect(t.wellness.delta).toBe(10);
  });

  it("baja cuando el delta es < -5", () => {
    const t = tendenciaReadiness(hoy, { partes: { wellness: 85, cmj: 76, acwr: 72 } });
    expect(t.wellness.direccion).toBe("bajo");
    expect(t.wellness.delta).toBe(-15);
  });

  it("se mantiene estable dentro de ±5", () => {
    const t = tendenciaReadiness(hoy, { partes: { wellness: 73, cmj: 84, acwr: 66 } });
    expect(t.wellness.direccion).toBe("estable");
    expect(t.cmj.direccion).toBe("estable");
    expect(t.acwr.direccion).toBe("estable");
    expect(t.cmj.delta).toBe(-4);
  });

  it("marca 'nuevo' cuando no hay ventana anterior", () => {
    const t = tendenciaReadiness(hoy, null);
    expect(t.wellness.direccion).toBe("nuevo");
    expect(t.wellness.anterior).toBeNull();
    expect(t.wellness.delta).toBeNull();
  });

  it("devuelve objeto vacío si no hay readiness de hoy", () => {
    expect(tendenciaReadiness(null, { partes: {} })).toEqual({});
  });

  it("el umbral de estabilidad es ±5 puntos", () => {
    expect(UMBRAL_TENDENCIA).toBe(5);
  });
});

describe("correlacionWellnessBanner · asociación observada con el volumen", () => {
  const dias = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

  /** 4 cruces: 2 días de sueño alto (volumen alto) y 2 de sueño bajo (volumen bajo). */
  function controllerCorrelacion() {
    const c = makeController();
    c.perfil = {
      data: {
        wellness: [
          { fecha: dias(0), sueno: 5, estres: 3, doms: 3, motivacion: 3 },
          { fecha: dias(1), sueno: 5, estres: 3, doms: 3, motivacion: 3 },
          { fecha: dias(2), sueno: 1, estres: 3, doms: 3, motivacion: 3 },
          { fecha: dias(3), sueno: 1, estres: 3, doms: 3, motivacion: 3 },
        ],
        saltos: [],
      },
    };
    c.rutina = {
      historial: [
        { fechaISO: dias(0), volumenTotal: 300, ejercicios: [] },
        { fechaISO: dias(1), volumenTotal: 320, ejercicios: [] },
        { fechaISO: dias(2), volumenTotal: 100, ejercicios: [] },
        { fechaISO: dias(3), volumenTotal: 120, ejercicios: [] },
      ],
    };
    return c;
  }

  it("muestra la sección de insight con tono de 'asociación, no causalidad'", () => {
    const html = controllerCorrelacion()._correlacionWellnessBanner();
    // avgAltos=310, avgBajos=110 → diffPct=((310-110)/110)*100 = 181.8%
    expect(html).toContain("estado-insight");
    expect(html).toContain("Con sueño alto vs bajo");
    expect(html).toContain("+181.8%");
    expect(html).toContain("no causalidad");
  });

  it("integra el insight debajo del desglose dentro del banner", () => {
    const html = controllerCorrelacion()._estadoAtletaBanner();
    expect(html).toContain("estado-desglose");
    expect(html).toContain("estado-insight");
    // El insight queda después del desglose (no lo corta).
    expect(html.indexOf("estado-insight")).toBeGreaterThan(html.indexOf("estado-desglose"));
  });

  it("no muestra nada cuando no hay datos de wellness ni sesiones", () => {
    const c = controllerCon([NEUTRAL]); // sin historial → analizar() devuelve null
    expect(c._correlacionWellnessBanner()).toBe("");
  });

  it("no muestra nada cuando hay menos de 2 cruces (mismo criterio que analytics)", () => {
    const c = makeController();
    c.perfil = { data: { wellness: [{ fecha: dias(0), sueno: 5, estres: 3, doms: 3, motivacion: 3 }], saltos: [] } };
    c.rutina = { historial: [{ fechaISO: dias(0), volumenTotal: 100, ejercicios: [] }] };
    expect(c._correlacionWellnessBanner()).toBe("");
  });
});