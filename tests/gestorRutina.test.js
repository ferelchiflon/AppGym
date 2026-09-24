/**
 * Tests for GestorRutina (src/gestor-rutina.js)
 *
 * Estrategia: vi.mock (hoisted por Vitest) para TODAS las dependencias (utils,
 * formulas, autorregulacion, store, config, dnd). Imports estáticos de los
 * módulos mockeados para asertar sobre los mocks (`require()` no existe en ESM).
 * Fixture plano con la misma forma que produce Store.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GestorRutina } from "../src/gestor-rutina.js";
import { FormulasRM } from "../src/formulas.js";
import { Autoregulacion } from "../src/autorregulacion.js";
import { Store } from "../src/store.js";
import { reordenarArrayEjercicios } from "../src/dnd.js";

vi.mock("../src/utils.ts", () => {
  // Contador interno (closure de fábrica) para ids únicos por llamada.
  let idCounter = 0;
  return {
    Utils: {
      generarId: vi.fn(() => `id-test-${++idCounter}`),
      fechaFormateada: vi.fn(() => "22 de septiembre"),
      fechaISO: vi.fn(() => "2026-09-22"),
    },
  };
});

vi.mock("../src/formulas.js", () => ({
  FormulasRM: {
    calcularTodos: vi.fn(() => ({ promedio: 100 })),
    calcular1RMPorRPE: vi.fn(() => ({ rm: 110, porcentaje: 80, rpe: 8 })),
  },
}));

vi.mock("../src/autorregulacion.js", () => ({
  Autoregulacion: {
    sugerirProximoPeso: vi.fn(() => 105),
  },
}));

vi.mock("../src/store.js", () => ({
  Store: {
    guardar: vi.fn(),
    crearPlantilla: vi.fn((nombre, ejercicios) => ({ id: "plantilla-1", nombre, ejercicios })),
    listarPlantillas: vi.fn(() => []),
  },
}));

vi.mock("../src/config.ts", () => ({
  EJERCICIOS_DISPONIBLES: [
    { id: "press-banca", nombre: "Press Banca", musculo: "pecho" },
    { id: "sentadilla", nombre: "Sentadilla", musculo: "piernas" },
    { id: "peso-muerto", nombre: "Peso Muerto", musculo: "espalda" },
  ],
}));

vi.mock("../src/dnd.js", () => ({
  // Simula el comportamiento real de dnd.reordenarArrayEjercicios: mueve
  // fromIdx → toIdx y re-enlaza solo los pares de superseries que siguen
  // siendo adyacentes tras el movimiento.
  reordenarArrayEjercicios: vi.fn((rutina, superseries, fromIdx, toIdx) => {
    const pares = [];
    Object.entries(superseries || {}).forEach(([i, val]) => {
      const idx = Number(i);
      if (val && idx >= 0 && idx < rutina.length - 1) pares.push([rutina[idx], rutina[idx + 1]]);
    });
    const nuevo = [...rutina];
    const [movido] = nuevo.splice(fromIdx, 1);
    nuevo.splice(toIdx, 0, movido);
    const nuevas = {};
    for (let i = 0; i < nuevo.length - 1; i++) {
      const par = `${nuevo[i]}|${nuevo[i + 1]}`;
      if (pares.some((p) => p.join("|") === par)) nuevas[i] = true;
    }
    return { rutina: nuevo, superseries: nuevas };
  }),
}));

/** Fixture base con la misma forma que gestiona GestorRutina. */
function makeRutinaData(overrides = {}) {
  return {
    rutina: ["press-banca", "sentadilla"],
    seriesPorEjercicio: {
      "press-banca": [],
      "sentadilla": [],
    },
    historial: [],
    superseries: {},
    records: {},
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks NO toca las implementaciones: restauramos las por defecto
  // para que los tests que las cambian (mockImplementation*) no contaminen.
  FormulasRM.calcularTodos.mockImplementation(() => ({ promedio: 100 }));
  FormulasRM.calcular1RMPorRPE.mockImplementation(() => ({ rm: 110, porcentaje: 80, rpe: 8 }));
  Autoregulacion.sugerirProximoPeso.mockImplementation(() => 105);
  Store.crearPlantilla.mockImplementation(
    (nombre, ejercicios) => ({ id: "plantilla-1", nombre, ejercicios })
  );
  Store.listarPlantillas.mockImplementation(() => []);
  // OJO: Utils.generarId NO se re-mockea: su implementación de fábrica
  // (closure con contador) garantiza ids únicos por llamada.
});

