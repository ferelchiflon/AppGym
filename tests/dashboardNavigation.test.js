import { describe, it, expect, vi } from "vitest";
import { DashboardController } from "../src/controllers/dashboard.controller.js";
import controllerSrc from "../src/controllers/dashboard.controller.js?raw";
import { Store } from "../src/store.js";
import * as H from "../src/utils/dashboard-helpers.js";

/**
 * Regresión de navegación del DashboardController + cobertura de
 * `_quickStart`, `_iniciarRutina` y `_iniciarRutinaSugerida`.
 *
 * Bug original: `_ir()` usaba nombres de pestaña que NO coinciden con los
 * panes reales ("entrenar", "perfil", "periodizacion"). AppNavigator.goTo()
 * arma `id="tab-<tab>"` y desactiva todos los panes sin activar ninguno →
 * pantalla en blanco al tocar el botón. Las únicas pestañas válidas son las
 * que existen como `.tab-pane` (ver src/views/{dashboard,workout,history,progress,profile}.js).
 */
const TABS_VALIDOS = ["dashboard", "workout", "history", "progress", "profile"];

/** Rutina sin ejercicios cargados hoy → hay que armarla. */
function rutinaVacia(historial = []) {
  return {
    historial,
    data: { rutina: [], progreso: {}, seriesPorEjercicio: {} },
    ejercicioSeleccionado: null,
  };
}

/** Rutina ya cargada → solo hay que continuar navegando. */
function rutinaCargada() {
  return {
    historial: [],
    data: { rutina: ["press_banca"], progreso: {}, seriesPorEjercicio: {} },
    ejercicioSeleccionado: "press_banca",
  };
}

/** Monta un DOM de prueba con los 5 panes reales + un fake navigator. */
function mountApp(extra = {}) {
  document.body.innerHTML = `<main>
    ${TABS_VALIDOS.map((t) => `<section id="tab-${t}" class="tab-pane"></section>`).join("")}
  </main>`;

  const activosPorLlamada = [];
  // Espejo fiel de AppNavigator.goTo(): solo puede activar panes que existan.
  const goTo = vi.fn((tab, scroll) => {
    expect(TABS_VALIDOS).toContain(tab);
    document.querySelectorAll(".tab-pane").forEach((p) => {
      p.classList.toggle("active", p.id === `tab-${tab}`);
    });
    activosPorLlamada.push(
      [...document.querySelectorAll(".tab-pane.active")].map((p) => p.id)
    );
    return scroll;
  });
  const navigator = { goTo };

  const container = document.createElement("div");
  container.id = "dashboardContainer";
  const controller = new DashboardController({
    app: { navigator },
    el: { container },
    ...extra,
  });

  return { controller, navigator, goTo, container, activosPorLlamada };
}

