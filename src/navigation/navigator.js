/**
 * src/navigation/navigator.js
 * Gestor de navegación móvil-rediseñado.
 *
 * - Drawer lateral que se abre desde la izquierda (menú hamburguesa ☰).
 * - Overlay oscuro detrás, cierre con ✕, click fuera o tecla ESC (transición 300ms).
 * - Vista única: sólo la sección activa es visible; el menú cambia la vista.
 * - Título de la sección actual en el header.
 * - Soporte de anclado: un ítem puede navegar a una sección y hacer scroll
 *   hasta una card concreta (data-scroll="idDelCard").
 */
import { t } from "../i18n.js";

export class AppNavigator {
  constructor() {
    this._titles = {
      dashboard: "nav.header.dashboard",
      workout: "nav.header.workout",
      history: "nav.header.history",
      progress: "nav.header.progress",
      profile: "nav.header.profile",
    };

    this._hamburger = null;
    this._drawer = null;
    this._overlay = null;
    this._closeBtn = null;
    this._headerTitle = null;
    this._onTabEnter = null; // callback(tab) -> opcional, p.ej. renderizar analytics
  }

  init() {
    this._hamburger = document.getElementById("hamburgerBtn");
    this._drawer = document.getElementById("drawer");
    this._overlay = document.getElementById("drawerOverlay");
    this._closeBtn = document.getElementById("drawerCloseBtn");
    this._headerTitle = document.getElementById("headerTitle");
    this._body = document.body;

    // Deep-linking para shortcuts del manifest (p.ej. ?tab=workout o #workout).
    // Permite que Chrome/Android abran una vista concreta al lanzar la app
    // desde un acceso directo, sin recarga completa (SPA de una sola página).
    this.syncFromDeepLink();
    window.addEventListener("hashchange", () => this.syncFromDeepLink());

    this._hamburger?.addEventListener("click", () => this.toggle());
    this._closeBtn?.addEventListener("click", () => this.close());
    this._overlay?.addEventListener("click", () => this.close());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });

    const items = this._drawer?.querySelectorAll("[data-nav-target]") || [];
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const tab = item.getAttribute("data-nav-target");
        const scrollTarget = item.getAttribute("data-scroll") || null;
        this.goTo(tab, scrollTarget);
        this.close();
      });
    });

    this._syncPayload();
    return this;
  }

  setOnTabEnter(fn) {
    this._onTabEnter = typeof fn === "function" ? fn : null;
    return this;
  }

  open() {
    if (!this._drawer || !this._overlay) return;
    this._drawer.classList.add("open");
    this._overlay.classList.add("open");
    this._hamburger?.setAttribute("aria-expanded", "true");
    if (this._drawer) this._drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  close() {
    if (!this._drawer || !this._overlay) return;
    this._drawer.classList.remove("open");
    this._overlay.classList.remove("open");
    this._hamburger?.setAttribute("aria-expanded", "false");
    if (this._drawer) this._drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  toggle() {
    if (this._drawer?.classList.contains("open")) this.close();
    else this.open();
  }

  /**
   * Navega a una sección (pane) y opcionalmente hace scroll a un card anidado.
   * Mantiene sincronizados el drawer, el bottom-nav y el título del header.
   */
  goTo(tab, scrollTarget) {
    if (!tab) return;
    const targetId = "tab-" + tab;

    // 1) Mostrar sólo la sección objetivo
    const panes = document.querySelectorAll(".tab-pane");
    panes.forEach((p) => p.classList.toggle("active", p.id === targetId));

    // 2) Sincronizar bottom-nav
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach((t) => {
      const active = t.getAttribute("data-tab") === tab;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });

    // 3) Título de la sección actual en el header
    this._tabActual = tab;
    this.setTitle(t(this._titles[tab] || tab));

    // 4) Hook opcional (p.ej. renderizar analytics al entrar a progreso)
    if (this._onTabEnter) this._onTabEnter(tab);

    // 5) Scroll vertical a la "base" de la sección o a una card concreta
    const delay = 60;
    if (scrollTarget) {
      const card = document.getElementById(scrollTarget);
      if (card) {
        setTimeout(() => {
          if (typeof card.scrollIntoView === "function") {
            card.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          const top = this._offsetTop(card) - 70;
          if (top > 0) window.scrollTo({ top, behavior: "smooth" });
        }, delay);
        return;
      }
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), delay);
  }

  setTitle(text) {
    if (this._headerTitle && text) this._headerTitle.textContent = text;
  }

  /** Re-traduce el título de la pestaña activa (se llama al cambiar de idioma). */
  refreshTitle() {
    const tab = this._tabActual || "dashboard";
    this.setTitle(t(this._titles[tab] || tab));
  }

  _offsetTop(el) {
    let top = 0;
    let node = el;
    while (node) {
      top += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return top;
  }

  // Asegura el estado inicial (pane activo por defecto y su título).
  _syncPayload() {
    const activePane = document.querySelector(".tab-pane.active");
    if (activePane) {
      const tab = activePane.id.replace("tab-", "");
      this.setTitle(t(this._titles[tab] || tab));
    }
  }

  /**
   * Lee la URL (query `?tab=` o hash `#<tab>`) y navega a la vista indicada.
   * Soportado: ?tab=dashboard|workout|history|progress|profile
   *            #workout, #history, etc.
   * Opcionalmente acepta un ancla secundaria (<tab>/<scrollTarget> vía hash).
   * Las entradas inválidas se ignoran de forma silenciosa (arranque normal).
   */
  _syncFromDeepLink() {
    const TABS = new Set(Object.keys(this._titles));
    let tab = null;
    let scrollTarget = null;

    // 1) Query param: ./index.html?tab=workout
    const params = new URLSearchParams(location.search);
    const qTab = params.get("tab");
    if (qTab && TABS.has(qTab)) tab = qTab;

    // 2) Hash: ./index.html#workout o #workout/rutinaCard
    const hash = (location.hash || "").replace(/^#/, "");
    if (hash) {
      const [hTab, hTarget] = hash.split("/");
      if (TABS.has(hTab)) {
        tab = hTab;
        if (hTarget) scrollTarget = hTarget;
      }
    }

    if (!tab) return;
    this._tabActual = tab;
    this.goTo(tab, scrollTarget);
  }

  /** Alias público para re-sincronizar el deep-link desde fuera (p.ej. app.js). */
  syncFromDeepLink() {
    this._syncFromDeepLink();
  }
}