/**
 * src/controllers/workout.controller.js
 * Controlador de la vista "Entrenar".
 * Maneja catálogo de ejercicios, filtro por grupo muscular, creación de ejercicios personalizados,
 * rutina del día, formulario rápido de series, cálculo de 1RM, warm-up y calculadora de discos.
 *
 * Fase 2 (Paso B): renders DOM en renderers/workout/renders.ts y wiring de eventos en
 * renderers/workout/events.ts. Aquí queda la lógica de negocio (series, plantillas, 1RM,
 * warm-up, discos, métricas) + delegación fina que conserva los nombres de los métodos.
 */

import { Store } from "../store.js";
import { Utils } from "../utils.ts";
import { Toast } from "../toast.js";
import { Dialog } from "../dialog.js";
import { FormulasRM, PlateCalculator } from "../formulas.js";
import { Autoregulacion } from "../autorregulacion.js";
import { GestorTimer } from "../gestor-timer.js";
import { ExerciseGuide } from "../components/exercise-guide.js";
import { bindWorkoutEvents } from "./renderers/workout/events.ts";
import {
  renderFiltroGrupos,
  renderFiltroPatrones,
  renderSelectorEjercicios,
  renderRutina,
  renderPlantillas,
  renderPlantillasPredefinidas,
  renderSeries,
  renderAutoreg,
} from "./renderers/workout/renders.ts";

export class WorkoutController {
  constructor({ app, el, rutina, timer }) {
    this.app = app;
    this.el = el;
    this.rutina = rutina;
    this.timer = timer;
    this._rirTocadoPorUsuario = false;
    this._grupoFiltroActual = "todos";
    this._patronFiltroActual = "todos";
    this._busquedaActual = "";

    this._bindEvents();
    this._bindSteppers();
    this._subscribeStore();
    this.render();
  }

  actualizarInstancias({ rutina, timer }) {
    if (rutina) this.rutina = rutina;
    if (timer) this.timer = timer;
    this.render();
  }