describe("DashboardController · regresión de navegación", () => {
  it("todas las llamadas a _ir(\"...\") usan tabs que existen como pane real", () => {
    const targets = [...controllerSrc.matchAll(/_ir\(\s*"([a-z_]+)"/g)].map(
      (m) => m[1]
    );

    // El test es significativo: debe haber encontrado los call-sites reales.
    expect(targets.length).toBeGreaterThanOrEqual(5);
    for (const t of targets) {
      expect(TABS_VALIDOS, `tab no válido en _ir("${t}")`).toContain(t);
    }
  });

  it("cada botón del dashboard navega a un pane que existe (no deja pantalla en blanco)", () => {
    const { controller, goTo, container, activosPorLlamada } = mountApp();
    container.innerHTML = `
      <button id="fatigaAjustarBtn"></button>
      <button id="wellnessAjustarBtn"></button>
      <button id="wellnessIrRegistrarBtn"></button>
      <button id="goPeriodizacionBtn"></button>
    `;
    controller._bindActions();

    container.querySelector("#fatigaAjustarBtn").click();
    container.querySelector("#wellnessAjustarBtn").click();
    container.querySelector("#wellnessIrRegistrarBtn").click();
    container.querySelector("#goPeriodizacionBtn").click();

    const tabs = goTo.mock.calls.map((c) => c[0]);
    expect(tabs).toEqual(["profile", "profile", "profile", "history"]);

    // Tras cada navegación queda exactamente un pane activo, el destino real.
    tabs.forEach((t, i) => {
      expect(activosPorLlamada[i], `navegación ${i} ("${t}")`).toEqual([`tab-${t}`]);
    });
  });
describe("DashboardController · _quickStart (3 casos)", () => {
  it("(a) hay rutina activa no completada hoy → 'Continuar rutina de hoy' (solo navega)", () => {
    const { controller } = mountApp({ rutina: rutinaCargada() });

    const html = controller._quickStart();

    expect(html).toContain("Continuar rutina de hoy");
    expect(controller._quickStartModo).toBe("continuar");
  });

  it("(b) sin rutina pero con bloque de periodización activo → arma usando el bloque", () => {
    const periodoBloque = { tipo: "deload" };
    const periodizacion = { getBloqueActual: () => periodoBloque };
    const { controller } = mountApp({ rutina: rutinaVacia(), periodizacion });

    const html = controller._quickStart();
    expect(html).toContain("Iniciar mi primer entrenamiento");
    expect(controller._quickStartModo).toBe("armar");

    // El arranque delega el bloque activo al sugeridor de grupo muscular.
    const sugerir = vi.spyOn(H, "sugerirGrupoMuscular").mockReturnValue("pecho");
    controller._iniciarRutinaSugerida();
    expect(sugerir).toHaveBeenCalledWith({
      historial: controller.rutina.historial,
      bloque: periodoBloque,
    });
    sugerir.mockRestore();
  });

  it("(c) ni rutina ni bloque → 'Iniciar mi primer entrenamiento' (arma)", () => {
    const { controller } = mountApp({ rutina: rutinaVacia() });

    const html = controller._quickStart();

    expect(html).toContain("Iniciar mi primer entrenamiento");
    expect(controller._quickStartModo).toBe("armar");
  });
});

describe("DashboardController · click real en #quickStartBtn", () => {
  it("navega efectivamente a la pestaña workout (no solo sin tirar error)", () => {
    const { controller, goTo, container } = mountApp({ rutina: rutinaCargada() });
    container.innerHTML = `<div>${controller._quickStart()}</div>`;
    controller._bindActions();

    const btn = container.querySelector("#quickStartBtn");
    expect(btn).toBeTruthy();
    btn.click();

    // Continúa la rutina → navega al pane "workout".
    expect(goTo).toHaveBeenCalledTimes(1);
    expect(goTo).toHaveBeenCalledWith("workout", true);
    expect(document.getElementById("tab-workout").classList.contains("active")).toBe(true);
  });
});

describe("DashboardController · _iniciarRutina / _iniciarRutinaSugerida", () => {
  it("_iniciarRutina navega a workout", () => {
    const { controller, goTo } = mountApp({ rutina: rutinaCargada() });

    controller._iniciarRutina();

    expect(goTo).toHaveBeenCalledTimes(1);
    expect(goTo).toHaveBeenCalledWith("workout", true);
  });

  it("_iniciarRutinaSugerida arma la rutina (4 ejercicios) y navega a workout", () => {
    const { controller, goTo } = mountApp({ rutina: rutinaVacia() });
    const emit = vi.spyOn(Store, "emit");

    controller._iniciarRutinaSugerida();

    const r = controller.rutina;
    expect(r.data.rutina).toHaveLength(4);
    expect(r.ejercicioSeleccionado).toBe(r.data.rutina[0]);
    r.data.rutina.forEach((id) => {
      expect(r.data.progreso[id]).toEqual({ completado: false });
      expect(r.data.seriesPorEjercicio[id]).toEqual([]);
    });
    expect(emit).toHaveBeenCalledWith("routine:updated", r.data.rutina);
    expect(goTo).toHaveBeenCalledTimes(1);
    expect(goTo).toHaveBeenCalledWith("workout", true);
    emit.mockRestore();
  });

  it("con bloque de periodización activo usa ese bloque para elegir el grupo", () => {
    const periodoBloque = { tipo: "deload" };
    const periodizacion = { getBloqueActual: () => periodoBloque };
    const { controller } = mountApp({ rutina: rutinaVacia(), periodizacion });

    const sugerir = vi.spyOn(H, "sugerirGrupoMuscular").mockReturnValue("pecho");
    controller._iniciarRutinaSugerida();
    expect(sugerir).toHaveBeenCalledWith({
      historial: controller.rutina.historial,
      bloque: periodoBloque,
    });
    sugerir.mockRestore();

    // La rutina se arma con la selección sugerida.
    expect(controller.rutina.data.rutina).toHaveLength(4);
  });
});
});