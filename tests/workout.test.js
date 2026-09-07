import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkoutController } from "../src/controllers/workout.controller.js";
import { Store } from "../src/store.js";
import { Toast } from "../src/toast.js";
import { Dialog } from "../src/dialog.js";
import { GestorTimer } from "../src/gestor-timer.js";
import { ExerciseGuide } from "../src/components/exercise-guide.js";
import { PlateCalculator } from "../src/formulas.js";
import workoutViewHtml from "../src/views/workout.js";

function mountWorkoutDOM() {
  document.body.innerHTML = workoutViewHtml;
  return {
    filtroMusculoSelect: document.getElementById("filtroMusculoSelect"),
    filtroPatronSelect: document.getElementById("filtroPatronSelect"),
    ejercicioBusqueda: document.getElementById("ejercicioBusqueda"),
    ejercicioCountNote: document.getElementById("ejercicioCountNote"),
    selectEjercicio: document.getElementById("ejercicioSelect"),
    crearEjercicioBtn: document.getElementById("crearEjercicioBtn"),
    rutinaContainer: document.getElementById("rutinaContainer"),
    ejerciciosCount: document.getElementById("ejerciciosCount"),
    agregarBtn: document.getElementById("agregarEjercicioBtn"),
    resetRutinaBtn: document.getElementById("resetRutinaBtn"),
    guardarPlantillaBtn: document.getElementById("guardarPlantillaBtn"),
    plantillasContainer: document.getElementById("plantillasContainer"),
    plantillasPredefinidasContainer: document.getElementById("plantillasPredefinidasContainer"),
    seriesContainer: document.getElementById("seriesContainer"),
    serieForm: document.getElementById("serieForm"),
    serieFormEmpty: document.getElementById("serieFormEmpty"),
    seriePeso: document.getElementById("seriePeso"),
    serieReps: document.getElementById("serieReps"),
    serieRPE: document.getElementById("serieRPE"),
    serieRIR: document.getElementById("serieRIR"),
    serieNotas: document.getElementById("serieNotas"),
    rpePorcentajeDisplay: document.getElementById("rpePorcentajeDisplay"),
    addSerieBtn: document.getElementById("addSerieBtn"),
    guardarSesionBtn: document.getElementById("guardarSesionBtn"),
    limpiarSeriesBtn: document.getElementById("limpiarSeriesBtn"),
    rmEpley: document.getElementById("rmEpley"),
    rmBrzycki: document.getElementById("rmBrzycki"),
    rmLombardi: document.getElementById("rmLombardi"),
    rmPromedio: document.getElementById("rmPromedio"),
    autoregSugerencia: document.getElementById("autoregSugerencia"),
    rpeObjetivoInput: document.getElementById("rpeObjetivoInput"),
    warmUpContainer: document.getElementById("warmUpContainer"),
    calcularWarmUpBtn: document.getElementById("calcularWarmUpBtn"),
    discoPesoObjetivo: document.getElementById("discoPesoObjetivo"),
    discoPesoBarra: document.getElementById("discoPesoBarra"),
    calcularDiscosBtn: document.getElementById("calcularDiscosBtn"),
    discosResultado: document.getElementById("discosResultado"),
    timerMinutes: document.getElementById("timerMinutes"),
    timerSeconds: document.getElementById("timerSeconds"),
    setTimerBtn: document.getElementById("setTimerBtn"),
    timerDisplay: document.getElementById("timerDisplay"),
    startTimerBtn: document.getElementById("startTimerBtn"),
    pauseTimerBtn: document.getElementById("pauseTimerBtn"),
    resetTimerBtn: document.getElementById("resetTimerBtn"),
  };
}

