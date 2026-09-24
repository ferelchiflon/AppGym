/**
 * Tests for ChartsManager (src/charts-manager.js)
 *
 * Estrategia:
 * - vi.mock("chart.js") con vi.hoisted: clase Chart falsa + registro de
 *   instancias para asertar las configs pasadas a `new Chart(...)`, sin
 *   depender de Chart.js real ni del paquete `canvas`.
 * - DOM real de jsdom para los canvases (getElementById, parentElement,
 *   placeholders .chart-empty).
 * - _gradiente usa try/catch: en jsdom (sin paquete `canvas`) getContext
 *   devuelve null → fallback; se testean ambos caminos.
 * - El fallo de carga de Chart.js se testea con un módulo fresco
 *   (vi.resetModules + vi.doMock con fábrica que lanza) al final del archivo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChartsManager } from "../src/charts-manager.js";

const chartMocks = vi.hoisted(() => {
  const instances = [];
  const destroySpy = vi.fn(function () {
    this.destroyed = true;
  });
  const registerSpy = vi.fn();
  // Clase constructible falsa: captura ctx/config, se registra en `instances`
  // para asertar, expone destroy espiado y el método ESTÁTICO register.
  function FakeChart(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.destroyed = false;
    this.destroy = destroySpy;
    instances.push(this);
  }
  FakeChart.defaults = { font: {}, color: null };
  FakeChart.register = registerSpy;
  return { instances, destroySpy, registerSpy, FakeChart };
});

vi.mock("chart.js", () => {
  const fakePart = () => ({});
  return {
    Chart: chartMocks.FakeChart,
    LineController: fakePart(),
    BarController: fakePart(),
    CategoryScale: fakePart(),
    LinearScale: fakePart(),
    PointElement: fakePart(),
    LineElement: fakePart(),
    BarElement: fakePart(),
    Tooltip: fakePart(),
    Legend: fakePart(),
    Filler: fakePart(),
  };
});

/** Crea un wrapper con canvas colgado de document.body (como en la app real). */
function mountChartDOM(canvasId) {
  const wrapper = document.createElement("div");
  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  wrapper.appendChild(canvas);
  document.body.appendChild(wrapper);
  return { wrapper, canvas };
}

