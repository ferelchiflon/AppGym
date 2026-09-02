import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GestorTimer } from "../src/gestor-timer.js";

describe("GestorTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("inicializa con valores por defecto", () => {
    const timer = new GestorTimer();
    expect(timer.segundosTotales).toBe(150);
    expect(timer.segundosRestantes).toBe(150);
    expect(timer.getTiempoFormateado()).toBe("02:30");
  });

  it("setTiempo actualiza segundos y formato correctamente", () => {
    const timer = new GestorTimer();
    timer.setTiempo(3, 45);
    expect(timer.segundosTotales).toBe(225);
    expect(timer.segundosRestantes).toBe(225);
    expect(timer.getTiempoFormateado()).toBe("03:45");
  });

  it("iniciar y tick descuentan tiempo basado en timestamps", () => {
    const timer = new GestorTimer();
    timer.setTiempo(1, 0); // 60s
    timer.iniciar();
    expect(timer.corriendo).toBe(true);

    vi.advanceTimersByTime(10000); // 10s
    expect(timer.segundosRestantes).toBe(50);
    expect(timer.getTiempoFormateado()).toBe("00:50");

    timer.pausar();
    expect(timer.corriendo).toBe(false);
  });

  it("dispara onFinish y detiene al llegar a cero", () => {
    const timer = new GestorTimer();
    const finishSpy = vi.fn();
    timer.onFinish = finishSpy;
    timer.setTiempo(0, 3); // 3s
    timer.iniciar();

    vi.advanceTimersByTime(3500);
    expect(timer.segundosRestantes).toBe(0);
    expect(timer.corriendo).toBe(false);
    expect(finishSpy).toHaveBeenCalledTimes(1);
  });

  it("sincroniza multiples displays mediante vincularDisplay y agregarDisplay", () => {
    const timer = new GestorTimer();
    const primaryDisplay = { textContent: "" };
    const miniDisplay = { textContent: "" };
    const floatingDisplay = { textContent: "" };

    timer.vincularDisplay(primaryDisplay);
    timer.agregarDisplay(miniDisplay);
    timer.agregarDisplay(floatingDisplay);

    expect(primaryDisplay.textContent).toBe("02:30");
    expect(miniDisplay.textContent).toBe("02:30");
    expect(floatingDisplay.textContent).toBe("02:30");

    timer.setTiempo(1, 15);
    expect(primaryDisplay.textContent).toBe("01:15");
    expect(miniDisplay.textContent).toBe("01:15");
    expect(floatingDisplay.textContent).toBe("01:15");
  });
});
