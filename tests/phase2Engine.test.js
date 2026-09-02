import { describe, it, expect } from "vitest";
import { PATRONES_MOVIMIENTO, EJERCICIOS_CATALOGO } from "../src/data/exercises.js";
import { FormulasRM, TablaRPE_Tuchscherer } from "../src/formulas.js";
import { VolumeLandmarks } from "../src/landmarks-volumen.js";
import { GestorPeriodizacion, MODELOS_PERIODIZACION } from "../src/gestor-periodizacion.js";

describe("Fase 2: Motor Metodológico Olímpico & Biomecánico", () => {
  describe("Patrones de Movimiento y Catálogo Olímpico", () => {
    it("exporta la lista completa de patrones de movimiento", () => {
      expect(Array.isArray(PATRONES_MOVIMIENTO)).toBe(true);
      expect(PATRONES_MOVIMIENTO.some(p => p.id === "olimpico_potencia")).toBe(true);
      expect(PATRONES_MOVIMIENTO.some(p => p.id === "dominancia_rodilla")).toBe(true);
      expect(PATRONES_MOVIMIENTO.some(p => p.id === "dominancia_cadera")).toBe(true);
    });

    it("incluye levantamientos olímpicos y potencia en el catálogo", () => {
      const powerClean = EJERCICIOS_CATALOGO.find(e => e.id === "power_clean");
      expect(powerClean).toBeDefined();
      expect(powerClean.patron).toBe("olimpico_potencia");

      const pushPress = EJERCICIOS_CATALOGO.find(e => e.id === "push_press");
      expect(pushPress).toBeDefined();
      expect(pushPress.patron).toBe("olimpico_potencia");
    });
  });

  describe("Matriz RPE de Tuchscherer (Reactive Training Systems)", () => {
    it("contiene los coeficientes oficiales de RTS para 1RM", () => {
      expect(TablaRPE_Tuchscherer[1][10]).toBe(1.000);
      expect(TablaRPE_Tuchscherer[5][8]).toBe(0.811);
      expect(TablaRPE_Tuchscherer[8][8]).toBe(0.723);
    });

    it("calcular1RMPorRPE estima 1RM con precisión de RTS", () => {
      const calc = FormulasRM.calcular1RMPorRPE(100, 5, 8);
      expect(calc).toBeDefined();
      expect(calc.porcentaje).toBe(81.1);
      // 100 / 0.811 = ~123.3 kg
      expect(calc.rm).toBe(123.3);
    });

    it("calcularTodos advierte sobre series de alta repeticion (>10 reps)", () => {
      const rmBajo = FormulasRM.calcularTodos(100, 5);
      expect(rmBajo.confiable).toBe(true);
      expect(rmBajo.advertencia).toBeNull();

      const rmAlto = FormulasRM.calcularTodos(50, 15);
      expect(rmAlto.confiable).toBe(false);
      expect(typeof rmAlto.advertencia).toBe("string");
    });
  });

  describe("Landmarks de Volumen (MEV / MAV / MRV)", () => {
    it("discrimina series efectivas por RPE/RIR", () => {
      expect(VolumeLandmarks.esSerieEfectiva({ rpe: 8, reps: 8 })).toBe(true);
      expect(VolumeLandmarks.esSerieEfectiva({ rpe: 6, reps: 8 })).toBe(false);
      expect(VolumeLandmarks.esSerieEfectiva({ rir: 2, reps: 8 })).toBe(true);
      expect(VolumeLandmarks.esSerieEfectiva({ rir: 4, reps: 8 })).toBe(false);
    });

    it("analizarSemana diagnostica adecuadamente el estado de adaptación", () => {
      const hoy = new Date().toISOString();
      const historial = [
        {
          timestamp: hoy,
          ejercicios: [
            {
              musculo: "pecho",
              series: [
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
                { peso: 80, reps: 8, rpe: 8 },
              ]
            }
          ]
        }
      ];

      const analisis = VolumeLandmarks.analizarSemana(historial, 7);
      expect(analisis.pecho).toBeDefined();
      expect(analisis.pecho.efectivas).toBe(12);
      expect(analisis.pecho.estado).toBe("en_mav");
      expect(analisis.pecho.color).toBe("success");
    });
  });

  describe("Periodización Contemporánea (ATR & DUP)", () => {
    it("calcula la semana actual del bloque dinámicamente", () => {
      const gestor = new GestorPeriodizacion([]);
      const bloque = gestor.crearBloque({
        nombre: "Fuerza Bloque 1",
        tipo: "intensificacion",
        semanas: 4
      });

      expect(gestor.getSemanaActual(bloque)).toBe(1);
      const prescripcion = gestor.getPrescripcionActual();
      expect(prescripcion).toBeDefined();
      expect(prescripcion.rpeObjetivo).toBe(7.5);
    });

    it("contiene los modelos ATR y DUP estructurados", () => {
      expect(MODELOS_PERIODIZACION.acumulacion).toBeDefined();
      expect(MODELOS_PERIODIZACION.intensificacion).toBeDefined();
      expect(MODELOS_PERIODIZACION.realizacion).toBeDefined();
      expect(MODELOS_PERIODIZACION.dup).toBeDefined();
    });
  });
});
