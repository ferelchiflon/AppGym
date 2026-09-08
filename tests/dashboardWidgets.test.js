/**
 * tests/dashboardWidgets.test.js
 * Valida los widgets de seguimiento del dashboard (2.2):
 * último entrenamiento, próximo objetivo y logros recientes.
 */
import { describe, it, expect } from "vitest";
import {
  ultimoEntrenamiento,
  proximoObjetivo,
  logrosRecientes,
  renderSeguimiento,
} from "../src/components/dashboard-widgets.js";

const hist = [
  {
    fechaISO: "2026-08-09T10:30:00",
    ejercicios: [
      { id: "press_banca", musculo: "pecho", series: [{ peso: 60, reps: 8 }, { peso: 60, reps: 8 }] },
      { id: "press_militar", musculo: "hombros", series: [{ peso: 30, reps: 10 }] },
    ],
  },
  { fechaISO: "2026-08-07T09:00:00", ejercicios: [] },
];

describe("dashboard-widgets", () => {
  it("ultimoEntrenamiento muestra la sesión más reciente con resumen", () => {
    const html = ultimoEntrenamiento(hist);
    expect(html).toContain("ÚLTIMO ENTRENAMIENTO");
    expect(html).toContain("2</strong> ejercicios");
    expect(html).toContain("3</strong> series");
    expect(html).toContain("Pecho");
    expect(html).toContain("Hombros");
  });

  it("ultimoEntrenamiento muestra estado vacío sin historial", () => {
    expect(ultimoEntrenamiento([])).toContain("Aún no registraste");
  });

  it("proximoObjetivo usa la prescripción de periodización", () => {
    const periodizacion = {
      getPrescripcionActual: () => ({ fase: "Fase base", semana: 2, modeloDesc: "Acumulación de volumen" }),
    };
    const html = proximoObjetivo(periodizacion, "pecho");
    expect(html).toContain("PRÓXIMO OBJETIVO");
    expect(html).toContain("Fase base · Semana 2");
    expect(html).toContain("Acumulación de volumen");
    expect(html).toContain("Pecho");
  });

  it("proximoObjetivo cae a 'Entrenar hoy' sin prescripción", () => {
    expect(proximoObjetivo(null, "")).toContain("Entrenar hoy");
  });

  it("logrosRecientes enumera racha y PRs", () => {
    const html = logrosRecientes({
      stre: 3,
      prs: { recientes: [{}], mejor: { nombre: "Peso muerto" } },
      best: null,
    });
    expect(html).toContain("Racha activa de");
    expect(html).toContain("3</strong> días");
    expect(html).toContain("1</strong> nuevo PR");
    expect(html).toContain("Peso muerto");
  });

  it("logrosRecientes muestra mensaje motivacional sin datos", () => {
    expect(logrosRecientes({})).toContain("Entrená para desbloquear logros");
  });

  it("renderSeguimiento agrupa los tres widgets con su título de sección", () => {
    const html = renderSeguimiento({ historial: hist, grupo: "espalda", prs: null, stre: 1, best: null });
    expect(html).toContain("Seguimiento");
    expect(html).toContain("ÚLTIMO ENTRENAMIENTO");
    expect(html).toContain("PRÓXIMO OBJETIVO");
    expect(html).toContain("LOGROS RECIENTES");
  });
});