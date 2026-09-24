/**
 * src/controllers/renderers/workout/renders.ts
 * Renders DOM de la vista "Entrenar": filtros del catálogo, selector de ejercicios
 * con búsqueda, badges de la rutina, plantillas guardadas y predefinidas, series
 * del ejercicio actual y sugerencia de autorregulación. Extraídos de
 * WorkoutController (Paso B): el controlador queda delgado (delegación fina +
 * lógica de negocio) y aquí vive la construcción del DOM.
 *
 * Seguridad: todo se construye con createElement + textContent; nunca innerHTML
 * con datos del usuario (nombres de ejercicios/plantillas son input del usuario).
 * Sin estado propio: reciben el controlador (c), que expone el, rutina y los
 * métodos de acción; mutan directamente sus contenedores.
 */
import { Store } from "../../../store.js";
import { Toast } from "../../../toast.js";
import { ExerciseGuide } from "../../../components/exercise-guide.js";
import { GRUPOS_MUSCULARES, PATRONES_MOVIMIENTO } from "../../../data/exercises.js";
import { EJERCICIOS_DISPONIBLES } from "../../../config.ts";
import { PLANTILLAS_PREDEFINIDAS } from "../../../data/plantillas-predefinidas.js";
import { t } from "../../../i18n.js";
import type { WorkoutController } from "../../../types/workout-controller";
import type { Ejercicio, MusculoGrupo, Plantilla, PlantillaPredefinida, Serie } from "../../../types/gym.d.ts";
interface AutoregSugerencia {
  peso: number;
  direccion: string;
  delta: number;
}

export function renderFiltroGrupos(c: WorkoutController): void {
    if (!c.el.filtroMusculoSelect) return;
    const frag = document.createDocumentFragment();
    GRUPOS_MUSCULARES.forEach((g: { id: string; nombre: string }) => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.nombre;
      frag.appendChild(opt);
    });
    c.el.filtroMusculoSelect.replaceChildren(frag);
}

export function renderFiltroPatrones(c: WorkoutController): void {
    if (!c.el.filtroPatronSelect) return;
    const frag = document.createDocumentFragment();
    PATRONES_MOVIMIENTO.forEach((p: { id: string; nombre: string }) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      frag.appendChild(opt);
    });
    c.el.filtroPatronSelect.replaceChildren(frag);
}

export function renderSelectorEjercicios(c: WorkoutController): void {
    const todos: Ejercicio[] = Store.getEjerciciosDisponibles();
    let filtrados = todos;

    if (c._grupoFiltroActual !== "todos") {
      filtrados = filtrados.filter(
        (e: Ejercicio) => e.musculo === c._grupoFiltroActual || (e.musculosSecundarios && e.musculosSecundarios.includes(c._grupoFiltroActual as MusculoGrupo))
      );
    }

    if (c._patronFiltroActual !== "todos") {
      filtrados = filtrados.filter((e: Ejercicio) => e.patron === c._patronFiltroActual);
    }

    // Búsqueda por texto: nombre del ejercicio y grupos musculares (principal y secundarios).
    if (c._busquedaActual) {
      const q = c._busquedaActual;
      filtrados = filtrados.filter(
        (e: Ejercicio) =>
          (e.nombre || "").toLowerCase().includes(q) ||
          String(e.musculo || "").toLowerCase().includes(q) ||
          (e.musculosSecundarios || []).some((m: string) => String(m).toLowerCase().includes(q))
      );
    }

    const frag = document.createDocumentFragment();
    filtrados.forEach((ej: Ejercicio) => {
      const opt = document.createElement("option");
      opt.value = ej.id;
      const customPrefix = ej.personalizado ? "⭐ " : "";
      const tieneGuia = ExerciseGuide.porId(ej.id) ? " 📘" : "";
      opt.textContent = `${customPrefix}${ej.nombre} (${ej.musculo} • ${ej.patron || "general"})${tieneGuia}`;
      frag.appendChild(opt);
    });

    if (filtrados.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Sin resultados para tu búsqueda / filtros";
      frag.appendChild(opt);
    }

    c.el.selectEjercicio.replaceChildren(frag);

    // Nota de conteo de resultados según búsqueda/filtros activos.
    if (c.el.ejercicioCountNote) {
      const filtrosActivos = c._grupoFiltroActual !== "todos" || c._patronFiltroActual !== "todos" || !!c._busquedaActual;
      c.el.ejercicioCountNote.textContent = filtrosActivos
        ? t("workout.resultado", { n: filtrados.length })
        : "";
    }

    c._syncGuiaBtn();
}

