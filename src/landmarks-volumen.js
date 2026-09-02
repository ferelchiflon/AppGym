/**
 * src/landmarks-volumen.js
 * Control científico de volumen hipertrófico y fuerza según landmarks
 * (Dr. Mike Israetel / Dr. Brad Schoenfeld).
 *
 * MEV: Minimum Effective Volume (mínimo para adaptación)
 * MAV: Maximum Adaptive Volume (rango de ganancia óptima)
 * MRV: Maximum Recoverable Volume (límite superior antes de sobreentrenamiento)
 */

export const VOLUME_LANDMARKS = {
  pecho:       { mev: 8,  mavMin: 12, mavMax: 18, mrv: 22, nombre: "Pecho" },
  espalda:     { mev: 10, mavMin: 14, mavMax: 22, mrv: 26, nombre: "Espalda" },
  piernas:     { mev: 8,  mavMin: 12, mavMax: 18, mrv: 22, nombre: "Piernas (Cuádriceps)" },
  gluteos:     { mev: 6,  mavMin: 10, mavMax: 16, mrv: 20, nombre: "Glúteos & Isquios" },
  hombros:     { mev: 8,  mavMin: 14, mavMax: 20, mrv: 26, nombre: "Hombros" },
  biceps:      { mev: 6,  mavMin: 10, mavMax: 16, mrv: 20, nombre: "Bíceps" },
  triceps:     { mev: 6,  mavMin: 10, mavMax: 16, mrv: 20, nombre: "Tríceps" },
  core:        { mev: 4,  mavMin: 8,  mavMax: 14, mrv: 18, nombre: "Core / Abdominales" },
  gemelos:     { mev: 6,  mavMin: 10, mavMax: 16, mrv: 20, nombre: "Gemelos" },
  antebrazos:  { mev: 4,  mavMin: 6,  mavMax: 12, mrv: 16, nombre: "Antebrazos" },
};

export const VolumeLandmarks = {
  /**
   * Determina si una serie es "efectiva" (suficiente estímulo mecánico: RIR <= 3 o RPE >= 7).
   */
  esSerieEfectiva(serie) {
    if (!serie) return false;
    if (serie.rpe !== null && serie.rpe !== undefined) return parseFloat(serie.rpe) >= 7.0;
    if (serie.rir !== null && serie.rir !== undefined) return parseFloat(serie.rir) <= 3.0;
    return true; // Si no reportó RPE/RIR, se asume serie de trabajo estándar
  },

  /**
   * Analiza el historial de las últimas N días (default 7 días / 1 semana) y calcula
   * las series efectivas totales por grupo muscular y su estado de adaptación.
   */
  analizarSemana(historial, dias = 7) {
    if (!Array.isArray(historial)) return {};
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);

    const sesionesRecientes = historial.filter((s) => {
      const fecha = new Date(s.timestamp || s.fechaISO || s.fecha);
      return !isNaN(fecha.getTime()) && fecha >= limite;
    });

    const seriesPorMusculo = {};
    Object.keys(VOLUME_LANDMARKS).forEach((m) => {
      seriesPorMusculo[m] = { total: 0, efectivas: 0 };
    });

    sesionesRecientes.forEach((sesion) => {
      if (Array.isArray(sesion.ejercicios)) {
        sesion.ejercicios.forEach((ej) => {
          const musculo = ej.musculo || "pecho";
          if (!seriesPorMusculo[musculo]) {
            seriesPorMusculo[musculo] = { total: 0, efectivas: 0 };
          }
          const series = Array.isArray(ej.series) ? ej.series : [];
          series.forEach((s) => {
            seriesPorMusculo[musculo].total += 1;
            if (VolumeLandmarks.esSerieEfectiva(s)) {
              seriesPorMusculo[musculo].efectivas += 1;
            }
          });
        });
      }
    });

    const resultado = {};
    Object.entries(VOLUME_LANDMARKS).forEach(([musculo, lm]) => {
      const stats = seriesPorMusculo[musculo] || { total: 0, efectivas: 0 };
      const efectivas = stats.efectivas;

      let estado = "sub_mev";
      let etiqueta = "Bajo estímulo (< MEV)";
      let color = "warning";
      let progresoPct = Math.min(100, Math.round((efectivas / lm.mavMax) * 100));

      if (efectivas >= lm.mrv) {
        estado = "sobre_mrv";
        etiqueta = "Riesgo de sobrecarga (> MRV)";
        color = "danger";
      } else if (efectivas >= lm.mavMin) {
        estado = "en_mav";
        etiqueta = "Zona Óptima (MAV)";
        color = "success";
      } else if (efectivas >= lm.mev) {
        estado = "en_mev";
        etiqueta = "Mantenimiento (MEV)";
        color = "info";
      }

      resultado[musculo] = {
        nombre: lm.nombre,
        total: stats.total,
        efectivas,
        mev: lm.mev,
        mavMin: lm.mavMin,
        mavMax: lm.mavMax,
        mrv: lm.mrv,
        estado,
        etiqueta,
        color,
        progresoPct,
      };
    });

    return resultado;
  },
};