function makeRutina() {
  return {
    data: {
      rutina: ["press_banca"],
      seriesPorEjercicio: {
        press_banca: [
          { peso: 80, reps: 8, rpe: 8, rir: 2, timestamp: "2026-09-04T12:00:00.000Z", esPR: false },
        ],
      },
      superseries: {},
    },
    ejercicioSeleccionado: "press_banca",
    getEjercicioActual: vi.fn(() => "press_banca"),
    seleccionarEjercicio: vi.fn(function (id) {
      this.ejercicioSeleccionado = id;
    }),
    agregarEjercicio: vi.fn(function (id) {
      if (this.data.rutina.includes(id)) return false;
      this.data.rutina.push(id);
      return true;
    }),
    eliminarEjercicio: vi.fn(function (id) {
      this.data.rutina = this.data.rutina.filter((x) => x !== id);
    }),
    reordenarEjercicio: vi.fn(() => true),
    agregarSerie: vi.fn(function (id, s) {
      if (!this.data.seriesPorEjercicio[id]) this.data.seriesPorEjercicio[id] = [];
      this.data.seriesPorEjercicio[id].push(s);
      return { esPR: false };
    }),
    get rutina() {
      return this.data.rutina;
    },
    get seriesPorEjercicio() {
      return this.data.seriesPorEjercicio;
    },
    get superseries() {
      return this.data.superseries;
    },
    eliminarSerie: vi.fn(),
    eliminarTodasSeries: vi.fn(),
    guardarSesion: vi.fn(() => ({ completada: true })),
    getSeries: vi.fn(() => [
      { peso: 80, reps: 8, rpe: 8, rir: 2, timestamp: "2026-09-04T12:00:00.000Z" },
    ]),
  };
}

function makeTimer() {
  return {
    setTiempo: vi.fn(),
    iniciar: vi.fn(),
    pausar: vi.fn(),
    reset: vi.fn(),
  };
}

