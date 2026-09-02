/**
 * tests/exerciseGuide.test.js
 * Valida los datos de las guías (EXERCISE_GUIDES) y el render del modal
 * ExerciseGuide en jsdom.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EXERCISE_GUIDES, EJERCICIOS_CATALOGO } from "../src/config.js";
import { ExerciseGuide } from "../src/components/exercise-guide.js";

describe("Datos de guías (EXERCISE_GUIDES)", () => {
  it("registra press militar (press_hombro) y sentadilla", () => {
    expect(EXERCISE_GUIDES).toHaveProperty("press_hombro");
    expect(EXERCISE_GUIDES).toHaveProperty("sentadilla");
  });

  it("cada guía tiene 3 fases y entrega rutas relativas de imágenes", () => {
    ["press_hombro", "sentadilla"].forEach((id) => {
      const guia = EXERCISE_GUIDES[id];
      expect(guia.fases).toHaveLength(3);
      expect(guia.musculos.length).toBeGreaterThan(0);
      // La carpeta se usa para assets/guides/{carpeta}/fase{n}.jpg
      expect(typeof guia.carpeta).toBe("string");
    });
    expect(EXERCISE_GUIDES.press_hombro.carpeta).toBe("press-militar");
  });

  it("respeta las fases pedidas para cada ejercicio", () => {
    expect(EXERCISE_GUIDES.press_hombro.fases.map((f) => f.titulo)).toEqual([
      "Inicio",
      "Movimiento",
      "Final",
    ]);
    expect(EXERCISE_GUIDES.sentadilla.fases.map((f) => f.titulo)).toEqual([
      "Inicio",
      "Descenso",
      "Profundidad",
    ]);
  });

  it("los ids de guía existen en el catálogo de ejercicios", () => {
    const ids = new Set(EJERCICIOS_CATALOGO.map((e) => e.id));
    Object.keys(EXERCISE_GUIDES).forEach((id) => {
      expect(ids.has(id)).toBe(true);
    });
  });
});

describe("Resolución de ids", () => {
  it("resuelve el alias press-militar hacia press_hombro", () => {
    const guia = ExerciseGuide.porId("press-militar");
    expect(guia).toBe(EXERCISE_GUIDES.press_hombro);
    expect(guia.id).toBe("press_hombro");
  });

  it("devuelve null para ejercicios sin guía", () => {
    expect(ExerciseGuide.porId("press_banca")).toBeNull();
    expect(ExerciseGuide.porId("")).toBeNull();
    expect(ExerciseGuide.porId(null)).toBeNull();
  });
});

describe("Modal ExerciseGuide (DOM)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    if (ExerciseGuide._activo) ExerciseGuide._activo.cerrar();
    document.body.innerHTML = "";
  });

  it("abre el modal con 3 fases y los músculos de sentadilla", () => {
    const ok = ExerciseGuide.abrirPorEjercicio("sentadilla");
    expect(ok).toBe(true);

    const overlay = document.querySelector(".guide-overlay");
    expect(overlay).not.toBeNull();

    const phases = overlay.querySelectorAll(".guide-phase");
    expect(phases.length).toBe(3);
    expect(overlay.querySelector(".guide-title").textContent).toBe("Sentadilla trasera con barra");

    const muscles = overlay.querySelectorAll(".guide-muscle");
    expect(muscles.length).toBe(6);
  });

  it("no abre si el ejercicio no tiene guía", () => {
    const ok = ExerciseGuide.abrirPorEjercicio("press_banca");
    expect(ok).toBe(false);
    expect(document.querySelector(".guide-overlay")).toBeNull();
  });

  it("cierra con la tecla Escape y elimina el overlay", async () => {
    ExerciseGuide.abrirPorEjercicio("press-militar");
    expect(document.querySelector(".guide-overlay")).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    // La salida es transitoria (300ms) y el nodo se elimina después.
    await new Promise((r) => setTimeout(r, 350));
    expect(document.querySelector(".guide-overlay")).toBeNull();
  });
});