import { describe, it, expect, afterEach } from "vitest";
import drawerViewHtml from "../src/views/drawer.js";
import {
  aplicarTraduccionesEstaticas,
  aplicarIdioma,
} from "../src/i18n.js";

/**
 * Regresión del menú de navegación (drawer): los 6 emojis de sistema se
 * reemplazaron por SVG (Lucide) consistentes con el resto del proyecto.
 *
 * CRÍTICO: cada <svg> es HERMANO de un <span data-i18n>. Si el data-i18n
 * estuviera en el contenedor (group-title / label), cada cambio de idioma
 * haría `el.textContent = traducción`, borrando el ícono junto al texto viejo
 * (aplicarTraduccionesEstaticas reemplaza TODO el contenido del elemento).
 * Estos tests verifican exactamente eso: los íconos ONVIVEN al repintado.
 */
function mount() {
  const host = document.createElement("div");
  host.id = "host-drawer-test";
  host.innerHTML = drawerViewHtml;
  document.body.appendChild(host);
  return host;
}

/** Rango de emojis "de sistema" que queremos que ya no aparezcan. */
function tieneEmoji(txt) {
  return /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(txt || "");
}

const CLAVES = [
  "drawer.group.inicio",
  "drawer.group.progreso",
  "drawer.group.perfil",
  "drawer.group.apariencia",
  "drawer.group.herramientas",
  "idioma.label",
];

describe("Drawer · íconos SVG del menú (regresión i18n/XSS)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("expone los 6 íconos SVG (reemplazando los emojis del sistema)", () => {
    const host = mount();
    const svgs = host.querySelectorAll(".drawer-icon");
    expect(svgs.length).toBe(6);
    svgs.forEach((svg) => {
      // Mismo patrón Lucide que el resto del proyecto.
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(svg.getAttribute("fill")).toBe("none");
      expect(svg.getAttribute("stroke")).toBe("currentColor");
      expect(svg.getAttribute("stroke-width")).toBe("2");
    });

    // Ningún título lleva emoji de sistema.
    CLAVES.forEach((k) => {
      const el = host.querySelector(`[data-i18n="${k}"]`);
      expect(el).toBeTruthy();
      expect(tieneEmoji(el.textContent)).toBe(false);
    });
  });

  it("el data-i18n vive en el <span> interno, NO en el contenedor del <svg>", () => {
    const host = mount();
    document.querySelectorAll(".drawer-icon").forEach((svg) => {
      // El contenedor donde vive el svg no debe tener data-i18n.
      expect(svg.parentElement.hasAttribute("data-i18n")).toBe(false);
    });
    // El span con data-i18n sí es hermano del svg.
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.closest(".drawer-icon")) {
        expect(el.parentElement.querySelector(".drawer-icon")).toBeTruthy();
      }
    });
  });

  it("los íconos sobreviven a un cambio de idioma (EN y de vuelta a ES)", () => {
    const host = mount();

    // 1er repintado (montaje en es).
    aplicarTraduccionesEstaticas(host);
    expect(host.querySelectorAll(".drawer-icon").length).toBe(6);

    // Cambio a inglés: se repinta TODO el documento; los íconos deben seguir.
    aplicarIdioma("en", false);
    expect(host.querySelectorAll(".drawer-icon").length).toBe(6);
    expect(host.querySelector('[data-i18n="drawer.group.inicio"]').textContent).toBe("Home");
    expect(host.querySelector('[data-i18n="drawer.group.herramientas"]').textContent).toBe("Extra tools");

    // De vuelta a español.
    aplicarIdioma("es", false);
    expect(host.querySelectorAll(".drawer-icon").length).toBe(6);
    expect(host.querySelector('[data-i18n="drawer.group.inicio"]').textContent).toBe("Inicio");
    expect(host.querySelector('[data-i18n="idioma.label"]').textContent).toBe("Idioma");
  });
});