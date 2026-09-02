import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../src/store.js";
import { GestorRutina } from "../src/gestor-rutina.js";

describe("Store - Plantillas de rutina", () => {
  beforeEach(() => {
    localStorage.clear();
    Store._cache = null;
    Store._modoIDB = false;
  });

  it("crea una plantilla en el perfil activo y la lista", () => {
    const plantilla = Store.crearPlantilla("Empuje pecho", ["press_banca", "fondos"]);
    expect(plantilla).toBeDefined();
    expect(plantilla.id).toBeDefined();
    expect(plantilla.nombre).toBe("Empuje pecho");
    expect(plantilla.ejercicios).toEqual(["press_banca", "fondos"]);
    expect(typeof plantilla.creadaEn).toBe("string");

    const lista = Store.listarPlantillas();
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe(plantilla.id);
  });

  it("agrega fallback plantillas:[] para perfiles migrados sin el campo", () => {
    // Simula un perfil ya guardado (pre-migración) sin la key `plantillas`.
    const perfil = Store.getPerfilActivo();
    delete perfil.plantillas;

    // listarPlantillas debe tolerar la ausencia del campo.
    expect(Store.listarPlantillas()).toEqual([]);

    // crearPlantilla debe inicializar el array antes de insertar.
    const plantilla = Store.crearPlantilla("Piero día 1", ["sentadilla"]);
    expect(plantilla).toBeDefined();
    expect(Store.listarPlantillas()).toHaveLength(1);
  });

  it("elimina una plantilla existente y devuelve booleano", () => {
    const plantilla = Store.crearPlantilla("Pull", ["remo", "dominadas"]);
    expect(Store.eliminarPlantilla(plantilla.id)).toBe(true);
    expect(Store.listarPlantillas()).toHaveLength(0);

    // Eliminar una id inexistente devuelve false.
    expect(Store.eliminarPlantilla("id-inexistente")).toBe(false);
  });

  it("actualiza nombre y ejercicios de una plantilla", () => {
    const plantilla = Store.crearPlantilla("Full body", ["press_militar"]);
    const actualizada = Store.actualizarPlantilla(plantilla.id, {
      nombre: "Full body v2",
      ejercicios: ["press_militar", "peso_muerto"],
    });

    expect(actualizada.nombre).toBe("Full body v2");
    expect(actualizada.ejercicios).toEqual(["press_militar", "peso_muerto"]);

    // Actualizar id inexistente devuelve null.
    expect(Store.actualizarPlantilla("nope", { nombre: "x" })).toBeNull();
  });
});

describe("GestorRutina - Plantillas de rutina", () => {
  beforeEach(() => {
    localStorage.clear();
    Store._cache = null;
    Store._modoIDB = false;
  });

  function nuevaRutinaConEjercicios(ids) {
    const perfil = Store.getPerfilActivo();
    perfil.rutina = [...ids];
    perfil.seriesPorEjercicio = {};
    ids.forEach((id) => { perfil.seriesPorEjercicio[id] = []; });
    return new GestorRutina(perfil);
  }

  it("guardarComoPlantilla persiste la rutina actual", () => {
    const rutina = nuevaRutinaConEjercicios(["press_banca", "fondos"]);
    const plantilla = rutina.guardarComoPlantilla("Empuje");

    expect(plantilla).toBeDefined();
    expect(plantilla.ejercicios).toEqual(["press_banca", "fondos"]);
    expect(Store.listarPlantillas()).toHaveLength(1);
  });

  it("guardarComoPlantilla devuelve null si la rutina está vacía", () => {
    const rutina = nuevaRutinaConEjercicios([]);
    expect(rutina.guardarComoPlantilla("Vacía")).toBeNull();
    expect(Store.listarPlantillas()).toEqual([]);
  });

  it("cargarPlantilla reemplaza la rutina y reinicializa series", () => {
    const rutina = nuevaRutinaConEjercicios(["press_banca"]);
    rutina.agregarSerie("press_banca", { peso: 60, reps: 8 });

    const plantilla = Store.crearPlantilla("Día piernas", ["sentadilla", "prensa"]);

    expect(rutina.cargarPlantilla(plantilla.id)).toBe(true);
    expect(rutina.rutina).toEqual(["sentadilla", "prensa"]);
    // series reinicializadas: sentadilla y prensa con arrays vacíos.
    expect(rutina.seriesPorEjercicio["sentadilla"]).toEqual([]);
    expect(rutina.seriesPorEjercicio["prensa"]).toEqual([]);
    expect(rutina.seriesPorEjercicio["press_banca"]).toBeUndefined();
    // el ejercicio seleccionado pasa al primero de la plantilla.
    expect(rutina.getEjercicioActual()).toBe("sentadilla");
  });

  it("cargarPlantilla devuelve false para id inexistente", () => {
    const rutina = nuevaRutinaConEjercicios(["press_banca"]);
    expect(rutina.cargarPlantilla("nope")).toBe(false);
    expect(rutina.rutina).toEqual(["press_banca"]);
  });
});