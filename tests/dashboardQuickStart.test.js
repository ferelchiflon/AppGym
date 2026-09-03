import { describe, it, expect, vi } from "vitest";
import { DashboardController } from "../src/controllers/dashboard.controller.js";
import { Utils } from "../src/utils.js";

/**
 * Tests del botón de arranque rápido del Dashboard (#quickStartBtn).
 *
 * Regresión: #quickStartBtn estaba atado únicamente a _iniciarRutina()
 * (que solo navega a Entrenar) en los casos donde todavía hay que ARMAR
 * la rutina ("Iniciar mi primer entrenamiento" / "Iniciar rutina sugerida").
 * El botón debe crear la rutina sugerida antes de navegar, y únicamente
 * navegar sin rearmar cuando ya hay una rutina cargada ("Continuar rutina de hoy").
 */

function makeController(rutina) {
  return new DashboardController({
    el: { container: document.createElement("div") },
    rutina,
  });
}

/** Rutina "vacía": no hay ejercicios cargados hoy → hay que armar la rutina. */
function rutinaVacia(historial = []) {
  return {
    historial,
    data: { rutina: [], progreso: {}, seriesPorEjercicio: {} },
    ejercicioSeleccionado: null,
  };
}

/** Rutina ya cargada: hay ejercicios → solo hay que continuar navegando. */
function rutinaCargada() {
  return {
    historial: [],
    data: { rutina: ["press-banca"], progreso: {}, seriesPorEjercicio: {} },
    ejercicioSeleccionado: "press-banca",
  };
}

describe("DashboardController · botón de arranque rápido", () => {
  it("sin rutina cargada ni entrenos previos ofrece 'Iniciar mi primer entrenamiento' y arma la rutina", () => {
    const c = makeController(rutinaVacia());

    const html = c._quickStart();

    expect(html).toContain("Iniciar mi primer entrenamiento");
    expect(c._quickStartModo).toBe("armar");
    expect(html).toContain('id="quickStartBtn"');
  });

  it("tras entrenar hoy, sin rutina cargada ofrece 'Iniciar rutina sugerida' y arma la rutina", () => {
    const hoy = Utils.fechaISO();
    const c = makeController(
      rutinaVacia([{ fechaISO: hoy, nombre: "Press", peso: 50, reps: 8 }])
    );

    const html = c._quickStart();

    expect(html).toContain("Iniciar rutina sugerida");
    expect(c._quickStartModo).toBe("armar");
  });

  it("con rutina cargada ofrece 'Continuar rutina de hoy' y no rearma", () => {
    const c = makeController(rutinaCargada());

    const html = c._quickStart();

    expect(html).toContain("Continuar rutina de hoy");
    expect(c._quickStartModo).toBe("continuar");
  });

  it("al hacer clic en el primer entrenamiento arma la rutina (no solo navega)", () => {
    const c = makeController(rutinaVacia());
    const armar = vi.spyOn(c, "_iniciarRutinaSugerida").mockImplementation(() => {});
    const navegar = vi.spyOn(c, "_iniciarRutina").mockImplementation(() => {});

    c.container.innerHTML = `<div id="x">${c._quickStart()}</div>`;
    c._bindActions();

    c.container.querySelector("#quickStartBtn").click();

    expect(armar).toHaveBeenCalledTimes(1);
    expect(navegar).not.toHaveBeenCalled();
  });

  it("al hacer clic en 'Continuar rutina de hoy' solo navega sin rearmar", () => {
    const c = makeController(rutinaCargada());
    const armar = vi.spyOn(c, "_iniciarRutinaSugerida").mockImplementation(() => {});
    const navegar = vi.spyOn(c, "_iniciarRutina").mockImplementation(() => {});

    c.container.innerHTML = `<div id="x">${c._quickStart()}</div>`;
    c._bindActions();

    c.container.querySelector("#quickStartBtn").click();

    expect(navegar).toHaveBeenCalledTimes(1);
    expect(armar).not.toHaveBeenCalled();
  });
});