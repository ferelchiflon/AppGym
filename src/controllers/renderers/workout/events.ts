/**
 * src/controllers/renderers/workout/events.ts
 * Wiring de eventos de la vista "Entrenar": conecta los listeners estáticos de el
 * (filtros, selector, botones de rutina, formulario de series, warm-up, discos,
 * timer, búsqueda y drag & drop) con los métodos del controlador. Extraído de
 * WorkoutController._bindEvents (Paso B) para dejar el controlador delgado.
 *
 * Sin estado propio: recibe el controlador (c), que expone el, rutina, timer y
 * los métodos de acción (_renderSelectorEjercicios, _abrirModalCrearEjercicio,
 * _guardarComoPlantilla, _agregarSerie, _guardarSesionCompleta, _calcularWarmUp,
 * _calcularDiscos, _syncGuiaBtn). Se vincula UNA sola vez en el constructor: la
 * vista es HTML estático; el contenido dinámico (rutina, series, plantillas)
 * re-vincula sus propios listeners al renderizarse.
 */
import { Store } from "../../../store.js";
import type { WorkoutController } from "../../../types/workout-controller";
import { Utils } from "../../../utils.ts";
import { Toast } from "../../../toast.js";
import { Dialog } from "../../../dialog.js";
import { FormulasRM } from "../../../formulas.js";
import { GestorTimer } from "../../../gestor-timer.js";
import { ExerciseGuide } from "../../../components/exercise-guide.js";
import { hacerReordenable } from "../../../dnd.js";