describe("GestorRutina", () => {
  let gestor;

  beforeEach(() => {
    gestor = new GestorRutina(makeRutinaData());
  });

  describe("constructor", () => {
    it("debe inicializar con los datos provistos", () => {
      expect(gestor.data).toEqual(makeRutinaData());
      expect(gestor.ejercicioSeleccionado).toBe("press-banca");
      expect(gestor._dataVersion).toBe(0);
      expect(gestor._cache1RM).toBeInstanceOf(Map);
      expect(gestor._cache1RM.size).toBe(0);
    });

    it("debe setear ejercicioSeleccionado en null si la rutina está vacía", () => {
      const g = new GestorRutina(makeRutinaData({ rutina: [] }));
      expect(g.ejercicioSeleccionado).toBeNull();
    });
  });

  describe("getters", () => {
    it("deben exponer las estructuras internas por referencia", () => {
      const data = makeRutinaData();
      const g = new GestorRutina(data);
      expect(g.rutina).toBe(data.rutina);
      expect(g.seriesPorEjercicio).toBe(data.seriesPorEjercicio);
      expect(g.historial).toBe(data.historial);
      expect(g.superseries).toBe(data.superseries);
    });
  });

  describe("LIMITES (estático)", () => {
    it("debe exponer los límites de validación", () => {
      expect(GestorRutina.LIMITES).toEqual({
        pesoMin: 0,
        pesoMax: 500,
        repsMin: 0,
        repsMax: 100,
        rpeMin: 1,
        rpeMax: 10,
        rirMin: 0,
        rirMax: 10,
      });
    });

    it("debe devolver una copia (mutar el resultado no afecta el original)", () => {
      const limites = GestorRutina.LIMITES;
      limites.pesoMax = 1;
      expect(GestorRutina.LIMITES.pesoMax).toBe(500);
    });
  });

  describe("_incrementarVersion", () => {
    it("debe incrementar la versión y limpiar la caché de 1RM", () => {
      gestor._cache1RM.set("press-banca", { rm: 100 });
      gestor._incrementarVersion();
      expect(gestor._dataVersion).toBe(1);
      expect(gestor._cache1RM.size).toBe(0);
    });
  });

  describe("_validarSerie", () => {
    it("debe normalizar valores válidos (strings → números)", () => {
      expect(gestor._validarSerie({ peso: "20.5", reps: "10", rpe: "8", rir: "2" })).toEqual({
        peso: 20.5,
        reps: 10,
        rpe: 8,
        rir: 2,
      });
    });

    it("debe aceptar rpe/rir nulos (por defecto)", () => {
      expect(gestor._validarSerie({ peso: 20, reps: 10 })).toEqual({
        peso: 20,
        reps: 10,
        rpe: null,
        rir: null,
      });
    });

    it("debe lanzar error para peso NaN", () => {
      expect(() => gestor._validarSerie({ peso: NaN, reps: 10 })).toThrow(/Peso inválido/);
    });

    it("debe lanzar error para peso por debajo del mínimo", () => {
      expect(() => gestor._validarSerie({ peso: -1, reps: 10 })).toThrow(/Peso inválido/);
    });

    it("debe lanzar error para peso por encima del máximo", () => {
      expect(() => gestor._validarSerie({ peso: 501, reps: 10 })).toThrow(/Peso inválido/);
    });

    it("debe lanzar error para reps NaN", () => {
      expect(() => gestor._validarSerie({ peso: 20, reps: NaN })).toThrow(/Repeticiones inválidas/);
    });

    it("debe lanzar error para reps por debajo del mínimo", () => {
      expect(() => gestor._validarSerie({ peso: 20, reps: -1 })).toThrow(/Repeticiones inválidas/);
    });

    it("debe lanzar error para reps por encima del máximo", () => {
      expect(() => gestor._validarSerie({ peso: 20, reps: 101 })).toThrow(/Repeticiones inválidas/);
    });

    it("debe lanzar error para rpe fuera de rango", () => {
      expect(() => gestor._validarSerie({ peso: 20, reps: 10, rpe: 11 })).toThrow(/RPE inválido/);
      expect(() => gestor._validarSerie({ peso: 20, reps: 10, rpe: 0.5 })).toThrow(/RPE inválido/);
    });

    it("debe lanzar error para rir fuera de rango", () => {
      expect(() => gestor._validarSerie({ peso: 20, reps: 10, rir: -1 })).toThrow(/RIR inválido/);
      expect(() => gestor._validarSerie({ peso: 20, reps: 10, rir: 11 })).toThrow(/RIR inválido/);
    });
  });

  describe("get1RMEstimado", () => {
    it("debe devolver null si el ejercicio no tiene series", () => {
      expect(gestor.get1RMEstimado("press-banca")).toBeNull();
      expect(gestor.get1RMEstimado("no-existe")).toBeNull();
    });

    it("debe calcular el 1RM a partir de la última serie", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [
        { peso: 80, reps: 8, rpe: 7 },
        { peso: 100, reps: 5, rpe: null },
      ];

      const rm = gestor.get1RMEstimado("press-banca");
      expect(FormulasRM.calcularTodos).toHaveBeenCalledWith(100, 5);
      expect(rm).toEqual({
        rm: 100,
        peso: 100,
        reps: 5,
        rpe: null,
        fuente: "epley+brzycki+lombardi",
        version: 0,
      });
    });

    it("debe devolver el objeto cacheado en llamadas repetidas (misma referencia)", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5 }];
      const primera = gestor.get1RMEstimado("press-banca");
      const segunda = gestor.get1RMEstimado("press-banca");
      expect(segunda).toBe(primera);
      expect(FormulasRM.calcularTodos).toHaveBeenCalledTimes(1);
    });

    it("debe recalcular si la caché quedó obsoleta (versión incrementada)", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5 }];
      expect(gestor.get1RMEstimado("press-banca").rm).toBe(100);

      FormulasRM.calcularTodos.mockImplementation(() => ({ promedio: 120 }));
      gestor._incrementarVersion(); // invalida la caché

      expect(gestor.get1RMEstimado("press-banca").rm).toBe(120);
      expect(FormulasRM.calcularTodos).toHaveBeenCalledTimes(2);
    });

    it("debe devolver null si las fórmulas no pueden calcular", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5 }];
      FormulasRM.calcularTodos.mockReturnValueOnce(null);
      expect(gestor.get1RMEstimado("press-banca")).toBeNull();
    });
  });

  describe("get1RMPorRPE", () => {
    it("debe devolver null si el ejercicio no tiene series", () => {
      expect(gestor.get1RMPorRPE("press-banca")).toBeNull();
    });

    it("debe devolver null si la última serie no tiene RPE", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5, rpe: null }];
      expect(gestor.get1RMPorRPE("press-banca")).toBeNull();
      expect(FormulasRM.calcular1RMPorRPE).not.toHaveBeenCalled();
    });

    it("debe calcular el 1RM por RPE y cachearlo", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 90, reps: 5, rpe: 8 }];

      const resultado = gestor.get1RMPorRPE("press-banca");
      expect(FormulasRM.calcular1RMPorRPE).toHaveBeenCalledWith(90, 5, 8);
      expect(resultado).toEqual({ rm: 110, porcentaje: 80, rpe: 8, version: 0 });

      // Segunda llamada: cacheada (misma referencia, sin recalcular).
      expect(gestor.get1RMPorRPE("press-banca")).toBe(resultado);
      expect(FormulasRM.calcular1RMPorRPE).toHaveBeenCalledTimes(1);
    });

    it("debe recalcular si la caché quedó obsoleta (versión incrementada)", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 90, reps: 5, rpe: 8 }];
      expect(gestor.get1RMPorRPE("press-banca").rm).toBe(110);

      FormulasRM.calcular1RMPorRPE.mockImplementation(() => ({ rm: 120, porcentaje: 85, rpe: 8 }));
      gestor._incrementarVersion();

      expect(gestor.get1RMPorRPE("press-banca").rm).toBe(120);
    });
  });

  describe("agregarEjercicio", () => {
    it("debe agregar un ejercicio nuevo y actualizar estructuras relacionadas", () => {
      const result = gestor.agregarEjercicio("peso-muerto");

      expect(result).toBe(true);
      expect(gestor.data.rutina).toEqual(["press-banca", "sentadilla", "peso-muerto"]);
      expect(gestor.data.seriesPorEjercicio["peso-muerto"]).toEqual([]);
      expect(gestor.ejercicioSeleccionado).toBe("peso-muerto");
      expect(gestor._dataVersion).toBe(1);
      expect(Store.guardar).toHaveBeenCalledTimes(1);
    });

    it("debe devolver false si el ejercicio ya existe (sin mutar ni persistir)", () => {
      const result = gestor.agregarEjercicio("press-banca");

      expect(result).toBe(false);
      expect(gestor.data.rutina).toEqual(["press-banca", "sentadilla"]);
      expect(gestor._dataVersion).toBe(0);
      expect(Store.guardar).not.toHaveBeenCalled();
    });
  });

  describe("eliminarEjercicio", () => {
    it("debe eliminar el ejercicio y limpiar series/superseries", () => {
      gestor.data.superseries = { 0: true };
      gestor.eliminarEjercicio("press-banca");

      expect(gestor.data.rutina).toEqual(["sentadilla"]);
      expect(gestor.data.seriesPorEjercicio).not.toHaveProperty("press-banca");
      expect(gestor.data.superseries).not.toHaveProperty("0");
      expect(gestor._dataVersion).toBe(1);
      expect(Store.guardar).toHaveBeenCalledTimes(1);
    });

    it("debe actualizar ejercicioSeleccionado si se eliminó el seleccionado", () => {
      gestor.eliminarEjercicio("press-banca");
      expect(gestor.ejercicioSeleccionado).toBe("sentadilla");
    });

    it("debe dejar ejercicioSeleccionado en null si se elimina el único ejercicio", () => {
      gestor.eliminarEjercicio("press-banca");
      gestor.eliminarEjercicio("sentadilla");
      expect(gestor.ejercicioSeleccionado).toBeNull();
    });

    it("debe mantener ejercicioSeleccionado si se elimina otro ejercicio", () => {
      gestor.seleccionarEjercicio("sentadilla");
      gestor.eliminarEjercicio("press-banca");
      expect(gestor.ejercicioSeleccionado).toBe("sentadilla");
    });
  });

  describe("seleccionarEjercicio", () => {
    it("debe cambiar la selección a un id existente", () => {
      expect(gestor.seleccionarEjercicio("sentadilla")).toBe(true);
      expect(gestor.ejercicioSeleccionado).toBe("sentadilla");
    });

    it("debe devolver false y mantener la selección para un id inexistente", () => {
      expect(gestor.seleccionarEjercicio("no-existe")).toBe(false);
      expect(gestor.ejercicioSeleccionado).toBe("press-banca");
    });
  });

  describe("reordenarEjercicio", () => {
    it("debe reordenar moviendo fromIdx → toIdx y persistir", () => {
      const g = new GestorRutina(
        makeRutinaData({
          rutina: ["press-banca", "sentadilla", "peso-muerto"],
          seriesPorEjercicio: { "press-banca": [], "sentadilla": [], "peso-muerto": [] },
          superseries: { 0: true },
        })
      );

      const result = g.reordenarEjercicio(0, 2);

      expect(result).toBe(true);
      expect(g.data.rutina).toEqual(["sentadilla", "peso-muerto", "press-banca"]);
      // La superserie press-banca+sentadilla deja de ser adyacente → purgada.
      expect(g.data.superseries).toEqual({});
      expect(g.ejercicioSeleccionado).toBe("press-banca"); // se preserva por id
      expect(g._dataVersion).toBe(1);
      expect(Store.guardar).toHaveBeenCalledTimes(1);
    });

    it("debe conservar la superserie si el par sigue siendo adyacente", () => {
      const g = new GestorRutina(
        makeRutinaData({
          rutina: ["press-banca", "sentadilla", "peso-muerto"],
          superseries: { 1: true }, // sentadilla+peso-muerto enlazados
        })
      );

      g.reordenarEjercicio(0, 2); // press-banca al final

      expect(g.data.rutina).toEqual(["sentadilla", "peso-muerto", "press-banca"]);
      expect(g.data.superseries).toEqual({ 0: true }); // el par sigue adyacente
    });

    it("debe devolver false para índices inválidos (sin persistir)", () => {
      expect(gestor.reordenarEjercicio(0, 0)).toBe(false); // mismo índice
      expect(gestor.reordenarEjercicio(-1, 1)).toBe(false); // fuera de rango
      expect(gestor.reordenarEjercicio(0, 5)).toBe(false); // fuera de rango
      expect(Store.guardar).not.toHaveBeenCalled();
    });

    it("debe devolver false si la rutina tiene menos de 2 ejercicios", () => {
      const g = new GestorRutina(makeRutinaData({ rutina: ["press-banca"] }));
      expect(g.reordenarEjercicio(0, 0)).toBe(false);
    });

    it("debe usar el primer ejercicio como fallback si la selección es null", () => {
      gestor.data.rutina = ["press-banca", "sentadilla", "peso-muerto"];
      gestor.ejercicioSeleccionado = null;

      gestor.reordenarEjercicio(0, 2);

      expect(gestor.ejercicioSeleccionado).toBe("sentadilla"); // primero del nuevo orden
    });
  });

  describe("getEjercicioActual / getSeriesActuales", () => {
    it("deben devolver la selección y sus series", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 60, reps: 8 }];
      expect(gestor.getEjercicioActual()).toBe("press-banca");
      expect(gestor.getSeriesActuales()).toEqual([{ peso: 60, reps: 8 }]);
    });

    it("deben devolver valores vacíos sin selección", () => {
      gestor.ejercicioSeleccionado = null;
      expect(gestor.getEjercicioActual()).toBeNull();
      expect(gestor.getSeriesActuales()).toEqual([]);
    });
  });

  describe("toggleSuperserie / estaEnlazadoConSiguiente", () => {
    it("debe alternar el enlace con la siguiente serie", () => {
      expect(gestor.estaEnlazadoConSiguiente(0)).toBe(false);

      gestor.toggleSuperserie(0);
      expect(gestor.estaEnlazadoConSiguiente(0)).toBe(true);
      expect(gestor.data.superseries).toHaveProperty("0", true);
      expect(Store.guardar).toHaveBeenCalledTimes(1);

      gestor.toggleSuperserie(0);
      expect(gestor.estaEnlazadoConSiguiente(0)).toBe(false);
      expect(gestor.data.superseries).not.toHaveProperty("0");
      expect(Store.guardar).toHaveBeenCalledTimes(2);
    });
  });

  describe("agregarSerie", () => {
    it("debe agregar una serie válida con id, PR y persistencia", () => {
      const serie = gestor.agregarSerie("press-banca", {
        peso: 100,
        reps: 5,
        rpe: 8,
        rir: 2,
        notas: "buena técnica",
      });

      expect(serie).toEqual({
        id: expect.any(String),
        peso: 100,
        reps: 5,
        rpe: 8,
        rir: 2,
        notas: "buena técnica",
        timestamp: expect.any(String),
        esPR: true, // primer PR del ejercicio
      });
      expect(gestor.data.seriesPorEjercicio["press-banca"]).toEqual([serie]);
      expect(gestor._dataVersion).toBe(1);
      expect(Store.guardar).toHaveBeenCalledTimes(1);
      // El PR se evalúa con las fórmulas:
      expect(FormulasRM.calcularTodos).toHaveBeenCalledWith(100, 5);
    });

    it("debe marcar esPR false si la serie no supera el record", () => {
      gestor.agregarSerie("press-banca", { peso: 100, reps: 5 });
      const segunda = gestor.agregarSerie("press-banca", { peso: 100, reps: 5 });
      expect(segunda.esPR).toBe(false);
      expect(gestor.data.seriesPorEjercicio["press-banca"]).toHaveLength(2);
    });

    it("debe aplicar valores por defecto (rpe/rir null, notas '')", () => {
      const serie = gestor.agregarSerie("press-banca", { peso: 50, reps: 10 });
      expect(serie.rpe).toBeNull();
      expect(serie.rir).toBeNull();
      expect(serie.notas).toBe("");
    });

    it("debe lanzar Error si la serie es inválida (vía _validarSerie)", () => {
      expect(() => gestor.agregarSerie("press-banca", { peso: 999, reps: 5 })).toThrow(
        /Peso inválido/
      );
      expect(gestor.data.seriesPorEjercicio["press-banca"]).toEqual([]);
    });

    it("debe crear la key de series para un ejercicioId desconocido (comportamiento actual)", () => {
      gestor.agregarSerie("desconocido", { peso: 20, reps: 10 });
      expect(gestor.data.seriesPorEjercicio["desconocido"]).toHaveLength(1);
    });
  });

  describe("_evaluarYActualizarRecord / getRecord", () => {
    it("debe crear el record en la primera serie (peso, volumen, rm, fecha)", () => {
      gestor.agregarSerie("press-banca", { peso: 100, reps: 5 });

      expect(gestor.getRecord("press-banca")).toEqual({
        peso: 100,
        volumen: 500,
        rm: 100, // promedio mockeado
        fecha: "2026-09-22",
      });
    });

    it("debe devolver null si el ejercicio no tiene record", () => {
      expect(gestor.getRecord("no-existe")).toBeNull();
    });

    it("debe actualizar el record cuando la serie es mejor", () => {
      gestor.data.records["press-banca"] = { peso: 80, volumen: 320, rm: 90, fecha: "2026-09-01" };
      gestor.agregarSerie("press-banca", { peso: 100, reps: 5 });

      const record = gestor.getRecord("press-banca");
      expect(record.peso).toBe(100);
      expect(record.volumen).toBe(500);
      expect(record.rm).toBe(100);
    });

    it("debe conservar el record cuando la serie es peor (sin esPR)", () => {
      gestor.data.records["press-banca"] = { peso: 200, volumen: 1000, rm: 150, fecha: "2026-09-01" };
      const serie = gestor.agregarSerie("press-banca", { peso: 50, reps: 5 });

      expect(serie.esPR).toBe(false);
      expect(gestor.getRecord("press-banca")).toEqual({
        peso: 200,
        volumen: 1000,
        rm: 150,
        fecha: "2026-09-01",
      });
    });

    it("debe manejar rm null de las fórmulas sin romperse (récord por peso)", () => {
      FormulasRM.calcularTodos.mockReturnValueOnce(null);
      const serie = gestor.agregarSerie("press-banca", { peso: 100, reps: 5 });
      expect(serie.esPR).toBe(true);
      expect(gestor.getRecord("press-banca").rm).toBe(0);
    });
  });

  describe("eliminarSerie", () => {
    it("debe eliminar la serie cuyo id coincida", () => {
      const s1 = gestor.agregarSerie("press-banca", { peso: 60, reps: 8 });
      gestor.agregarSerie("press-banca", { peso: 80, reps: 6 });

      gestor.eliminarSerie("press-banca", s1.id);

      const series = gestor.data.seriesPorEjercicio["press-banca"];
      expect(series).toHaveLength(1);
      expect(series[0].peso).toBe(80);
      expect(gestor._dataVersion).toBe(3); // 2 por agregar + 1 por eliminar
      expect(Store.guardar).toHaveBeenCalledTimes(3);
    });

    it("debe conservar todas las series si ningún id coincide", () => {
      gestor.agregarSerie("press-banca", { peso: 60, reps: 8 });
      gestor.eliminarSerie("press-banca", "id-inexistente");
      expect(gestor.data.seriesPorEjercicio["press-banca"]).toHaveLength(1);
    });

    it("debe ser un no-op si el ejercicio no tiene key de series", () => {
      expect(() => gestor.eliminarSerie("no-existe", "cualquier-id")).not.toThrow();
      expect(gestor.data.seriesPorEjercicio).not.toHaveProperty("no-existe");
    });
  });

  describe("eliminarTodasSeries", () => {
    it("debe vaciar las series del ejercicio", () => {
      gestor.agregarSerie("press-banca", { peso: 60, reps: 8 });
      gestor.agregarSerie("press-banca", { peso: 80, reps: 6 });

      gestor.eliminarTodasSeries("press-banca");

      expect(gestor.data.seriesPorEjercicio["press-banca"]).toEqual([]);
      expect(Store.guardar).toHaveBeenCalled();
    });

    it("debe ser un no-op si el ejercicio no tiene key", () => {
      expect(() => gestor.eliminarTodasSeries("no-existe")).not.toThrow();
    });
  });

  describe("calcularVolumen", () => {
    it("debe sumar peso × reps de todas las series", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [
        { peso: 10, reps: 10 }, // 100
        { peso: 20, reps: 5 },  // 100
      ];
      expect(gestor.calcularVolumen("press-banca")).toBe(200);
    });

    it("debe devolver 0 sin series o para un ejercicio desconocido", () => {
      expect(gestor.calcularVolumen("press-banca")).toBe(0);
      expect(gestor.calcularVolumen("no-existe")).toBe(0);
    });
  });

  describe("calcularRM", () => {
    it("debe calcular el RM de la última serie", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [
        { peso: 80, reps: 8 },
        { peso: 100, reps: 5 },
      ];
      gestor.calcularRM("press-banca");
      expect(FormulasRM.calcularTodos).toHaveBeenCalledWith(100, 5);
    });

    it("debe devolver null sin series", () => {
      expect(gestor.calcularRM("press-banca")).toBeNull();
    });
  });

  describe("calcularWarmUp", () => {
    it("debe generar las series de calentamiento (pesos redondeados a 0.5)", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5 }];
      FormulasRM.calcularTodos.mockReturnValueOnce({ promedio: 100 });

      expect(gestor.calcularWarmUp("press-banca")).toEqual([
        { porcentaje: 20, peso: 20, reps: 5 },
        { porcentaje: 40, peso: 40, reps: 5 },
        { porcentaje: 60, peso: 60, reps: 3 },
        { porcentaje: 80, peso: 80, reps: 2 },
      ]);
    });

    it("debe aceptar porcentajes personalizados", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5 }];
      FormulasRM.calcularTodos.mockReturnValueOnce({ promedio: 100 });

      expect(gestor.calcularWarmUp("press-banca", [50])).toEqual([
        { porcentaje: 50, peso: 50, reps: 3 },
      ]);
    });

    it("debe devolver null sin series", () => {
      expect(gestor.calcularWarmUp("press-banca")).toBeNull();
    });
  });

  describe("sugerirAutorregulacion", () => {
    it("debe delegar en Autoregulacion.sugerirProximoPeso con la última serie", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5, rpe: 8 }];

      expect(gestor.sugerirAutorregulacion("press-banca")).toBe(105);
      expect(Autoregulacion.sugerirProximoPeso).toHaveBeenCalledWith(100, 8, 8);
    });

    it("debe usar el rpeObjetivo provisto", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5, rpe: 9 }];
      gestor.sugerirAutorregulacion("press-banca", 7);
      expect(Autoregulacion.sugerirProximoPeso).toHaveBeenCalledWith(100, 9, 7);
    });

    it("debe devolver null sin series o sin RPE", () => {
      expect(gestor.sugerirAutorregulacion("press-banca")).toBeNull();
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5, rpe: null }];
      expect(gestor.sugerirAutorregulacion("press-banca")).toBeNull();
    });
  });

  describe("guardarSesion", () => {
    it("debe construir la sesión, push al historial y resetear series", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 100, reps: 5 }]; // volumen 500
      gestor.data.seriesPorEjercicio["sentadilla"] = [{ peso: 50, reps: 10 }];  // volumen 500

      const sesion = gestor.guardarSesion();

      expect(sesion).toEqual({
        id: expect.any(String),
        fecha: "22 de septiembre",
        fechaISO: "2026-09-22",
        timestamp: expect.any(String),
        ejercicios: [
          {
            id: "press-banca",
            nombre: "Press Banca",
            musculo: "pecho",
            series: [{ peso: 100, reps: 5 }],
            volumen: 500,
          },
          {
            id: "sentadilla",
            nombre: "Sentadilla",
            musculo: "piernas",
            series: [{ peso: 50, reps: 10 }],
            volumen: 500,
          },
        ],
        volumenTotal: 1000,
      });

      expect(gestor.data.historial).toHaveLength(1);
      expect(gestor.data.historial[0]).toBe(sesion);
      // Series reseteadas tras guardar:
      expect(gestor.data.seriesPorEjercicio["press-banca"]).toEqual([]);
      expect(gestor.data.seriesPorEjercicio["sentadilla"]).toEqual([]);
      expect(gestor._dataVersion).toBe(1);
      expect(Store.guardar).toHaveBeenCalledTimes(1);
    });

    it("debe copiar las series del historial (no pasar referencias vivas)", () => {
      const serieOriginal = { peso: 100, reps: 5, rpe: null, rir: null, notas: "", esPR: false };
      gestor.data.seriesPorEjercicio["press-banca"] = [serieOriginal];

      const sesion = gestor.guardarSesion();
      expect(sesion.ejercicios[0].series[0]).toEqual(serieOriginal);
      expect(sesion.ejercicios[0].series[0]).not.toBe(serieOriginal);
    });

    it("debe devolver null si la rutina está vacía (sin persistir)", () => {
      const g = new GestorRutina(makeRutinaData({ rutina: [] }));
      expect(g.guardarSesion()).toBeNull();
      expect(g.data.historial).toHaveLength(0);
      expect(Store.guardar).not.toHaveBeenCalled();
    });
  });

  describe("guardarComoPlantilla", () => {
    it("debe crear la plantilla vía Store con la rutina actual", () => {
      const plantilla = gestor.guardarComoPlantilla("Push Day");

      expect(Store.crearPlantilla).toHaveBeenCalledWith("Push Day", ["press-banca", "sentadilla"]);
      expect(plantilla).toEqual({
        id: "plantilla-1",
        nombre: "Push Day",
        ejercicios: ["press-banca", "sentadilla"],
      });
    });

    it("debe devolver null si la rutina está vacía (sin llamar a Store)", () => {
      const g = new GestorRutina(makeRutinaData({ rutina: [] }));
      expect(g.guardarComoPlantilla("Vacía")).toBeNull();
      expect(Store.crearPlantilla).not.toHaveBeenCalled();
    });
  });

  describe("cargarPlantilla", () => {
    it("debe aplicar la plantilla y reconstruir seriesPorEjercicio", () => {
      Store.listarPlantillas.mockReturnValueOnce([
        { id: "p1", nombre: "Full Body", ejercicios: ["peso-muerto", "press-banca"] },
      ]);

      const result = gestor.cargarPlantilla("p1");

      expect(result).toBe(true);
      expect(gestor.data.rutina).toEqual(["peso-muerto", "press-banca"]);
      expect(gestor.data.seriesPorEjercicio["peso-muerto"]).toEqual([]);
      expect(gestor.data.seriesPorEjercicio["press-banca"]).toEqual([]);
      expect(gestor.ejercicioSeleccionado).toBe("peso-muerto");
      expect(gestor._dataVersion).toBe(1);
      expect(Store.guardar).toHaveBeenCalledTimes(1);
    });

    it("debe preservar las series de ejercicios que ya estaban", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 60, reps: 8 }];
      Store.listarPlantillas.mockReturnValueOnce([
        { id: "p1", ejercicios: ["peso-muerto", "press-banca"] },
      ]);

      gestor.cargarPlantilla("p1");

      expect(gestor.data.seriesPorEjercicio["press-banca"]).toEqual([{ peso: 60, reps: 8 }]);
    });

    it("debe purgar superseries huérfanas fuera del nuevo rango", () => {
      gestor.data.superseries = { 0: true, 5: true };
      Store.listarPlantillas.mockReturnValueOnce([
        { id: "p1", ejercicios: ["peso-muerto", "press-banca"] },
      ]);

      gestor.cargarPlantilla("p1");

      expect(gestor.data.superseries).toEqual({ 0: true });
    });

    it("debe devolver false si la plantilla no existe (sin mutar)", () => {
      Store.listarPlantillas.mockReturnValueOnce([]);
      expect(gestor.cargarPlantilla("no-existe")).toBe(false);
      expect(gestor.data.rutina).toEqual(["press-banca", "sentadilla"]);
      expect(Store.guardar).not.toHaveBeenCalled();
    });
  });

  describe("getVolumenPorMusculo", () => {
    it("debe agregar el volumen por grupo muscular de la rutina actual", () => {
      gestor.data.seriesPorEjercicio["press-banca"] = [
        { peso: 10, reps: 10 }, // 100
        { peso: 20, reps: 5 },  // 100
      ];
      gestor.data.seriesPorEjercicio["sentadilla"] = [{ peso: 50, reps: 2 }]; // 100

      expect(gestor.getVolumenPorMusculo()).toEqual({ pecho: 200, piernas: 100 });
    });

    it("debe omitir ejercicios que no están en el catálogo", () => {
      gestor.data.rutina = ["press-banca", "desconocido"];
      gestor.data.seriesPorEjercicio["press-banca"] = [{ peso: 10, reps: 10 }];

      expect(gestor.getVolumenPorMusculo()).toEqual({ pecho: 100 });
    });
  });

  describe("getVolumenPorMusculoHistorico", () => {
    it("debe agregar el volumen por músculo desde el historial", () => {
      gestor.data.historial = [
        {
          fecha: "18 de septiembre",
          fechaISO: "2026-09-18",
          ejercicios: [
            { musculo: "pecho", volumen: 100 },
            { musculo: "piernas", volumen: 50 },
          ],
        },
        {
          fecha: "19 de septiembre",
          fechaISO: "2026-09-19",
          ejercicios: [
            { musculo: "pecho", volumen: 200 },
            { musculo: "espalda", volumen: 300 },
          ],
        },
      ];

      expect(gestor.getVolumenPorMusculoHistorico()).toEqual({
        pecho: 300, // 100 + 200
        piernas: 50,
        espalda: 300,
      });
    });

    it("debe devolver un objeto vacío sin historial", () => {
      expect(gestor.getVolumenPorMusculoHistorico()).toEqual({});
    });
  });

  describe("getProgresoRM", () => {
    it("debe devolver el RM estimado por sesión del historial", () => {
      FormulasRM.calcularTodos.mockImplementation((peso) => ({ promedio: peso }));

      gestor.data.historial = [
        {
          fecha: "18 de septiembre",
          fechaISO: "2026-09-18",
          ejercicios: [{ id: "press-banca", series: [{ peso: 100, reps: 5 }] }],
        },
        {
          fecha: "19 de septiembre",
          fechaISO: "2026-09-19",
          ejercicios: [{ id: "sentadilla", series: [{ peso: 999, reps: 5 }] }], // otro ejercicio
        },
        {
          fecha: "20 de septiembre",
          fechaISO: "2026-09-20",
          ejercicios: [{ id: "press-banca", series: [{ peso: 110, reps: 3 }] }],
        },
      ];

      expect(gestor.getProgresoRM("press-banca")).toEqual([
        { sesion: 1, fecha: "18 de septiembre", fechaISO: "2026-09-18", rm: 100 },
        { sesion: 2, fecha: "20 de septiembre", fechaISO: "2026-09-20", rm: 110 },
      ]);
    });

    it("debe filtrar entradas del historial sin series", () => {
      gestor.data.historial = [
        {
          fecha: "18 de septiembre",
          fechaISO: "2026-09-18",
          ejercicios: [{ id: "press-banca", series: [] }],
        },
      ];
      expect(gestor.getProgresoRM("press-banca")).toEqual([]);
    });

    it("debe usar rm 0 cuando las fórmulas no pueden calcular", () => {
      FormulasRM.calcularTodos.mockReturnValueOnce(null);
      gestor.data.historial = [
        {
          fecha: "18 de septiembre",
          fechaISO: "2026-09-18",
          ejercicios: [{ id: "press-banca", series: [{ peso: 100, reps: 5 }] }],
        },
      ];

      expect(gestor.getProgresoRM("press-banca")).toEqual([
        { sesion: 1, fecha: "18 de septiembre", fechaISO: "2026-09-18", rm: 0 },
      ]);
    });
  });

  describe("getUltimaSesionEjercicio", () => {
    it("debe devolver la última serie de la sesión más reciente con el ejercicio", () => {
      gestor.data.historial = [
        {
          fecha: "18 de septiembre",
          fechaISO: "2026-09-18",
          ejercicios: [{ id: "press-banca", series: [{ peso: 100, reps: 5 }] }],
        },
        {
          fecha: "19 de septiembre",
          fechaISO: "2026-09-19",
          ejercicios: [{ id: "sentadilla", series: [{ peso: 200, reps: 5 }] }], // no press-banca
        },
        {
          fecha: "20 de septiembre",
          fechaISO: "2026-09-20",
          ejercicios: [{ id: "press-banca", series: [{ peso: 110, reps: 3, rpe: 8, rir: 2 }] }],
        },
      ];

      expect(gestor.getUltimaSesionEjercicio("press-banca")).toEqual({
        peso: 110,
        reps: 3,
        rpe: 8,
        rir: 2,
        fecha: "20 de septiembre",
        fechaISO: "2026-09-20",
      });
    });

    it("debe devolver rpe/rir null si la serie no los registró", () => {
      gestor.data.historial = [
        {
          fecha: "20 de septiembre",
          fechaISO: "2026-09-20",
          ejercicios: [{ id: "press-banca", series: [{ peso: 110, reps: 3 }] }],
        },
      ];
      const result = gestor.getUltimaSesionEjercicio("press-banca");
      expect(result.rpe).toBeNull();
      expect(result.rir).toBeNull();
    });

    it("debe devolver null si el ejercicio nunca se realizó", () => {
      gestor.data.historial = [
        {
          fecha: "20 de septiembre",
          fechaISO: "2026-09-20",
          ejercicios: [{ id: "sentadilla", series: [{ peso: 200, reps: 5 }] }],
        },
      ];
      expect(gestor.getUltimaSesionEjercicio("press-banca")).toBeNull();
    });
  });

  describe("getVolumenPorSesion", () => {
    it("debe devolver las últimas n sesiones con fecha y volumen", () => {
      gestor.data.historial = [
        { fecha: "18 de septiembre", fechaISO: "2026-09-18", volumenTotal: 100 },
        { fecha: "19 de septiembre", fechaISO: "2026-09-19", volumenTotal: 200 },
        { fecha: "20 de septiembre", fechaISO: "2026-09-20", volumenTotal: 300 },
        { fecha: "21 de septiembre", fechaISO: "2026-09-21", volumenTotal: 400 },
      ];

      expect(gestor.getVolumenPorSesion(2)).toEqual([
        { fecha: "20 de septiembre", fechaISO: "2026-09-20", volumen: 300 },
        { fecha: "21 de septiembre", fechaISO: "2026-09-21", volumen: 400 },
      ]);
    });

    it("debe devolver todas las sesiones si n supera el largo del historial", () => {
      gestor.data.historial = [
        { fecha: "18 de septiembre", fechaISO: "2026-09-18", volumenTotal: 100 },
        { fecha: "19 de septiembre", fechaISO: "2026-09-19", volumenTotal: 200 },
      ];
      expect(gestor.getVolumenPorSesion(5)).toHaveLength(2);
    });
  });
});