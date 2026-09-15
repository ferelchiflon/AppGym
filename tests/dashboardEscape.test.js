import { describe, it, expect } from "vitest";
import { DashboardController } from "../src/controllers/dashboard.controller.js";

/**
 * Regresión de seguridad: el dashboard interpola datos que pueden llegar de un
 * input del usuario o de un backup importado (Store.importarTodo). Verificar que
 * se renderizan como texto escapado y no como HTML ejecutable (XSS).
 */
function instancia({ rutina, periodizacion = null } = {}) {
  return new DashboardController({
    app: null,
    rutina,
    periodizacion,
    perfil: null,
    el: { container: document.createElement("div") },
  });
}

function rutinaVacia() {
  return { historial: [], data: { rutina: [], progreso: {}, seriesPorEjercicio: {} } };
}

describe("DashboardController · escape de HTML (XSS)", () => {
  it("escapa el tipo de un bloque de periodización manipulado en _periodizacionCard", () => {
    const payload = "<img src=x onerror=alert(1)>";
    const periodizacion = {
      getBloqueActual: () => ({
        nombre: "Bloque",
        tipo: payload, // tipo libre si viene de un backup manipulado
        semanas: 4,
        duracionSemanas: 4,
        fechaInicio: "2026-01-01",
      }),
      getSemanaActual: () => 1,
    };

    const c = instancia({ rutina: rutinaVacia(), periodizacion });
    const html = c._periodizacionCard();

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });

  it("escapa el grupo muscular sugerido derivado de datos manipulados en _sugerenciaCard", () => {
    const payload = "<img src=x onerror=alert(1)>";

    const c = instancia({ rutina: rutinaVacia() });
    const html = c._sugerenciaCard(payload, null);

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });
});