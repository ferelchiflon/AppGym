/**
 * src/types/gym.d.ts
 * Contratos de datos estrictos para el ecosistema GYM PRO.
 */

export type MusculoGrupo =
  | "pecho"
  | "espalda"
  | "piernas"
  | "hombros"
  | "biceps"
  | "triceps"
  | "core"
  | "gluteos"
  | "gemelos"
  | "antebrazos";

export type PatronMovimiento =
  | "empuje"
  | "jalon"
  | "sentadilla"
  | "bisagra"
  | "zancada"
  | "isometrico"
  | "aislamiento";

export type Equipamiento =
  | "barra"
  | "mancuerna"
  | "polea"
  | "maquina"
  | "peso_corporal"
  | "kettlebell"
  | "banda";

export type ObjetivoAtleta = "fuerza" | "hipertrofia" | "power";
export type NivelAtleta = "principiante" | "intermedio" | "avanzado";
export type GeneroAtleta = "masculino" | "femenino" | "otro";

export interface Ejercicio {
  id: string;
  nombre: string;
  musculo: MusculoGrupo;
  musculosSecundarios?: MusculoGrupo[];
  intensidad: number; // 1 - 10
  patron: PatronMovimiento;
  equipamiento: Equipamiento;
  personalizado?: boolean;
  notasTecnicas?: string;
}

export interface Serie {
  id: string;
  peso: number;
  reps: number;
  rpe?: number;
  rir?: number | null;
  notas?: string;
  timestamp?: number;
  completada?: boolean;
}

export interface SesionEntrenamiento {
  id: string;
  fecha: string;
  fechaISO: string;
  isoDate: string;
  duracionMinutos: number;
  ejercicios: {
    ejercicioId: string;
    nombre: string;
    series: Serie[];
    volumenTotal: number;
    rmEstimado: number;
  }[];
  volumenTotal: number;
  kcalEstimadas: number;
  indiceFuerza: number;
  rpePromedio?: number;
}

export type TipoCardio = "correr" | "bici" | "remo" | "otro";

export interface SesionCardio {
  id: string;
  tipo: TipoCardio;
  /** Duración en minutos. */
  duracion: number;
  /** Distancia en kilómetros (opcional). */
  distancia?: number | null;
  /** Frecuencia cardíaca promedio en ppm (opcional, carga manual). */
  fc?: number | null;
  /** Percepción subjetiva del esfuerzo (1-10). */
  rpe: number;
  notas?: string;
  fecha: string;
  timestamp?: string;
}

export interface PerfilAtletaData {
  id: string;
  nombre: string;
  perfil: {
    edad: number;
    altura: number;
    peso: number;
    grasa: number | null;
    objetivo: ObjetivoAtleta;
    nivel: NivelAtleta;
    genero: GeneroAtleta;
  };
  wellness: WellnessRegistro[];
  nutricion?: NutricionRegistro[];
  saltos: SaltoCMJ[];
  sesionesCardio: SesionCardio[];
  rutina: string[];
  seriesPorEjercicio: Record<string, Serie[]>;
  superseries: Record<string, string[]>;
  historial: SesionEntrenamiento[];
  bloques: BloquePeriodizacion[];
  records: Record<string, number>;
  acumulados: {
    fuerza: number;
    kcal: number;
    volumen: number;
  };
  medidas: {
    pecho: number;
    cintura: number;
    cadera: number;
    pesoCorporal: number;
    altura: number;
    historial: {
      fecha: string;
      peso: number;
      pecho: number;
      cintura: number;
      cadera: number;
      imc: number;
    }[];
  };
  ejerciciosPersonalizados?: Ejercicio[];
}

export interface WellnessRegistro {
  fecha: string;
  sueno: number; // 1 - 5
  estres: number; // 1 - 5
  doms: number; // 1 - 5
  motivacion: number; // 1 - 5
  energia: number; // 1 - 5
  fatiga: number; // 1 - 5
  alimentacion: number; // 1 - 5
  hidratacion: number; // 1 - 5
}

export interface NutricionRegistro {
  fecha: string;
  comidas: number;
  proteina: boolean;
  agua: boolean;
}

export interface SaltoCMJ {
  id: string;
  fecha: string;
  altura: number; // en cm
  fatigaEstimadaPct?: number;
}

export type TipoBloquePeriodizacion =
  | "acumulacion"
  | "intensificacion"
  | "realizacion"
  | "deload";

export interface BloquePeriodizacion {
  id: string;
  nombre: string;
  tipo: TipoBloquePeriodizacion;
  semanas: number;
  semanaActual: number;
  fechaInicio: string;
  activo: boolean;
  progresoPct: number;
  totalSemanas: number;
  estado: string;
}

/** Plantilla de rutina guardada en el perfil activo (Store.crearPlantilla). */
export interface Plantilla {
  id: string;
  nombre: string;
  ejercicios: string[];
  creadaEn?: string;
}

/** Plantilla de entrenamiento predefinida del sistema (data/plantillas-predefinidas.js). */
export interface PlantillaPredefinida {
  id: string;
  nombre: string;
  descripcion?: string;
  nivel?: string;
  etiquetas?: string[];
  ejercicios: string[];
}

export interface AppStoreData {
  version: string;
  activeProfileId: string;
  profiles: Record<string, PerfilAtletaData>;
}

/** Resultado del cruce entre historial y wellness usado en banner y analytics. */
export interface WellnessCorrelacionResultado {
  suficienteDatos: boolean;
  cruces: number;
  sueno: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
  estres: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
  doms: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
  motivacion: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
  energia: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
  fatiga: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
  alimentacion: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
  hidratacion: { diffPct: number | null; nBajos: number; nAltos: number } | undefined;
}

/** Tendencia de listos para el banner (hoy vs ventana anterior). */
export interface TendenciaReadiness {
  [key: string]: {
    actual: number | null;
    anterior: number | null;
    direccion: "subio" | "bajo" | "estable" | "nuevo";
    delta: number | null;
  };
}

/** Resultado del cálculo de readiness utilizado en el dashboard. */
export interface Readiness {
  score: number;
  color: string;
  partes: Record<string, number>;
}

export interface ResumenCardio {
  sesiones: number;
  minutos: number;
  distancia: number;
  fcPromedio: number | null;
  rpePromedio: number | null;
}

interface VolumenStats {
  total: number;
  semana: number;
}
interface SEStats {
  total: number;
  semana: number;
}
interface StreStats {
  total: number;
  semana: number;
}
interface BestStats {
  total: number;
  semana: number;
  ejercicio: string;
}
interface AcwrData {
  ratio: number;
  zona: string;
  etiqueta: string;
}
