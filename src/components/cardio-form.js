/**
 * src/components/cardio-form.js
 * Modal para registrar una sesión de cardio desde el dashboard.
 *
 * Construye el formulario con DOM nativo (sin innerHTML con datos de usuario),
 * siguiendo el patrón del modal de ExerciseGuide: singleton, cierre con
 * Escape / click en el fondo, foco inicial en el primer campo y restauración
 * del foco al cerrar. Reutiliza clases existentes (.dialog-overlay, .dialog-box,
 * .dialog-acciones, .btn-scale, .wstar, .guide-close) para no crear un sistema
 * visual nuevo.
 *
 * Depende de: ../gestor-cardio.js (TIPOS_CARDIO_LABELS), ../toast.js
 */
import { TIPOS_CARDIO_LABELS } from "../gestor-cardio.js";
import { Toast } from "../toast.js";

export class CardioForm {
  /**
   * Abre el modal con un GestorCardio ya inyectado.
   * @param {Object} gestor GestorCardio (debe tener registrar()).
   * @param {{ onGuardado?: (sesion:Object|null) => void }} [opts]
   * @returns {CardioForm|null} null si el gestor no es válido.
   */
  static abrir(gestor, opts = {}) {
    if (!gestor || typeof gestor.registrar !== "function") return null;
    if (CardioForm._activo) CardioForm._activo.cerrar();
    const instancia = new CardioForm(gestor, opts);
    instancia.abrir();
    return instancia;
  }

  constructor(gestor, { onGuardado = null } = {}) {
    this.gestor = gestor;
    this.onGuardado = typeof onGuardado === "function" ? onGuardado : null;
    this.overlay = null;
    this._prevFocus = document.activeElement;
    this._onKeydown = null;
    this._rpe = 0;
    this._distanciaWrap = null;
    this._errorEl = null;
  }