  _bindSteppers() {
    const chips = document.querySelectorAll(".stepper-chip");
    chips.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute("data-step-target");
        const stepVal = parseFloat(btn.getAttribute("data-step-val")) || 0;
        const input = document.getElementById(targetId);
        if (!input) return;
        const current = parseFloat(input.value) || 0;
        const next = Math.max(0, Math.round((current + stepVal) * 100) / 100);
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        GestorTimer.vibrarCorto();
      });
    });
  }

  /**
   * Vincula una sola vez los listeners estáticos de la vista (el HTML base no se
   * reconstruye; el contenido dinámico re-vincula al renderizarse).
   * Wiring completo en renderers/workout/events.ts.
   */
  _bindEvents() {
    bindWorkoutEvents(this);
  }

  _subscribeStore() {
    Store.on("routine:updated", () => {
      this._renderRutina();
      this._renderSeries();
    });

    Store.on("series:updated", () => {
      this._renderSeries();
    });

    Store.on("exercises:updated", () => {
      this._renderSelectorEjercicios();
    });

    Store.on("plantillas:updated", () => {
      this._renderPlantillas();
    });
  }

  render() {
    this._renderFiltroGrupos();
    this._renderFiltroPatrones();
    this._renderSelectorEjercicios();
    this._renderRutina();
    this._renderPlantillas();
    this._renderPlantillasPredefinidas();
    this._renderSeries();
    this._syncGuiaBtn();
  }

  /** Refleja en el botón "Guía" si el ejercicio seleccionado tiene guía. */
  _syncGuiaBtn() {
    const btn = document.getElementById("guiaBtn");
    if (!btn) return;
    const id = this.el.selectEjercicio ? this.el.selectEjercicio.value : "";
    const disponible = !!id && !!ExerciseGuide.porId(id);
    btn.classList.toggle("is-unavailable", !disponible);
    btn.setAttribute("aria-disabled", disponible ? "false" : "true");
    btn.title = disponible ? "Ver guía de ejecución" : "Este ejercicio no tiene guía disponible";
  }

  /** Filtro de grupos musculares. Render en renderers/workout/renders.ts. */
  _renderFiltroGrupos() {
    renderFiltroGrupos(this);
  }

  /** Filtro de patrones de movimiento. Render en renderers/workout/renders.ts. */
  _renderFiltroPatrones() {
    renderFiltroPatrones(this);
  }

  /** Selector de ejercicios con filtros + búsqueda. Render en renderers/workout/renders.ts. */
  _renderSelectorEjercicios() {
    renderSelectorEjercicios(this);
  }

  /** Badges de la rutina del día (con drag & drop). Render en renderers/workout/renders.ts. */
  _renderRutina() {
    renderRutina(this);
  }

  /** Plantillas guardadas por el usuario. Render en renderers/workout/renders.ts. */
  _renderPlantillas() {
    renderPlantillas(this);
  }

  async _guardarComoPlantilla() {
    const rutina = this.rutina.rutina;
    if (!rutina || rutina.length === 0) {
      Toast.mostrar("La rutina está vacía. Agrega ejercicios primero.", "warning");
      return;
    }

    const nombre = await Dialog.pedirTexto("Nombre de la plantilla:");
    if (!nombre) return;

    const plantilla = this.rutina.guardarComoPlantilla(nombre);
    if (plantilla) {
      Toast.mostrar('Plantilla "' + plantilla.nombre + '" guardada', "success");
      this._renderPlantillas();
    }
  }

  async _cargarPlantilla(id) {
    const plantillas = Store.listarPlantillas();
    const plantilla = plantillas.find((p) => p.id === id);
    if (!plantilla) return;

    // Si la rutina actual tiene series cargadas, confirmar antes de pisarlas.
    const tieneSeries = this.rutina.rutina.some((ejId) => {
      return (this.rutina.seriesPorEjercicio[ejId] || []).length > 0;
    });

    if (tieneSeries) {
      const ok = await Dialog.confirm(
        "Cargar esta plantilla reemplazará la rutina actual y sus series. ¿Continuar?",
        { textoConfirmar: "Cargar", peligroso: true }
      );
      if (!ok) return;
    }

    if (this.rutina.cargarPlantilla(id)) {
      Store.emit("routine:updated", this.rutina.data.rutina);
      Toast.mostrar('Plantilla "' + plantilla.nombre + '" cargada', "success");
    }
  }

  async _eliminarPlantilla(id) {
    const plantillas = Store.listarPlantillas();
    const plantilla = plantillas.find((p) => p.id === id);
    if (!plantilla) return;

    const ok = await Dialog.confirm(
      '¿Eliminar la plantilla "' + plantilla.nombre + '"? Esta acción no se puede deshacer.',
      { textoConfirmar: "Eliminar", peligroso: true }
    );
    if (!ok) return;

    if (Store.eliminarPlantilla(id)) {
      Toast.mostrar("Plantilla eliminada", "info");
      this._renderPlantillas();
    }
  }

  /** Plantillas predefinidas del sistema. Render en renderers/workout/renders.ts. */
  _renderPlantillasPredefinidas() {
    renderPlantillasPredefinidas(this);
  }

  /** Importa una plantilla predefinida: la guarda en "Plantillas guardadas" y la carga. */
  async _importarPlantillaPredefinida(tpl) {
    if (!tpl || !Array.isArray(tpl.ejercicios) || tpl.ejercicios.length === 0) {
      Toast.mostrar("Esta plantilla no tiene ejercicios definidos", "warning");
      return;
    }

    // La copia queda persistida en el perfil activo para que el usuario pueda
    // editarla y reutilizarla después ("Importar y usar").
    const plantilla = Store.crearPlantilla(tpl.nombre, [...tpl.ejercicios]);
    if (!plantilla) return;

    // Si la rutina actual tiene series, confirmar antes de pisarlas (igual que `_cargarPlantilla`).
    const tieneSeries = this.rutina.rutina.some((ejId) => {
      return (this.rutina.seriesPorEjercicio[ejId] || []).length > 0;
    });

    if (tieneSeries) {
      const ok = await Dialog.confirm(
        "Importar esta plantilla reemplazará la rutina actual y sus series. ¿Continuar?",
        { textoConfirmar: "Importar", peligroso: true }
      );
      if (!ok) {
        // No se carga, pero la copia ya quedó en "Plantillas guardadas".
        Toast.mostrar("Plantilla importada a 'Plantillas guardadas'", "info");
        return;
      }
    }

    const id = plantilla.id;
    if (this.rutina.cargarPlantilla(id)) {
      Store.emit("routine:updated", this.rutina.data.rutina);
      Toast.mostrar('Plantilla "' + tpl.nombre + '" importada y cargada', "success");
    }
  }

  /** Formulario + lista de series del ejercicio actual (con prefill "última vez"). Render en renderers/workout/renders.ts. */
  _renderSeries() {
    renderSeries(this);
  }

  _actualizarMetricasEjercicio(ejercicioId, series) {
    if (series.length === 0) {
      this._actualizarRM(null);
      this.el.autoregSugerencia.replaceChildren();
      return;
    }

    // Mejor serie para 1RM
    let mejorRM = 0;
    let mejorStats = null;
    const ultimaSerie = series[series.length - 1];

    series.forEach((s) => {
      if (s.peso > 0 && s.reps > 0) {
        const rm = FormulasRM.calcularTodos(s.peso, s.reps);
        if (rm.promedio > mejorRM) {
          mejorRM = rm.promedio;
          mejorStats = rm;
        }
      }
    });

    this._actualizarRM(mejorStats);

    // Sugerencia de autorregulación
    if (ultimaSerie && ultimaSerie.rpe) {
      const rpeObj = parseFloat(this.el.rpeObjetivoInput.value) || 8;
      const sugerencia = Autoregulacion.sugerirProximoPeso(ultimaSerie.peso, ultimaSerie.rpe, rpeObj);
      this._renderAutoreg(sugerencia);
    } else {
      this.el.autoregSugerencia.replaceChildren();
    }
  }

  _actualizarRM(rm) {
    if (!rm) {
      this.el.rmEpley.textContent = "--";
      this.el.rmBrzycki.textContent = "--";
      this.el.rmLombardi.textContent = "--";
      this.el.rmPromedio.textContent = "--";
      return;
    }
    this.el.rmEpley.textContent = rm.epley.toFixed(1);
    this.el.rmBrzycki.textContent = rm.brzycki.toFixed(1);
    this.el.rmLombardi.textContent = rm.lombardi.toFixed(1);
    this.el.rmPromedio.textContent = rm.promedio.toFixed(1);
  }

  /** Sugerencia de autorregulación para la próxima serie. Render en renderers/workout/renders.ts. */
  _renderAutoreg(sug) {
    renderAutoreg(this, sug);
  }

  _agregarSerie() {
    const ejercicioId = this.rutina.getEjercicioActual();
    if (!ejercicioId) {
      Toast.mostrar("Selecciona un ejercicio primero", "error");
      return;
    }

    const peso = parseFloat(this.el.seriePeso.value);
    const reps = parseInt(this.el.serieReps.value, 10);
    const rpe = parseFloat(this.el.serieRPE.value) || null;
    const rir = parseFloat(this.el.serieRIR.value) || null;
    const notas = this.el.serieNotas.value.trim();

    if (isNaN(peso) || peso < 0 || isNaN(reps) || reps <= 0) {
      Toast.mostrar("Ingresa peso (>=0) y repeticiones (>0) válidos", "warning");
      return;
    }

   // 1. Validaciones y sanitización de tipos numéricos
    const pesoNum = parseFloat(peso);
    const repsNum = parseInt(reps, 10);
    const rpeNum = rpe !== null && rpe !== undefined && rpe !== "" ? parseFloat(rpe) : null;
    const rirNum = rir !== null && rir !== undefined && rir !== "" ? parseFloat(rir) : null;

    if (isNaN(pesoNum) || pesoNum < 0 || isNaN(repsNum) || repsNum <= 0) {
      Toast.mostrar("Por favor ingresa valores válidos para peso y repeticiones", "warning");
      return;
    }

    try {
      // 2. Ejecución segura de la adición de la serie
      const serie = this.rutina.agregarSerie(ejercicioId, {
        peso: pesoNum,
        reps: repsNum,
        rpe: rpeNum,
        rir: rirNum,
        notas: (notas || "").trim()
      });

      // 3. Persistencia y emisión de eventos con try/catch explícito
      Store.guardar();
      Store.emit("series:updated", { ejercicioId, peso: pesoNum, reps: repsNum });

      // 4. Notificación y feedback (Uso de template literals `` para evitar conflicto de comillas)
      if (serie && serie.esPR) {
        GestorTimer.vibrarPR?.();
        Toast.mostrar("🏆 ¡Nuevo récord personal (PR) registrado!", "success");
      } else {
        GestorTimer.vibrarExito?.();
        Toast.mostrar("Serie agregada", "success");
      }
    } catch (error) {
      console.error("[WorkoutController] Error al agregar serie:", error);
      Toast.mostrar("No se pudo guardar la serie. Inténtalo de nuevo.", "error");
    }

    // Iniciar timer de descanso automáticamente si el usuario lo desea
    if (this.timer && !this.timer.corriendo) {
      this.timer.iniciar();
    }
  }

  _guardarSesionCompleta() {
    const rutina = this.rutina.rutina;
    if (rutina.length === 0) {
      Toast.mostrar("No hay ejercicios en la rutina", "warning");
      return;
    }

    let totalSeries = 0;
    rutina.forEach((id) => {
      totalSeries += (this.rutina.seriesPorEjercicio[id] || []).length;
    });

    if (totalSeries === 0) {
      Toast.mostrar("Registra al menos una serie antes de guardar", "warning");
      return;
    }

    const sesion = this.rutina.guardarSesion();
    Store.guardar();
    Store.emit("session:completed", sesion);
    Toast.mostrar("¡Sesión guardada en el historial!", "success");
  }

  _calcularWarmUp() {
    const peso = parseFloat(this.el.seriePeso.value);
    if (!peso || peso <= 20) {
      Toast.mostrar("Ingresa un peso de trabajo mayor a 20kg", "warning");
      return;
    }
    const container = this.el.warmUpContainer;
    container.replaceChildren();

    const seriesWarm = [
      { pct: 0.4, reps: 5, desc: "Calentamiento 40%" },
      { pct: 0.6, reps: 3, desc: "Aproximación 60%" },
      { pct: 0.8, reps: 2, desc: "Aproximación 80%" },
      { pct: 0.9, reps: 1, desc: "Activación 90%" },
    ];

    const frag = document.createDocumentFragment();
    seriesWarm.forEach((sw) => {
      const p = Utils.redondearIncremento(peso * sw.pct, 2.5);
      const row = document.createElement("div");
      row.className = "small-note-inline";
      row.textContent = "• " + sw.desc + ": " + p + "kg × " + sw.reps + " reps";
      frag.appendChild(row);
    });

    container.appendChild(frag);
  }

  _calcularDiscos() {
    const objetivo = parseFloat(this.el.discoPesoObjetivo.value);
    const barra = parseFloat(this.el.discoPesoBarra.value) || 20;

    if (!objetivo || objetivo <= barra) {
      Toast.mostrar("El peso objetivo debe ser mayor que el peso de la barra", "warning");
      return;
    }

    const res = PlateCalculator.calcular(objetivo, barra);
    const container = this.el.discosResultado;
    container.replaceChildren();

    if (!res.alcanzable && res.porLado.length === 0) {
      container.textContent = "No es posible armar con los discos estándar.";
      return;
    }

    const div = document.createElement("div");
    div.className = "badge-list";
    res.porLado.forEach((d) => {
      const span = document.createElement("span");
      span.className = "badge";
      const valorDisco = d.disco ?? d.peso;
      span.textContent = valorDisco + "kg × " + d.cantidad + " (por lado)";
      div.appendChild(span);
    });
    container.appendChild(div);
  }

  async _abrirModalCrearEjercicio() {
    const nombre = await Dialog.pedirTexto("Nombre del nuevo ejercicio:");
    if (!nombre) return;

    const musculo = this._grupoFiltroActual !== "todos" ? this._grupoFiltroActual : "pecho";
    Store.agregarEjercicioPersonalizado({
      nombre,
      musculo,
      intensidad: 7,
      patron: "aislamiento",
      equipamiento: "mancuerna",
    });

    Toast.mostrar("Ejercicio " + nombre + " guardado en tu catálogo", "success");
  }
}
