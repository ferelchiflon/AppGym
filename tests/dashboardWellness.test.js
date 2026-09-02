import { describe, it, expect } from "vitest";
import { DashboardController } from "../src/controllers/dashboard.controller.js";
import { COLORS_SPARKLINE } from "../src/utils/dashboard-helpers.js";

/**
 * Tests unitarios del sparkline de wellness (SVG puro suavizado) y del
 * estado vacío de la tarjeta de wellness del DashboardController.
 */

function wellness(...dias) {
  // facilita construir registros: cada arg es { sueno, estres, doms, motivacion }
  return dias.map((d, i) => ({ fecha: `2026-01-0${i + 1}`, ...d }));
}

function makeController() {
  return new DashboardController({ el: { container: document.createElement("div") } });
}

describe("DashboardController · sparkline de wellness", () => {
  it("genera un path suavizado (bezier cúbico) por cada uno de los 4 marcadores", () => {
    const c = makeController();
    const serie = wellness(
      { sueno: 4, estres: 2, doms: 2, motivacion: 4 },
      { sueno: 3, estres: 3, doms: 3, motivacion: 3 },
      { sueno: 5, estres: 1, doms: 1, motivacion: 5 }
    );

    const html = c._sparkline(serie);

    // 4 paths (uno por métrica), todos suavizados con curvas "C".
    const paths = html.match(/<path /g);
    expect(paths).toHaveLength(4);
    expect(html.match(/ C /g).length).toBeGreaterThanOrEqual(4);

    // Cada path usa stroke-width=2, linecap round y opacidad 0.7.
    expect(html).toContain('stroke-width="2"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('stroke-opacity="0.7"');
  });

  it("dibuja un punto (círculo) por cada día en cada métrica", () => {
    const c = makeController();
    const serie = wellness(
      { sueno: 4, estres: 2, doms: 2, motivacion: 4 },
      { sueno: 3, estres: 3, doms: 3, motivacion: 3 }
    );

    const html = c._sparkline(serie);

    // 4 métricas * 2 días = 8 círculos (uno por día por línea).
    const circles = html.match(/<circle /g);
    expect(circles).toHaveLength(8);
    // Los puntos usan opacidad 0.7.
    expect(html).toContain('fill-opacity="0.7"');
  });

  it("incluye una leyenda con los 4 colores distintivos", () => {
    const c = makeController();
    const serie = wellness({ sueno: 4, estres: 2, doms: 2, motivacion: 4 });

    const html = c._sparkline(serie);

    expect(html).toContain("Leyenda");
    expect(html).toContain("Sueño");
    expect(html).toContain("Motivación");
    expect(html).toContain("Estrés");
    expect(html).toContain("DOMS");
    // Los 4 colores de COLORS_SPARKLINE están presentes en la leyenda.
    Object.values(COLORS_SPARKLINE).forEach((color) => {
      expect(html).toContain(`background:${color}`);
    });
  });

  it("invierte estrés y DOMS para que 'bienestar alto' quede arriba", () => {
    const c = makeController();
    // sueno=1 (peor) vs sueno=5 (mejor): y(1) debe ser MAYOR (más abajo) que y(5).
    const bajo = c._sparklinePoints([{ sueno: 1 }], "sueno")[0];
    const alto = c._sparklinePoints([{ sueno: 5 }], "sueno")[0];
    expect(bajo[1]).toBeGreaterThan(alto[1]);

    // estres=5 (peor) invertido debe quedar abajo; estres=1 (mejor) arriba.
    const estresAlto = c._sparklinePoints([{ estres: 5 }], "estres")[0];
    const estresBajo = c._sparklinePoints([{ estres: 1 }], "estres")[0];
    expect(estresAlto[1]).toBeGreaterThan(estresBajo[1]);
  });

  it("caso de un único día no produce NaN en el path", () => {
    const c = makeController();
    const html = c._sparkline(wellness({ sueno: 4, estres: 2, doms: 2, motivacion: 4 }));
    expect(html).not.toContain("NaN");
  });
});

describe("DashboardController · tarjeta wellness estado vacío", () => {
  it("sin wellness muestra CTA 'Registra tu wellness de hoy' hacia el formulario", () => {
    const c = makeController();
    const html = c._wellnessCard([], null);

    expect(html).toContain("Registra tu wellness de hoy");
    expect(html).toContain('id="wellnessIrRegistrarBtn"');
    // No debe mostrar el sparkline ni el tracker en estado vacío.
    expect(html).not.toContain("wellness-spark");
    expect(html).not.toContain("wellness-tracker");
  });

  it("con wellness reciente muestra sparkline y leyenda (sin botón de vacío)", () => {
    const c = makeController();
    const html = c._wellnessCard(
      wellness({ sueno: 4, estres: 2, doms: 2, motivacion: 4 }),
      { color: "#54E08A" }
    );

    expect(html).toContain("wellness-spark");
    expect(html).toContain("ÚLTIMOS 7 DÍAS");
    expect(html).not.toContain("wellnessIrRegistrarBtn");
  });
});