describe("WorkoutController", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Toast, "mostrar").mockImplementation(() => {});
    vi.spyOn(Store, "guardar").mockImplementation(() => {});
    vi.spyOn(GestorTimer, "vibrarCorto").mockImplementation(() => {});
    vi.spyOn(GestorTimer, "vibrarPR").mockImplementation(() => {});
  });

  describe("Render e Inicialización", () => {
    it("inicializa y renderiza filtros, ejercicios y rutina activa", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      const timer = makeTimer();

      new WorkoutController({ app: {}, el, rutina, timer });

      expect(el.filtroMusculoSelect.options.length).toBeGreaterThan(1);
      expect(el.filtroPatronSelect.options.length).toBeGreaterThan(1);
      expect(el.selectEjercicio.options.length).toBeGreaterThan(0);
      expect(el.ejerciciosCount.textContent).toBe("1");
      expect(el.rutinaContainer.children.length).toBe(1);
    });

    it("cuando no hay ejercicio seleccionado muestra serieFormEmpty", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.getEjercicioActual.mockReturnValue(null);
      rutina.ejercicioSeleccionado = null;

      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      expect(el.serieForm.classList.contains("hidden")).toBe(true);
      expect(el.serieFormEmpty.classList.contains("hidden")).toBe(false);
      expect(el.serieFormEmpty.textContent).toContain("Selecciona o agrega un ejercicio");
    });
  });

  describe("Filtros y Búsqueda", () => {
    it("filtra ejercicios al cambiar filtroMusculoSelect", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.filtroMusculoSelect.value = "pecho";
      el.filtroMusculoSelect.dispatchEvent(new Event("change"));

      const options = Array.from(el.selectEjercicio.options);
      expect(options.length).toBeGreaterThan(0);
      expect(options.some((opt) => opt.value === "press_banca")).toBe(true);
    });

    it("filtra por patrón biomecánico", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.filtroPatronSelect.value = "empuje_horizontal";
      el.filtroPatronSelect.dispatchEvent(new Event("change"));

      expect(el.selectEjercicio.options.length).toBeGreaterThan(0);
    });
  });

  describe("Interacciones con la Rutina", () => {
    it("agrega un ejercicio a la rutina al hacer clic en agregarBtn", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.selectEjercicio.value = "sentadilla";
      el.agregarBtn.click();

      expect(rutina.agregarEjercicio).toHaveBeenCalledWith("sentadilla");
      expect(Store.guardar).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith("Ejercicio agregado a la rutina", "success");
    });

    it("informa si el ejercicio ya está en la rutina", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.selectEjercicio.value = "press_banca";
      el.agregarBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith("Este ejercicio ya está en la rutina", "error");
    });

    it("reinicia la rutina tras confirmación de Dialog", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(true);

      await el.resetRutinaBtn.click();

      expect(Dialog.confirm).toHaveBeenCalled();
      expect(rutina.data.rutina).toEqual([]);
      expect(Store.guardar).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith("Rutina reiniciada", "info");
    });
  });

  describe("Interacciones con Series y Cálculos", () => {
    it("calcula 1RM en tiempo real y actualiza RIR/RPE bidireccionalmente", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.seriePeso.value = "100";
      el.serieReps.value = "5";
      el.serieRPE.value = "8";
      el.serieRPE.dispatchEvent(new Event("input"));

      expect(el.serieRIR.value).toBe("2");
      expect(el.rpePorcentajeDisplay.innerHTML).toContain("1RM est");

      // Modificar RIR actualiza RPE
      el.serieRIR.value = "1";
      el.serieRIR.dispatchEvent(new Event("input"));
      expect(el.serieRPE.value).toBe("9");
    });

    it("agrega una serie al hacer clic en addSerieBtn", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      const controller = new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.seriePeso.value = "90";
      el.serieReps.value = "6";
      el.serieRPE.value = "8.5";
      el.serieRIR.value = "1.5";
      el.serieNotas.value = "Buena técnica";

      el.addSerieBtn.click();

      expect(rutina.agregarSerie).toHaveBeenCalledWith("press_banca", expect.objectContaining({
        peso: 90,
        reps: 6,
        rpe: 8.5,
        rir: 1.5,
        notas: "Buena técnica",
      }));
      expect(Store.guardar).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith("Serie agregada", "success");
    });

    it("limpia las series del ejercicio actual tras confirmación", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(true);

      await el.limpiarSeriesBtn.click();

      expect(Dialog.confirm).toHaveBeenCalled();
      expect(rutina.eliminarTodasSeries).toHaveBeenCalledWith("press_banca");
      expect(Toast.mostrar).toHaveBeenCalledWith("Series eliminadas", "info");
    });

    it("guarda sesión completa", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(true);

      await el.guardarSesionBtn.click();

      expect(rutina.guardarSesion).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("guardada"), "success");
    });
  });

  describe("Herramientas adicionales: Warmup, Discos y Timer", () => {
    it("calcula warm-up para el peso actual", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.seriePeso.value = "100";
      el.calcularWarmUpBtn.click();

      expect(el.warmUpContainer.innerHTML).toContain("Aproximación");
      expect(el.warmUpContainer.innerHTML).toContain("kg");
    });

    it("calcula distribución de discos para peso objetivo", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.discoPesoObjetivo.value = "100";
      el.discoPesoBarra.value = "20";
      el.calcularDiscosBtn.click();

      expect(el.discosResultado.innerHTML).toContain("por lado");
      expect(el.discosResultado.innerHTML).toContain("25kg");
      expect(el.discosResultado.innerHTML).toContain("15kg");
    });

    it("controla el Timer de descanso (fijar, iniciar, pausar, reset)", () => {
      const el = mountWorkoutDOM();
      const timer = makeTimer();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer });

      el.timerMinutes.value = "3";
      el.timerSeconds.value = "15";
      el.setTimerBtn.click();
      expect(timer.setTiempo).toHaveBeenCalledWith(3, 15);
      expect(Toast.mostrar).toHaveBeenCalledWith("Tiempo fijado", "info");

      el.startTimerBtn.click();
      expect(timer.iniciar).toHaveBeenCalled();

      el.pauseTimerBtn.click();
      expect(timer.pausar).toHaveBeenCalled();

      el.resetTimerBtn.click();
      expect(timer.reset).toHaveBeenCalled();
    });

    it("los stepper chips ajustan valores numéricos del input destino", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.seriePeso.value = "60";
      const chip = document.querySelector('.stepper-chip[data-step-target="seriePeso"][data-step-val="2.5"]');
      chip.click();

      expect(el.seriePeso.value).toBe("62.5");
      expect(GestorTimer.vibrarCorto).toHaveBeenCalled();
    });

    it("sincroniza el botón Guía abriendo ExerciseGuide si está disponible", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      const guiaBtn = document.getElementById("guiaBtn");
      vi.spyOn(ExerciseGuide, "abrirPorEjercicio").mockReturnValue(true);

      el.selectEjercicio.value = "press_banca";
      guiaBtn.click();

      expect(ExerciseGuide.abrirPorEjercicio).toHaveBeenCalledWith("press_banca");
    });
  });
});

