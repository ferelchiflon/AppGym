import { describe, it, expect, beforeEach } from "vitest";
import { GestorCardio, TIPOS_CARDIO } from "../src/gestor-cardio.js";
import { Store } from "../src/store.js";
import { CONFIG } from "../src/config.js";

function perfilBase() {
  return {
    id: "p1",
    nombre: "Tester",
    sesionesCardio: [],
  };
}

describe("GestorCardio", () => {
  let cardio;

  beforeEach(() => {
    cardio = new GestorCardio(perfilBase());
  });

  it("expone los 4 tipos de cardio de la whitelist", () => {
    expect(TIPOS_CARDIO).toEqual(["correr", "bici", "remo", "otro"]);
  });

  it("registra una sesión válida con todos sus campos", () => {
    const sesion = cardio.registrar({
      tipo: "correr",
      duracion: "45",
      distancia: "10.5",
      fc: 158,
      rpe: 8,
      notas: "Fácil",
    });

    expect(sesion).not.toBeNull();
    expect(sesion.id).toBeDefined();
    expect(sesion.tipo).toBe("correr");
    expect(sesion.duracion).toBe(45);
    expect(sesion.distancia).toBe(10.5);
    expect(sesion.fc).toBe(158);
    expect(sesion.rpe).toBe(8);
    expect(sesion.notas).toBe("Fácil");
    expect(sesion.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("guarda la sesión en perfil.sesionesCardio (colección propia)", () => {
    cardio.registrar({ tipo: "bici", duracion: 30, rpe: 6 });
    const lista = cardio.getSesiones();
    expect(lista).toHaveLength(1);
    expect(lista[0].tipo).toBe("bici");
  });

  it("rechaza tipo inválido y duración no positiva (seguridad de input)", () => {
    expect(cardio.registrar({ tipo: "natacion", duracion: 30, rpe: 7 })).toBeNull();
    expect(cardio.registrar({ tipo: "correr", duracion: "0", rpe: 7 })).toBeNull();
    expect(cardio.registrar({ tipo: "correr", duracion: -5, rpe: 7 })).toBeNull();
    expect(cardio.getSesiones()).toHaveLength(0);
  });

  it("hace la FC opcional y el RPE obligatorio", () => {
    const conFc = cardio.registrar({ tipo: "remo", duracion: 20, fc: null, rpe: 5 });
    expect(conFc.fc).toBeNull();

    const sinRpe = cardio.registrar({ tipo: "remo", duracion: 20 });
    expect(sinRpe).toBeNull();
  });

  it("clampa el RPE fuera de rango a 1-10", () => {
    const alto = cardio.registrar({ tipo: "correr", duracion: 30, rpe: 15 });
    expect(alto.rpe).toBe(10);
    const bajo = cardio.registrar({ tipo: "correr", duracion: 30, rpe: 0 });
    expect(bajo.rpe).toBe(1);
  });

  it("redondea duración y distancia a decimales razonables", () => {
    const sesion = cardio.registrar({ tipo: "bici", duracion: "45.333", distancia: "12.456", rpe: 7.55 });
    expect(sesion.duracion).toBe(45.3);
    expect(sesion.distancia).toBe(12.46);
  });

  it("filtra por tipo sin mutar la colección", () => {
    cardio.registrar({ tipo: "correr", duracion: 30, rpe: 5 });
    cardio.registrar({ tipo: "bici", duracion: 30, rpe: 5 });

    expect(cardio.getPorTipo("correr")).toHaveLength(1);
    expect(cardio.getPorTipo("bici")).toHaveLength(1);
    expect(cardio.getPorTipo("remo")).toHaveLength(0);
    expect(cardio.getPorTipo("invalido")).toHaveLength(0);
    expect(cardio.getSesiones()).toHaveLength(2);
  });

  it("getUltima devuelve la sesión más reciente (o null si no hay)", () => {
    expect(cardio.getUltima()).toBeNull();
    cardio.registrar({ tipo: "correr", duracion: 30, rpe: 5 });
    cardio.registrar({ tipo: "bici", duracion: 45, rpe: 7 });
    expect(cardio.getUltima().tipo).toBe("bici");
  });

  it("calcula resumen semanal de minutos, km, sesiones y promedios", () => {
    cardio.registrar({ tipo: "correr", duracion: 30, distancia: 5, fc: 150, rpe: 7 });
    cardio.registrar({ tipo: "bici", duracion: 45, distancia: 15, fc: 130, rpe: 5 });

    const resumen = cardio.getResumen(7);
    expect(resumen.sesiones).toBe(2);
    expect(resumen.minutos).toBe(75);
    expect(resumen.distancia).toBe(20);
    expect(resumen.fcPromedio).toBe(140);
    expect(resumen.rpePromedio).toBe(6);
  });

  it("elimina una sesión por id y devuelve false si no existe", () => {
    const sesion = cardio.registrar({ tipo: "correr", duracion: 30, rpe: 5 });
    expect(cardio.eliminar(sesion.id)).toBe(true);
    expect(cardio.getSesiones()).toHaveLength(0);
    expect(cardio.eliminar(sesion.id)).toBe(false);
  });
});

describe("Integración: sesionesCardio con Store", () => {
  it("los perfiles nuevos nacen con la colección sesionesCardio", () => {
    const perfil = Store.getPerfilActivo();
    expect(Array.isArray(perfil.sesionesCardio)).toBe(true);
  });

  it("registrar una sesión persiste en Store y sigue visible en dashboards", () => {
    const perfil = Store.getPerfilActivo();
    const gestor = new GestorCardio(perfil);

    const sesion = gestor.registrar({
      tipo: "remo",
      duracion: 20,
      distancia: 4,
      fc: 145,
      rpe: 6,
    });

    expect(sesion).not.toBeNull();
    expect(perfil.sesionesCardio.some((s) => s.id === sesion.id)).toBe(true);
    expect(gestor.getResumen(7).minutos).toBeGreaterThanOrEqual(20);
  });

  it("un perfil legacy sin sesionesCardio se backfillea a [] al tocar Store", () => {
    const data = {
      version: CONFIG.VERSION,
      activeProfileId: "p1",
      profiles: { p1: { id: "p1", nombre: "Legacy" } },
    };
    // _asegurarColeccionesNuevas es un helper público del Store (módulo).
    Store._asegurarColeccionesNuevas(data);
    expect(Array.isArray(data.profiles.p1.sesionesCardio)).toBe(true);
  });
});