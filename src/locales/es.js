/**
 * src/locales/es.js
 * Diccionario de traducciones al español (idioma por defecto de la app).
 * Las claves se resuelven con t() desde src/i18n.js. Los valores pueden ser
 * funciones para pluralización sencilla ({ n } como parámetro).
 */
export const es = {
  lang: "es",

  nav: {
    tab: {
      dashboard: "Inicio",
      workout: "Entrenar",
      history: "Historial",
      progress: "Progreso",
      profile: "Atleta",
    },
    header: {
      dashboard: "Inicio",
      workout: "Entrenamiento",
      history: "Historial",
      progress: "Progreso",
      profile: "Perfil",
    },
  },

  drawer: {
    group: {
      inicio: "🏠 Inicio",
      entrenamiento: "🏋️ Entrenamiento",
      progreso: "📊 Progreso",
      perfil: "👤 Perfil y configuración",
      apariencia: "🎨 Apariencia",
      herramientas: "⚙️ Herramientas extra",
    },
    item: {
      dashboard: "Dashboard",
      rutina: "Rutina y series",
      timer: "Timer de descanso",
      metricas: "Métricas de sesión",
      progreso: "Gráficos y evolución",
      historial: "Historial de sesiones",
      acumulado: "Progreso acumulado",
      perfil: "Perfil del atleta",
      medidas: "Medidas corporales",
      wellness: "Wellness diario",
      salto: "Test de salto (CMJ)",
      periodizacion: "Periodización",
      discos: "Calculadora de discos",
      backup: "Backup completo",
      warmup: "Warm-up calculator",
    },
  },

  gym: {
    etiqueta: "Modo Gimnasio",
    on: "🏋️ Modo Gimnasio activo",
    off: "Modo Gimnasio desactivado",
    headerInactivo: "Activar Modo Gimnasio",
    headerActivo: "Modo Gimnasio activo (pulsa para desactivar)",
  },

  theme: {
    oscuro: "Modo oscuro",
    claro: "Modo claro",
    on: "🌙 Modo oscuro activado",
    off: "☀️ Modo claro activado",
    aClaro: "Pulsando cambiarás al modo claro",
    aOscuro: "Pulsando cambiarás al modo oscuro",
    tClaro: "Modo oscuro activo (pulsa para cambiar al modo claro)",
    tOscuro: "Modo claro activo (pulsa para cambiar al modo oscuro)",
  },

  idioma: {
    label: "🌐 Idioma",
  },

  shortcuts: {
    timerReset: "⏱ Timer reiniciado (tecla R)",
  },

  workout: {
    titulo: {
      rutina: "Rutina de hoy",
      series: "Registro de series",
      timer: "Timer de descanso",
    },
    emptyRutina: "No hay ejercicios en la rutina de hoy. Agrega uno arriba.",
    resultado: (p) => p.n + (p.n === 1 ? " resultado" : " resultados"),
    seriesTag: (p) => p.n + " series",
  },
};