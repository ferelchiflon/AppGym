/**
 * tests/usability.test.js
 * Verifica las funcionalidades de usabilidad añadidas sin romper el arranque:
 *  - Modo Gimnasio: el conmutador activa/desactiva body.gym-mode y persiste.
 *  - Atajos: la tecla R reinicia el timer (y NO dispara dentro de un input).
 *  - i18n: el selector cambia data-lang, repinta data-i18n y persiste.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";

describe("Usabilidad: Modo Gimnasio, atajos de teclado e i18n", () => {
  let app;

  beforeAll(async () => {
    const html = readFileSync(process.cwd() + "/index.html", "utf8");
    document.documentElement.innerHTML = html;

    // index.html ya no contiene el markup completo: se ensambla desde
    // src/views/* en #app (igual que hace src/main.js) ANTES de instanciar,
    // porque el binding centralizado por ID de AppGymPro requiere ese DOM.
    const root = document.getElementById("app");
    if (root) {
      const { default: appLayout } = await import("../src/views/index.js");
      root.innerHTML = appLayout.join("\n");
    }

    const { Toast } = await import("../src/toast.js");
    Toast.init();
    const { AppGymPro } = await import("../src/app.js");
    app = new AppGymPro();
  });

  it("el conmutador de Modo Gimnasio activa/desactiva body.gym-mode y aria-pressed", () => {
    const boton = document.getElementById("gymModeBtn");
    const drawerBoton = document.getElementById("gymModeDrawerBtn");
    expect(boton).toBeTruthy();
    expect(drawerBoton).toBeTruthy();

    boton.click();
    expect(document.body.classList.contains("gym-mode")).toBe(true);
    expect(document.body.getAttribute("data-gym")).toBe("on");
    expect(boton.getAttribute("aria-pressed")).toBe("true");
    expect(drawerBoton.getAttribute("aria-pressed")).toBe("true");

    boton.click();
    expect(document.body.classList.contains("gym-mode")).toBe(false);
    expect(document.body.getAttribute("data-gym")).toBe("off");
    expect(boton.getAttribute("aria-pressed")).toBe("false");
  });

  it("la tecla R reinicia el timer y no se dispara al escribir en un input", () => {
    const timer = app.timer;
    timer.setTiempo(2, 30);
    timer.iniciar();

    // Fuera de campos de texto: R reinicia (pausa + vuelve a total).
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(timer.corriendo).toBe(false);
    expect(timer.segundosRestantes).toBe(timer.segundosTotales);

    // Dentro de un input la tecla R NO debe reiniciar (guard de edición).
    timer.iniciar();
    const input = document.getElementById("seriePeso");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
    expect(timer.corriendo).toBe(true);
    timer.detener();
  });

  it("el selector de idioma cambia data-lang, repinta data-i18n y restaura", () => {
    const sel = document.getElementById("langSelect");
    const tab = document.querySelector('[data-i18n="nav.tab.progress"]');
    expect(sel).toBeTruthy();
    expect(sel.value).toBe("es");

    sel.value = "en";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    expect(document.documentElement.getAttribute("data-lang")).toBe("en");
    expect(tab.textContent).toBe("Progress");

    sel.value = "es";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    expect(document.documentElement.getAttribute("data-lang")).toBe("es");
    expect(tab.textContent).toBe("Progreso");
  });
});