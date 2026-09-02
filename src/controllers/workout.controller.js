/**
 * src/controllers/workout.controller.js
 * Controlador de la vista "Entrenar".
 * Maneja catálogo de ejercicios, filtro por grupo muscular, creación de ejercicios personalizados,
 * rutina del día, formulario rápido de series, cálculo de 1RM, warm-up y calculadora de discos.
 */

import { Store } from "../store.js";
import { Utils } from "../utils.js";
import { Toast } from "../toast.js";
import { Dialog } from "../dialog.js";
import { FormulasRM, PlateCalculator } from "../formulas.js";
import { Autoregulacion } from "../autorregulacion.js";
import { GRUPOS_MUSCULARES, PATRONES_MOVIMIENTO } from "../data/exercises.js";
import { EJERCICIOS_DISPONIBLES } from "../config.js";
import { GestorTimer } from "../gestor-timer.js";
import { ExerciseGuide } from "../components/exercise-guide.js";

export class WorkoutController {
  constructor({ app, el, rutina, timer }) {
    this.app = app;
    this.el = el;
    this.rutina = rutina;
    this.timer = timer;
    this._rirTocadoPorUsuario = false;
    this._grupoFiltroActual = "todos";
    this._patronFiltroActual = "todos";

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

  _bindEvents() {
    // Filtro de grupo muscular
    if (this.el.filtroMusculoSelect) {
      this.el.filtroMusculoSelect.addEventListener("change", () => {
        this._grupoFiltroActual = this.el.filtroMusculoSelect.value;
        this._renderSelectorEjercicios();
      });
    }

    // Filtro de patrón de movimiento biomecánico
    if (this.el.filtroPatronSelect) {
      this.el.filtroPatronSelect.addEventListener("change", () => {
        this._patronFiltroActual = this.el.filtroPatronSelect.value;
        this._renderSelectorEjercicios();
      });
    }

    // Botón para crear ejercicio personalizado
    if (this.el.crearEjercicioBtn) {
      this.el.crearEjercicioBtn.addEventListener("click", () => this._abrirModalCrearEjercicio());
    }

    // Botón para guardar la rutina actual como plantilla
    if (this.el.guardarPlantillaBtn) {
      this.el.guardarPlantillaBtn.addEventListener("click", () => this._guardarComoPlantilla());
    }

    // Agregar ejercicio a la rutina
    this.el.agregarBtn.addEventListener("click", () => {
      const id = this.el.selectEjercicio.value;
      if (!id) return;
      if (this.rutina.agregarEjercicio(id)) {
        Store.guardar();
        Store.emit("routine:updated", this.rutina.data.rutina);
        GestorTimer.vibrarCorto();
        Toast.mostrar("Ejercicio agregado a la rutina", "success");
      } else {
        Toast.mostrar("Este ejercicio ya está en la rutina", "error");
      }
    });

    // Botón "Guía" junto al selector: abre la guía del ejercicio seleccionado.
    const guiaBtn = document.getElementById("guiaBtn");
    if (guiaBtn) {
      guiaBtn.addEventListener("click", () => {
        const id = this.el.selectEjercicio.value;
        if (!id) return;
        if (!ExerciseGuide.abrirPorEjercicio(id)) {
          Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
        }
      });
    }

    // Actualiza el estado visual del botón "Guía" al cambiar de ejercicio.
    if (this.el.selectEjercicio) {
      this.el.selectEjercicio.addEventListener("change", () => this._syncGuiaBtn());
    }

    // Reiniciar rutina completa
    this.el.resetRutinaBtn.addEventListener("click", async () => {
      const ok = await Dialog.confirm("¿Reiniciar toda la rutina de hoy?", {
        peligroso: true,
        textoConfirmar: "Reiniciar",
      });
      if (ok) {
        this.rutina.data.rutina = [];
        this.rutina.data.seriesPorEjercicio = {};
        this.rutina.data.superseries = {};
        this.rutina.ejercicioSeleccionado = null;
        Store.guardar();
        Store.emit("routine:updated", []);
        Toast.mostrar("Rutina reiniciada", "info");
      }
    });

    // Agregar serie individual
    this.el.addSerieBtn.addEventListener("click", () => this._agregarSerie());

    // Limpiar series del ejercicio actual
    this.el.limpiarSeriesBtn.addEventListener("click", async () => {
      const id = this.rutina.getEjercicioActual();
      if (!id) return;
      const ok = await Dialog.confirm("¿Borrar todas las series de este ejercicio?", { peligroso: true });
      if (ok) {
        this.rutina.eliminarTodasSeries(id);
        Store.guardar();
        Store.emit("series:updated", { ejercicioId: id });
        Toast.mostrar("Series eliminadas", "info");
      }
    });

    // Guardar sesión completa de entrenamiento
    this.el.guardarSesionBtn.addEventListener("click", () => this._guardarSesionCompleta());

    // Cálculos de RPE/RIR automáticos y cálculo de %1RM RTS en tiempo real
    const actualizarRPE1RMRealTime = () => {
      const peso = parseFloat(this.el.seriePeso?.value) || 0;
      const reps = parseInt(this.el.serieReps?.value, 10) || 0;
      const rpe = parseFloat(this.el.serieRPE?.value) || null;
      if (this.el.rpePorcentajeDisplay) {
        if (peso > 0 && reps > 0 && rpe) {
          const calc = FormulasRM.calcular1RMPorRPE(peso, reps, rpe);
          if (calc) {
            this.el.rpePorcentajeDisplay.innerHTML = `📊 Carga: <strong>${calc.porcentaje}% 1RM</strong> (Tuchscherer RTS) → 1RM est: <strong>${calc.rm} kg</strong>`;
            return;
          }
        }
        this.el.rpePorcentajeDisplay.textContent = "";
      }
    };

    this.el.serieRPE.addEventListener("input", () => {
      if (!this._rirTocadoPorUsuario) {
        const rpe = parseFloat(this.el.serieRPE.value);
        if (!isNaN(rpe)) {
          this.el.serieRIR.value = Math.max(0, 10 - rpe);
        }
      }
      actualizarRPE1RMRealTime();
    });

    this.el.serieRIR.addEventListener("input", () => {
      this._rirTocadoPorUsuario = true;
      const rir = parseFloat(this.el.serieRIR.value);
      if (!isNaN(rir)) {
        this.el.serieRPE.value = Math.max(1, Math.min(10, 10 - rir));
      }
      actualizarRPE1RMRealTime();
    });

    this.el.seriePeso?.addEventListener("input", actualizarRPE1RMRealTime);
    this.el.serieReps?.addEventListener("input", actualizarRPE1RMRealTime);

    // Warm-up calculator
    this.el.calcularWarmUpBtn.addEventListener("click", () => this._calcularWarmUp());

    // Plate calculator
    this.el.calcularDiscosBtn.addEventListener("click", () => this._calcularDiscos());

    // Timer controls
    this.el.setTimerBtn.addEventListener("click", () => {
      const min = parseInt(this.el.timerMinutes.value, 10) || 0;
      const sec = parseInt(this.el.timerSeconds.value, 10) || 0;
      this.timer.setTiempo(min, sec);
      Toast.mostrar("Tiempo fijado", "info");
    });

    this.el.startTimerBtn.addEventListener("click", () => this.timer.iniciar());
    this.el.pauseTimerBtn.addEventListener("click", () => this.timer.pausar());
    this.el.resetTimerBtn.addEventListener("click", () => this.timer.reset());
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

  _renderFiltroGrupos() {
    if (!this.el.filtroMusculoSelect) return;
    const frag = document.createDocumentFragment();
    GRUPOS_MUSCULARES.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.nombre;
      frag.appendChild(opt);
    });
    this.el.filtroMusculoSelect.replaceChildren(frag);
  }

