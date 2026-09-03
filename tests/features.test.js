import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../src/store.js";
import { GestorRutina } from "../src/gestor-rutina.js";
import { EJERCICIOS_CATALOGO } from "../src/data/exercises.js";
import { PLANTILLAS_PREDEFINIDAS } from "../src/data/plantillas-predefinidas.js";
import { reordenarArrayEjercicios } from "../src/dnd.js";
import { SyncManager } from "../src/sync.js";

const idsValidos = new Set(EJERCICIOS_CATALOGO.map((e) => e.id));

function resetStore() {
  localStorage.clear();
  Store._cache = null;
  Store._modoIDB = false;
}

function nuevaRutinaConEjercicios(ids, superseries = {}) {
  const perfil = Store.getPerfilActivo();
  perfil.rutina = [...ids];
  perfil.seriesPorEjercicio = {};
  ids.forEach((id) => { perfil.seriesPorEjercicio[id] = []; });
  perfil.superseries = { ...superseries };
  return new GestorRutina(perfil);
}

describe("Plantillas predefinidas", () => {
  it("definen id, nombre, descripcion y ejercicios válidos del catálogo", () => {
    expect(PLANTILLAS_PREDEFINIDAS.length).toBeGreaterThanOrEqual(4);
    PLANTILLAS_PREDEFINIDAS.forEach((tpl) => {
      expect(tpl.id).toBeTypeOf("string");
      expect(tpl.nombre).toBeTypeOf("string");
      expect(tpl.descripcion).toBeTypeOf("string");
      expect(Array.isArray(tpl.ejercicios)).toBe(true);
      expect(tpl.ejercicios.length).toBeGreaterThan(0);
      tpl.ejercicios.forEach((id) => {
        expect(idsValidos.has(id), "id desconocido: " + id).toBe(true);
      });
    });
  });

  it('el flujo "importar y usar" persiste una copia y la carga en la rutina', () => {
    const tpl = PLANTILLAS_PREDEFINIDAS[0];
    const plantilla = Store.crearPlantilla(tpl.nombre, [...tpl.ejercicios]);
    expect(plantilla).toBeDefined();
    expect(Store.listarPlantillas()).toHaveLength(1);

    const rutina = nuevaRutinaConEjercicios(["press_banca"]);
    expect(rutina.cargarPlantilla(plantilla.id)).toBe(true);
    expect(rutina.rutina).toEqual(tpl.ejercicios);
    tpl.ejercicios.forEach((id) => expect(rutina.seriesPorEjercicio[id]).toEqual([]));
  });
});

describe("reordenarEjercicio (Drag & Drop)", () => {
  beforeEach(resetStore);

  it("reordena la rutina moviendo un ejercicio de fromIdx a toIdx", () => {
    const rutina = nuevaRutinaConEjercicios(["a", "b", "c", "d"]);
    expect(rutina.reordenarEjercicio(0, 2)).toBe(true);
    expect(rutina.data.rutina).toEqual(["b", "c", "a", "d"]);
  });

  it("rechaza índices inválidos o sin movimiento", () => {
    const rutina = nuevaRutinaConEjercicios(["a", "b"]);
    expect(rutina.reordenarEjercicio(-1, 1)).toBe(false);
    expect(rutina.reordenarEjercicio(0, 5)).toBe(false);
    expect(rutina.reordenarEjercicio(1, 1)).toBe(false);
    expect(rutina.data.rutina).toEqual(["a", "b"]);
  });

  it("remapa superseries: conserva el enlace si el par sigue adyacente", () => {
    // Superserie inicial: a-b (índice 0).
    const rutina = nuevaRutinaConEjercicios(["a", "b", "c"], { 0: true });
    // Movemos c (índice 2) al inicio → ['c','a','b']; el par a-b sigue junto.
    expect(rutina.reordenarEjercicio(2, 0)).toBe(true);
    expect(rutina.data.rutina).toEqual(["c", "a", "b"]);
    expect(rutina.data.superseries).toEqual({ 1: true });
  });

  it("remapa superseries: libera el enlace si el par se separa", () => {
    const rutina = nuevaRutinaConEjercicios(["a", "b", "c"], { 0: true });
    // Movemos a (índice 0) entre b y c → ['b','a','c']; a-b ya no es adyacente.
    expect(rutina.reordenarEjercicio(0, 2)).toBe(true);
    expect(rutina.data.rutina).toEqual(["b", "c", "a"]);
    expect(rutina.data.superseries).toEqual({});
  });

  it("utilidad pura reordena y conserva el ejercicio seleccionado válido", () => {
    const { rutina: orden } = reordenarArrayEjercicios(["x", "y", "z"], { 0: true }, 2, 1);
    expect(orden).toEqual(["x", "z", "y"]);
  });
});

describe("SyncManager (offline-first)", () => {
  it("expone el estado de conexión (navegador)", () => {
    const manager = new SyncManager();
    expect(typeof manager.online).toBe("boolean");
    manager.destruir();
  });

  it("sin IndexedDB disponible, encolarOperacion devuelve null sin romper", async () => {
    const manager = new SyncManager();
    const op = await manager.encolarOperacion({ tipo: "test", entidad: "x", datos: {} });
    expect(op).toBeNull();
    manager.destruir();
  });

  it("procesarCola no procesa nada si está offline", async () => {
    const manager = new SyncManager();
    manager._online = false;
    expect(await manager.procesarCola()).toBe(0);
    manager.destruir();
  });

  it("procesarCola no procesa si la cola no está inicializada (IDB ausente)", async () => {
    const manager = new SyncManager();
    manager._online = true;
    expect(await manager.procesarCola()).toBe(0);
    manager.destruir();
  });
});