/**
 * tests/components/Button.test.js
 * Valida renderizado, variantes, estado de carga y manejo de onClick de Button.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { Button } from "../../src/components/Button.js";

describe("Button", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renderiza un <button> con la etiqueta de texto", () => {
    const b = Button({ text: "Guardar" });
    expect(b.tagName).toBe("BUTTON");
    expect(b.querySelector(".gp-btn__label").textContent).toBe("Guardar");
  });

  it("aplica variante y tamaño mediante clases", () => {
    const b = Button({ variant: "danger", size: "lg" });
    expect(b.classList.contains("gp-btn--danger")).toBe(true);
    expect(b.classList.contains("gp-btn--lg")).toBe(true);
  });

  it("se deshabilita y muestra spinner en estado loading", () => {
    const b = Button({ loading: true });
    expect(b.disabled).toBe(true);
    expect(b.querySelector(".gp-spinner")).not.toBeNull();
  });

  it("respeta el estado disabled explícito", () => {
    const b = Button({ disabled: true });
    expect(b.disabled).toBe(true);
  });

  it("dispara onClick al hacer click", () => {
    const fn = vi.fn();
    const b = Button({ text: "Aceptar", onClick: fn });
    document.body.appendChild(b);
    b.click();
    expect(fn).toHaveBeenCalledTimes(1);
    b.remove();
  });
});