/**
 * Regresión: aviso al usuario cuando un Service Worker nuevo toma control en
 * segundo plano (evento 'controllerchange'), para evitar pantallas en blanco
 * por imports() dinámicos de chunks JS con hash que el SW nuevo ya purgó.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AppGymPro } from "../src/app.js";
import { Toast } from "../src/toast.js";

/** Navegador simulado con la API ServiceWorker que consume _registrarServiceWorker. */
function mockearNavigator({ controller = null } = {}) {
  const listeners = {};
  const sw = {
    controller,
    register: vi.fn().mockResolvedValue({}),
    addEventListener: vi.fn((evt, cb) => {
      listeners[evt] = cb;
    }),
  };
  const nav = { serviceWorker: sw };
  // Helper de test para disparar el evento 'controllerchange' como haría el navegador.
  nav._fireControllerChange = () => {
    const cb = listeners["controllerchange"];
    if (cb) cb();
  };
  return nav;
}

/** Crea una instancia de AppGymPro sin ejecutar el constructor completo. */
function crearApp({ rutina, timer }) {
  const app = Object.create(AppGymPro.prototype);
  app.rutina = rutina;
  app.timer = timer;
  return app;
}

function rutinaVacia() {
  return { rutina: [], seriesPorEjercicio: {} };
}

function timerDetenido() {
  return { corriendo: false };
}

describe("Service Worker: aviso de nueva versión (controllerchange)", () => {
  let reloadSpy;

  beforeEach(() => {
    // jsdom: window.location.reload() no existe → lo injectamos como spy.
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        protocol: "https:",
        hostname: "localhost",
        reload: reloadSpy,
      },
    });

    document.body.innerHTML = '<div id="toastContainer"></div>';
    Toast.init();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("registra el listener de 'controllerchange' en navigator.serviceWorker", () => {
    const nav = mockearNavigator({ controller: { scriptURL: "sw.js" } });
    const app = crearApp({ rutina: rutinaVacia(), timer: timerDetenido() });

    app._registrarServiceWorker(nav);

    expect(nav.serviceWorker.register).toHaveBeenCalledWith("sw.js");
    expect(nav.serviceWorker.addEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function)
    );
  });

  it("recarga automáticamente (sin toast accionable) cuando no hay sesión en curso", () => {
    const nav = mockearNavigator({ controller: { scriptURL: "sw-viejo.js" } });
    const app = crearApp({ rutina: rutinaVacia(), timer: timerDetenido() });

    app._registrarServiceWorker(nav);
    nav._fireControllerChange();

    expect(reloadSpy).toHaveBeenCalledTimes(1);
    // No debe quedar un toast accionable persistente.
    expect(document.querySelector(".toast-accion")).toBeNull();
  });

  it("muestra un Toast accionable y NO recarga cuando hay una sesión en curso", () => {
    const nav = mockearNavigator({ controller: { scriptURL: "sw-viejo.js" } });
    const rutina = {
      rutina: ["press_banca"],
      seriesPorEjercicio: { press_banca: [{ peso: 100, reps: 8 }] },
    };
    const app = crearApp({ rutina, timer: timerDetenido() });

    app._registrarServiceWorker(nav);
    nav._fireControllerChange();

    expect(reloadSpy).not.toHaveBeenCalled();

    const toast = document.querySelector(".toast-accion");
    expect(toast).not.toBeNull();
    expect(toast.querySelector(".toast-texto").textContent).toContain(
      "versión nueva disponible"
    );

    // Al tocar la acción, se recarga la página.
    toast.querySelector(".toast-action-btn").click();
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("NO dispara nada en el registro inicial sin controller previo", () => {
    const nav = mockearNavigator({ controller: null }); // usuario nuevo, sin SW previo
    const app = crearApp({ rutina: rutinaVacia(), timer: timerDetenido() });

    app._registrarServiceWorker(nav);
    nav._fireControllerChange(); // 1ª instalación: null -> controller

    expect(reloadSpy).not.toHaveBeenCalled();
    expect(document.querySelector(".toast-accion")).toBeNull();
    expect(document.querySelector(".toast")).toBeNull();
  });

  it("no registra nada si 'serviceWorker' no está disponible", () => {
    const nav = {};
    const app = crearApp({ rutina: rutinaVacia(), timer: timerDetenido() });

    expect(() => app._registrarServiceWorker(nav)).not.toThrow();
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});