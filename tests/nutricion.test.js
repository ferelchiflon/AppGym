import { describe, it, expect, vi, beforeEach } from "vitest";
import { PerfilAtleta } from "../src/perfil-atleta.js";
import { DashboardController } from "../src/controllers/dashboard.controller.js";
import { Store } from "../src/store.js";
import { Toast } from "../src/toast.js";
import { Utils } from "../src/utils.ts";

describe("PerfilAtleta · Nutrición diaria", () => {
  let perfil;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Store, "guardar").mockImplementation(() => {});
    perfil = new PerfilAtleta({
      perfil: {},
      wellness: [],
      nutricion: [],
    });
  });

  describe("registrarNutricion()", () => {
    it("guarda un registro con datos válidos y fecha de hoy", () => {
      const entry = perfil.registrarNutricion({
        comidas: 4,
        proteina: true,
        agua: true,
      });

      expect(entry).toBeDefined();
      expect(entry.fecha).toBe(Utils.fechaISO());
      expect(entry.comidas).toBe(4);
      expect(entry.proteina).toBe(true);
      expect(entry.agua).toBe(true);
      expect(perfil.data.nutricion).toHaveLength(1);
      expect(Store.guardar).toHaveBeenCalledTimes(1);
    });

    it("reemplaza el registro de hoy en vez de duplicarlo si se registra de nuevo", () => {
      perfil.registrarNutricion({ comidas: 3, proteina: false, agua: true });
      expect(perfil.data.nutricion).toHaveLength(1);

      const updated = perfil.registrarNutricion({ comidas: 5, proteina: true, agua: true });
      expect(perfil.data.nutricion).toHaveLength(1);
      expect(perfil.data.nutricion[0].comidas).toBe(5);
      expect(perfil.data.nutricion[0].proteina).toBe(true);
      expect(updated.comidas).toBe(5);
    });

    it("limita el stepper de comidas: no permite negativos ni números mayores a 8", () => {
      // Negativo -> 0
      const bajo = perfil.registrarNutricion({ comidas: -3, proteina: false, agua: false });
      expect(bajo.comidas).toBe(0);

      // Excesivo -> 8
      const alto = perfil.registrarNutricion({ comidas: 20, proteina: false, agua: false });
      expect(alto.comidas).toBe(8);

      // Decimales se redondean
      const redondeado = perfil.registrarNutricion({ comidas: 4.7, proteina: false, agua: false });
      expect(redondeado.comidas).toBe(5);

      // Invalido o null -> 0
      const invalido = perfil.registrarNutricion({ comidas: "invalido", proteina: false, agua: false });
      expect(invalido.comidas).toBe(0);
    });

    it("coerces proteina y agua a valores booleanos estrictos", () => {
      const entry = perfil.registrarNutricion({
        comidas: 3,
        proteina: "si",
        agua: 0,
      });
      expect(entry.proteina).toBe(true);
      expect(entry.agua).toBe(false);
    });

    it("inicializa el array de nutricion si el perfil viene de un estado legacy sin la propiedad", () => {
      const legacyPerfil = new PerfilAtleta({ perfil: {} });
      expect(Array.isArray(legacyPerfil.data.nutricion)).toBe(true);
      const entry = legacyPerfil.registrarNutricion({ comidas: 3 });
      expect(entry.comidas).toBe(3);
      expect(legacyPerfil.data.nutricion).toHaveLength(1);
    });
  });

  describe("getNutricionHoy()", () => {
    it("devuelve null cuando no hay registros de nutrición", () => {
      expect(perfil.getNutricionHoy()).toBeNull();
    });

    it("devuelve null si solo hay registros de días anteriores", () => {
      perfil.data.nutricion = [
        { fecha: "2026-01-01", comidas: 4, proteina: true, agua: true },
        { fecha: "2026-01-02", comidas: 3, proteina: false, agua: true },
      ];
      expect(perfil.getNutricionHoy()).toBeNull();
    });

    it("devuelve el registro del día de hoy cuando existe", () => {
      const hoy = Utils.fechaISO();
      perfil.data.nutricion = [
        { fecha: "2026-01-01", comidas: 2, proteina: false, agua: false },
        { fecha: hoy, comidas: 5, proteina: true, agua: true },
      ];
      const res = perfil.getNutricionHoy();
      expect(res).not.toBeNull();
      expect(res.fecha).toBe(hoy);
      expect(res.comidas).toBe(5);
      expect(res.proteina).toBe(true);
      expect(res.agua).toBe(true);
    });
  });
});

