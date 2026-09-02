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
export class AppNavigator {
  constructor() {
    this._titles = {
      dashboard: "Inicio",
      workout: "Entrenamiento",
      history: "Historial",
      progress: "Progreso",
      profile: "Perfil",
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
    this.setTitle(this._titles[tab] || tab);

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
      this.setTitle(this._titles[tab] || tab);
    }
  }
}