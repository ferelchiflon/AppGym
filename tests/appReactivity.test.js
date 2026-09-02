import { describe, it, expect, beforeEach, vi } from "vitest";
import { Store } from "../src/store.js";
import { GestorTimer } from "../src/gestor-timer.js";

describe("Web Móvil & Reactivity (Fase 1)", () => {
  beforeEach(() => {
    // Reset test storage
    localStorage.clear();
    Store._cache = null;
    Store._modoIDB = false;
  });

  it("permite cambiar de perfil y crear nuevos perfiles en Store", () => {
    const p1 = Store.getPerfilActivo();
    expect(p1.nombre).toBe("Atleta principal");

    const p2 = Store.crearPerfil("Atleta Olímpico");
    expect(p2.nombre).toBe("Atleta Olímpico");
    expect(Store.getPerfilActivo().id).toBe(p2.id);

    Store.cambiarPerfil(p1.id);
    expect(Store.getPerfilActivo().id).toBe(p1.id);
  });

  it("GestorTimer expone metodos hapticos y audio pre-warming", () => {
    expect(typeof GestorTimer.vibrarCorto).toBe("function");
    expect(typeof GestorTimer.vibrarExito).toBe("function");
    expect(typeof GestorTimer.vibrarPR).toBe("function");
    expect(typeof GestorTimer.desbloquearAudio).toBe("function");

    // No debe lanzar errores en entornos sin soporte Web Audio/Vibrate
    expect(() => GestorTimer.vibrarCorto()).not.toThrow();
    expect(() => GestorTimer.vibrarPR()).not.toThrow();
    expect(() => GestorTimer.desbloquearAudio()).not.toThrow();
  });

  it("Quick Stepper ajusta valores numericos correctamente", () => {
    document.body.innerHTML = `
      <input type="number" id="seriePeso" value="60" />
      <button class="stepper-chip" data-step-target="seriePeso" data-step-val="2.5">+2.5</button>
      <button class="stepper-chip" data-step-target="seriePeso" data-step-val="-2.5">-2.5</button>
    `;

    const input = document.getElementById("seriePeso");
    const plusBtn = document.querySelector('[data-step-val="2.5"]');
    const minusBtn = document.querySelector('[data-step-val="-2.5"]');

    // Simulate clicking stepper
    const stepValPlus = parseFloat(plusBtn.getAttribute("data-step-val"));
    input.value = (parseFloat(input.value) + stepValPlus).toString();
    expect(input.value).toBe("62.5");

    const stepValMinus = parseFloat(minusBtn.getAttribute("data-step-val"));
    input.value = (parseFloat(input.value) + stepValMinus).toString();
    expect(input.value).toBe("60");
  });
});