describe("DashboardController · Tarjeta de nutrición", () => {
  function makeController(perfilData = null) {
    const container = document.createElement("div");
    const perfil = perfilData ? new PerfilAtleta(perfilData) : null;
    return new DashboardController({
      el: { container },
      perfil,
      rutina: { historial: [], data: { rutina: [] } },
      periodizacion: { getBloqueActual: () => null },
    });
  }

  describe("Renderizado de la tarjeta (_nutricionCard)", () => {
    it("renderiza con valores por defecto (0 comidas, chips inactivos) sin datos hoy", () => {
      const c = makeController();
      const html = c._nutricionCard(null);

      expect(html).toContain('id="nutricionCard"');
      expect(html).toContain("NUTRICIÓN");
      expect(html).toContain("Hábitos de hoy");
      expect(html).toContain('value="0"');
      expect(html).toContain('id="nutricionProteinaBtn"');
      expect(html).toContain('id="nutricionAguaBtn"');
      expect(html).toContain('aria-pressed="false"');
      expect(html).not.toContain("is-active");
      expect(html).toContain('id="nutricionGuardarBtn"');
    });

    it("renderiza con los datos cargados cuando existen registros de hoy", () => {
      const c = makeController();
      const html = c._nutricionCard({
        fecha: Utils.fechaISO(),
        comidas: 4,
        proteina: true,
        agua: false,
      });

      expect(html).toContain('value="4"');
      // Proteína activa
      expect(html).toContain('class="toggle-chip is-active" id="nutricionProteinaBtn" aria-pressed="true"');
      // Agua inactiva
      expect(html).toContain('class="toggle-chip" id="nutricionAguaBtn" aria-pressed="false"');
    });

    it("la tarjeta está incluida en el render completo del dashboard", () => {
      const c = makeController({
        perfil: {},
        wellness: [],
        nutricion: [{ fecha: Utils.fechaISO(), comidas: 3, proteina: true, agua: true }],
      });
      c.render();
      expect(c.container.querySelector("#nutricionCard")).not.toBeNull();
      const input = c.container.querySelector("#nutricionComidas");
      expect(input.value).toBe("3");
    });
  });

  describe("Interacciones del stepper y chips en el DOM", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.spyOn(Store, "guardar").mockImplementation(() => {});
      vi.spyOn(Store, "emit").mockImplementation(() => {});
      vi.spyOn(Toast, "mostrar").mockImplementation(() => {});
    });

    it("el stepper incrementa y decrementa respetando los límites 0 a 8", () => {
      const c = makeController({
        perfil: {},
        wellness: [],
        nutricion: [],
      });
      c.render();

      const input = c.container.querySelector("#nutricionComidas");
      const btnMenos = c.container.querySelector('.stepper-chip[data-step-val="-1"]');
      const btnMas = c.container.querySelector('.stepper-chip[data-step-val="1"]');

      expect(input.value).toBe("0");

      // No puede bajar de 0
      btnMenos.click();
      expect(input.value).toBe("0");

      // Incrementa
      btnMas.click();
      expect(input.value).toBe("1");
      btnMas.click();
      btnMas.click();
      expect(input.value).toBe("3");

      // Decrementa
      btnMenos.click();
      expect(input.value).toBe("2");

      // No puede superar 8
      for (let i = 0; i < 10; i++) {
        btnMas.click();
      }
      expect(input.value).toBe("8");
    });

    it("los chips toggle alternan su estado aria-pressed y clase is-active al hacer click", () => {
      const c = makeController({
        perfil: {},
        wellness: [],
        nutricion: [],
      });
      c.render();

      const protBtn = c.container.querySelector("#nutricionProteinaBtn");
      const aguaBtn = c.container.querySelector("#nutricionAguaBtn");

      expect(protBtn.getAttribute("aria-pressed")).toBe("false");
      expect(protBtn.classList.contains("is-active")).toBe(false);

      protBtn.click();
      expect(protBtn.getAttribute("aria-pressed")).toBe("true");
      expect(protBtn.classList.contains("is-active")).toBe(true);

      protBtn.click();
      expect(protBtn.getAttribute("aria-pressed")).toBe("false");
      expect(protBtn.classList.contains("is-active")).toBe(false);

      aguaBtn.click();
      expect(aguaBtn.getAttribute("aria-pressed")).toBe("true");
      expect(aguaBtn.classList.contains("is-active")).toBe(true);
    });

    it("el botón Guardar hoy persiste en el perfil, emite evento y muestra toast", () => {
      const perfilData = {
        perfil: {},
        wellness: [],
        nutricion: [],
      };
      const c = makeController(perfilData);
      c.render();

      const btnMas = c.container.querySelector('.stepper-chip[data-step-val="1"]');
      const protBtn = c.container.querySelector("#nutricionProteinaBtn");
      const guardarBtn = c.container.querySelector("#nutricionGuardarBtn");

      // Seleccionar 3 comidas y proteína
      btnMas.click();
      btnMas.click();
      btnMas.click();
      protBtn.click();

      guardarBtn.click();

      expect(c.perfil.data.nutricion).toHaveLength(1);
      const hoy = c.perfil.getNutricionHoy();
      expect(hoy).not.toBeNull();
      expect(hoy.comidas).toBe(3);
      expect(hoy.proteina).toBe(true);
      expect(hoy.agua).toBe(false);

      expect(Store.guardar).toHaveBeenCalled();
      expect(Store.emit).toHaveBeenCalledWith("nutricion:updated", c.perfil.data.nutricion);
      expect(Toast.mostrar).toHaveBeenCalledWith("Nutrición guardada", "success");
    });

    it("muestra toast de error si se intenta guardar sin perfil activo", () => {
      const c = makeController(null);
      c.container.innerHTML = c._nutricionCard(null);
      c._bindActions();

      const guardarBtn = c.container.querySelector("#nutricionGuardarBtn");
      guardarBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith(
        "No hay un perfil activo para guardar la nutrición",
        "danger"
      );
    });
  });
});
