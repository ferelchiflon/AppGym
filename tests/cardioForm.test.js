/**
 * tests/cardioForm.test.js
 * Valida el modal de registro de sesión de cardio (CardioForm):
 * render de campos, validación en cliente, llamada a GestorCardio.registrar(),
 * Toast de éxito/error y cierre del modal.
 *
 * Sigue los patrones de mocks/limpieza de tests/exerciseGuide.test.js y
 * tests/dashboardWellness.test.js.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CardioForm } from "../src/components/cardio-form.js";
import { GestorCardio } from "../src/gestor-cardio.js";
import { Toast } from "../src/toast.js";

function perfilBase() {
  return { id: "p1", nombre: "Tester", sesionesCardio: [] };
}

function gestor() {
  return new GestorCardio(perfilBase());
}

function abrir(cardio, onGuardado) {
  return CardioForm.abrir(cardio, { onGuardado });
}

/** Espera a que termine la transición de cierre (250ms) y el nodo se elimine. */
function trasCierre() {
  return new Promise((resolve) => setTimeout(resolve, 280));
}

describe("CardioForm", () => {
  let toastSpy;

  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    toastSpy = vi.spyOn(Toast, "mostrar").mockImplementation(() => {});
  });

  afterEach(() => {
    if (CardioForm._activo) CardioForm._activo.cerrar();
    toastSpy.mockRestore();
    document.body.innerHTML = "";
  });

  it("abre el modal con los campos del form mapeados a registrar()", () => {
    abrir(gestor());

    const overlay = document.querySelector(".dialog-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(overlay.getAttribute("aria-modal")).toBe("true");

    // Select de tipo construido desde TIPOS_CARDIO_LABELS.
    const select = overlay.querySelector("#cardioTipo");
    expect(select).not.toBeNull();
    const opciones = [...select.options].map((o) => `${o.value}:${o.textContent}`);
    expect(opciones).toEqual(["correr:Correr", "bici:Bici", "remo:Remo", "otro:Otro"]);
    expect(select.value).toBe("correr");

    // Campos numéricos y notas.
    const duracion = overlay.querySelector("#cardioDuracion");
    expect(duracion).not.toBeNull();
    expect(duracion.type).toBe("number");
    expect(duracion.required).toBe(true);
    expect(overlay.querySelector("#cardioDistancia")).not.toBeNull();
    expect(overlay.querySelector("#cardioFc")).not.toBeNull();
    expect(overlay.querySelector("#cardioNotas").tagName).toBe("TEXTAREA");

    // RPE: 10 botones 1-10.
    const rpeBtns = overlay.querySelectorAll(".cardio-rpe-btn");
    expect(rpeBtns.length).toBe(10);
    expect(rpeBtns[0].textContent.trim()).toBe("1");
    expect(rpeBtns[9].textContent.trim()).toBe("10");
  });

  it("valida duración y RPE obligatorios antes de llamar a registrar()", () => {
    const c = gestor();
    const registrar = vi.spyOn(c, "registrar");
    const onGuardado = vi.fn();
    abrir(c, onGuardado);

    // Submit con campos vacíos.
    document.querySelector(".cardio-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    expect(registrar).not.toHaveBeenCalled();
    expect(onGuardado).not.toHaveBeenCalled();
    expect(toastSpy).not.toHaveBeenCalled();

    const error = document.querySelector(".cardio-form-error");
    expect(error.classList.contains("hidden")).toBe(false);
    expect(error.textContent).toContain("duración");
    expect(error.textContent).toContain("esfuerzo");
  });

  it("llama registrar() con los datos correctos, muestra toast de éxito y cierra", async () => {
    const c = gestor();
    const registrar = vi.spyOn(c, "registrar"); // mantiene el original
    const onGuardado = vi.fn();
    abrir(c, onGuardado);

    const overlay = document.querySelector(".dialog-overlay");
    overlay.querySelector("#cardioDuracion").value = "30";
    overlay.querySelector("#cardioDistancia").value = "5.4";
    overlay.querySelector("#cardioFc").value = "150";
    overlay.querySelector("#cardioNotas").value = "Fácil";
    overlay.querySelector('.cardio-rpe-btn[data-val="5"]').click();

    document.querySelector(".cardio-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar.mock.calls[0][0]).toMatchObject({
      tipo: "correr",
      duracion: 30,
      distancia: "5.4",
      fc: "150",
      rpe: 5,
      notas: "Fácil",
    });

    expect(toastSpy).toHaveBeenCalledWith("Sesión de cardio guardada", "success");
    expect(onGuardado).toHaveBeenCalledTimes(1);

    // El modal se cierra: tras la transición el nodo se elimina del DOM.
    await trasCierre();
    expect(document.querySelector(".dialog-overlay")).toBeNull();
  });

  it("muestra toast de error y mantiene el modal abierto si registrar() devuelve null", () => {
    const c = gestor();
    const registrar = vi.spyOn(c, "registrar").mockImplementation(() => null);
    const onGuardado = vi.fn();
    abrir(c, onGuardado);

    const overlay = document.querySelector(".dialog-overlay");
    overlay.querySelector("#cardioDuracion").value = "20";
    overlay.querySelector('.cardio-rpe-btn[data-val="4"]').click();

    document.querySelector(".cardio-form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar.mock.calls[0][0]).toMatchObject({ tipo: "correr", duracion: 20, rpe: 4 });
    expect(toastSpy).toHaveBeenCalledWith("No se pudo guardar la sesión de cardio", "error");
    expect(onGuardado).not.toHaveBeenCalled();
    expect(document.querySelector(".dialog-overlay")).not.toBeNull();
  });

  it("oculta y limpia la distancia cuando el tipo es 'otro'", () => {
    abrir(gestor());

    const overlay = document.querySelector(".dialog-overlay");
    const select = overlay.querySelector("#cardioTipo");
    const wrap = overlay.querySelector("#cardioDistanciaWrap");

    expect(wrap.classList.contains("cardio-form-hidden")).toBe(false);

    select.value = "otro";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(wrap.classList.contains("cardio-form-hidden")).toBe(true);

    // Al volver a un tipo con distancia, se restaura.
    select.value = "bici";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(wrap.classList.contains("cardio-form-hidden")).toBe(false);
  });

  it("cierra con Escape y desactiva el singleton", async () => {
    const instancia = abrir(gestor());
    expect(CardioForm._activo).toBe(instancia);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(CardioForm._activo).toBeNull();
    expect(document.querySelector(".dialog-overlay")).not.toBeNull();

    await trasCierre();
    expect(document.querySelector(".dialog-overlay")).toBeNull();
  });
});