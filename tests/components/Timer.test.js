/**
 * tests/components/Timer.test.js
 * Valida el componente Timer (wrapper de GestorTimer): display MM:SS,
 * controles presentes y reset a la duración original.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { Timer } from "../../src/components/Timer.js";

describe("Timer", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("muestra el tiempo inicial formateado como MM:SS", () => {
    const t = Timer({ segundos: 150 });
    expect(t.el.querySelector(".gp-timer__display").textContent).toBe("02:30");
    expect(t.el.querySelectorAll("button").length).toBe(2);
  });

  it("formatea los segundos por debajo del minuto", () => {
    const t = Timer({ segundos: 45 });
    expect(t.el.querySelector(".gp-timer__display").textContent).toBe("00:45");
    t.destroy();
  });

  it("reinicia el display a la duración original", () => {
    const t = Timer({ segundos: 60 });
    t.gestor.iniciar();
    t.reset();
    expect(t.el.querySelector(".gp-timer__display").textContent).toBe("01:00");
    t.destroy();
  });
});