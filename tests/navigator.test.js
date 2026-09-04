import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppNavigator } from "../src/navigation/navigator.js";

describe("AppNavigator", () => {
  let navigator;

  beforeEach(() => {
    document.body.innerHTML = `
      <header>
        <button id="hamburgerBtn" aria-expanded="false"></button>
        <span id="headerTitle"></span>
      </header>
      <div id="drawer" class="" aria-hidden="true">
        <button id="drawerCloseBtn"></button>
        <button data-nav-target="history" data-scroll="card-historial">Historial</button>
      </div>
      <div id="drawerOverlay" class=""></div>
      <div id="tab-workout" class="tab-pane active"></div>
      <div id="tab-history" class="tab-pane">
        <div id="card-historial"></div>
      </div>
      <div id="tab-progress" class="tab-pane"></div>
      <div id="tab-profile" class="tab-pane"></div>
      <nav>
        <button class="nav-tab active" data-tab="workout"></button>
        <button class="nav-tab" data-tab="history"></button>
      </nav>
    `;

    navigator = new AppNavigator();
    navigator.init();
  });

  it("inicializa sincronizando el pane activo y su titulo", () => {
    const title = document.getElementById("headerTitle");
    expect(title.textContent).toBe("Entrenamiento");
  });

  it("abre y cierra el drawer modificando clases y atributos aria", () => {
    const drawer = document.getElementById("drawer");
    const overlay = document.getElementById("drawerOverlay");
    const hamburger = document.getElementById("hamburgerBtn");

    navigator.open();
    expect(drawer.classList.contains("open")).toBe(true);
    expect(overlay.classList.contains("open")).toBe(true);
    expect(hamburger.getAttribute("aria-expanded")).toBe("true");
    expect(drawer.getAttribute("aria-hidden")).toBe("false");

    navigator.close();
    expect(drawer.classList.contains("open")).toBe(false);
    expect(overlay.classList.contains("open")).toBe(false);
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");
    expect(drawer.getAttribute("aria-hidden")).toBe("true");
  });

  it("toggle alterna entre abierto y cerrado", () => {
    const drawer = document.getElementById("drawer");
    navigator.toggle();
    expect(drawer.classList.contains("open")).toBe(true);
    navigator.toggle();
    expect(drawer.classList.contains("open")).toBe(false);
  });

  it("goTo cambia de tab, actualiza titulo y sincroniza nav-tabs", () => {
    const onTabEnterSpy = vi.fn();
    navigator.setOnTabEnter(onTabEnterSpy);

    navigator.goTo("history");

    const tabWorkout = document.getElementById("tab-workout");
    const tabHistory = document.getElementById("tab-history");
    const headerTitle = document.getElementById("headerTitle");
    const historyNavTab = document.querySelector('.nav-tab[data-tab="history"]');
    const workoutNavTab = document.querySelector('.nav-tab[data-tab="workout"]');

    expect(tabWorkout.classList.contains("active")).toBe(false);
    expect(tabHistory.classList.contains("active")).toBe(true);
    expect(headerTitle.textContent).toBe("Historial");
    expect(historyNavTab.classList.contains("active")).toBe(true);
    expect(workoutNavTab.classList.contains("active")).toBe(false);
    expect(onTabEnterSpy).toHaveBeenCalledWith("history");
  });

  it("cierra el drawer al presionar Escape", () => {
    navigator.open();
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    const drawer = document.getElementById("drawer");
    expect(drawer.classList.contains("open")).toBe(false);
  });

  it("syncFromDeepLink navega según el hash o query param", () => {
    window.location.hash = "#history/card-historial";
    navigator.syncFromDeepLink();

    const tabHistory = document.getElementById("tab-history");
    expect(tabHistory.classList.contains("active")).toBe(true);
    expect(document.getElementById("headerTitle").textContent).toBe("Historial");

    window.location.hash = "";
  });
});
