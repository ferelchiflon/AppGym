import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ErrorHandler } from "../src/error-handler.js";
import { Toast } from "../src/toast.js";

const MENSAJE_ERROR = "Ocurrió un error inesperado. Por favor, reintenta.";

/** Dispara un evento "error" de runtime a nivel window (simula un throw sin capturar). */
function dispararErrorRuntime() {
  const e = new Event("error");
  Object.defineProperty(e, "message", { value: "boom de prueba" });
  Object.defineProperty(e, "error", { value: new TypeError("boom de prueba") });
  Object.defineProperty(e, "filename", { value: "http://localhost/app.js" });
  Object.defineProperty(e, "lineno", { value: 10 });
  Object.defineProperty(e, "colno", { value: 2 });
  window.dispatchEvent(e);
}

/** Dispara un evento "unhandledrejection" a nivel window (promesa rechazada sin catch). */
function dispararRechazo(razon) {
  const e = new Event("unhandledrejection");
  Object.defineProperty(e, "reason", { value: razon });
  window.dispatchEvent(e);
}

/** Monta el contenedor de toasts y deja Toast listo (como hace main.js). */
function montarToast() {
  document.body.innerHTML = '<div id="toastContainer" class="toast-container"></div>';
  Toast.init();
}

function cantToasts() {
  return document.querySelectorAll(".toast.toast-error").length;
}

describe("Manejo global de errores (ErrorHandler)", () => {
  // Los listeners se registran UNA sola vez para todo el archivo: window es un
  // singleton compartido entre tests y un listener acumulado dispararía N toasts
  // por cada dispatch (uno por cada init() de tests anteriores).
  beforeAll(() => {
    ErrorHandler.init();
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="toastContainer" class="toast-container"></div>';
    Toast.init();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("captura un error de runtime, lo loguea en consola y muestra un Toast en pantalla", () => {
    montarToast();
    ErrorHandler.init();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    dispararErrorRuntime();

    // Logging de depuración con mensaje + stack + ubicación.
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[error-handler] Error de runtime"),
      "boom de prueba",
      expect.objectContaining({
        stack: expect.stringContaining("boom de prueba"),
        location: "http://localhost/app.js:10:2",
      })
    );

    // Notificación visual amigable.
    expect(cantToasts()).toBe(1);
    const toast = document.querySelector(".toast.toast-error");
    expect(toast.textContent).toBe(MENSAJE_ERROR);
  });

  it("captura una promesa rechazada (Error) y muestra un Toast en pantalla", () => {
    montarToast();
    ErrorHandler.init();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    dispararRechazo(new Error("promesa fallida"));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[error-handler] Promesa rechazada"),
      expect.stringContaining("promesa fallida")
    );
    expect(cantToasts()).toBe(1);
  });

  it("bloguea tal cual la razón cuando el rechazo no es un Error", () => {
    montarToast();
    ErrorHandler.init();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    dispararRechazo("42");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[error-handler] Promesa rechazada"),
      "42"
    );
    expect(cantToasts()).toBe(1);
  });

  it("init() es idempotente: no duplica listeners ni toasts por evento", () => {
    montarToast();
    ErrorHandler.init();
    ErrorHandler.init();
    ErrorHandler.init();

    dispararErrorRuntime();

    expect(cantToasts()).toBe(1);
  });

  it("si notificar falla, el handler no lanza (evita recursión y pantalla en blanco)", () => {
    document.body.innerHTML = '<div id="toastContainer"></div>';
    Toast.init();
    const mostrarSpy = vi.spyOn(Toast, "mostrar").mockImplementation(() => {
      throw new Error("toast roto");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    ErrorHandler.init();

    expect(() => dispararErrorRuntime()).not.toThrow();

    expect(mostrarSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No se pudo notificar"),
      expect.any(Error)
    );
  });
});