describe("WorkoutController - Cobertura adicional", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Toast, "mostrar").mockImplementation(() => {});
    vi.spyOn(Store, "guardar").mockImplementation(() => {});
    vi.spyOn(GestorTimer, "vibrarCorto").mockImplementation(() => {});
    vi.spyOn(GestorTimer, "vibrarPR").mockImplementation(() => {});
  });

  describe("actualizarInstancias y suscripciones reactivas", () => {
    it("actualizarInstancias cambia rutina, timer y vuelve a renderizar", () => {
      const el = mountWorkoutDOM();
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      const newRutina = makeRutina();
      newRutina.data.rutina = ["press_banca", "sentadilla"];
      const newTimer = makeTimer();

      controller.actualizarInstancias({ rutina: newRutina, timer: newTimer });

      expect(controller.rutina).toBe(newRutina);
      expect(controller.timer).toBe(newTimer);
      expect(el.ejerciciosCount.textContent).toBe("2");
    });

    it("actualizarInstancias respeta rutina o timer opcionales", () => {
      const el = mountWorkoutDOM();
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      const soloRutina = makeRutina();
      controller.actualizarInstancias({ rutina: soloRutina });
      expect(controller.rutina).toBe(soloRutina);

      const soloTimer = makeTimer();
      controller.actualizarInstancias({ timer: soloTimer });
      expect(controller.timer).toBe(soloTimer);
      expect(controller.rutina).toBe(soloRutina);
    });

    it("reacciona a exercises:updated y plantillas:updated del Store", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      expect(el.selectEjercicio.options.length).toBeGreaterThan(0);
      Store.emit("exercises:updated");
      expect(el.selectEjercicio.options.length).toBeGreaterThan(0);

      vi.spyOn(Store, "listarPlantillas").mockReturnValue([
        { id: "p1", nombre: "Día de pecho", creadaEn: "2026-09-01T10:00:00.000Z", ejercicios: ["press_banca"] },
      ]);
      Store.emit("plantillas:updated");
      expect(el.plantillasContainer.querySelectorAll(".plantilla-item").length).toBe(1);
    });
  });

  describe("Filtros, búsqueda y selector de ejercicios", () => {
    it("filtra por búsqueda sobre un grupo muscular secundario (ej: triceps)", () => {
      const el = mountWorkoutDOM();
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      controller._busquedaActual = "triceps";
      controller._renderSelectorEjercicios();

      const options = Array.from(el.selectEjercicio.options).map((o) => o.value);
      expect(options).toContain("press_banca");
    });

    it("muestra 'Sin resultados' cuando la búsqueda o filtros no devuelven nada", () => {
      const el = mountWorkoutDOM();
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      controller._busquedaActual = "xyz_no_existe";
      controller._renderSelectorEjercicios();

      const options = Array.from(el.selectEjercicio.options);
      expect(options).toHaveLength(1);
      expect(options[0].value).toBe("");
    });

    it("aplica la búsqueda por input con debounce", () => {
      vi.useFakeTimers();
      try {
        const el = mountWorkoutDOM();
        new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

        el.ejercicioBusqueda.value = "sentadilla";
        el.ejercicioBusqueda.dispatchEvent(new Event("input"));
        vi.advanceTimersByTime(200);

        const options = Array.from(el.selectEjercicio.options).map((o) => o.value);
        expect(options).toContain("sentadilla");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("Plantillas guardadas (render y guardado)", () => {
    it("renderiza plantillas con nombre, fecha y ejercicios resueltos (fallback a id)", () => {
      const el = mountWorkoutDOM();
      vi.spyOn(Store, "listarPlantillas").mockReturnValue([
        { id: "p1", nombre: "Día de pecho", creadaEn: "2026-09-01T10:00:00.000Z", ejercicios: ["press_banca", "press_inclinado_barra"] },
        { id: "p2", nombre: "Con ejercicio desconocido", ejercicios: ["id_inexistente"] },
        { id: "p3", nombre: "Sin fecha ni ejercicios", creadaEn: null },
      ]);
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      const items = el.plantillasContainer.querySelectorAll(".plantilla-item");
      expect(items.length).toBe(3);

      expect(items[0].querySelector(".plantilla-nombre").textContent).toBe("Día de pecho");
      expect(items[0].querySelector(".plantilla-detalle").textContent).toContain("2 ejercicios");
      expect(items[0].querySelector(".plantilla-ejercicios").textContent).toContain("Press banca");
      expect(items[1].querySelector(".plantilla-ejercicios").textContent).toContain("id_inexistente");
      expect(items[2].querySelector(".plantilla-detalle").textContent).toContain("0 ejercicios");
    });

    it("guarda la rutina actual como plantilla", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.guardarComoPlantilla = vi.fn(() => ({ id: "pl", nombre: "Mi plan", ejercicios: ["press_banca"] }));
      vi.spyOn(Dialog, "pedirTexto").mockResolvedValue("Mi plan");
      vi.spyOn(Store, "listarPlantillas").mockReturnValue([{ id: "pl", nombre: "Mi plan", ejercicios: ["press_banca"] }]);
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      await el.guardarPlantillaBtn.click();

      expect(rutina.guardarComoPlantilla).toHaveBeenCalledWith("Mi plan");
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("guardada"), "success");
    });

    it("avisa si se intenta guardar con la rutina vacía", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.data.rutina = [];
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.guardarPlantillaBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("La rutina está vacía"), "warning");
    });
  });

  describe("Cargar, eliminar e importar plantillas", () => {
    it("_cargarPlantilla carga sin confirmar si la rutina no tiene series", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.data.seriesPorEjercicio = { press_banca: [] };
      rutina.cargarPlantilla = vi.fn(() => true);
      vi.spyOn(Store, "listarPlantillas").mockReturnValue([{ id: "pl", nombre: "Pecho", ejercicios: ["press_banca"] }]);
      const controller = new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      await controller._cargarPlantilla("pl");

      expect(rutina.cargarPlantilla).toHaveBeenCalledWith("pl");
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("cargada"), "success");
    });

    it("_cargarPlantilla confirma si hay series y respeta la cancelación", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.cargarPlantilla = vi.fn(() => true);
      vi.spyOn(Store, "listarPlantillas").mockReturnValue([{ id: "pl", nombre: "Pecho", ejercicios: ["press_banca"] }]);
      const controller = new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(false);
      await controller._cargarPlantilla("pl");
      expect(rutina.cargarPlantilla).not.toHaveBeenCalled();

      vi.spyOn(Dialog, "confirm").mockResolvedValue(true);
      await controller._cargarPlantilla("pl");
      expect(rutina.cargarPlantilla).toHaveBeenCalledWith("pl");
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("cargada"), "success");
    });

    it("_cargarPlantilla no hace nada si la plantilla no existe", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.cargarPlantilla = vi.fn(() => true);
      vi.spyOn(Store, "listarPlantillas").mockReturnValue([]);
      const controller = new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      await controller._cargarPlantilla("noexiste");
      expect(rutina.cargarPlantilla).not.toHaveBeenCalled();
    });

    it("_eliminarPlantilla borra tras confirmar y re-renderiza", async () => {
      const el = mountWorkoutDOM();
      vi.spyOn(Store, "listarPlantillas").mockReturnValue([{ id: "pl", nombre: "Pecho", ejercicios: ["press_banca"] }]);
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(true);
      vi.spyOn(Store, "eliminarPlantilla").mockReturnValue(true);

      await controller._eliminarPlantilla("pl");

      expect(Store.eliminarPlantilla).toHaveBeenCalledWith("pl");
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("eliminada"), "info");
    });

    it("_eliminarPlantilla respeta la cancelación", async () => {
      const el = mountWorkoutDOM();
      vi.spyOn(Store, "listarPlantillas").mockReturnValue([{ id: "pl", nombre: "Pecho", ejercicios: ["press_banca"] }]);
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(false);
      vi.spyOn(Store, "eliminarPlantilla").mockReturnValue(true);
      await controller._eliminarPlantilla("pl");
      expect(Store.eliminarPlantilla).not.toHaveBeenCalled();
    });

    it("_importarPlantillaPredefinida avisa si la plantilla no trae ejercicios", async () => {
      const el = mountWorkoutDOM();
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      await controller._importarPlantillaPredefinida({ nombre: "Vacía", ejercicios: [] });
      expect(Toast.mostrar).toHaveBeenCalledWith("Esta plantilla no tiene ejercicios definidos", "warning");
    });

    it("_importarPlantillaPredefinida importa y carga sin confirmar si no hay series", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.data.seriesPorEjercicio = { press_banca: [] };
      rutina.cargarPlantilla = vi.fn(() => true);
      vi.spyOn(Store, "crearPlantilla").mockReturnValue({ id: "pl", nombre: "Pecho", ejercicios: ["press_banca"] });
      const controller = new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      await controller._importarPlantillaPredefinida({ nombre: "Pecho", ejercicios: ["press_banca"] });

      expect(Store.crearPlantilla).toHaveBeenCalled();
      expect(rutina.cargarPlantilla).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("importada y cargada"), "success");
    });

    it("_importarPlantillaPredefinida con series confirma y, si cancelan, deja la copia guardada", async () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.cargarPlantilla = vi.fn(() => true);
      vi.spyOn(Store, "crearPlantilla").mockReturnValue({ id: "pl", nombre: "Pecho", ejercicios: ["press_banca"] });
      const controller = new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(false);
      await controller._importarPlantillaPredefinida({ nombre: "Pecho", ejercicios: ["press_banca"] });

      expect(rutina.cargarPlantilla).not.toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("Plantillas guardadas"), "info");
    });
  });

  describe("Métricas, series y cálculos (validaciones y caminos extras)", () => {
    it("_agregarSerie avisa si no hay ejercicio seleccionado", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.getEjercicioActual.mockReturnValue(null);
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.addSerieBtn.click();
      expect(Toast.mostrar).toHaveBeenCalledWith("Selecciona un ejercicio primero", "error");
    });

    it("_agregarSerie valida peso y repeticiones", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.seriePeso.value = "abc";
      el.serieReps.value = "0";
      el.addSerieBtn.click();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("peso"), "warning");
    });

    it("_agregarSerie avisa PR cuando el modelo reporta esPR", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.agregarSerie = vi.fn(() => ({ esPR: true }));
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.seriePeso.value = "120";
      el.serieReps.value = "1";
      el.addSerieBtn.click();

      expect(GestorTimer.vibrarPR).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("PR"), "success");
    });

    it("elimina una serie individual desde el formulario de series", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      const delBtn = document.querySelector(".serie-item .badge-delete");
      delBtn.click();

      expect(rutina.eliminarSerie).toHaveBeenCalledTimes(1);
      expect(Store.guardar).toHaveBeenCalled();
    });

    it("guarda la sesión y avisa si la rutina está vacía", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.data.rutina = [];
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.guardarSesionBtn.click();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("No hay ejercicios"), "warning");
    });

    it("guarda la sesión y avisa si no hay series registradas", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.data.seriesPorEjercicio = { press_banca: [] };
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      el.guardarSesionBtn.click();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("Registra al menos una serie"), "warning");
    });

    it("_calcularWarmUp avisa si el peso de trabajo no es mayor a 20kg", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.seriePeso.value = "10";
      el.calcularWarmUpBtn.click();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("20kg"), "warning");
    });

    it("_calcularDiscos avisa si el objetivo no supera el peso de la barra", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      el.discoPesoObjetivo.value = "10";
      el.discoPesoBarra.value = "20";
      el.calcularDiscosBtn.click();
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("mayor que el peso de la barra"), "warning");
    });

    it("_calcularDiscos indica cuando no se puede armar con discos estándar", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      vi.spyOn(PlateCalculator, "calcular").mockReturnValue({ alcanzable: false, porLado: [] });
      el.discoPesoObjetivo.value = "100";
      el.discoPesoBarra.value = "20";
      el.calcularDiscosBtn.click();

      expect(el.discosResultado.textContent).toContain("No es posible");
    });
  });

  describe("Botón Guía y badges de la rutina", () => {
    it("el botón Guía del selector avisa cuando no hay guía técnica", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      vi.spyOn(ExerciseGuide, "abrirPorEjercicio").mockReturnValue(false);
      el.selectEjercicio.value = "sentadilla";
      document.getElementById("guiaBtn").click();

      expect(Toast.mostrar).toHaveBeenCalledWith("Este ejercicio todavía no tiene guía técnica", "warning");
    });

    it("el badge ⓘ de un ejercicio avisa cuando no tiene guía", () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      vi.spyOn(ExerciseGuide, "abrirPorEjercicio").mockReturnValue(false);
      const guideBtn = document.querySelector(".badge.routine-badge .badge-guide");
      guideBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith("Este ejercicio todavía no tiene guía técnica", "warning");
    });

    it("el badge × elimina el ejercicio de la rutina", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      const delBtn = document.querySelector(".badge.routine-badge .badge-delete");
      delBtn.click();

      expect(rutina.eliminarEjercicio).toHaveBeenCalledWith("press_banca");
      expect(Store.guardar).toHaveBeenCalled();
    });

    it("hacer clic en un badge selecciona el ejercicio", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      const badge = document.querySelector(".badge.routine-badge");
      badge.click();

      expect(rutina.seleccionarEjercicio).toHaveBeenCalledWith("press_banca");
    });
  });

  describe("Crear ejercicio personalizado", () => {
    it("no hace nada si se cancela el nombre", async () => {
      const el = mountWorkoutDOM();
      new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      const agregar = vi.spyOn(Store, "agregarEjercicioPersonalizado").mockImplementation(() => {});
      vi.spyOn(Dialog, "pedirTexto").mockResolvedValue(null);

      await el.crearEjercicioBtn.click();

      expect(agregar).not.toHaveBeenCalled();
    });

    it("guarda el ejercicio con el grupo filtrado activo", async () => {
      const el = mountWorkoutDOM();
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      const agregar = vi.spyOn(Store, "agregarEjercicioPersonalizado").mockImplementation(() => {});
      controller._grupoFiltroActual = "espalda";
      vi.spyOn(Dialog, "pedirTexto").mockResolvedValue("Remo en polea");

      await el.crearEjercicioBtn.click();

      expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Remo en polea", musculo: "espalda" }));
      expect(Toast.mostrar).toHaveBeenCalledWith(expect.stringContaining("guardado"), "success");
    });

    it("usa 'pecho' por defecto si no hay filtro activo", async () => {
      const el = mountWorkoutDOM();
      const controller = new WorkoutController({ app: {}, el, rutina: makeRutina(), timer: makeTimer() });

      const agregar = vi.spyOn(Store, "agregarEjercicioPersonalizado").mockImplementation(() => {});
      controller._grupoFiltroActual = "todos";
      vi.spyOn(Dialog, "pedirTexto").mockResolvedValue("Aperturas");

      await el.crearEjercicioBtn.click();

      expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ musculo: "pecho" }));
    });
  });

  describe("Drag & Drop (hacerReordenable)", () => {
    it("registra listeners y reordena al completar un arrastre con Pointer Events", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.data.rutina = ["press_banca", "sentadilla"];
      rutina.data.seriesPorEjercicio = { press_banca: [], sentadilla: [] };
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      expect(el.rutinaContainer.hasAttribute("data-dnd")).toBe(true);

      const handle = el.rutinaContainer.querySelectorAll(".drag-handle")[0];
      const downEvt = new Event("pointerdown", { bubbles: true, cancelable: true });
      downEvt.pointerId = 1;
      handle.dispatchEvent(downEvt);

      const moveEvt = new Event("pointermove", { bubbles: true, cancelable: true });
      moveEvt.clientY = 0;
      window.dispatchEvent(moveEvt);

      window.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }));

      expect(rutina.reordenarEjercicio).toHaveBeenCalled();
    });

    it("no reordena si el pointerdown no se origina en un manejador de arrastre", () => {
      const el = mountWorkoutDOM();
      const rutina = makeRutina();
      rutina.data.rutina = ["press_banca", "sentadilla"];
      rutina.data.seriesPorEjercicio = { press_banca: [], sentadilla: [] };
      new WorkoutController({ app: {}, el, rutina, timer: makeTimer() });

      const badge = el.rutinaContainer.querySelector(".badge.routine-badge");
      badge.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));

      expect(rutina.reordenarEjercicio).not.toHaveBeenCalled();
    });
  });
});
