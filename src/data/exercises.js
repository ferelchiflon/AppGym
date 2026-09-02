/**
 * src/data/exercises.js
 * Catálogo maestro ampliado de ejercicios (+90 ejercicios)
 * Organizado por grupos musculares, patrones de movimiento biomecánicos y equipamiento.
 */

export const PATRONES_MOVIMIENTO = [
  { id: "todos", nombre: "Todos los patrones" },
  { id: "dominancia_rodilla", nombre: "Dominancia de Rodilla (Squat/Prensa)" },
  { id: "dominancia_cadera", nombre: "Dominancia de Cadera (Hinge/Posterior)" },
  { id: "empuje_horizontal", nombre: "Empuje Horizontal (Banca/Push-up)" },
  { id: "traccion_horizontal", nombre: "Tracción Horizontal (Remos)" },
  { id: "empuje_vertical", nombre: "Empuje Vertical (Overhead/Militar)" },
  { id: "traccion_vertical", nombre: "Tracción Vertical (Dominadas/Jalón)" },
  { id: "olimpico_potencia", nombre: "Olímpico & Potencia (Clean/Snatch/Saltos)" },
  { id: "core_estabilidad", nombre: "Core & Estabilidad (Anti-extensión/Rotación)" },
  { id: "aislamiento", nombre: "Aislamiento & Accesorios" }
];

