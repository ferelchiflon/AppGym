/**
 * src/components/exercise-guide.js
 * Guía de ejecución en modal: 3 fases de técnica + músculos implicados
 * con su rol biomecánico.
 *
 * Sin dependencias externas. Los datos de las guías viven en
 * EXERCISE_GUIDES (src/config.js). El modal es un singleton: cada apertura
 * cierra cualquier instancia previa. Los `onerror` de las imágenes muestran
 * un placeholder con el nombre de la fase (las imágenes fase1/2/3.jpg se
 * cargan con rutas relativas desde assets/guides/{carpeta}/).
 */
import { EXERCISE_GUIDES } from "../config.js";

/**
 * Normalización de nombres/ids alternativos hacia los ids reales del
 * catálogo (EJERCICIOS_CATALOGO). El id "press-militar" pedido en la app
 * corresponde al ejercicio "Press militar con barra" del catálogo, que usa
 * el id interno `press_hombro`.
 */
const ID_ALIASES = {
  "press-militar": "press_hombro",
  press_militar: "press_hombro",
  "press militar": "press_hombro",
};

export class ExerciseGuide {
  /**
   * Abre la guía del ejercicio dado su id. Devuelve `true` si la abrió y
   * `false` si el ejercicio no tiene guía registrada.
   * @param {string} id
   * @returns {boolean}
   */
  static abrirPorEjercicio(id) {
    const guia = ExerciseGuide.porId(id);
    if (!guia) return false;
    ExerciseGuide.abrir(guia);
    return true;
  }

  /** Resuelve una guía por id, aplicando aliases del catálogo. */
  static porId(id) {
    if (!id) return null;
    return EXERCISE_GUIDES[ID_ALIASES[id] || id] || null;
  }

  /** Abre el modal con una guía ya resuelta. */
  static abrir(guia) {
    const instancia = new ExerciseGuide(guia);
    instancia.abrir();
    return instancia;
  }

  constructor(guia) {
    this.guia = guia;
    this.overlay = null;
    this._prevFocus = document.activeElement;
    this._onKeydown = null;
  }

  _esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Ruta relativa de la foto de una fase (fase1.jpg, fase2.jpg, fase3.jpg). */
  _imagenFase(i) {
    const guia = this.guia;
    if (guia.imagenes && guia.imagenes[i]) return guia.imagenes[i];
    const carpeta = guia.carpeta || guia.id;
    return `assets/guides/${carpeta}/fase${i + 1}.jpg`;
  }

  abrir() {
    // Singleton: si hay otro modal abierto, lo cierra primero.
    if (ExerciseGuide._activo) ExerciseGuide._activo.cerrar();
    ExerciseGuide._activo = this;

    // Cerrar con Escape.
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.cerrar();
    };

    const overlay = document.createElement("div");
    overlay.className = "guide-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "guide-title");
    this.overlay = overlay;

    const box = document.createElement("div");
    box.className = "guide-box";

    box.append(this._buildHeader(), this._buildFases(), this._buildMusculos());
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Transición de entrada.
    requestAnimationFrame(() => overlay.classList.add("visible"));
    document.body.classList.add("guide-open");
    document.addEventListener("keydown", this._onKeydown);

    // Cierre por click fuera del box.
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.cerrar();
    });

    const closeBtn = overlay.querySelector(".guide-close");
    if (closeBtn) closeBtn.focus();
  }

  _buildHeader() {
    const head = document.createElement("div");
    head.className = "guide-head";

    const copy = document.createElement("div");

    const eyebrow = document.createElement("div");
    eyebrow.className = "guide-eyebrow";
    eyebrow.textContent = "GUÍA DE EJECUCIÓN";

    const title = document.createElement("div");
    title.className = "guide-title";
    title.id = "guide-title";
    title.textContent = this.guia.nombre || "Guía de ejecución";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "guide-close";
    closeBtn.setAttribute("aria-label", "Cerrar guía");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.cerrar());

    copy.append(eyebrow, title);
    head.append(copy, closeBtn);
    return head;
  }

  _buildFases() {
    const phases = document.createElement("div");
    phases.className = "guide-phases";

    const fases = Array.isArray(this.guia.fases) && this.guia.fases.length ? this.guia.fases : [];

    fases.forEach((fase, i) => {
      const card = document.createElement("div");
      card.className = "guide-phase";

      const num = document.createElement("div");
      num.className = "guide-phase-num";
      num.textContent = String(i + 1).padStart(2, "0");

      const imgWrap = document.createElement("div");
      imgWrap.className = "guide-phase-img-wrap";
      imgWrap.dataset.fase = fase.titulo || "Fase " + (i + 1);

      const img = document.createElement("img");
      img.alt = "Fase " + (i + 1) + ": " + (fase.titulo || "");
      img.loading = "lazy";
      img.addEventListener(
        "error",
        () => {
          imgWrap.classList.add("guide-phase-img-fallback");
          img.remove();
        },
        { once: true }
      );
      img.src = this._imagenFase(i);
      imgWrap.appendChild(img);

      const titulo = document.createElement("h4");
      titulo.className = "guide-phase-title";
      titulo.textContent = this._esc(fase.titulo || "");

      const desc = document.createElement("p");
      desc.className = "guide-phase-desc";
      desc.textContent = this._esc(fase.desc || "");

      card.append(num, imgWrap, titulo, desc);
      phases.appendChild(card);
    });

    return phases;
  }

  _buildMusculos() {
    const section = document.createElement("div");
    section.className = "guide-muscles-section";

    const heading = document.createElement("h3");
    heading.textContent = "Músculos implicados";

    const grid = document.createElement("div");
    grid.className = "guide-muscles-grid";

    const musculos = Array.isArray(this.guia.musculos) ? this.guia.musculos : [];
    musculos.forEach((m) => {
      const item = document.createElement("div");
      item.className = "guide-muscle";

      const dot = document.createElement("span");
      dot.className = "guide-muscle-dot";

      const info = document.createElement("span");

      const nombre = document.createElement("strong");
      nombre.textContent = this._esc(m.nombre || "");

      const rol = document.createElement("span");
      rol.className = "guide-muscle-rol";
      rol.textContent = this._esc(m.rol || "");

      info.append(nombre, rol);
      item.append(dot, info);
      grid.appendChild(item);
    });

    section.append(heading, grid);
    return section;
  }

  cerrar() {
    const overlay = this.overlay;
    if (!overlay) return;
    this.overlay = null;
    if (ExerciseGuide._activo === this) ExerciseGuide._activo = null;

    if (this._onKeydown) document.removeEventListener("keydown", this._onKeydown);
    this._onKeydown = null;

    document.body.classList.remove("guide-open");
    overlay.classList.remove("visible");

    // Después de la transición de salida, eliminamos el nodo del DOM.
    setTimeout(() => overlay.remove(), 300);

    // Restaurar el foco que tenía el usuario antes de abrir el modal.
    if (this._prevFocus && document.contains(this._prevFocus)) this._prevFocus.focus();
  }
}