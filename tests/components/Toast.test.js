/**
 * tests/components/Toast.test.js
 * Valida el renderizado, variantes y auto-remoción de las notificaciones Toast.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Toast } from "../../src/toast.js";

describe("Toast", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="toastContainer"></div>';
    Toast.init();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("agrega un toast con la variante correcta al contenedor", () => {
    Toast.mostrar("Guardado", "success");
    const t = document.querySelector(".toast");
    expect(t).not.toBeNull();
    expect(t.classList.contains("toast-success")).toBe(true);
    expect(t.textContent).toBe("Guardado");
  });

  it("se elimina del DOM automáticamente tras la duración", () => {
    Toast.mostrar("ok", "info", 1000);
    expect(document.querySelectorAll(".toast").length).toBe(1);
    vi.advanceTimersByTime(1500);
    expect(document.querySelectorAll(".toast").length).toBe(0);
  });

  it("no hace nada si el contenedor no está inicializado", () => {
    Toast._contenedor = null;
    Toast.mostrar("invisible", "success");
    expect(document.querySelectorAll(".toast").length).toBe(0);
  });
});