  _renderFiltroPatrones() {
    if (!this.el.filtroPatronSelect) return;
    const frag = document.createDocumentFragment();
    PATRONES_MOVIMIENTO.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      frag.appendChild(opt);
    });
    this.el.filtroPatronSelect.replaceChildren(frag);
  }

  _renderSelectorEjercicios() {
    const todos = Store.getEjerciciosDisponibles();
    let filtrados = todos;

    if (this._grupoFiltroActual !== "todos") {
      filtrados = filtrados.filter(
        (e) => e.musculo === this._grupoFiltroActual || (e.musculosSecundarios && e.musculosSecundarios.includes(this._grupoFiltroActual))
      );
    }

    if (this._patronFiltroActual !== "todos") {
      filtrados = filtrados.filter((e) => e.patron === this._patronFiltroActual);
    }

    const frag = document.createDocumentFragment();
    filtrados.forEach((ej) => {
      const opt = document.createElement("option");
      opt.value = ej.id;
      const customPrefix = ej.personalizado ? "⭐ " : "";
      const tieneGuia = ExerciseGuide.porId(ej.id) ? " 📘" : "";
      opt.textContent = `${customPrefix}${ej.nombre} (${ej.musculo} • ${ej.patron || "general"})${tieneGuia}`;
      frag.appendChild(opt);
    });

    this.el.selectEjercicio.replaceChildren(frag);
    this._syncGuiaBtn();
  }

  _renderRutina() {
    const container = this.el.rutinaContainer;
    container.replaceChildren();

    const rutina = this.rutina.rutina;
    const countEl = this.el.ejerciciosCount;
    if (countEl) countEl.textContent = rutina.length;

    if (rutina.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "No hay ejercicios en la rutina de hoy. Agrega uno arriba.";
      container.appendChild(empty);
      return;
    }

    const todos = Store.getEjerciciosDisponibles();
    const actual = this.rutina.getEjercicioActual();

    const frag = document.createDocumentFragment();
    rutina.forEach((id) => {
      const ej = todos.find((e) => e.id === id) || { nombre: id, musculo: "general" };
      const seriesCount = (this.rutina.seriesPorEjercicio[id] || []).length;

      const badge = document.createElement("div");
      badge.className = "badge" + (actual === id ? " active" : "");
      badge.setAttribute("role", "button");
      badge.setAttribute("tabindex", "0");

      const nombreSpan = document.createElement("span");
      nombreSpan.textContent = ej.nombre;

      const seriesTag = document.createElement("span");
      seriesTag.className = "count-tag";
      seriesTag.textContent = seriesCount + " series";

      const guideBtn = document.createElement("button");
      guideBtn.type = "button";
      guideBtn.className = "badge-guide";
      guideBtn.setAttribute("aria-label", "Ver guía de " + ej.nombre);
      guideBtn.title = "Ver guía de " + ej.nombre;
      guideBtn.textContent = "ⓘ";
      guideBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!ExerciseGuide.abrirPorEjercicio(id)) {
          Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "badge-delete";
      deleteBtn.setAttribute("aria-label", "Quitar " + ej.nombre);
      deleteBtn.textContent = "×";

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.rutina.eliminarEjercicio(id);
        Store.guardar();
        Store.emit("routine:updated", this.rutina.data.rutina);
      });

      badge.addEventListener("click", () => {
        this.rutina.seleccionarEjercicio(id);
        this._renderRutina();
        this._renderSeries();
      });

      badge.append(nombreSpan, seriesTag, guideBtn, deleteBtn);
      frag.appendChild(badge);
    });

    container.appendChild(frag);
  }

  _renderPlantillas() {
    const container = this.el.plantillasContainer;
    if (!container) return;
    container.replaceChildren();

    const plantillas = Store.listarPlantillas();

    if (plantillas.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "No hay plantillas guardadas.";
      container.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();

    plantillas.forEach((p) => {
      const item = document.createElement("div");
      item.className = "plantilla-item";

      const info = document.createElement("div");
      info.className = "plantilla-info";

      const nombre = document.createElement("span");
      nombre.className = "plantilla-nombre";
      nombre.textContent = p.nombre;

      const detalle = document.createElement("span");
      detalle.className = "plantilla-detalle";
      const fecha = p.creadaEn ? new Date(p.creadaEn).toLocaleDateString("es-ES") : "";
      detalle.textContent = (p.ejercicios ? p.ejercicios.length : 0) + " ejercicios" + (fecha ? " · " + fecha : "");

      info.append(nombre, detalle);

      const ejercicios = document.createElement("span");
      ejercicios.className = "plantilla-ejercicios";
      ejercicios.textContent = (p.ejercicios || [])
        .map((id) => {
          const ej = EJERCICIOS_DISPONIBLES.find((e) => e.id === id);
          return ej ? ej.nombre : id;
        })
        .join(", ");

      const acciones = document.createElement("div");
      acciones.className = "plantilla-acciones";

      const cargarBtn = document.createElement("button");
      cargarBtn.type = "button";
      cargarBtn.textContent = "Cargar";
      cargarBtn.addEventListener("click", () => this._cargarPlantilla(p.id));

      const eliminarBtn = document.createElement("button");
      eliminarBtn.type = "button";
      eliminarBtn.className = "danger";
      eliminarBtn.textContent = "Eliminar";
      eliminarBtn.addEventListener("click", () => this._eliminarPlantilla(p.id));

      acciones.append(cargarBtn, eliminarBtn);

      item.append(info, ejercicios, acciones);
      frag.appendChild(item);
    });

    container.appendChild(frag);
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

  _renderSeries() {
    const ejercicioId = this.rutina.getEjercicioActual();
    const serieForm = this.el.serieForm;
    const emptyMsg = this.el.serieFormEmpty;

    if (!ejercicioId) {
      if (serieForm) serieForm.classList.add("hidden");
      if (emptyMsg) {
        emptyMsg.classList.remove("hidden");
        emptyMsg.textContent = "Selecciona o agrega un ejercicio de la rutina para registrar series.";
      }
      return;
    }

    if (serieForm) serieForm.classList.remove("hidden");
    if (emptyMsg) emptyMsg.classList.add("hidden");

    const series = this.rutina.seriesPorEjercicio[ejercicioId] || [];
    const container = this.el.seriesContainer;
    container.replaceChildren();

    const frag = document.createDocumentFragment();
    series.forEach((s, idx) => {
      const item = document.createElement("div");
      item.className = "badge serie-item";

      const info = document.createElement("span");
      const rpeTxt = s.rpe ? " | RPE " + s.rpe : "";
      const rirTxt = s.rir !== undefined && s.rir !== null ? " | RIR " + s.rir : "";
      info.textContent = "#" + (idx + 1) + " — " + s.peso + "kg × " + s.reps + " reps" + rpeTxt + rirTxt;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "badge-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => {
        this.rutina.eliminarSerie(ejercicioId, s.id);
        Store.guardar();
        Store.emit("series:updated", { ejercicioId });
      });

      item.append(info, delBtn);
      frag.appendChild(item);
    });

    container.appendChild(frag);
    this._actualizarMetricasEjercicio(ejercicioId, series);
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

  _renderAutoreg(sug) {
    const cont = this.el.autoregSugerencia;
    cont.replaceChildren();
    if (!sug) return;

    const div = document.createElement("div");
    div.className = "autoreg-box";
    const deltaSign = sug.delta > 0 ? "+" : "";
    div.textContent = "💡 Sugerencia prox. serie: " + sug.peso + "kg (" + deltaSign + sug.delta + "kg para RPE obj.)";
    cont.appendChild(div);
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

    const serie = this.rutina.agregarSerie(ejercicioId, { peso, reps, rpe, rir, notas });
    Store.guardar();
    Store.emit("series:updated", { ejercicioId, peso, reps });

    if (serie && serie.esPR) {
      GestorTimer.vibrarPR();
      Toast.mostrar("🏆 ¡Nuevo récord personal (PR) registrado!", "success");
    } else {
      GestorTimer.vibrarExito();
      Toast.mostrar("Serie agregada", "success");
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
      span.textContent = d.peso + "kg × " + d.cantidad + " (por lado)";
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
