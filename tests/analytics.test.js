import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsController } from "../src/controllers/analytics.controller.js";
import { ChartsManager } from "../src/charts-manager.js";
import { Store } from "../src/store.js";
import progressViewHtml from "../src/views/progress.js";

/**
 * Monta el DOM del tab de progreso usando la vista real de src/views/progress.js
 * y retorna las referencias a los elementos requeridos por AnalyticsController.
 */
function mountProgressDOM() {
  document.body.innerHTML = progressViewHtml;
  return {
    chartEjercicioSelect: document.getElementById("chartEjercicioSelect"),
    wellnessInsight: document.getElementById("wellnessInsight"),
    landmarksContainer: document.getElementById("landmarksContainer"),
    fuerzaAcumulada: document.getElementById("fuerzaAcumulada"),
    kcalAcumuladas: document.getElementById("kcalAcumuladas"),
    volumenAcumulado: document.getElementById("volumenAcumulado"),
    resetProgresoBtn: document.getElementById("resetProgresoBtn"),
  };
}

function makeRutina(historial = []) {
  return {
    historial,
    getProgresoRM: vi.fn(() => [
      { fecha: "2026-01-01", rm: 100 },
      { fecha: "2026-01-08", rm: 105 },
    ]),
    getVolumenPorMusculoHistorico: vi.fn(() => ({ pecho: 1200, espalda: 1500 })),
    getVolumenPorSesion: vi.fn(() => [
      { fecha: "2026-01-01", volumen: 2000 },
      { fecha: "2026-01-03", volumen: 2200 },
    ]),
  };
}

function makePerfil(wellness = []) {
  return {
    data: {
      wellness,
      perfil: { edad: 28, objetivo: "fuerza" },
    },
  };
}

