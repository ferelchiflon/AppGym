/**
 * src/locales/en.js
 * English translations. Keys must mirror src/locales/es.js (fallback source).
 */
export const en = {
  lang: "en",

  nav: {
    tab: {
      dashboard: "Home",
      workout: "Train",
      history: "History",
      progress: "Progress",
      profile: "Athlete",
    },
    header: {
      dashboard: "Home",
      workout: "Training",
      history: "History",
      progress: "Progress",
      profile: "Profile",
    },
  },

  drawer: {
    group: {
      inicio: "🏠 Home",
      entrenamiento: "🏋️ Training",
      progreso: "📊 Progress",
      perfil: "👤 Profile & settings",
      apariencia: "🎨 Appearance",
      herramientas: "⚙️ Extra tools",
    },
    item: {
      dashboard: "Dashboard",
      rutina: "Routine & sets",
      timer: "Rest timer",
      metricas: "Session metrics",
      progreso: "Charts & evolution",
      historial: "Session history",
      acumulado: "Cumulative progress",
      perfil: "Athlete profile",
      medidas: "Body measurements",
      wellness: "Daily wellness",
      salto: "Jump test (CMJ)",
      periodizacion: "Periodization",
      discos: "Plate calculator",
      backup: "Full backup",
      warmup: "Warm-up calculator",
    },
  },

  gym: {
    etiqueta: "Gym Mode",
    on: "🏋️ Gym Mode ON",
    off: "Gym Mode OFF",
    headerInactivo: "Enable Gym Mode",
    headerActivo: "Gym Mode active (tap to disable)",
  },

  theme: {
    oscuro: "Dark mode",
    claro: "Light mode",
    on: "🌙 Dark mode enabled",
    off: "☀️ Light mode enabled",
    aClaro: "Tap to switch to light mode",
    aOscuro: "Tap to switch to dark mode",
    tClaro: "Dark mode active (tap to switch to light)",
    tOscuro: "Light mode active (tap to switch to dark)",
  },

  idioma: {
    label: "🌐 Language",
  },

  shortcuts: {
    timerReset: "⏱ Timer reset (R key)",
  },

  workout: {
    titulo: {
      rutina: "Today's routine",
      series: "Set log",
      timer: "Rest timer",
    },
    emptyRutina: "No exercises in today's routine. Add one above.",
    resultado: (p) => p.n + (p.n === 1 ? " result" : " results"),
    seriesTag: (p) => p.n + (p.n === 1 ? " set" : " sets"),
  },
};