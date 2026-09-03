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

  it("cada guía tiene 3 fases, imagen principal y músculos", () => {
    ["press_hombro", "sentadilla"].forEach((id) => {
      const guia = EXERCISE_GUIDES[id];
      expect(guia.fases).toHaveLength(3);
      expect(guia.musculos.length).toBeGreaterThan(0);
      // La infografía única se carga desde assets/guides/ (ruta relativa).
      expect(typeof guia.imagen).toBe("string");
      expect(guia.imagen.startsWith("assets/guides/")).toBe(true);
      // Las fases solo llevan texto: sin imagen individual por fase.
      guia.fases.forEach((f) => {
        expect(typeof f.titulo).toBe("string");
        expect(typeof f.desc).toBe("string");
      });
    });
    expect(EXERCISE_GUIDES.press_hombro.imagen).toBe("assets/guides/press-militar.jpg");
    expect(EXERCISE_GUIDES.sentadilla.imagen).toBe("assets/guides/sentadilla.jpg");
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

  it("muestra 1 imagen principal y 3 fases de texto (sin imagen por fase)", () => {
    const ok = ExerciseGuide.abrirPorEjercicio("press-militar");
    expect(ok).toBe(true);

    const overlay = document.querySelector(".guide-overlay");
    const box = overlay.querySelector(".guide-box");

    // Orden del modal: header → imagen principal → fases → músculos.
    const children = [...box.children];
    expect(children[0].classList.contains("guide-head")).toBe(true);
    expect(children[1].classList.contains("guide-main-image")).toBe(true);
    expect(children[2].classList.contains("guide-phases")).toBe(true);
    expect(children[3].classList.contains("guide-muscles-section")).toBe(true);

    // Una sola imagen principal, con la ruta de la infografía completa.
    const principal = box.querySelector(".guide-main-image");
    const imgPrincipal = principal.querySelector("img");
    expect(imgPrincipal).not.toBeNull();
    expect(imgPrincipal.src.endsWith("assets/guides/press-militar.jpg")).toBe(true);

    // 3 fases son bloques de texto: número + título + desc, sin <img>.
    const phases = box.querySelectorAll(".guide-phase");
    expect(phases.length).toBe(3);
    phases.forEach((p) => {
      expect(p.querySelector("img")).toBeNull();
      expect(p.querySelector(".guide-phase-num")).not.toBeNull();
      expect(p.querySelector(".guide-phase-title")).not.toBeNull();
      expect(p.querySelector(".guide-phase-desc")).not.toBeNull();
    });

    // En todo el modal hay exactamente una imagen.
    expect(overlay.querySelectorAll("img").length).toBe(1);
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