export const EJERCICIOS_CATALOGO = [
  // ── LEVANTAMIENTOS OLÍMPICOS & POTENCIA ────────────────────────
  { id: "power_clean", nombre: "Power Clean con barra", musculo: "espalda", musculosSecundarios: ["piernas", "hombros", "core"], intensidad: 9, patron: "olimpico_potencia", equipamiento: "barra" },
  { id: "hang_clean", nombre: "Hang Clean desde muslos", musculo: "piernas", musculosSecundarios: ["espalda", "hombros", "core"], intensidad: 8, patron: "olimpico_potencia", equipamiento: "barra" },
  { id: "push_press", nombre: "Push Press olímpico", musculo: "hombros", musculosSecundarios: ["piernas", "triceps", "core"], intensidad: 8, patron: "olimpico_potencia", equipamiento: "barra" },
  { id: "snatch_high_pull", nombre: "Snatch High Pull con barra", musculo: "espalda", musculosSecundarios: ["hombros", "piernas"], intensidad: 8, patron: "olimpico_potencia", equipamiento: "barra" },
  { id: "saltos_caja", nombre: "Saltos al cajón con sobrecarga (Box Jump)", musculo: "piernas", musculosSecundarios: ["gluteos", "gemelos"], intensidad: 7, patron: "olimpico_potencia", equipamiento: "peso_corporal" },

  // ── PECHO (Chest) ─────────────────────────────────────────────
  { id: "press_banca", nombre: "Press banca con barra", musculo: "pecho", musculosSecundarios: ["triceps", "hombros"], intensidad: 8, patron: "empuje_horizontal", equipamiento: "barra" },
  { id: "press_inclinado_barra", nombre: "Press inclinado con barra", musculo: "pecho", musculosSecundarios: ["hombros", "triceps"], intensidad: 8, patron: "empuje_horizontal", equipamiento: "barra" },
  { id: "press_banca_mancuernas", nombre: "Press plano con mancuernas", musculo: "pecho", musculosSecundarios: ["triceps", "hombros"], intensidad: 7, patron: "empuje_horizontal", equipamiento: "mancuerna" },
  { id: "press_inclinado_mancuernas", nombre: "Press inclinado con mancuernas", musculo: "pecho", musculosSecundarios: ["hombros", "triceps"], intensidad: 7, patron: "empuje_horizontal", equipamiento: "mancuerna" },
  { id: "press_declinado", nombre: "Press declinado con barra", musculo: "pecho", musculosSecundarios: ["triceps"], intensidad: 7, patron: "empuje_horizontal", equipamiento: "barra" },
  { id: "aperturas_mancuernas", nombre: "Aperturas con mancuernas", musculo: "pecho", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "cruces_polea", nombre: "Cruces en polea (cables)", musculo: "pecho", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "polea" },
  { id: "fondos_pecho", nombre: "Fondos en paralelas (énfasis pecho)", musculo: "pecho", musculosSecundarios: ["triceps", "hombros"], intensidad: 7, patron: "empuje_horizontal", equipamiento: "peso_corporal" },
  { id: "press_maquina_pecho", nombre: "Press de pecho en máquina", musculo: "pecho", musculosSecundarios: ["triceps"], intensidad: 6, patron: "empuje_horizontal", equipamiento: "maquina" },
  { id: "flexiones", nombre: "Flexiones de brazos (Push-ups)", musculo: "pecho", musculosSecundarios: ["triceps", "core"], intensidad: 5, patron: "empuje_horizontal", equipamiento: "peso_corporal" },

  // ── ESPALDA (Back) ────────────────────────────────────────────
  { id: "peso_muerto", nombre: "Peso muerto convencional", musculo: "espalda", musculosSecundarios: ["piernas", "gluteos", "core"], intensidad: 9, patron: "dominancia_cadera", equipamiento: "barra" },
  { id: "dominadas", nombre: "Dominadas pronas (Pull-ups)", musculo: "espalda", musculosSecundarios: ["biceps", "antebrazos"], intensidad: 8, patron: "traccion_vertical", equipamiento: "peso_corporal" },
  { id: "dominadas_supinas", nombre: "Dominadas supinas (Chin-ups)", musculo: "espalda", musculosSecundarios: ["biceps"], intensidad: 8, patron: "traccion_vertical", equipamiento: "peso_corporal" },
  { id: "remo", nombre: "Remo con barra (Bent-over row)", musculo: "espalda", musculosSecundarios: ["biceps", "core"], intensidad: 7, patron: "traccion_horizontal", equipamiento: "barra" },
  { id: "remo_mancuerna", nombre: "Remo con mancuerna a una mano", musculo: "espalda", musculosSecundarios: ["biceps"], intensidad: 7, patron: "traccion_horizontal", equipamiento: "mancuerna" },
  { id: "jalon_polea_pecho", nombre: "Jalón al pecho en polea alta", musculo: "espalda", musculosSecundarios: ["biceps"], intensidad: 6, patron: "traccion_vertical", equipamiento: "polea" },
  { id: "remo_gironda", nombre: "Remo sentado en polea (Gironda)", musculo: "espalda", musculosSecundarios: ["biceps"], intensidad: 6, patron: "traccion_horizontal", equipamiento: "polea" },
  { id: "remo_barra_t", nombre: "Remo en barra T", musculo: "espalda", musculosSecundarios: ["biceps", "core"], intensidad: 8, patron: "traccion_horizontal", equipamiento: "barra" },
  { id: "pullover_polea", nombre: "Pullover en polea alta (brazos rectos)", musculo: "espalda", musculosSecundarios: ["triceps"], intensidad: 5, patron: "aislamiento", equipamiento: "polea" },
  { id: "remo_pecho_apoyado", nombre: "Remo con mancuernas en banco inclinado", musculo: "espalda", musculosSecundarios: ["biceps"], intensidad: 6, patron: "traccion_horizontal", equipamiento: "mancuerna" },

  // ── PIERNAS & CUÁDRICEPS (Legs & Quads) ────────────────────────
  { id: "sentadilla", nombre: "Sentadilla trasera con barra", musculo: "piernas", musculosSecundarios: ["gluteos", "core"], intensidad: 9, patron: "dominancia_rodilla", equipamiento: "barra" },
  { id: "sentadilla_frontal", nombre: "Sentadilla frontal", musculo: "piernas", musculosSecundarios: ["core", "gluteos"], intensidad: 9, patron: "dominancia_rodilla", equipamiento: "barra" },
  { id: "prensa_piernas", nombre: "Prensa de piernas 45°", musculo: "piernas", musculosSecundarios: ["gluteos"], intensidad: 8, patron: "dominancia_rodilla", equipamiento: "maquina" },
  { id: "hack_squat", nombre: "Sentadilla Hack", musculo: "piernas", musculosSecundarios: ["gluteos"], intensidad: 8, patron: "dominancia_rodilla", equipamiento: "maquina" },
  { id: "extension_cuadriceps", nombre: "Extensión de cuádriceps en máquina", musculo: "piernas", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "maquina" },
  { id: "zancadas", nombre: "Zancadas / Desplantes caminando", musculo: "piernas", musculosSecundarios: ["gluteos"], intensidad: 7, patron: "dominancia_rodilla", equipamiento: "mancuerna" },
  { id: "sentadilla_bulgara", nombre: "Sentadilla búlgara con mancuernas", musculo: "piernas", musculosSecundarios: ["gluteos"], intensidad: 8, patron: "dominancia_rodilla", equipamiento: "mancuerna" },
  { id: "sentadilla_goblet", nombre: "Sentadilla Goblet", musculo: "piernas", musculosSecundarios: ["core"], intensidad: 6, patron: "dominancia_rodilla", equipamiento: "kettlebell" },
  { id: "sissy_squat", nombre: "Sentadilla Sissy", musculo: "piernas", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "peso_corporal" },

  // ── ISQUIOS & GLÚTEOS (Hamstrings & Glutes) ───────────────────
  { id: "peso_muerto_rumano", nombre: "Peso muerto rumano (RDL)", musculo: "gluteos", musculosSecundarios: ["piernas", "espalda"], intensidad: 8, patron: "dominancia_cadera", equipamiento: "barra" },
  { id: "hip_thrust", nombre: "Hip Thrust con barra", musculo: "gluteos", musculosSecundarios: ["piernas"], intensidad: 8, patron: "dominancia_cadera", equipamiento: "barra" },
  { id: "curl_femoral_tumbado", nombre: "Curl femoral tumbado en máquina", musculo: "piernas", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "maquina" },
  { id: "curl_femoral_sentado", nombre: "Curl femoral sentado en máquina", musculo: "piernas", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "maquina" },
  { id: "buenos_dias", nombre: "Buenos días con barra (Good mornings)", musculo: "piernas", musculosSecundarios: ["gluteos", "espalda"], intensidad: 7, patron: "dominancia_cadera", equipamiento: "barra" },
  { id: "patada_gluteo_polea", nombre: "Patada de glúteo en polea", musculo: "gluteos", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "polea" },
  { id: "abduccion_maquina", nombre: "Abducción de cadera en máquina", musculo: "gluteos", musculosSecundarios: [], intensidad: 4, patron: "aislamiento", equipamiento: "maquina" },
  { id: "empuje_cadera_maquina", nombre: "Empuje de cadera (hip thrust) en máquina", musculo: "gluteos", musculosSecundarios: ["piernas"], intensidad: 7, patron: "dominancia_cadera", equipamiento: "maquina" },
  { id: "puente_gluteo_banda", nombre: "Puente de glúteo con banda de resistencia", musculo: "gluteos", musculosSecundarios: ["core"], intensidad: 5, patron: "dominancia_cadera", equipamiento: "banda" },
  { id: "nordic_curl", nombre: "Curl nórdico (Nordic Hamstring Curl)", musculo: "piernas", musculosSecundarios: [], intensidad: 9, patron: "aislamiento", equipamiento: "peso_corporal" },

  // ── HOMBROS (Shoulders) ───────────────────────────────────────
  { id: "press_hombro", nombre: "Press militar con barra (Overhead Press)", musculo: "hombros", musculosSecundarios: ["triceps", "core"], intensidad: 8, patron: "empuje_vertical", equipamiento: "barra" },
  { id: "press_hombro_mancuernas", nombre: "Press de hombros con mancuernas", musculo: "hombros", musculosSecundarios: ["triceps"], intensidad: 7, patron: "empuje_vertical", equipamiento: "mancuerna" },
  { id: "press_arnold", nombre: "Press Arnold", musculo: "hombros", musculosSecundarios: ["triceps"], intensidad: 7, patron: "empuje_vertical", equipamiento: "mancuerna" },
  { id: "elevaciones_laterales", nombre: "Elevaciones laterales con mancuernas", musculo: "hombros", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "elevaciones_laterales_polea", nombre: "Elevaciones laterales en polea", musculo: "hombros", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "polea" },
  { id: "pajaros_mancuerna", nombre: "Pájaros con mancuernas (Deltoides posterior)", musculo: "hombros", musculosSecundarios: ["espalda"], intensidad: 5, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "face_pull", nombre: "Face Pull en polea con cuerda", musculo: "hombros", musculosSecundarios: ["espalda"], intensidad: 6, patron: "traccion_horizontal", equipamiento: "polea" },
  { id: "elevaciones_frontales", nombre: "Elevaciones frontales", musculo: "hombros", musculosSecundarios: [], intensidad: 4, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "encogimientos_trapecio", nombre: "Encogimientos de hombros con mancuernas", musculo: "hombros", musculosSecundarios: ["espalda"], intensidad: 6, patron: "aislamiento", equipamiento: "mancuerna" },

  // ── BÍCEPS (Biceps) ───────────────────────────────────────────
  { id: "curl_biceps", nombre: "Curl de bíceps con barra recta", musculo: "biceps", musculosSecundarios: ["antebrazos"], intensidad: 6, patron: "aislamiento", equipamiento: "barra" },
  { id: "curl_barra_z", nombre: "Curl de bíceps con barra Z", musculo: "biceps", musculosSecundarios: ["antebrazos"], intensidad: 6, patron: "aislamiento", equipamiento: "barra" },
  { id: "curl_mancuernas_alterno", nombre: "Curl alterno con mancuernas", musculo: "biceps", musculosSecundarios: ["antebrazos"], intensidad: 5, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "curl_martillo", nombre: "Curl martillo (Hammer curl)", musculo: "biceps", musculosSecundarios: ["antebrazos"], intensidad: 6, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "curl_inclinado_mancuernas", nombre: "Curl en banco inclinado", musculo: "biceps", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "curl_predicador", nombre: "Curl Scott / Predicador", musculo: "biceps", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "barra" },
  { id: "curl_polea_baja", nombre: "Curl de bíceps en polea baja", musculo: "biceps", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "polea" },
  { id: "curl_spider", nombre: "Curl Spider en banco", musculo: "biceps", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "mancuerna" },

  // ── TRÍCEPS (Triceps) ─────────────────────────────────────────
  { id: "fondos", nombre: "Fondos en paralelas (Dips)", musculo: "triceps", musculosSecundarios: ["pecho", "hombros"], intensidad: 7, patron: "empuje_horizontal", equipamiento: "peso_corporal" },
  { id: "press_cerrado", nombre: "Press de banca con agarre cerrado", musculo: "triceps", musculosSecundarios: ["pecho", "hombros"], intensidad: 8, patron: "empuje_horizontal", equipamiento: "barra" },
  { id: "extension_triceps", nombre: "Extensión de tríceps en polea (Pushdown)", musculo: "triceps", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "polea" },
  { id: "press_frances", nombre: "Press francés con barra Z (Skull crushers)", musculo: "triceps", musculosSecundarios: [], intensidad: 7, patron: "aislamiento", equipamiento: "barra" },
  { id: "extension_triceps_cuerda", nombre: "Extensión de tríceps con cuerda en polea", musculo: "triceps", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "polea" },
  { id: "extension_trasnuca_mancuerna", nombre: "Extensión tras nuca con mancuerna", musculo: "triceps", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "fondos_entre_bancos", nombre: "Fondos entre bancos", musculo: "triceps", musculosSecundarios: ["pecho"], intensidad: 5, patron: "empuje_horizontal", equipamiento: "peso_corporal" },
  { id: "patada_triceps", nombre: "Patada de tríceps con mancuerna", musculo: "triceps", musculosSecundarios: [], intensidad: 4, patron: "aislamiento", equipamiento: "mancuerna" },

  // ── CORE & ABDOMINALES (Core & Abs) ───────────────────────────
  { id: "plancha", nombre: "Plancha frontal isométrica (Plank)", musculo: "core", musculosSecundarios: ["hombros"], intensidad: 5, patron: "core_estabilidad", equipamiento: "peso_corporal" },
  { id: "plancha_lateral", nombre: "Plancha lateral", musculo: "core", musculosSecundarios: [], intensidad: 5, patron: "core_estabilidad", equipamiento: "peso_corporal" },
  { id: "elevacion_piernas_colgado", nombre: "Elevación de piernas colgado en barra", musculo: "core", musculosSecundarios: ["antebrazos"], intensidad: 7, patron: "core_estabilidad", equipamiento: "peso_corporal" },
  { id: "ab_wheel", nombre: "Rueda abdominal (Ab Wheel Rollout)", musculo: "core", musculosSecundarios: ["espalda", "hombros"], intensidad: 8, patron: "core_estabilidad", equipamiento: "peso_corporal" },
  { id: "crunch_polea", nombre: "Crunch abdominal en polea alta", musculo: "core", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "polea" },
  { id: "leñador_polea", nombre: "Woodchopper / Leñador en polea", musculo: "core", musculosSecundarios: ["hombros"], intensidad: 6, patron: "core_estabilidad", equipamiento: "polea" },
  { id: "pallof_press", nombre: "Press Pallof en polea o banda", musculo: "core", musculosSecundarios: [], intensidad: 5, patron: "core_estabilidad", equipamiento: "polea" },
  { id: "vacuum_abdominal", nombre: "Vacío abdominal (Stomach Vacuum)", musculo: "core", musculosSecundarios: [], intensidad: 4, patron: "core_estabilidad", equipamiento: "peso_corporal" },

  // ── GEMELOS (Calves) ──────────────────────────────────────────
  { id: "elevacion_gemelos_pie", nombre: "Elevación de talones de pie en máquina", musculo: "gemelos", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "maquina" },
  { id: "elevacion_gemelos_sentado", nombre: "Elevación de talones sentado (Soleo)", musculo: "gemelos", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "maquina" },
  { id: "elevacion_gemelos_prensa", nombre: "Elevación de gemelos en prensa", musculo: "gemelos", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "maquina" },
  { id: "elevacion_talon_unilateral", nombre: "Elevación de talón a una pierna", musculo: "gemelos", musculosSecundarios: [], intensidad: 5, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "elevacion_gemelos_smith", nombre: "Elevación de talones en máquina Smith", musculo: "gemelos", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "maquina" },
  { id: "salto_talones", nombre: "Saltos con énfasis en gemelos (Pogo Jumps)", musculo: "gemelos", musculosSecundarios: [], intensidad: 5, patron: "olimpico_potencia", equipamiento: "peso_corporal" },

  // ── ANTEBRAZOS (Forearms) ─────────────────────────────────────
  { id: "curl_antebrazo_supino", nombre: "Curl de muñeca en banco", musculo: "antebrazos", musculosSecundarios: [], intensidad: 4, patron: "aislamiento", equipamiento: "barra" },
  { id: "curl_antebrazo_prono", nombre: "Curl invertido de muñeca", musculo: "antebrazos", musculosSecundarios: [], intensidad: 4, patron: "aislamiento", equipamiento: "barra" },
  { id: "farmers_walk", nombre: "Paseo del granjero (Farmer Walk)", musculo: "antebrazos", musculosSecundarios: ["core", "hombros", "piernas"], intensidad: 8, patron: "core_estabilidad", equipamiento: "mancuerna" },
  { id: "dead_hang", nombre: "Colgado pasivo en barra (Dead Hang)", musculo: "antebrazos", musculosSecundarios: ["hombros", "espalda"], intensidad: 6, patron: "core_estabilidad", equipamiento: "peso_corporal" },
  { id: "curl_antebrazo_barra_detras", nombre: "Curl de muñeca con barra por detrás", musculo: "antebrazos", musculosSecundarios: [], intensidad: 4, patron: "aislamiento", equipamiento: "barra" },
  { id: "rodillo_muneca", nombre: "Rodillo de muñeca (Wrist Roller)", musculo: "antebrazos", musculosSecundarios: [], intensidad: 6, patron: "aislamiento", equipamiento: "mancuerna" },
  { id: "pinza_agarre", nombre: "Pinza de agarre con discos (Plate Pinch)", musculo: "antebrazos", musculosSecundarios: [], intensidad: 5, patron: "core_estabilidad", equipamiento: "barra" }
];

export const GRUPOS_MUSCULARES = [
  { id: "todos", nombre: "Todos los grupos" },
  { id: "pecho", nombre: "Pecho" },
  { id: "espalda", nombre: "Espalda" },
  { id: "piernas", nombre: "Piernas / Cuádriceps" },
  { id: "gluteos", nombre: "Glúteos & Isquios" },
  { id: "hombros", nombre: "Hombros" },
  { id: "biceps", nombre: "Bíceps" },
  { id: "triceps", nombre: "Tríceps" },
  { id: "core", nombre: "Core / Abdominales" },
  { id: "gemelos", nombre: "Gemelos" },
  { id: "antebrazos", nombre: "Antebrazos" }
];
