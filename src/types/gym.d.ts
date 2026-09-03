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
  rir?: number;
  notas?: string;
  timestamp?: number;
  completada?: boolean;
}

export interface SesionEntrenamiento {
  id: string;
  fecha: string;
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
  id: string;
  fecha: string;
  sueno: number; // 1 - 5
  estres: number; // 1 - 5
  doms: number; // 1 - 5
  motivacion: number; // 1 - 5
  puntuacionTotal: number;
  estado: "optimo" | "recuperacion" | "fatiga_alta";
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
}

export interface AppStoreData {
  version: string;
  activeProfileId: string;
  profiles: Record<string, PerfilAtletaData>;
}
