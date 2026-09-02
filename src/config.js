import { EJERCICIOS_CATALOGO, GRUPOS_MUSCULARES, PATRONES_MOVIMIENTO } from './data/exercises.js';

export const CONFIG = {
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
 * ExerciseGuide). La carpeta `carpeta` apunta al directorio de imágenes en
 * assets/guides/{carpeta}/fase{1..3}.jpg (rutas relativas).
 */
const _nombreDe = (id) => {
  const ej = EJERCICIOS_CATALOGO.find((e) => e.id === id);
  return ej ? ej.nombre : id;
};

export const EXERCISE_GUIDES = {
  /** Press militar con barra (id del catálogo. Alias: "press-militar"). */
  press_hombro: {
    id: "press_hombro",
    nombre: _nombreDe("press_hombro"),
    carpeta: "press-militar",
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
    carpeta: "sentadilla",
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
};