beforeEach(() => {
  vi.clearAllMocks();
  chartMocks.instances.length = 0;
  ChartsManager._charts = {};
  ChartsManager._Chart = null; // fuerza recarga de defaults en cada test
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ChartsManager", () => {
  describe("_destruir", () => {
    it("debe destruir y eliminar la instancia del registro", () => {
      const fake = { destroy: vi.fn() };
      ChartsManager._charts["c1"] = fake;

      ChartsManager._destruir("c1");

      expect(fake.destroy).toHaveBeenCalledTimes(1);
      expect(ChartsManager._charts).not.toHaveProperty("c1");
    });

    it("debe ser un no-op si el id no está en el registro", () => {
      expect(() => ChartsManager._destruir("no-existe")).not.toThrow();
    });
  });

  describe("_getChart", () => {
    it("debe cargar Chart.js y aplicar la tipografía/color de marca", async () => {
      const Chart = await ChartsManager._getChart();

      expect(Chart).toBe(chartMocks.FakeChart);
      // _loadChart registró los controllers/escalas/elementos:
      expect(chartMocks.registerSpy).toHaveBeenCalled();
      expect(Chart.defaults.font.family).toBe(ChartsManager._colores.fuente);
      expect(Chart.defaults.color).toBe(ChartsManager._colores.texto);
      expect(ChartsManager._Chart).toBe(chartMocks.FakeChart);
    });

    it("debe cachear la clase Chart en llamadas repetidas", async () => {
      const primera = await ChartsManager._getChart();
      const segunda = await ChartsManager._getChart();
      expect(segunda).toBe(primera);
    });
  });

  describe("_gradiente", () => {
    it("debe crear un gradiente lineal vertical con los color stops", () => {
      const gradient = { addColorStop: vi.fn() };
      const fakeCtx = { createLinearGradient: vi.fn(() => gradient) };
      const fakeCanvas = { getContext: vi.fn(() => fakeCtx), height: 250 };

      const g = ChartsManager._gradiente(fakeCanvas, "desde", "hasta");

      expect(fakeCtx.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 250);
      expect(g.addColorStop).toHaveBeenCalledWith(0, "desde");
      expect(g.addColorStop).toHaveBeenCalledWith(1, "hasta");
    });

    it("debe hacer fallback seguro si getContext falla (jsdom sin paquete canvas)", () => {
      const canvas = document.createElement("canvas");
      const g = ChartsManager._gradiente(canvas, "desde", "hasta");
      expect(g).toBe("hasta");
    });
  });

  describe("_opcionesBase", () => {
    it("debe devolver opciones responsive con leyenda y unidad en el eje Y", () => {
      const opciones = ChartsManager._opcionesBase("kg");

      expect(opciones.responsive).toBe(true);
      expect(opciones.maintainAspectRatio).toBe(false);
      expect(opciones.plugins.legend.display).toBe(true);
      expect(opciones.scales.y.title.text).toBe("kg");
      expect(opciones.scales.x.ticks.color).toBe(ChartsManager._colores.texto);
      expect(opciones.scales.y.grid.color).toBe(ChartsManager._colores.grilla);
    });

    it("debe permitir ocultar la leyenda", () => {
      const opciones = ChartsManager._opcionesBase("kg", false);
      expect(opciones.plugins.legend.display).toBe(false);
    });
  });

  describe("_renderVacio / _ocultarVacio", () => {
    it("debe crear el placeholder .chart-empty con el mensaje y ocultar el canvas", () => {
      const { wrapper, canvas } = mountChartDOM("c-vacio");

      ChartsManager._renderVacio(canvas, "Sin datos");

      const placeholder = wrapper.querySelector(".chart-empty");
      expect(placeholder).not.toBeNull();
      expect(placeholder.textContent).toBe("Sin datos");
      expect(placeholder.style.display).toBe("block");
      expect(canvas.style.display).toBe("none");
    });

    it("debe reutilizar el placeholder existente en sucesivas llamadas", () => {
      const { wrapper, canvas } = mountChartDOM("c-vacio-2");
      ChartsManager._renderVacio(canvas, "Primer mensaje");
      ChartsManager._renderVacio(canvas, "Segundo mensaje");

      const placeholders = wrapper.querySelectorAll(".chart-empty");
      expect(placeholders).toHaveLength(1);
      expect(placeholders[0].textContent).toBe("Segundo mensaje");
    });

    it("_ocultarVacio debe mostrar el canvas y ocultar el placeholder", () => {
      const { wrapper, canvas } = mountChartDOM("c-vacio-3");
      ChartsManager._renderVacio(canvas, "Sin datos");

      ChartsManager._ocultarVacio(canvas);

      expect(canvas.style.display).toBe("block");
      expect(wrapper.querySelector(".chart-empty").style.display).toBe("none");
    });
  });

  describe("renderProgresoRM", () => {
    it("debe renderizar un gráfico de línea con labels, datos redondeados y opciones base", async () => {
      const { canvas } = mountChartDOM("c-rm");
      const datos = [
        { fechaISO: "2026-09-18", rm: 100 },
        { fechaISO: "2026-09-20", rm: 105.55 },
      ];

      await ChartsManager.renderProgresoRM("c-rm", datos, "Press Banca");

      expect(chartMocks.instances).toHaveLength(1);
      const instancia = chartMocks.instances[0];
      expect(instancia.ctx).toBe(canvas);
      expect(instancia.config.type).toBe("line");
      expect(instancia.config.data.labels).toEqual(["2026-09-18", "2026-09-20"]);
      expect(instancia.config.data.datasets[0].label).toBe("1RM estimado — Press Banca");
      expect(instancia.config.data.datasets[0].data).toEqual([100, 105.6]); // Math.round(x*10)/10
      expect(instancia.config.data.datasets[0].borderColor).toBe(ChartsManager._colores.linea);
      // jsdom sin paquete `canvas`: el gradiente cae al fallback (gradienteFin)
      expect(instancia.config.data.datasets[0].backgroundColor).toBe(
        ChartsManager._colores.gradienteFin
      );
      expect(instancia.config.options.scales.y.title.text).toBe("kg");
    });

    it("debe renderizar el mensaje vacío sin sesiones (sin instanciar Chart)", async () => {
      const { wrapper, canvas } = mountChartDOM("c-rm-empty");

      await ChartsManager.renderProgresoRM("c-rm-empty", [], "Press Banca");

      expect(chartMocks.instances).toHaveLength(0);
      expect(wrapper.querySelector(".chart-empty").textContent).toBe(
        "Sin sesiones guardadas todavía para este ejercicio"
      );
      expect(canvas.style.display).toBe("none");
    });

    it("debe tolerar datosProgreso null", async () => {
      const { wrapper } = mountChartDOM("c-rm-null");

      await ChartsManager.renderProgresoRM("c-rm-null", null, "Press Banca");

      expect(chartMocks.instances).toHaveLength(0);
      expect(wrapper.querySelector(".chart-empty")).not.toBeNull();
    });

    it("debe retornar temprano si el canvas no existe en el DOM", async () => {
      await ChartsManager.renderProgresoRM(
        "canvas-inexistente",
        [{ fechaISO: "2026-09-18", rm: 100 }],
        "X"
      );
      expect(chartMocks.instances).toHaveLength(0);
    });
  });

  describe("renderVolumenPorMusculo", () => {
    it("debe renderizar un gráfico de barras con labels y datos redondeados", async () => {
      mountChartDOM("c-musculo");
      const volumen = { pecho: 500.4, piernas: 300 };

      await ChartsManager.renderVolumenPorMusculo("c-musculo", volumen);

      expect(chartMocks.instances).toHaveLength(1);
      const config = chartMocks.instances[0].config;
      expect(config.type).toBe("bar");
      expect(config.data.labels).toEqual(["pecho", "piernas"]);
      expect(config.data.datasets[0].label).toBe("Volumen (kg)");
      expect(config.data.datasets[0].data).toEqual([500, 300]);
      expect(config.data.datasets[0].backgroundColor).toBe(ChartsManager._colores.barras);
      expect(config.data.datasets[0].maxBarThickness).toBe(42);
      expect(config.options.plugins.legend.display).toBe(false);
      expect(config.options.scales.y.title.text).toBe("kg");
    });

    it("debe renderizar el mensaje vacío sin volumen", async () => {
      const { wrapper } = mountChartDOM("c-musculo-empty");

      await ChartsManager.renderVolumenPorMusculo("c-musculo-empty", {});

      expect(chartMocks.instances).toHaveLength(0);
      expect(wrapper.querySelector(".chart-empty").textContent).toBe(
        "Todavía no hay volumen registrado por grupo muscular"
      );
    });

    it("debe tolerar volumen null", async () => {
      const { wrapper } = mountChartDOM("c-musculo-null");

      await ChartsManager.renderVolumenPorMusculo("c-musculo-null", null);

      expect(chartMocks.instances).toHaveLength(0);
      expect(wrapper.querySelector(".chart-empty")).not.toBeNull();
    });
  });

  describe("renderVolumenPorSesion", () => {
    it("debe renderizar un gráfico de barras de volumen por sesión", async () => {
      mountChartDOM("c-sesiones");
      const sesiones = [
        { fechaISO: "2026-09-18", volumen: 1000.4 },
        { fechaISO: "2026-09-20", volumen: 1200 },
      ];

      await ChartsManager.renderVolumenPorSesion("c-sesiones", sesiones);

      expect(chartMocks.instances).toHaveLength(1);
      const config = chartMocks.instances[0].config;
      expect(config.type).toBe("bar");
      expect(config.data.labels).toEqual(["2026-09-18", "2026-09-20"]);
      expect(config.data.datasets[0].label).toBe("Volumen semanal (kg)");
      expect(config.data.datasets[0].data).toEqual([1000, 1200]);
      expect(config.data.datasets[0].borderColor).toBe("#FF5E00");
      expect(config.data.datasets[0].maxBarThickness).toBe(32);
      expect(config.options.plugins.legend.display).toBe(false);
    });

    it("debe renderizar el mensaje vacío sin sesiones", async () => {
      const { wrapper } = mountChartDOM("c-sesiones-empty");

      await ChartsManager.renderVolumenPorSesion("c-sesiones-empty", []);

      expect(chartMocks.instances).toHaveLength(0);
      expect(wrapper.querySelector(".chart-empty").textContent).toBe(
        "Guardá tu primera sesión para ver la evolución de volumen"
      );
    });

    it("debe retornar temprano si el canvas no existe", async () => {
      await ChartsManager.renderVolumenPorSesion("canvas-inexistente", [
        { fechaISO: "x", volumen: 1 },
      ]);
      expect(chartMocks.instances).toHaveLength(0);
    });
  });

  describe("renderCorrelacionWellness", () => {
    it("debe renderizar el mensaje vacío sin análisis o sin datos suficientes", async () => {
      const { wrapper } = mountChartDOM("c-wellness");

      await ChartsManager.renderCorrelacionWellness("c-wellness", null);

      expect(chartMocks.instances).toHaveLength(0);
      expect(wrapper.querySelector(".chart-empty").textContent).toContain("mínimo 2 cruces");

      const { wrapper: w2 } = mountChartDOM("c-wellness-2");
      await ChartsManager.renderCorrelacionWellness("c-wellness-2", { suficienteDatos: false });
      expect(chartMocks.instances).toHaveLength(0);
      expect(w2.querySelector(".chart-empty")).not.toBeNull();
    });

    it("debe renderizar barras comparativas (bajos vs altos) con datos suficientes", async () => {
      mountChartDOM("c-wellness-ok");
      const analisis = {
        suficienteDatos: true,
        sueno: { avgBajos: 1.8, avgAltos: 4.2 },
        estres: { avgBajos: 2.4, avgAltos: null },
        doms: { avgBajos: null, avgAltos: 3.6 },
        motivacion: { avgBajos: 2, avgAltos: 4 },
      };

      await ChartsManager.renderCorrelacionWellness("c-wellness-ok", analisis);

      expect(chartMocks.instances).toHaveLength(1);
      const config = chartMocks.instances[0].config;
      expect(config.type).toBe("bar");
      expect(config.data.labels).toEqual(["Sueño", "Estrés", "DOMS", "Motivación"]);
      expect(config.data.datasets).toHaveLength(2);
      // null → 0, y redondeo al entero más cercano
      expect(config.data.datasets[0].data).toEqual([2, 2, 0, 2]);
      expect(config.data.datasets[1].data).toEqual([4, 0, 4, 4]);
    });
  });

  describe("renderGraficoACWR", () => {
    it("debe renderizar el gráfico mixto (barra + líneas) de ACWR", async () => {
      mountChartDOM("c-acwr");
      const acwrData = {
        serieHistorica: [
          { fecha: "2026-09-18", cargaDia: 100, cargaAguda: 90, cargaCronica: 80 },
          { fecha: "2026-09-19", cargaDia: 120, cargaAguda: 95, cargaCronica: 85 },
        ],
      };

      await ChartsManager.renderGraficoACWR("c-acwr", acwrData);

      expect(chartMocks.instances).toHaveLength(1);
      const config = chartMocks.instances[0].config;
      expect(config.type).toBe("line");
      expect(config.data.labels).toEqual(["2026-09-18", "2026-09-19"]);
      expect(config.data.datasets).toHaveLength(3);
      expect(config.data.datasets[0]).toMatchObject({
        label: "Carga Diaria (sRPE UA)",
        type: "bar",
        data: [100, 120],
      });
      expect(config.data.datasets[1]).toMatchObject({
        label: "Carga Aguda 7d",
        type: "line",
        data: [90, 95],
      });
      expect(config.data.datasets[2]).toMatchObject({
        label: "Carga Crónica 28d",
        type: "line",
        data: [80, 85],
        borderDash: [5, 5],
      });
      expect(config.options.scales.y.title.text).toBe("Carga sRPE (UA)");
    });

    it("debe renderizar el mensaje vacío sin datos de carga", async () => {
      const { wrapper } = mountChartDOM("c-acwr-empty");

      await ChartsManager.renderGraficoACWR("c-acwr-empty", { serieHistorica: [] });

      expect(chartMocks.instances).toHaveLength(0);
      expect(wrapper.querySelector(".chart-empty").textContent).toBe(
        "Sin suficientes datos de carga interna para graficar ACWR."
      );
    });

    it("debe tolerar acwrData null y canvas inexistente", async () => {
      await ChartsManager.renderGraficoACWR("canvas-inexistente", null);
      expect(chartMocks.instances).toHaveLength(0);
    });
  });
});

/**
 * ÚLTIMO test del archivo (aislado): con un módulo FRESCO de charts-manager
 * (vi.resetModules) y una fábrica de 'chart.js' que lanza, el dynamic import
 * rechaza → _getChart captura, loguea y devuelve null.
 */
describe("fallo de carga de Chart.js", () => {
  it("debe devolver null y loguear error si Chart.js no se puede cargar", async () => {
    vi.resetModules();
    vi.doMock("chart.js", () => {
      throw new Error("chart.js no disponible");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { ChartsManager: Fresh } = await import("../src/charts-manager.js");
    const Chart = await Fresh._getChart();

    expect(Chart).toBeNull();
    expect(consoleError).toHaveBeenCalledWith("No se pudo cargar Chart.js", expect.any(Error));

    consoleError.mockRestore();
    vi.doUnmock("chart.js");
    vi.resetModules();
  });
});