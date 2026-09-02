import { describe, it, expect } from "vitest";
import { EJERCICIOS_CATALOGO, GRUPOS_MUSCULARES } from "../src/data/exercises.js";
import { Store } from "../src/store.js";

describe("Catálogo de Ejercicios Extendido", () => {
  it("contiene más de 80 ejercicios categorizados", () => {
    expect(EJERCICIOS_CATALOGO.length).toBeGreaterThanOrEqual(80);
  });

  it("todos los ejercicios tienen atributos obligatorios válidos", () => {
    EJERCICIOS_CATALOGO.forEach((ej) => {
      expect(ej).toHaveProperty("id");
      expect(ej).toHaveProperty("nombre");
      expect(ej).toHaveProperty("musculo");
      expect(ej).toHaveProperty("intensidad");
      expect(ej).toHaveProperty("patron");
      expect(ej).toHaveProperty("equipamiento");
      expect(ej.intensidad).toBeGreaterThanOrEqual(1);
      expect(ej.intensidad).toBeLessThanOrEqual(10);
    });
  });

  it("GRUPOS_MUSCULARES incluye todas las categorías principales", () => {
    const ids = GRUPOS_MUSCULARES.map((g) => g.id);
    expect(ids).toContain("pecho");
    expect(ids).toContain("espalda");
    expect(ids).toContain("piernas");
    expect(ids).toContain("hombros");
    expect(ids).toContain("biceps");
    expect(ids).toContain("triceps");
    expect(ids).toContain("core");
  });

  it("permite agregar y recuperar ejercicios personalizados por perfil", () => {
    const nuevo = Store.agregarEjercicioPersonalizado({
      nombre: "Press Declinado Especial",
      musculo: "pecho",
      intensidad: 8,
      patron: "empuje",
      equipamiento: "barra",
    });

    expect(nuevo.id).toBeDefined();
    expect(nuevo.personalizado).toBe(true);

    const disponibles = Store.getEjerciciosDisponibles();
    const encontrado = disponibles.find((e) => e.nombre === "Press Declinado Especial");
    expect(encontrado).toBeDefined();
    expect(encontrado?.personalizado).toBe(true);
  });
});

describe("Store Reactivo (EventBus)", () => {
  it("emite y escucha eventos personalizados", () => {
    let llamado = false;
    let payloadRecibido = null;

    const unsubscribe = Store.on("test:event", (data) => {
      llamado = true;
      payloadRecibido = data;
    });

    Store.emit("test:event", { score: 100 });
    expect(llamado).toBe(true);
    expect(payloadRecibido).toEqual({ score: 100 });

    // Desuscribir
    unsubscribe();
    llamado = false;
    Store.emit("test:event", { score: 200 });
    expect(llamado).toBe(false);
  });
});
