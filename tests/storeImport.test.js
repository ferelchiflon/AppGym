import { describe, it, expect, beforeEach } from "vitest";
import { Store, LIMITE_BACKUP_BYTES } from "../src/store.js";

/**
 * Módulo de prueba dedicado a la seguridad de la importación de backups
 * (Fase 1, hallazgo S2): límite de tamaño, validación de estructura y
 * sanitización contra Prototype Pollution / claves no permitidas.
 */

function backupValido() {
  return {
    version: "6.0",
    activeProfileId: "abc",
    profiles: {
      abc: {
        id: "abc",
        nombre: "Atleta",
        perfil: { edad: 30, objetivo: "fuerza" },
        medidas: { pecho: 95, cintura: 80 },
        rutina: ["ej1"],
        historial: [],
        plantillas: [],
      },
    },
  };
}

describe("Store.importarTodo — sanitización y límites de backups", () => {
  beforeEach(() => {
    if (globalThis.localStorage) globalThis.localStorage.clear();
    Store._cache = null;
  });

  it("restaura un backup válido y queda reflejado en Store.cargar()", () => {
    const data = Store.importarTodo(JSON.stringify(backupValido()));
    expect(data.activeProfileId).toBe("abc");
    expect(data.profiles.abc.nombre).toBe("Atleta");
    expect(Store.getData().profiles.abc.perfil.edad).toBe(30);
    expect(Store.getData().profiles.abc.medidas.pecho).toBe(95);
  });

  it("rechaza un archivo corrupto o que no es JSON", () => {
    expect(() => Store.importarTodo("{oops")).toThrow("El archivo no es un JSON válido");
    expect(() => Store.importarTodo("no soy json")).toThrow("El archivo no es un JSON válido");
    expect(() => Store.importarTodo("")).toThrow("El archivo no es un JSON válido");
  });

  it("rechaza un JSON sin la sección profiles o sin perfiles", () => {
    expect(() => Store.importarTodo(JSON.stringify({ restaurado: true })))
      .toThrow(/sección "profiles"/);
    expect(() => Store.importarTodo(JSON.stringify({ profiles: {} })))
      .toThrow(/sección "profiles"/);
    expect(() => Store.importarTodo('"solo un string"'))
      .toThrow(/sección "profiles"/);
  });

  it("rechaza un archivo sobredimensionado (> 10 MB) aunque el JSON parcial sea válido", () => {
    const sobredimensionado =
      '{"profiles":{},"relleno":"' + "a".repeat(LIMITE_BACKUP_BYTES + 1) + '"}';
    expect(() => Store.importarTodo(sobredimensionado)).toThrow("tamaño máximo permitido");
  });

  it("bloquea Prototype Pollution: descarta __proto__/constructor como claves de perfil", () => {
    const malicioso = backupValido();
    Object.defineProperty(malicioso.profiles, "__proto__", {
      value: { polluted: true },
      enumerable: true,
      configurable: true,
    });
    malicioso.profiles.constructor = { polluted: true };
    malicioso.profiles.prototype = { polluted: true };

    const data = Store.importarTodo(JSON.stringify(malicioso));

    expect(Object.prototype).not.toHaveProperty("polluted");
    expect(Object.keys(data.profiles)).not.toContain("__proto__");
    expect(Object.keys(data.profiles)).not.toContain("constructor");
    expect(Object.keys(data.profiles)).not.toContain("prototype");
  });

  it("elimina por allowlist las claves desconocidas o sospechosas de cada perfil", () => {
    const backup = backupValido();
    backup.profiles.abc.__proto__ = {};
    backup.profiles.abc.__malicioso = "x";
    backup.profiles.abc["$modo"] = "y";
    backup.profiles.abc.historial = [{ fecha: "01/01/2026" }];

    const data = Store.importarTodo(JSON.stringify(backup));

    expect(data.profiles.abc).not.toHaveProperty("__proto__");
    expect(data.profiles.abc).not.toHaveProperty("__malicioso");
    expect(data.profiles.abc).not.toHaveProperty("$=modo");
    // Las claves permitidas sí se conservan.
    expect(data.profiles.abc.nombre).toBe("Atleta");
    expect(data.profiles.abc.historial).toHaveLength(1);
  });

  it("repara activeProfileId si apunta a un perfil inexistente", () => {
    const backup = backupValido();
    backup.activeProfileId = "no-existe";
    const data = Store.importarTodo(JSON.stringify(backup));
    expect(data.activeProfileId).toBe("abc");
  });

  it("sobrescribe de forma segura el estado sin dejar referencias al JSON original", () => {
    const backup = backupValido();
    const data = Store.importarTodo(JSON.stringify(backup));
    // Mutar el resultado no debe alterar la fuente (clonado profundo).
    data.profiles.abc.nombre = "Cambiado";
    backup.profiles.abc.nombre = "Original";
    const reloaded = Store.importarTodo(JSON.stringify(backup));
    expect(reloaded.profiles.abc.nombre).toBe("Original");
  });
});