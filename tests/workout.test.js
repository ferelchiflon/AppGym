import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkoutController } from "../src/controllers/workout.controller.js";
import { Store } from "../src/store.js";
import { Toast } from "../src/toast.js";
import { Dialog } from "../src/dialog.js";
import { GestorTimer } from "../src/gestor-timer.js";
import { ExerciseGuide } from "../src/components/exercise-guide.js";
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
