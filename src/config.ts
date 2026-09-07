import { EJERCICIOS_CATALOGO, GRUPOS_MUSCULARES, PATRONES_MOVIMIENTO } from './data/exercises.js';

/** Configuración general de la aplicación (constantes). */
export interface AppConfig {
  VERSION: string;
  STORAGE_KEY: string;
  DEFAULT_ALTURA: number;
  DEFAULT_PESO: number;
  DISCOS_KG: number[];
  BARRA_KG_DEFAULT: number;
}

/** Una fase técnica de una guía de ejercicio. */
export interface GuiaFase {
  titulo: string;
  desc: string;
}

/** Músculo participante con su rol. */
export interface GuiaMusculo {
  nombre: string;
  rol: string;
}

/** Guía de ejecución estructurada para un ejercicio del catálogo. */
export interface EjercicioGuia {
  id: string;
  nombre: string;
  imagen: string;
  fases: GuiaFase[];
  musculos: GuiaMusculo[];
}

export const CONFIG: AppConfig = {
    VERSION: '6.0',
    STORAGE_KEY: 'gympro_data',
    DEFAULT_ALTURA: 175,
    DEFAULT_PESO: 72.5,
    DISCOS_KG: [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5],
    BARRA_KG_DEFAULT: 20,
};

export const EJERCICIOS_DISPONIBLES = EJERCICIOS_CATALOGO;
export { EJERCICIOS_CATALOGO, GRUPOS_MUSCULARES, PATRONES_MOVIMIENTO };

/**
 * Guías de ejecución por ejercicio.
 *
 * Claves = id del ejercicio en EJERCICIOS_CATALOGO. El "press militar" usa el
 * id interno `press_hombro` (aliases como "press-militar" se resuelven en
 * ExerciseGuide). `imagen` apunta a la infografía completa de la guía con una
 * ruta absoluta desde la raíz (publicDir de Vite = public/), p. ej.
 * "/guides/press-militar.jpg".
 * `fases` describe las fases técnicas (título + descripción) que se muestran
 * debajo de la imagen principal; no llevan imagen individual.
 */
const _nombreDe = (id: string): string => {
  const ej = EJERCICIOS_CATALOGO.find((e) => e.id === id);
  return ej ? ej.nombre : id;
};