/** Vincula los listeners estáticos de la vista. Recibe el WorkoutController. */
export function bindWorkoutEvents(c: WorkoutController): void {
    // Filtro de grupo muscular
    if (c.el.filtroMusculoSelect) {
      c.el.filtroMusculoSelect.addEventListener("change", () => {
        c._grupoFiltroActual = c.el.filtroMusculoSelect.value;
        c._renderSelectorEjercicios();
      });
    }

    // Filtro de patrón de movimiento biomecánico
    if (c.el.filtroPatronSelect) {
      c.el.filtroPatronSelect.addEventListener("change", () => {
        c._patronFiltroActual = c.el.filtroPatronSelect.value;
        c._renderSelectorEjercicios();
      });
    }

    // Botón para crear ejercicio personalizado
    if (c.el.crearEjercicioBtn) {
      c.el.crearEjercicioBtn.addEventListener("click", () => c._abrirModalCrearEjercicio());
    }

    // Botón para guardar la rutina actual como plantilla
    if (c.el.guardarPlantillaBtn) {
      c.el.guardarPlantillaBtn.addEventListener("click", () => c._guardarComoPlantilla());
    }

    // Agregar ejercicio a la rutina
    c.el.agregarBtn.addEventListener("click", () => {
      const id = c.el.selectEjercicio.value;
      if (!id) return;
      if (c.rutina.agregarEjercicio(id)) {
        Store.guardar();
        Store.emit("routine:updated", c.rutina.data.rutina);
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
        const id = c.el.selectEjercicio.value;
        if (!id) return;
        if (!ExerciseGuide.abrirPorEjercicio(id)) {
          Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
        }
      });
    }

    // Actualiza el estado visual del botón "Guía" al cambiar de ejercicio.
    if (c.el.selectEjercicio) {
      c.el.selectEjercicio.addEventListener("change", () => c._syncGuiaBtn());
    }

    // Reiniciar rutina completa
    c.el.resetRutinaBtn.addEventListener("click", async () => {
      const ok = await Dialog.confirm("¿Reiniciar toda la rutina de hoy?", {
        peligroso: true,
        textoConfirmar: "Reiniciar",
      });
      if (ok) {
        c.rutina.data.rutina = [];
        c.rutina.data.seriesPorEjercicio = {};
        c.rutina.data.superseries = {};
        c.rutina.ejercicioSeleccionado = null;
        Store.guardar();
        Store.emit("routine:updated", []);
        Toast.mostrar("Rutina reiniciada", "info");
      }
    });

    // Agregar serie individual
    c.el.addSerieBtn.addEventListener("click", () => c._agregarSerie());

    // Limpiar series del ejercicio actual
    c.el.limpiarSeriesBtn.addEventListener("click", async () => {
      const id = c.rutina.getEjercicioActual();
      if (!id) return;
      const ok = await Dialog.confirm("¿Borrar todas las series de este ejercicio?", { peligroso: true });
      if (ok) {
        c.rutina.eliminarTodasSeries(id);
        Store.guardar();
        Store.emit("series:updated", { ejercicioId: id });
        Toast.mostrar("Series eliminadas", "info");
      }
    });

    // Guardar sesión completa de entrenamiento
    c.el.guardarSesionBtn.addEventListener("click", () => c._guardarSesionCompleta());

    // Cálculos de RPE/RIR automáticos y cálculo de %1RM RTS en tiempo real
    const actualizarRPE1RMRealTime = () => {
      const peso = parseFloat(c.el.seriePeso?.value) || 0;
      const reps = parseInt(c.el.serieReps?.value, 10) || 0;
      const rpe = parseFloat(c.el.serieRPE?.value) || null;
      if (c.el.rpePorcentajeDisplay) {
        if (peso > 0 && reps > 0 && rpe) {
          const calc = FormulasRM.calcular1RMPorRPE(peso, reps, rpe);
          if (calc) {
            c.el.rpePorcentajeDisplay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/></svg> Carga: <strong>${calc.porcentaje}% 1RM</strong> (Tuchscherer RTS) → 1RM est: <strong>${calc.rm} kg</strong>`;
            return;
          }
        }
        c.el.rpePorcentajeDisplay.textContent = "";
      }
    };

    c.el.serieRPE.addEventListener("input", () => {
      if (!c._rirTocadoPorUsuario) {
        const rpe = parseFloat(c.el.serieRPE.value);
        if (!isNaN(rpe)) {
          c.el.serieRIR.value = String(Math.max(0, 10 - rpe));
        }
      }
      actualizarRPE1RMRealTime();
    });

    c.el.serieRIR.addEventListener("input", () => {
      c._rirTocadoPorUsuario = true;
      const rir = parseFloat(c.el.serieRIR.value);
      if (!isNaN(rir)) {
        c.el.serieRPE.value = String(Math.max(1, Math.min(10, 10 - rir)));
      }
      actualizarRPE1RMRealTime();
    });

    c.el.seriePeso?.addEventListener("input", actualizarRPE1RMRealTime);
    c.el.serieReps?.addEventListener("input", actualizarRPE1RMRealTime);

    // Atajo de teclado: Enter en los campos numéricos de la serie agrega la serie rápido.
    // No se vincula a textareas/selects para no interferir con la edición de texto.
    ["seriePeso", "serieReps", "serieRPE", "serieRIR"].forEach((id: string) => {
      const inp = document.getElementById(id);
      if (inp) {
        inp.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            c._agregarSerie();
          }
        });
      }
    });

    // Warm-up calculator
    c.el.calcularWarmUpBtn.addEventListener("click", () => c._calcularWarmUp());

    // Plate calculator
    c.el.calcularDiscosBtn.addEventListener("click", () => c._calcularDiscos());

    // Timer controls
    c.el.setTimerBtn.addEventListener("click", () => {
      const min = parseInt(c.el.timerMinutes.value, 10) || 0;
      const sec = parseInt(c.el.timerSeconds.value, 10) || 0;
      c.timer.setTiempo(min, sec);
      Toast.mostrar("Tiempo fijado", "info");
    });

    c.el.startTimerBtn.addEventListener("click", () => c.timer.iniciar());
    c.el.pauseTimerBtn.addEventListener("click", () => c.timer.pausar());
    c.el.resetTimerBtn.addEventListener("click", () => c.timer.reset());
  // Búsqueda por texto dentro del selector de ejercicios (Feature: Búsqueda + Filtros)
    if (c.el.ejercicioBusqueda) {
      c.el.ejercicioBusqueda.addEventListener(
        "input",
        Utils.debounce((e: Event) => {
          c._busquedaActual = ((e.target as HTMLInputElement).value || "").trim().toLowerCase();
          c._renderSelectorEjercicios();
        }, 180)
      );
    }

    // Drag & Drop para reordenar ejercicios (escritorio + táctil vía Pointer Events)
    if (c.el.rutinaContainer) {
      hacerReordenable(c.el.rutinaContainer, {
        selector: ".badge.routine-badge",
        handleSel: ".drag-handle",
        onReorder: (fromIdx: number, toIdx: number) => {
          if (c.rutina.reordenarEjercicio(fromIdx, toIdx)) {
            Store.emit("routine:updated", c.rutina.data.rutina);
            GestorTimer.vibrarCorto();
          }
        },
      });
    }
}
