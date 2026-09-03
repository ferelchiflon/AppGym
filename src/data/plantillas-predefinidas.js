/**
 * src/data/plantillas-predefinidas.js
 * Plantillas de entrenamiento listas para usar. Cada entrada referencia
 * ejercicios del catálogo maestro (EJERCICIOS_CATALOGO) por su `id`, por lo
 * que importar una plantilla es o crear una copia personal en el Store
 * (`Store.crearPlantilla`) y cargarla con GestorRutina.cargarPlantilla().
 *
 * Estructura:
 *   { id, nombre, descripcion, nivel, etiquetas: [], ejercicios: [id, ...] }
 */

export const PLANTILLAS_PREDEFINIDAS = [
  // ── PUSH / PULL / LEGS (PPL) ──────────────────────────────────
  {
    id: "ppl_push",
    nombre: "PPL · Empuje (Push)",
    descripcion:
      "Día de empuje: pecho, hombros y tríceps. Ideal para la división clásica Push / Pull / Legs a 6 días.",
    nivel: "intermedio",
    etiquetas: ["PPL", "Push", "Pecho", "Hombros"],
    ejercicios: ["press_banca", "press_inclinado_barra", "press_hombro", "elevaciones_laterales", "fondos", "extension_triceps_cuerda"],
  },
  {
    id: "ppl_pull",
    nombre: "PPL · Tirón (Pull)",
    descripcion:
      "Día de tirón: espalda y bíceps. Complemento perfecto del día de empuje de la división PPL.",
    nivel: "intermedio",
    etiquetas: ["PPL", "Pull", "Espalda", "Bíceps"],
    ejercicios: ["dominadas", "remo", "jalon_polea_pecho", "face_pull", "curl_biceps", "curl_martillo"],
  },
  {
    id: "ppl_legs",
    nombre: "PPL · Piernas (Legs)",
    descripcion:
      "Día de piernas completo: cuádriceps, isquios y glúteos con sentadilla como cabeza.",
    nivel: "intermedio",
    etiquetas: ["PPL", "Legs", "Piernas"],
    ejercicios: ["sentadilla", "prensa_piernas", "peso_muerto_rumano", "curl_femoral_tumbado", "hip_thrust", "elevacion_gemelos_pie"],
  },

  // ── 5/3/1 ─────────────────────────────────────────────────────
  {
    id: "531_principal",
    nombre: "5/3/1 · Fuerza básica",
    descripcion:
      "La plantilla del método 5/3/1 de Jim Wendler: los 4 movimientos compuestos centrales en su onda de repeticiones.",
    nivel: "avanzado",
    etiquetas: ["5/3/1", "Fuerza", "Compuestos"],
    ejercicios: ["sentadilla", "press_banca", "peso_muerto", "press_hombro"],
  },

  // ── UPPER / LOWER (Torso / Pierna) ────────────────────────────
  {
    id: "upper_lower_upper",
    nombre: "Torso / Pierna · Parte superior",
    descripcion:
      "Día de torso: empuje horizontal y vertical más tracción y accesorios de brazos.",
    nivel: "principiante",
    etiquetas: ["Upper/Lower", "Torso", "Pecho", "Espalda"],
    ejercicios: ["press_banca", "remo", "dominadas", "press_hombro", "curl_biceps", "extension_triceps_cuerda", "elevaciones_laterales"],
  },
  {
    id: "upper_lower_lower",
    nombre: "Torso / Pierna · Parte inferior",
    descripcion:
      "Día de pierna de la división Upper/Lower: énfasis en cuádriceps, isquios y glúteos.",
    nivel: "principiante",
    etiquetas: ["Upper/Lower", "Piernas", "Cuádriceps"],
    ejercicios: ["sentadilla", "prensa_piernas", "peso_muerto_rumano", "curl_femoral_tumbado", "hip_thrust", "elevacion_gemelos_pie"],
  },

  // ── FULL BODY ─────────────────────────────────────────────────
  {
    id: "full_body",
    nombre: "Full Body · Cuerpo completo",
    descripcion:
      "Rutina de cuerpo completo en una sesión, ideal para 3 días por semana con frecuencia alta.",
    nivel: "principiante",
    etiquetas: ["Full Body", "Cuerpo completo", "3 días"],
    ejercicios: ["sentadilla", "press_banca", "peso_muerto", "remo", "press_hombro", "plancha", "curl_biceps", "extension_triceps_cuerda"],
  },
];

/** Nombre humano de un id de ejercicio (cae al propio id si no existe). */
export function nombreEjercicioDeCatalogo(id, catalogo) {
  const ej = (catalogo || []).find((e) => e.id === id);
  return ej ? ej.nombre : id;
}