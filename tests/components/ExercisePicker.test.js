/**
 * tests/components/ExercisePicker.test.js
 * Valida el modal selector de ejercicios: filtros por grupo muscular,
 * búsqueda y callback onSelect.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExercisePicker } from "../../src/components/ExercisePicker.js";

describe("ExercisePicker", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    ExercisePicker.cerrar();
    document.body.innerHTML = "";
  });

  it("abre el modal con campo de búsqueda y filtros de grupo muscular", () => {
    ExercisePicker.abrir({});
    expect(document.querySelector(".exercise-picker__search")).not.toBeNull();
    const filters = document.querySelectorAll(".exercise-picker__filter");
    expect(filters.length).toBeGreaterThan(1);
    expect(filters[0].textContent).toBe("Todos");
    expect(document.querySelector(".exercise-picker__list").children.length).toBeGreaterThan(0);
  });

  it("dispara onSelect al elegir un ejercicio", () => {
    const fn = vi.fn();
    ExercisePicker.abrir({ onSelect: fn });
    const primero = document.querySelector(".exercise-picker__item");
    expect(primero).not.toBeNull();
    primero.click();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("filtra la lista según la búsqueda", () => {
    ExercisePicker.abrir({});
    const search = document.querySelector(".exercise-picker__search");
    const list = document.querySelector(".exercise-picker__list");
    search.value = "press banca";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    const nombres = [...list.querySelectorAll(".exercise-picker__item")].map((n) => n.textContent);
    expect(nombres.length).toBeGreaterThan(0);
    expect(nombres.every((n) => n.toLowerCase().includes("press banca"))).toBe(true);
  });
});