export function renderRutina(c: WorkoutController): void {
    const container = c.el.rutinaContainer;
    container.replaceChildren();

    const rutina = c.rutina.rutina;
    const countEl = c.el.ejerciciosCount;
    if (countEl) countEl.textContent = String(rutina.length);

    if (rutina.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = t("workout.emptyRutina");
      container.appendChild(empty);
      return;
    }

    const todos: Ejercicio[] = Store.getEjerciciosDisponibles();
    const actual = c.rutina.getEjercicioActual();

    const frag = document.createDocumentFragment();
    rutina.forEach((id) => {
      const ej = todos.find((e: Ejercicio) => e.id === id) || { nombre: id, musculo: "general" };
      const seriesCount = (c.rutina.seriesPorEjercicio[id] || []).length;

      const badge = document.createElement("div");
      badge.className = "badge routine-badge" + (actual === id ? " active" : "");
      badge.setAttribute("role", "button");
      badge.setAttribute("tabindex", "0");

      // Manejador de arrastre (handle). Sin él no se inicia el drag, para no
      // interferir con el click de selección ni con los botones ⓘ / ×.
      const dragHandle = document.createElement("span");
      dragHandle.className = "drag-handle";
      dragHandle.setAttribute("aria-label", "Arrastrar " + ej.nombre + " para reordenar");
      dragHandle.title = "Arrastrar para reordenar";
      dragHandle.textContent = "≡";

      const nombreSpan = document.createElement("span");
      nombreSpan.textContent = ej.nombre;

      const seriesTag = document.createElement("span");
      seriesTag.className = "count-tag";
      seriesTag.textContent = t("workout.seriesTag", { n: seriesCount });

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
        c.rutina.eliminarEjercicio(id);
        Store.guardar();
        Store.emit("routine:updated", c.rutina.data.rutina);
      });

      badge.addEventListener("click", () => {
        c.rutina.seleccionarEjercicio(id);
        c._renderRutina();
        c._renderSeries();
      });

      badge.append(dragHandle, nombreSpan, seriesTag, guideBtn, deleteBtn);
      frag.appendChild(badge);
    });

    container.appendChild(frag);
}

export function renderPlantillas(c: WorkoutController): void {
    const container = c.el.plantillasContainer;
    if (!container) return;
    container.replaceChildren();

    const plantillas: Plantilla[] = Store.listarPlantillas();

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
      cargarBtn.addEventListener("click", () => c._cargarPlantilla(p.id));

      const eliminarBtn = document.createElement("button");
      eliminarBtn.type = "button";
      eliminarBtn.className = "danger";
      eliminarBtn.textContent = "Eliminar";
      eliminarBtn.addEventListener("click", () => c._eliminarPlantilla(p.id));

      acciones.append(cargarBtn, eliminarBtn);

      item.append(info, ejercicios, acciones);
      frag.appendChild(item);
    });

    container.appendChild(frag);
}

