/**
 * Smoketest temporal: arranca la app real (main.js) con el DOM completo de
 * index.html y verifica que AppGymPro se inicializa sin lanzar excepciones.
 * Si cualquier controlador rompe, los botones no responden.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";

describe("Arranque real de la app", () => {
  let errores = [];
  let appCreado = false;

  beforeAll(async () => {
    // Cargar el DOM real de index.html dentro de jsdom
    const html = readFileSync(process.cwd() + "/index.html", "utf8");
    document.documentElement.innerHTML = html;

    // Capturar errores de consola/ventana
    const origError = console.error;
    console.error = (...a) => {
      errores.push(a.map(String).join(" "));
      origError(...a);
    };
    window.addEventListener("error", (e) => errores.push("window.error: " + e.message));

    // Importar main.js (que define el listener de DOMContentLoaded)
    const main = await import("../src/main.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));
    appCreado = typeof window.app !== "undefined" && !!window.app;
  });

  it("crea la instancia AppGymPro sin error", () => {
    expect(appCreado).toBe(true);
  });

  it("no lanza errores de consola al arrancar", () => {
    expect(errores).toEqual([]);
  });
});