describe("AnalyticsController", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ChartsManager, "renderProgresoRM").mockImplementation(() => {});
    vi.spyOn(ChartsManager, "renderVolumenPorMusculo").mockImplementation(() => {});
    vi.spyOn(ChartsManager, "renderVolumenPorSesion").mockImplementation(() => {});
    vi.spyOn(ChartsManager, "renderCorrelacionWellness").mockImplementation(() => {});
  });

  describe("Inicialización y render principal", () => {
    it("puebla el selector de ejercicios al inicializarse o renderizarse", () => {
      const el = mountProgressDOM();
      const rutina = makeRutina();
      const perfil = makePerfil();

      const controller = new AnalyticsController({ el, rutina, perfil });
      controller.render();

      expect(el.chartEjercicioSelect.children.length).toBeGreaterThan(0);
      const options = Array.from(el.chartEjercicioSelect.options);
      expect(options.some((opt) => opt.value === "peso_muerto" || opt.value === "sentadilla")).toBe(true);
    });

    it("invoca ChartsManager con los datos correspondientes en renderRM y renderVolumen", () => {
      const el = mountProgressDOM();
      const rutina = makeRutina();
      const perfil = makePerfil();

      const controller = new AnalyticsController({ el, rutina, perfil });
      controller.render();

      expect(ChartsManager.renderProgresoRM).toHaveBeenCalledWith(
        "chartRM",
        expect.any(Array),
        expect.any(String)
      );
      expect(ChartsManager.renderVolumenPorMusculo).toHaveBeenCalledWith(
        "chartVolumenMusculo",
        { pecho: 1200, espalda: 1500 }
      );
      expect(ChartsManager.renderVolumenPorSesion).toHaveBeenCalledWith(
        "chartVolumenSesion",
        expect.any(Array)
      );
      expect(ChartsManager.renderCorrelacionWellness).toHaveBeenCalledWith(
        "chartWellness",
        null
      );
    });

    it("actualizarInstancias reemplaza rutina/perfil y vuelve a ejecutar render()", () => {
      const el = mountProgressDOM();
      const rutina1 = makeRutina();
      const perfil1 = makePerfil();
      const controller = new AnalyticsController({ el, rutina: rutina1, perfil: perfil1 });

      const renderSpy = vi.spyOn(controller, "render");
      const rutina2 = makeRutina();
      const perfil2 = makePerfil();

      controller.actualizarInstancias({ rutina: rutina2, perfil: perfil2 });

      expect(controller.rutina).toBe(rutina2);
      expect(controller.perfil).toBe(perfil2);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Interacciones DOM y suscripciones al Store", () => {
    it("al cambiar el select de ejercicios en el DOM se actualiza el gráfico de RM", () => {
      const el = mountProgressDOM();
      const rutina = makeRutina();
      const perfil = makePerfil();
      const controller = new AnalyticsController({ el, rutina, perfil });
      controller.render();

      const renderRMSpy = vi.spyOn(controller, "renderRM");

      // Simular cambio de selección real en el elemento select
      el.chartEjercicioSelect.value = "peso_muerto";
      el.chartEjercicioSelect.dispatchEvent(new Event("change"));

      expect(renderRMSpy).toHaveBeenCalledTimes(1);
      expect(rutina.getProgresoRM).toHaveBeenCalledWith("peso_muerto");
      expect(ChartsManager.renderProgresoRM).toHaveBeenLastCalledWith(
        "chartRM",
        expect.any(Array),
        "Peso muerto convencional"
      );
    });

    it("reacciona a eventos del Store (session:completed, exercises:updated, wellness:updated)", () => {
      const el = mountProgressDOM();
      const rutina = makeRutina();
      const perfil = makePerfil();
      const controller = new AnalyticsController({ el, rutina, perfil });

      const renderSpy = vi.spyOn(controller, "render");
      const selectorSpy = vi.spyOn(controller, "_renderSelectorGrafico");
      const wellnessSpy = vi.spyOn(controller, "renderWellnessCorrelacion");

      Store.emit("session:completed");
      // render() llama internamente a _renderSelectorGrafico
      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(selectorSpy).toHaveBeenCalledTimes(1);

      Store.emit("exercises:updated");
      expect(selectorSpy).toHaveBeenCalledTimes(2);

      Store.emit("wellness:updated");
      // render() llamó a wellnessSpy 1 vez, y este evento la 2da vez
      expect(wellnessSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Wellness y Correlación", () => {
    it("muestra mensaje de datos insuficientes si no hay cruces suficientes", () => {
      const el = mountProgressDOM();
      const rutina = makeRutina([]);
      const perfil = makePerfil([]);
      const controller = new AnalyticsController({ el, rutina, perfil });

      controller.renderWellnessCorrelacion();

      expect(el.wellnessInsight.textContent).toContain(
        "Se necesitan al menos 2 sesiones con wellness registrado el mismo día"
      );
      expect(el.wellnessInsight.querySelector(".small-note")).toBeTruthy();
    });

    it("renderiza insights cuando hay suficientes cruces y métricas con diferencias", () => {
      const el = mountProgressDOM();
      const hoy = "2026-09-04";
      const ayer = "2026-09-03";

      const historial = [
        { fechaISO: hoy, volumenTotal: 3000 },
        { fechaISO: ayer, volumenTotal: 1500 },
      ];
      const wellness = [
        { fecha: hoy, sueno: 5, estres: 1, doms: 1, motivacion: 5 },
        { fecha: ayer, sueno: 2, estres: 4, doms: 4, motivacion: 2 },
      ];

      const rutina = makeRutina(historial);
      const perfil = makePerfil(wellness);
      const controller = new AnalyticsController({ el, rutina, perfil });

      controller.renderWellnessCorrelacion();

      const lineas = el.wellnessInsight.querySelectorAll(".insight-linea");
      expect(lineas.length).toBeGreaterThan(0);
      expect(el.wellnessInsight.innerHTML).toContain("+100%");
      expect(el.wellnessInsight.textContent).toContain("sueño alto vs bajo");
    });

    it("muestra 'Datos insuficientes por métrica todavía' cuando hay cruces pero ningún diffPct computable", () => {
      const el = mountProgressDOM();
      const d1 = "2026-09-01";
      const d2 = "2026-09-02";

      const historial = [
        { fechaISO: d1, volumenTotal: 1000 },
        { fechaISO: d2, volumenTotal: 1000 },
      ];
      const wellness = [
        { fecha: d1, sueno: 3, estres: 3, doms: 3, motivacion: 3 },
        { fecha: d2, sueno: 3, estres: 3, doms: 3, motivacion: 3 },
      ];

      const controller = new AnalyticsController({ el, rutina: makeRutina(historial), perfil: makePerfil(wellness) });
      controller.renderWellnessCorrelacion();

      expect(el.wellnessInsight.textContent).toContain("Datos insuficientes por métrica todavía.");
    });
  });

  describe("Landmarks de Volumen Semanal", () => {
    it("retorna temprano sin error si landmarksContainer es nulo o indefinido", () => {
      const el = mountProgressDOM();
      el.landmarksContainer = null;
      const controller = new AnalyticsController({ el, rutina: makeRutina(), perfil: makePerfil() });

      expect(() => controller.renderLandmarks()).not.toThrow();
    });

    it("muestra mensaje vacío si no hay sesiones en la semana con series", () => {
      const el = mountProgressDOM();
      const controller = new AnalyticsController({ el, rutina: makeRutina([]), perfil: makePerfil() });

      controller.renderLandmarks();

      const empty = el.landmarksContainer.querySelector(".empty-message");
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain("Registra sesiones en la semana para ver los landmarks de volumen.");
    });

    it("renderiza filas de termómetro y leyenda cuando hay trabajo registrado", () => {
      const el = mountProgressDOM();
      const hoy = new Date().toISOString();
      const historial = [
        {
          timestamp: hoy,
          ejercicios: [
            {
              musculo: "pecho",
              series: [
                { rpe: 8, reps: 10, peso: 80 },
                { rir: 1, reps: 10, peso: 80 },
                { rpe: 9, reps: 8, peso: 85 },
              ],
            },
          ],
        },
      ];

      const controller = new AnalyticsController({ el, rutina: makeRutina(historial), perfil: makePerfil() });
      controller.renderLandmarks();

      // Leyenda
      expect(el.landmarksContainer.querySelector(".vl-legend")).toBeTruthy();
      // Fila termómetro para pecho
      const row = el.landmarksContainer.querySelector(".vl-row");
      expect(row).toBeTruthy();
      expect(row.textContent).toContain("Pecho");
      expect(row.textContent).toContain("3 series efectivas");
      expect(row.querySelector(".vl-indicator")).toBeTruthy();
      expect(row.querySelector(".vl-status")).toBeTruthy();
    });

    it("maneja correctamente el toggle de 'Ver todos los grupos musculares' cuando hay más de 6 grupos", () => {
      const el = mountProgressDOM();
      const hoy = new Date().toISOString();
      const musculos = ["pecho", "espalda", "piernas", "gluteos", "hombros", "biceps", "triceps", "core"];
      const ejercicios = musculos.map((m) => ({
        musculo: m,
        series: [{ rpe: 8, reps: 10, peso: 50 }],
      }));

      const historial = [{ timestamp: hoy, ejercicios }];
      const controller = new AnalyticsController({ el, rutina: makeRutina(historial), perfil: makePerfil() });
      controller.renderLandmarks();

      const rows = el.landmarksContainer.querySelectorAll(".vl-row");
      expect(rows.length).toBe(8);

      const hiddenRows = el.landmarksContainer.querySelectorAll(".vl-row--hidden");
      expect(hiddenRows.length).toBe(2);
      expect(hiddenRows[0].style.display).toBe("none");

      const toggle = el.landmarksContainer.querySelector(".vl-toggle");
      expect(toggle).toBeTruthy();
      expect(toggle.textContent).toContain("Ver todos los grupos musculares (+2)");

      // Click para expandir
      toggle.click();
      expect(hiddenRows[0].style.display).toBe("");
      expect(toggle.textContent).toBe("Ocultar grupos musculares");

      // Click para colapsar
      toggle.click();
      expect(hiddenRows[0].style.display).toBe("none");
      expect(toggle.textContent).toContain("Ver todos los grupos musculares (+2)");
    });
  });

  describe("Casos límite y datos atípicos", () => {
    it("renderRM funciona con fallback seguro si el select está vacío y no hay ejercicios disponibles", () => {
      const el = mountProgressDOM();
      el.chartEjercicioSelect.replaceChildren(); // vacío
      vi.spyOn(Store, "getEjerciciosDisponibles").mockReturnValue([]);

      const rutina = makeRutina();
      const controller = new AnalyticsController({ el, rutina, perfil: makePerfil() });

      expect(() => controller.renderRM()).not.toThrow();
      expect(rutina.getProgresoRM).toHaveBeenCalledWith("sentadilla");
    });

    it("_crearFilaTermometro tolera estados desconocidos asignando color fallback", () => {
      const el = mountProgressDOM();
      const controller = new AnalyticsController({ el, rutina: makeRutina(), perfil: makePerfil() });

      const dataAtipica = {
        nombre: "Musculo X",
        efectivas: 15,
        mev: 6,
        mavMax: 12,
        mrv: 18,
        estado: "desconocido_o_custom",
        etiqueta: "Etiqueta Custom",
      };

      const row = controller._crearFilaTermometro(dataAtipica);
      expect(row).toBeTruthy();
      const indicator = row.querySelector(".vl-indicator polygon");
      expect(indicator.getAttribute("fill")).toBe("#C6FF3D");
    });
  });
});
