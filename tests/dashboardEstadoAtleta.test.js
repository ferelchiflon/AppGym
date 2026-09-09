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

// Bienestar = (sueno + motivacion + (6-estres) + (6-doms)) / 4
const ALTO = { sueno: 5, motivacion: 5, estres: 1, doms: 1 }; // avg 5 → 100
const NEUTRAL = { sueno: 3, motivacion: 3, estres: 3, doms: 3 }; // avg 3 → 60
const BAJO = { sueno: 2, motivacion: 2, estres: 4, doms: 4 }; // avg 2 → 40

/** Controller con solo wellness (una componente) para dirigir el score 0-100. */
function controllerCon(wellness) {
  const c = makeController();
  c.perfil = { data: { wellness, saltos: [] } };
  c.rutina = { historial: [] };
  return c;
}

describe("banner · colores del semáforo (título con emoji)", () => {
  it("verde (score ≥ 70): 'BUEN MOMENTO PARA ENTRENAR' + flecha de tendencia en bienestar", () => {
    // índice 0 viejo/bajo; los últimos 3 altos → hoy 100, ventana anterior 40.
    const c = controllerCon([BAJO, ALTO, ALTO, ALTO, ALTO]);
    const html = c._estadoAtletaBanner();

    expect(html).toContain("🟢");
    expect(html).toContain("BUEN MOMENTO PARA ENTRENAR");
    // tendencia: bienestar 100 vs 40 = +60 (> umbral) → subió ▲
    expect(html).toContain('class="trend up"');
    // desglose: 3 filas (Bienestar / Carga·ACWR / Potencia·CMJ)
    expect(html.match(/class="estado-row"/g)).toHaveLength(3);
  });

  it("amarillo (score 50-69): 'RECUPERACIÓN MODERADA'", () => {
    const c = controllerCon([NEUTRAL]);
    const html = c._estadoAtletaBanner();

    expect(html).toContain("🟡");
    expect(html).toContain("RECUPERACIÓN MODERADA");
  });

  it("rojo (score < 50): 'NECESITÁS DESCANSAR'", () => {
    const c = controllerCon([BAJO]);
    const html = c._estadoAtletaBanner();

    expect(html).toContain("🔴");
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

describe("ventanaAnteriorReadiness · recorta últimos 4 días", () => {
  const dias = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

  it("saca los últimos 4 del wellness/saltos y las sesiones recientes del historial", () => {
    const v = ventanaAnteriorReadiness({
      wellness: [1, 2, 3, 4, 5],
      saltos: [9, 8, 7, 6, 5],
      historial: [
        { fechaISO: dias(0), ejercicios: [] },
        { fechaISO: dias(6), ejercicios: [] },
      ],
    });

    expect(v.wellness).toHaveLength(1); // 5 - 4
    expect(v.saltos).toHaveLength(1);
    expect(v.historial).toHaveLength(1);
    expect(v.historial[0].fechaISO).toBe(dias(6)); // la de hoy (dias(0)) queda fuera
  });

  it("no muta los arrays originales", () => {
    const wellness = [1, 2, 3, 4, 5];
    ventanaAnteriorReadiness({ wellness, saltos: [], historial: [] });
    expect(wellness).toHaveLength(5);
  });
});