export const EXERCISE_GUIDES: Record<string, EjercicioGuia> = {
  /** Press militar con barra (id del catálogo. Alias: "press-militar"). */
  press_hombro: {
    id: "press_hombro",
    nombre: _nombreDe("press_hombro"),
    imagen: "/guides/press-militar.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "Barra a la altura del pecho/mentón, agarre apenas más ancho que los hombros y antebrazos verticales. Escápulas estables, glúteos y core activados para sostener el tronco recto.",
      },
      {
        titulo: "Movimiento",
        desc: "Presioná la barra en línea recta hacia arriba mientras extendés codos y elevás el deltoides. El tríceps completa el empuje; no dejés que la barra oscile hacia adelante.",
      },
      {
        titulo: "Final",
        desc: "Bloqueá los codos en el punto más alto, con la barra levemente detrás de la corona. Bajá con control hasta reanudar la posición inicial sin arquear la espalda.",
      },
    ],
    musculos: [
      { nombre: "Deltoides anterior y lateral", rol: "Motor principal" },
      { nombre: "Tríceps braquial", rol: "Extiende el codo" },
      { nombre: "Trapecio superior", rol: "Eleva la escápula" },
      { nombre: "Pectoral clavicular", rol: "Asiste en el empuje" },
      { nombre: "Core y erectores", rol: "Estabilizan el tronco" },
      { nombre: "Glúteo y cuádriceps", rol: "Base isométrica" },
    ],
  },

  /** Sentadilla trasera con barra. */
  sentadilla: {
    id: "sentadilla",
    nombre: _nombreDe("sentadilla"),
    imagen: "/guides/sentadilla.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "Pies a ancho de hombros con las puntas levemente abiertas. Barra firme sobre el trapecio, pecho alto, columna neutra y abdomen en tensión antes de iniciar el descenso.",
      },
      {
        titulo: "Descenso",
        desc: "Flexioná cadera y rodillas al mismo tiempo, llevando el peso hacia el mediopié. Mantené las rodillas en línea con las puntas mientras el torso baja compacto y el core permanece activo.",
      },
      {
        titulo: "Profundidad",
        desc: "Bajá hasta que los muslos queden al menos paralelos al piso sin perder la curva lumbar. Empujá el suelo con el mediopié y subí potenciando glúteos y cuádriceps.",
      },
    ],
    musculos: [
      { nombre: "Cuádriceps", rol: "Extiende la rodilla" },
      { nombre: "Glúteo mayor", rol: "Extiende la cadera" },
      { nombre: "Isquiosurales", rol: "Co-contracción estabilizadora" },
      { nombre: "Erectores lumbales", rol: "Mantienen la columna" },
      { nombre: "Core y abdomen", rol: "Estabilizan el tronco" },
      { nombre: "Gemelos y sóleo", rol: "Control del tobillo" },
    ],
  },

  /** Press de banca con barra. */
  press_banca: {
    id: "press_banca",
    nombre: _nombreDe("press_banca"),
    imagen: "/guides/press-banca.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "Tumbado en el banco con pies firmes en el suelo, omóplatos retraídos y pecho alto. Agarrá la barra apenas más ancha que los hombros y sacala del soporte con los brazos extendidos.",
      },
      {
        titulo: "Descenso",
        desc: "Bajá la barra con control hasta la parte media del pecho, con los codos a unos 45° del tronco. Mantené las muñecas rectas y los antebrazos verticales durante todo el recorrido.",
      },
      {
        titulo: "Empuje",
        desc: "Presioná la barra hacia arriba en línea levemente curva, extendiendo los codos sin despegar glúteos ni omóplatos del banco. Bloqueá arriba y repetí sin rebotar contra el pecho.",
      },
    ],
    musculos: [
      { nombre: "Pectoral mayor", rol: "Motor principal" },
      { nombre: "Tríceps braquial", rol: "Extiende el codo" },
      { nombre: "Deltoides anterior", rol: "Asiste en el empuje" },
      { nombre: "Serrato anterior", rol: "Estabiliza la escápula" },
      { nombre: "Core", rol: "Mantiene el arco lumbar" },
    ],
  },

  /** Peso muerto convencional. */
  peso_muerto: {
    id: "peso_muerto",
    nombre: _nombreDe("peso_muerto"),
    imagen: "/guides/peso-muerto.jpg",
    fases: [
      {
        titulo: "Pto. inicial",
        desc: "Pies a ancho de cadera con la barra sobre el mediopié. Flexioná cadera y rodillas, agarra la barra justo por fuera de las piernas y mantené la espalda neutra con el pecho alto.",
      },
      {
        titulo: "Tirón",
        desc: "Empujá el suelo con las piernas mientras la barra sube pegada a las espinillas. Extendé cadera y rodillas al unísono, manteniendo la barra cerca del cuerpo todo el tiempo.",
      },
      {
        titulo: "Bloqueo",
        desc: "Terminá erguido con cadera bloqueada y hombros en línea sobre la barra. Bajá empujando la cadera hacia atrás y flexionando las rodillas solo cuando la barra pase las rodillas.",
      },
    ],
    musculos: [
      { nombre: "Erectores espinales", rol: "Mantienen la columna neutra" },
      { nombre: "Glúteo mayor", rol: "Extiende la cadera" },
      { nombre: "Cuádriceps", rol: "Extiende la rodilla" },
      { nombre: "Isquiosurales", rol: "Bisagra de cadera" },
      { nombre: "Trapecio y dorsal", rol: "Fijan la escápula y el agarre" },
      { nombre: "Core", rol: "Estabiliza el tronco" },
    ],
  },

  /** Dominadas pronas (Pull-ups). */
  dominadas: {
    id: "dominadas",
    nombre: _nombreDe("dominadas"),
    imagen: "/guides/dominadas.jpg",
    fases: [
      {
        titulo: "Colgado",
        desc: "Colgate de la barra con agarre prono algo más ancho que los hombros. Activá las escápulas con los hombros lejos de las orejas y el core en tensión antes de tirar.",
      },
      {
        titulo: "Tirón",
        desc: "Tirá de la barra llevando los codos hacia abajo y atrás, como si quisieras meterlos en los bolsillos. Subí hasta que el mentón supere la barra sin balancear las piernas.",
      },
      {
        titulo: "Descenso",
        desc: "Bajá de forma controlada hasta extender los codos por completo, manteniendo la tensión en la espalda y el core. Evitá el rebote y la caída libre al final del recorrido.",
      },
    ],
    musculos: [
      { nombre: "Dorsal ancho", rol: "Motor principal" },
      { nombre: "Bíceps braquial", rol: "Flexiona el codo" },
      { nombre: "Trapecio y romboides", rol: "Retraen la escápula" },
      { nombre: "Redondo mayor", rol: "Asiste en la tracción" },
      { nombre: "Antebrazos", rol: "Fijan el agarre" },
      { nombre: "Core", rol: "Evita el balanceo" },
    ],
  },

  /** Remo con barra (Bent-over row). */
  remo: {
    id: "remo",
    nombre: _nombreDe("remo"),
    imagen: "/guides/remo-barra.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "Con la barra en las manos, flexioná la cadera hasta inclinar el torso a unos 45° con la espalda neutra. Brazo relajado y barra colgando bajo los hombros, core activado.",
      },
      {
        titulo: "Tracción",
        desc: "Llevá la barra hacia el abdomen inferior tirando los codos hacia atrás. Mantené los hombros lejos de las orejas y el torso quieto, sin erguirte para ayudarte.",
      },
      {
        titulo: "Retorno",
        desc: "Bajá la barra controlada hasta extender los brazos, sin perder la postura. Mantené la cadera y el ángulo del torso constantes en cada repetición.",
      },
    ],
    musculos: [
      { nombre: "Dorsal ancho", rol: "Motor principal" },
      { nombre: "Trapecio y romboides", rol: "Retraen la escápula" },
      { nombre: "Redondo mayor", rol: "Asiste en la tracción" },
      { nombre: "Bíceps", rol: "Flexiona el codo" },
      { nombre: "Erectores espinales", rol: "Sostienen la flexión de cadera" },
      { nombre: "Core", rol: "Estabiliza el tronco" },
    ],
  },

  /** Curl de bíceps con barra recta. */
  curl_biceps: {
    id: "curl_biceps",
    nombre: _nombreDe("curl_biceps"),
    imagen: "/guides/curl-biceps.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "De pie, agarrá la barra con las palmas hacia arriba a ancho de hombros. Codos pegados al torso, hombros relajados hacia atrás y core firme antes de empezar.",
      },
      {
        titulo: "Flexión",
        desc: "Flexioná los codos subiendo la barra hacia el pecho sin mover los codos ni balancear el torso. Mantené las muñecas rectas y evitá usar la cadera como impulso.",
      },
      {
        titulo: "Descenso",
        desc: "Bajá la barra lenta y controlada hasta extender los codos por completo, manteniendo la tensión del bíceps. No dejés caer el peso ni arqueés la espalda.",
      },
    ],
    musculos: [
      { nombre: "Bíceps braquial", rol: "Motor principal" },
      { nombre: "Braquial", rol: "Flexión del codo" },
      { nombre: "Braquiorradial", rol: "Asiste en la flexión" },
      { nombre: "Antebrazos", rol: "Estabilizan el agarre" },
      { nombre: "Core", rol: "Mantiene la postura erguida" },
    ],
  },

  /** Extensión de tríceps en polea (Pushdown). */
  extension_triceps: {
    id: "extension_triceps",
    nombre: _nombreDe("extension_triceps"),
    imagen: "/guides/extension-triceps.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "Frente a la polea alta, agarrá la barra o cuerda con las palmas hacia abajo. Codos pegados al torso, hombros bajos y torso levemente inclinado con el core activo.",
      },
      {
        titulo: "Extensión",
        desc: "Extendé los codos empujando la barra hacia abajo hasta bloquear los brazos, sin despegar los codos del torso. Contraé el tríceps en el punto más bajo del recorrido.",
      },
      {
        titulo: "Retorno",
        desc: "Dejá que la barra suba de forma controlada hasta que los antebrazos queden cerca de la horizontal. No dejes que el codo avance hacia adelante ni uses el peso del cuerpo.",
      },
    ],
    musculos: [
      { nombre: "Tríceps braquial", rol: "Motor principal" },
      { nombre: "Cabeza lateral del tríceps", rol: "Extensión del codo" },
      { nombre: "Cabeza larga", rol: "Extensión desde el hombro" },
      { nombre: "Core", rol: "Estabiliza la postura" },
    ],
  },

  /** Prensa de piernas 45°. */
  prensa_piernas: {
    id: "prensa_piernas",
    nombre: _nombreDe("prensa_piernas"),
    imagen: "/guides/prensa-piernas.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "Sentado con la espalda y glúteos apoyados en el respaldo, pies a ancho de hombros en la plataforma. Destrabá la máquina y mantené una leve flexión de rodillas.",
      },
      {
        titulo: "Descenso",
        desc: "Bajá la plataforma flexionando cadera y rodillas sin despegar la zona lumbar del respaldo. Bajá hasta que las rodillas formen unos 90° sin que el glúteo levante del asiento.",
      },
      {
        titulo: "Empuje",
        desc: "Empujá la plataforma extendiendo las piernas sin bloquear del todo las rodillas arriba. Conducí el movimiento con el mediopié, evitando que las rodillas se cierren hacia adentro.",
      },
    ],
    musculos: [
      { nombre: "Cuádriceps", rol: "Motor principal" },
      { nombre: "Glúteo mayor", rol: "Extiende la cadera" },
      { nombre: "Isquiosurales", rol: "Co-contracción estabilizadora" },
      { nombre: "Gemelos", rol: "Estabilizan el tobillo" },
    ],
  },

  /** Elevaciones laterales con mancuernas. */
  elevaciones_laterales: {
    id: "elevaciones_laterales",
    nombre: _nombreDe("elevaciones_laterales"),
    imagen: "/guides/elevaciones-laterales.jpg",
    fases: [
      {
        titulo: "Inicio",
        desc: "De pie con una mancuerna en cada mano a los costados, codos con una leve flexión y hombros relajados. Mantené el core firme y el torso erguido sin inclinarte.",
      },
      {
        titulo: "Elevación",
        desc: "Elevá los brazos lateralmente hasta la altura de los hombros, conduciendo con los codos. Mantené las muñecas neutras y evitá encoger los hombros durante la subida.",
      },
      {
        titulo: "Descenso",
        desc: "Bajá las mancuernas lenta y controlada hasta la posición inicial, sin dejarlas caer. Controlá la fase negativa para mantener la tensión continua en el deltoides lateral.",
      },
    ],
    musculos: [
      { nombre: "Deltoides lateral", rol: "Motor principal" },
      { nombre: "Deltoides anterior", rol: "Asiste en la elevación" },
      { nombre: "Trapecio superior", rol: "Estabiliza la escápula" },
      { nombre: "Supraespinoso", rol: "Inicia la abducción" },
      { nombre: "Core", rol: "Mantiene la postura" },
    ],
  },
};