export function renderPlantillasPredefinidas(c: WorkoutController): void {
    const container = c.el.plantillasPredefinidasContainer;
    if (!container) return;
    container.replaceChildren();

    const frag = document.createDocumentFragment();

    PLANTILLAS_PREDEFINIDAS.forEach((tpl: PlantillaPredefinida) => {
      const card = document.createElement("article");
      card.className = "predef-card";

      const head = document.createElement("div");
      head.className = "predef-head";

      const titulo = document.createElement("h4");
      titulo.textContent = tpl.nombre;

      const badges = document.createElement("span");
      badges.className = "predef-tags";
      badges.textContent = (tpl.etiquetas || []).join(" · ");

      head.append(titulo, badges);

      const desc = document.createElement("p");
      desc.className = "predef-desc";
      desc.textContent = tpl.descripcion || "";

      const ejList = document.createElement("p");
      ejList.className = "predef-ejercicios";
      ejList.textContent = (tpl.ejercicios || [])
        .map((id) => {
          const ej = EJERCICIOS_DISPONIBLES.find((e) => e.id === id);
          return ej ? ej.nombre : id;
        })
        .join(" · ");

      const acciones = document.createElement("div");
      acciones.className = "predef-acciones";

      const importarBtn = document.createElement("button");
      importarBtn.type = "button";
      importarBtn.className = "primary";
      importarBtn.textContent = "Importar y usar";
      importarBtn.addEventListener("click", () => c._importarPlantillaPredefinida(tpl));

      acciones.appendChild(importarBtn);

      card.append(head, desc, ejList, acciones);
      frag.appendChild(card);
    });

    container.appendChild(frag);
}

export function renderSeries(c: WorkoutController): void {
    const ejercicioId = c.rutina.getEjercicioActual();
    const serieForm = c.el.serieForm;
    const emptyMsg = c.el.serieFormEmpty;

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

    // Recordatorio "última vez": qué hizo el usuario en este ejercicio la última
    // vez, para reducir la fricción de cargar series. Solo texto de contexto.
    const ultima = c.rutina.getUltimaSesionEjercicio(ejercicioId);
    const ultimaVezEl = c.el.serieUltimaVez;
    if (ultimaVezEl) {
      if (ultima && (ultima.peso !== null || ultima.reps !== null)) {
        const rpeTxt = ultima.rpe ? " · RPE " + ultima.rpe : "";
        ultimaVezEl.textContent =
          "Última vez: " +
          (ultima.peso !== null ? ultima.peso : "—") + "kg × " +
          (ultima.reps !== null ? ultima.reps : "—") + " reps" +
          rpeTxt +
          (ultima.fechaISO ? " (" + ultima.fechaISO.slice(0, 10) + ")" : "");
      } else {
        ultimaVezEl.textContent = "";
      }
    }

    // Prefill opcional: si el usuario todavía no tocó peso/reps de la serie nueva,
    // precargamos el valor real (editable) de la última vez. Guardamos con valor
    // vacío para no pisar lo que ya haya escrito (ej. al cambiar de ejercicio).
    if (ultima) {
      if (c.el.seriePeso && c.el.seriePeso.value === "" && ultima.peso !== null) {
        c.el.seriePeso.value = String(ultima.peso);
      }
      if (c.el.serieReps && c.el.serieReps.value === "" && ultima.reps !== null) {
        c.el.serieReps.value = String(ultima.reps);
      }
    }

    const series = c.rutina.seriesPorEjercicio[ejercicioId] || [];
    const container = c.el.seriesContainer;
    container.replaceChildren();

    const frag = document.createDocumentFragment();
    series.forEach((s: Serie, idx: number) => {
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
        c.rutina.eliminarSerie(ejercicioId, s.id);
        Store.guardar();
        Store.emit("series:updated", { ejercicioId });
      });

      item.append(info, delBtn);
      frag.appendChild(item);
    });

    container.appendChild(frag);
    c._actualizarMetricasEjercicio(ejercicioId, series);
}

export function renderAutoreg(c: WorkoutController, sug: AutoregSugerencia | null): void {
    const cont = c.el.autoregSugerencia;
    cont.replaceChildren();
    if (!sug) return;

    const div = document.createElement("div");
    div.className = "autoreg-box";
    const deltaSign = sug.delta > 0 ? "+" : "";
    div.textContent = "💡 Sugerencia prox. serie: " + sug.peso + "kg (" + deltaSign + sug.delta + "kg para RPE obj.)";
    cont.appendChild(div);
}
