/**
 * src/fisiologia-cargas.js
 * Control fisiológico de carga interna (sRPE de Foster) y ratio ACWR (Dr. Tim Gabbett).
 * Previene el sobreentrenamiento y calcula el riesgo lesional tendinoso y neuromuscular.
 */

export const FisiologiaCargas = {
  /**
   * Calcula la carga de una sesión individual en unidades arbitrarias (UA).
   * Método sRPE de Foster = RPE de la sesión (1-10) * Duración (minutos).
   * Si no se especificó RPE de la sesión, se deriva del promedio de RPE de las series o intensidad base.
   */
  calcularCargaSesion(sesion) {
    if (!sesion) return 0;
    const duracion = parseFloat(sesion.duracionMin || sesion.tiempoMin) || 45;

    let rpe = parseFloat(sesion.rpeGlobal || sesion.rpe);
    if (!rpe || isNaN(rpe)) {
      // Calcular RPE promedio de las series registradas
      let sumaRpe = 0;
      let totalSeries = 0;
      if (Array.isArray(sesion.ejercicios)) {
        sesion.ejercicios.forEach((ej) => {
          if (Array.isArray(ej.series)) {
            ej.series.forEach((s) => {
              const sRpe = parseFloat(s.rpe);
              if (!isNaN(sRpe) && sRpe > 0) {
                sumaRpe += sRpe;
                totalSeries++;
              }
            });
          }
        });
      }
      rpe = totalSeries > 0 ? sumaRpe / totalSeries : 7.0;
    }

    return Math.round(duracion * rpe);
  },

  /**
   * Analiza el historial de entrenamientos y calcula el ACWR actual y su evolución histórica.
   * Carga Aguda: suma de los últimos 7 días.
   * Carga Crónica: promedio semanal de las últimas 4 semanas (28 días).
   */
  calcularACWR(historial) {
    if (!Array.isArray(historial) || historial.length === 0) {
      return {
        cargaAguda: 0,
        cargaCronica: 0,
        ratio: 1.0,
        zona: "sin_datos",
        etiqueta: "Sin datos suficientes",
        color: "info",
        recomendacion: "Registra sesiones consecutivas para calcular la carga interna y riesgo de lesión.",
        serieHistorica: []
      };
    }

    const hoy = new Date();
    const msPorDia = 86400000;

    // Agrupar carga por día (últimos 28 días)
    const cargasPorDia = {};
    for (let i = 0; i < 28; i++) {
      const d = new Date(hoy.getTime() - i * msPorDia);
      const iso = d.toISOString().slice(0, 10);
      cargasPorDia[iso] = 0;
    }

    historial.forEach((s) => {
      const fechaStr = (s.timestamp || s.fechaISO || s.fecha || "").slice(0, 10);
      if (cargasPorDia[fechaStr] !== undefined) {
        cargasPorDia[fechaStr] += FisiologiaCargas.calcularCargaSesion(s);
      }
    });

    const diasOrdenados = Object.keys(cargasPorDia).sort(); // Del más antiguo al más reciente

    // Últimos 7 días = Aguda
    const ultimos7 = diasOrdenados.slice(-7);
    const cargaAguda = ultimos7.reduce((acc, dia) => acc + cargasPorDia[dia], 0);

    // 28 días totales = Crónica (suma / 4 semanas)
    const suma28 = diasOrdenados.reduce((acc, dia) => acc + cargasPorDia[dia], 0);
    const cargaCronica = Math.max(1, Math.round(suma28 / 4));

    const ratio = Math.round((cargaAguda / cargaCronica) * 100) / 100;

    let zona = "sweet_spot";
    let etiqueta = "Sweet Spot (Adaptación Óptima)";
    let color = "success";
    let recomendacion = "Excelente equilibrio entre estímulo agudo y condición física crónica. Bajo riesgo de lesión.";

    if (ratio < 0.8) {
      zona = "sub_entrenamiento";
      etiqueta = "Subentrenamiento (< 0.8)";
      color = "warning";
      recomendacion = "Carga aguda baja respecto a la condición previa. Puedes aumentar el volumen o intensidad progresivamente.";
    } else if (ratio > 1.5) {
      zona = "peligro";
      etiqueta = "Zona de Peligro (> 1.5)";
      color = "danger";
      recomendacion = "Pico excesivo de carga aguda. Riesgo exponencial de sobrecarga tendinosa/muscular. Considera una descarga o reducción de volumen del 30-40%.";
    } else if (ratio > 1.3) {
      zona = "alerta";
      etiqueta = "Zona de Alerta (1.3 - 1.5)";
      color = "warning";
      recomendacion = "Carga elevada. Monitorea la calidad de sueño, dolor articular (DOMS) y nutrición para evitar fatiga acumulada.";
    }

    // Construir serie histórica de los últimos 14 días para gráficos
    const serieHistorica = [];
    for (let i = 13; i >= 0; i--) {
      const fechaRef = new Date(hoy.getTime() - i * msPorDia);
      const isoRef = fechaRef.toISOString().slice(0, 10);
      const cargaDia = cargasPorDia[isoRef] || 0;
      serieHistorica.push({
        fecha: isoRef.slice(5), // MM-DD
        cargaDia,
        cargaAguda: Math.round(cargaAguda / 7),
        cargaCronica: Math.round(cargaCronica / 7),
      });
    }

    return {
      cargaAguda,
      cargaCronica,
      ratio,
      zona,
      etiqueta,
      color,
      recomendacion,
      serieHistorica
    };
  }
};
