import type { PlantillaPredefinida, Serie } from "./gym.d.ts";

/**
 * Elementos del DOM de la vista "Entrenar" usados por los renderers y el wiring
 * de eventos (HTML estático de views/workout.js, mapeados en app.js).
 */
export interface WorkoutElements {
  filtroMusculoSelect: HTMLSelectElement;
  filtroPatronSelect: HTMLSelectElement;
  selectEjercicio: HTMLSelectElement;
  crearEjercicioBtn: HTMLButtonElement;
  guardarPlantillaBtn: HTMLButtonElement;
  agregarBtn: HTMLButtonElement;
  ejercicioBusqueda: HTMLInputElement;
  ejercicioCountNote: HTMLElement;
  ejerciciosCount: HTMLElement;
  rutinaContainer: HTMLElement;
  plantillasContainer: HTMLElement;
  plantillasPredefinidasContainer: HTMLElement;
  serieForm: HTMLElement;
  serieFormEmpty: HTMLElement;
  serieUltimaVez: HTMLElement;
  seriePeso: HTMLInputElement;
  serieReps: HTMLInputElement;
  serieRPE: HTMLInputElement;
  serieRIR: HTMLInputElement;
  rpePorcentajeDisplay: HTMLElement;
  addSerieBtn: HTMLButtonElement;
  guardarSesionBtn: HTMLButtonElement;
  limpiarSeriesBtn: HTMLButtonElement;
  resetRutinaBtn: HTMLButtonElement;
  calcularWarmUpBtn: HTMLButtonElement;
  calcularDiscosBtn: HTMLButtonElement;
  timerMinutes: HTMLInputElement;
  timerSeconds: HTMLInputElement;
  setTimerBtn: HTMLButtonElement;
  startTimerBtn: HTMLButtonElement;
  pauseTimerBtn: HTMLButtonElement;
  resetTimerBtn: HTMLButtonElement;
  timerDisplay: HTMLElement;
  miniTimerDisplay: HTMLElement;
  floatingTimerDisplay: HTMLElement;
  floatPlayBtn: HTMLButtonElement;
  autoregSugerencia: HTMLElement;
  seriesContainer: HTMLElement;
  warmUpContainer: HTMLElement;
  discosResultado: HTMLElement;
}

/** Sesión de entrenamiento tal como la guarda GestorRutina.guardarSesion en el historial. */
export interface SesionHistorialRutina {
  id: string;
  fecha: string;
  fechaISO: string;
  timestamp: string;
  ejercicios: Array<{
    id: string;
    nombre: string;
    musculo: string;
    series: Serie[];
    volumen: number;
  }>;
  volumenTotal: number;
}

/** Datos crudos de la rutina gestionados por GestorRutina (src/gestor-rutina.js). */
export interface RutinaData {
  rutina: string[];
  seriesPorEjercicio: Record<string, Serie[]>;
  historial: SesionHistorialRutina[];
  superseries: Record<number, boolean>;
}

/** Última serie registrada de un ejercicio (GestorRutina.getUltimaSesionEjercicio). */
export interface UltimaSerieEjercicio {
  peso: number | null;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  fecha: string;
  fechaISO: string;
}

/** Vista de GestorRutina usada por los renderers de la vista "Entrenar". */
export interface GestorRutinaVista {
  data: RutinaData;
  ejercicioSeleccionado: string | null;
  rutina: string[];
  seriesPorEjercicio: Record<string, Serie[]>;
  historial: SesionHistorialRutina[];
  superseries: Record<number, boolean>;
  agregarEjercicio(id: string): boolean;
  eliminarEjercicio(id: string): void;
  seleccionarEjercicio(id: string): void;
  reordenarEjercicio(fromIdx: number, toIdx: number): boolean;
  getEjercicioActual(): string | null;
  getSeriesActuales(): Serie[];
  getUltimaSesionEjercicio(ejercicioId: string): UltimaSerieEjercicio | null;
  eliminarSerie(ejercicioId: string, serieId: string): void;
  eliminarTodasSeries(ejercicioId: string): void;
  calcularVolumen(ejercicioId: string): number;
}

/** Vista de GestorTimer usada por los renderers de la vista "Entrenar". */
export interface GestorTimerVista {
  segundosTotales: number;
  segundosRestantes: number;
  finTimestamp: number;
  corriendo: boolean;
  onTick: (segundos: number) => void;
  onFinish: () => void;
  setTiempo(minutos: number, segundos: number): void;
  iniciar(): void;
  pausar(): void;
  detener(): void;
  reset(): void;
  getTiempoFormateado(): string;
  vincularDisplay(element: HTMLElement): void;
  agregarDisplay(element: HTMLElement): void;
}

export class WorkoutController {
  app: HTMLElement;
  el: WorkoutElements;
  rutina: GestorRutinaVista;
  timer: GestorTimerVista;
  _grupoFiltroActual: string;
  _patronFiltroActual: string;
  _busquedaActual: string;
  _rirTocadoPorUsuario: boolean;
  constructor(opciones: {
    app: HTMLElement;
    el: WorkoutElements;
    rutina: GestorRutinaVista;
    timer: GestorTimerVista;
  });
  _bindEvents(): void;
  _bindSteppers(): void;
  _subscribeStore(): void;
  render(): void;
  _syncGuiaBtn(): void;
  _renderFiltroGrupos(): void;
  _renderFiltroPatrones(): void;
  _renderSelectorEjercicios(): void;
  _renderRutina(): void;
  _renderPlantillas(): void;
  _renderPlantillasPredefinidas(): void;
  _renderSeries(): void;
  _guardarComoPlantilla(): Promise<void>;
  _abrirModalCrearEjercicio(): Promise<void>;
  _calcularWarmUp(): void;
  _calcularDiscos(): void;
  _agregarSerie(): void;
  _guardarSesionCompleta(): void;
  _actualizarRPE1RMRealTime(): void;
  _actualizarMetricasEjercicio(ejercicioId: string, series: Serie[]): void;
  _cargarPlantilla(id: string): Promise<void>;
  _eliminarPlantilla(id: string): Promise<void>;
  _importarPlantillaPredefinida(tpl: PlantillaPredefinida): Promise<void>;
  actualizarInstancias(instancias: { rutina: GestorRutinaVista; timer: GestorTimerVista }): void;
}