  abrir() {
    // Singleton: si hay otro modal abierto, lo cierra primero.
    if (CardioForm._activo) CardioForm._activo.cerrar();
    CardioForm._activo = this;

    // Cerrar con Escape.
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.cerrar();
    };

    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "cardioFormTitle");
    this.overlay = overlay;

    const box = document.createElement("div");
    box.className = "dialog-box cardio-form-dialog";
    box.append(this._buildHeader(), this._buildForm());

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.body.classList.add("guide-open"); // bloquea el scroll del fondo
    document.addEventListener("keydown", this._onKeydown);

    // Cerrar al hacer click en el fondo (fuera del cuadro).
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.cerrar();
    });

    requestAnimationFrame(() => {
      overlay.classList.remove("hidden");
      const primer = overlay.querySelector("#cardioDuracion") || overlay.querySelector("#cardioTipo");
      if (primer) primer.focus();
    });
  }

  _buildHeader() {
    const head = document.createElement("div");
    head.className = "cardio-form-head";

    const copy = document.createElement("div");

    const eyebrow = document.createElement("div");
    eyebrow.className = "guide-eyebrow cardio-eyebrow";
    eyebrow.textContent = "CARDIO";

    const title = document.createElement("h2");
    title.className = "cardio-form-title";
    title.id = "cardioFormTitle";
    title.textContent = "Registrar sesión de cardio";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "guide-close";
    closeBtn.setAttribute("aria-label", "Cerrar registro de cardio");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.cerrar());

    copy.append(eyebrow, title);
    head.append(copy, closeBtn);
    return head;
  }

  /** Selector RPE 1-10 reutilizando el patrón visual .wstar del wellness. */
  _buildRpe() {
    const wrap = document.createElement("div");
    wrap.className = "cardio-rpe";

    for (let n = 1; n <= 10; n++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wstar cardio-rpe-btn";
      btn.dataset.val = String(n);
      btn.setAttribute("aria-label", `Esfuerzo ${n}`);
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = String(n);
      btn.addEventListener("click", () => this._seleccionarRpe(n));
      wrap.appendChild(btn);
    }
    return wrap;
  }

  _seleccionarRpe(val) {
    this._rpe = val;
    const btns = this.overlay ? this.overlay.querySelectorAll(".cardio-rpe-btn") : [];
    btns.forEach((btn) => {
      const activo = parseInt(btn.dataset.val, 10) <= val;
      btn.classList.toggle("on", activo);
      btn.setAttribute("aria-pressed", activo ? "true" : "false");
    });
    this._ocultarError();
  }

  _buildInput({ id, label, required = false, min = null, step = "any", placeholder = "" }) {
    const field = document.createElement("div");
    field.className = "cardio-form-field";

    const lbl = document.createElement("label");
    lbl.setAttribute("for", id);
    lbl.textContent = label;

    const input = document.createElement("input");
    input.type = "number";
    input.id = id;
    input.name = id;
    if (required) input.required = true;
    if (min !== null) input.min = String(min);
    if (step) input.step = step;
    if (placeholder) input.placeholder = placeholder;

    field.append(lbl, input);
    return field;
  }

  _buildForm() {
    const form = document.createElement("form");
    form.className = "cardio-form";
    form.setAttribute("novalidate", "true");

    // Tipo (whitelist desde TIPOS_CARDIO_LABELS del gestor).
    const tipoField = document.createElement("div");
    tipoField.className = "cardio-form-field";

    const tipoLbl = document.createElement("label");
    tipoLbl.setAttribute("for", "cardioTipo");
    tipoLbl.textContent = "Tipo";

    const select = document.createElement("select");
    select.id = "cardioTipo";
    select.name = "cardioTipo";
    Object.entries(TIPOS_CARDIO_LABELS).forEach(([clave, label]) => {
      const opt = document.createElement("option");
      opt.value = clave;
      opt.textContent = label;
      select.appendChild(opt);
    });
    select.value = "correr";
    select.addEventListener("change", () => this._syncDistancia());
    tipoField.append(tipoLbl, select);

    // Duración + distancia en una cuadrícula de 2 columnas.
    const grid = document.createElement("div");
    grid.className = "cardio-form-grid";

    const duracion = this._buildInput({
      id: "cardioDuracion",
      label: "Duración (min)",
      required: true,
      min: "0",
      step: "any",
    });

    const distanciaWrap = document.createElement("div");
    distanciaWrap.className = "cardio-form-field";
    distanciaWrap.id = "cardioDistanciaWrap";

    const distLbl = document.createElement("label");
    distLbl.setAttribute("for", "cardioDistancia");
    distLbl.textContent = "Distancia (km)";

    const distInput = document.createElement("input");
    distInput.type = "number";
    distInput.id = "cardioDistancia";
    distInput.name = "cardioDistancia";
    distInput.min = "0";
    distInput.step = "any";
    distInput.placeholder = "Opcional";

    distanciaWrap.append(distLbl, distInput);
    this._distanciaWrap = distanciaWrap;

    grid.append(duracion, distanciaWrap);

    // FC promedio (opcional).
    const fc = this._buildInput({
      id: "cardioFc",
      label: "FC media (ppm)",
      min: "0",
      step: "1",
      placeholder: "Opcional",
    });

    // RPE obligatorio (1-10).
    const rpeField = document.createElement("div");
    rpeField.className = "cardio-form-field";

    const rpeLbl = document.createElement("label");
    rpeLbl.id = "cardioRpeLabel";
    rpeLbl.textContent = "Esfuerzo percibido (RPE 1-10) · obligatorio";

    rpeField.append(rpeLbl, this._buildRpe());

    // Notas (opcional).
    const notasField = document.createElement("div");
    notasField.className = "cardio-form-field";

    const notasLbl = document.createElement("label");
    notasLbl.setAttribute("for", "cardioNotas");
    notasLbl.textContent = "Notas";

    const notas = document.createElement("textarea");
    notas.id = "cardioNotas";
    notas.name = "cardioNotas";
    notas.rows = 2;
    notas.placeholder = "Opcional";

    notasField.append(notasLbl, notas);

    // Mensaje de error de validación.
    const error = document.createElement("p");
    error.className = "cardio-form-error hidden";
    error.setAttribute("role", "alert");
    this._errorEl = error;

    // Acciones.
    const acciones = document.createElement("div");
    acciones.className = "dialog-acciones";

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "secondary";
    cancelar.textContent = "Cancelar";
    cancelar.addEventListener("click", () => this.cerrar());

    const guardar = document.createElement("button");
    guardar.type = "submit";
    guardar.className = "btn-scale cta-block";
    guardar.textContent = "Guardar sesión";

    acciones.append(cancelar, guardar);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this._enviar();
    });

    form.append(tipoField, grid, fc, rpeField, notasField, error, acciones);
    return form;
  }

  /** Si el tipo es "otro" no aplica distancia: la oculta y la limpia. */
  _syncDistancia() {
    if (!this.overlay) return;
    const tipo = this.overlay.querySelector("#cardioTipo").value;
    const oculto = tipo === "otro";
    if (this._distanciaWrap) this._distanciaWrap.classList.toggle("cardio-form-hidden", oculto);
    const input = this.overlay.querySelector("#cardioDistancia");
    if (oculto && input) input.value = "";
  }

  _ocultarError() {
    if (this._errorEl) this._errorEl.classList.add("hidden");
  }

  _mostrarError(msg) {
    if (this._errorEl) {
      this._errorEl.textContent = msg;
      this._errorEl.classList.remove("hidden");
    }
  }

  _enviar() {
    const overlay = this.overlay;
    if (!overlay) return;

    const tipo = overlay.querySelector("#cardioTipo").value;
    const duracion = overlay.querySelector("#cardioDuracion").value;
    const distancia = overlay.querySelector("#cardioDistancia").value;
    const fc = overlay.querySelector("#cardioFc").value;
    const notas = overlay.querySelector("#cardioNotas").value;

    // Validación ANTES de llamar al gestor: duración y RPE son obligatorios
    // (mismas reglas que valida GestorCardio internamente, pero con feedback
    // inmediato sin depender solo del return null del gestor).
    const duracionOk = parseFloat(duracion) > 0;
    const rpeOk = Number(this._rpe) >= 1;

    if (!duracionOk || !rpeOk) {
      const faltantes = [];
      if (!duracionOk) faltantes.push("la duración");
      if (!rpeOk) faltantes.push("el esfuerzo percibido (RPE)");
      this._mostrarError(`Completa ${faltantes.join(" y ")} para guardar la sesión.`);
      const foco = !duracionOk
        ? overlay.querySelector("#cardioDuracion")
        : overlay.querySelector(".cardio-rpe-btn");
      if (foco) foco.focus();
      return;
    }

    const datos = { tipo, duracion: parseFloat(duracion), distancia, fc, rpe: this._rpe, notas };

    const sesion = this.gestor.registrar(datos);
    if (!sesion) {
      Toast.mostrar("No se pudo guardar la sesión de cardio", "error");
      this._mostrarError("Revisa los datos e intentalo de nuevo.");
      return;
    }

    Toast.mostrar("Sesión de cardio guardada", "success");
    this.cerrar();
    if (this.onGuardado) this.onGuardado(sesion);
  }

  cerrar() {
    const overlay = this.overlay;
    if (!overlay) return;
    this.overlay = null;
    if (CardioForm._activo === this) CardioForm._activo = null;

    if (this._onKeydown) document.removeEventListener("keydown", this._onKeydown);
    this._onKeydown = null;

    document.body.classList.remove("guide-open");
    overlay.classList.add("hidden");

    // Después de la transición de salida, eliminamos el nodo del DOM.
    setTimeout(() => overlay.remove(), 250);

    // Restaurar el foco que tenía el usuario antes de abrir el modal.
    if (this._prevFocus && document.contains(this._prevFocus)) this._prevFocus.focus();
  }
}