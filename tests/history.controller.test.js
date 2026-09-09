import { describe, it, expect, vi, beforeEach } from "vitest";
import { HistoryController } from "../src/controllers/history.controller.js";
import { Store } from "../src/store.js";
import { Toast } from "../src/toast.js";
import { Dialog } from "../src/dialog.js";
import { Utils } from "../src/utils.ts";
import * as csvExport from "../src/export/csv.js";
import * as pdfExport from "../src/export/pdf.js";
import historyViewHtml from "../src/views/history.js";

/**
 * Monta el DOM real de la vista "Historial y Plan" (src/views/history.js) y
 * devuelve las referencias a los elementos requeridos por HistoryController.
 */
function mountHistoryDOM() {
  document.body.innerHTML = historyViewHtml;
  return {
    // Historial
    exportHistorialBtn: document.getElementById("exportHistorialBtn"),
    exportHistorialPdfBtn: document.getElementById("exportHistorialPdfBtn"),
    clearHistorialBtn: document.getElementById("clearHistorialBtn"),
    historialContainer: document.getElementById("historialContainer"),

    // Periodización
    bloqueNombre: document.getElementById("bloqueNombre"),
    bloqueTipo: document.getElementById("bloqueTipo"),
    bloqueSemanas: document.getElementById("bloqueSemanas"),
    crearBloqueBtn: document.getElementById("crearBloqueBtn"),
    bloqueActualInfo: document.getElementById("bloqueActualInfo"),
    bloquePrescripcionInfo: document.getElementById("bloquePrescripcionInfo"),

    // Wellness
    wellnessSueno: document.getElementById("wellnessSueno"),
    wellnessEstres: document.getElementById("wellnessEstres"),
    wellnessDoms: document.getElementById("wellnessDoms"),
    wellnessMotivacion: document.getElementById("wellnessMotivacion"),
    registrarWellnessBtn: document.getElementById("registrarWellnessBtn"),
    wellnessEstado: document.getElementById("wellnessEstado"),

    // Salto CMJ
    saltoAltura: document.getElementById("saltoAltura"),
    registrarSaltoBtn: document.getElementById("registrarSaltoBtn"),
    saltosRecientes: document.getElementById("saltosRecientes"),
  };
}

function makeRutina(historial = []) {
  // _renderHistorial/_exportar* leen this.rutina.historial; _borrarHistorial
  // escribe this.rutina.data.historial. Usamos la MISMA referencia.
  return { historial, data: { historial } };
}

function makePeriodizacion(bloqueActual = null, prescripcion = null) {
  return {
    bloques: [],
    crearBloque: vi.fn(),
    getBloqueActual: vi.fn(() => bloqueActual),
    getSemanaActual: vi.fn(() => 2),
    getPrescripcionActual: vi.fn(() => prescripcion),
  };
}

function makePerfil({ wellness = [], saltos = [] } = {}) {
  return {
    data: { wellness, saltos },
    registrarWellness: vi.fn(),
    registrarSalto: vi.fn(),
  };
}

function sesionDeEjemplo(sobres = {}) {
  return {
    fecha: "2026-09-04",
    duracionMinutos: 60,
    volumenTotal: 5000,
    ejercicios: [{ nombre: "Press Banca", series: [{}, {}], rmEstimado: 120 }],
    ...sobres,
  };
}

function crearController(opts = {}) {
  const el = opts.el || mountHistoryDOM();
  return new HistoryController({
    el,
    rutina: opts.rutina || makeRutina([]),
    periodizacion: opts.periodizacion || makePeriodizacion(),
    perfil: opts.perfil || makePerfil(),
  });
}

describe("HistoryController", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Store.on: NOOP para no acumular listeners reactivos entre tests (Store es singleton).
    vi.spyOn(Store, "on").mockImplementation(() => () => {});
    vi.spyOn(Store, "emit").mockImplementation(() => {});
    vi.spyOn(Store, "guardar").mockImplementation(() => {});
    vi.spyOn(Toast, "mostrar").mockImplementation(() => {});
    vi.spyOn(Utils, "descargarArchivo").mockImplementation(() => {});
  });

  describe("_crearBloque", () => {
    it("crea un bloque de periodización con nombre/tipo/semanas válidos al hacer clic", () => {
      const el = mountHistoryDOM();
      const periodizacion = makePeriodizacion();
      crearController({ el, periodizacion });

      el.bloqueNombre.value = "Bloque fuerza otoño";
      el.bloqueTipo.value = "intensificacion";
      el.bloqueSemanas.value = "6";
      el.crearBloqueBtn.click();

      expect(periodizacion.crearBloque).toHaveBeenCalledWith({
        nombre: "Bloque fuerza otoño",
        tipo: "intensificacion",
        semanas: 6,
      });
      expect(Store.guardar).toHaveBeenCalled();
      expect(Store.emit).toHaveBeenCalledWith("blocks:updated");
      expect(Toast.mostrar).toHaveBeenCalledWith(
        "Bloque de periodización activado",
        "success"
      );
    });

    it("con campos vacíos usa los valores por defecto (nombre 'Bloque principal', semanas 4)", () => {
      const el = mountHistoryDOM();
      const periodizacion = makePeriodizacion();
      crearController({ el, periodizacion });

      el.bloqueNombre.value = "   ";
      el.bloqueSemanas.value = "";
      el.crearBloqueBtn.click();

      expect(periodizacion.crearBloque).toHaveBeenCalledWith({
        nombre: "Bloque principal",
        tipo: "acumulacion",
        semanas: 4,
      });
    });

    it("con semanas inválidas (0) cae al fallback de 4 semanas", () => {
      const el = mountHistoryDOM();
      const periodizacion = makePeriodizacion();
      crearController({ el, periodizacion });

      el.bloqueNombre.value = "Volumen";
      el.bloqueSemanas.value = "0";
      el.crearBloqueBtn.click();

      expect(periodizacion.crearBloque).toHaveBeenCalledWith({
        nombre: "Volumen",
        tipo: "acumulacion",
        semanas: 4,
      });
    });
  });

  describe("render() y renderers", () => {
    it("render() arma el HTML esperado de historial, periodización, wellness y saltos con datos de ejemplo", () => {
      const el = mountHistoryDOM();
      const sesion = sesionDeEjemplo({ fecha: "2026-09-04" });
      const bloque = {
        nombre: "Base Fuerza",
        tipo: "intensificacion",
        semanas: 4,
      };
      const prescripcion = {
        fase: "Sobrecarga",
        seriesRango: "4-5",
        repsRango: "8-12",
        pct1RM: "70-75%",
        rpeObjetivo: 7.5,
      };
      const periodizacion = makePeriodizacion(bloque, prescripcion);
      const perfil = makePerfil({
        wellness: [{ sueno: 5, estres: 2, doms: 1, motivacion: 5, energia: 5, fatiga: 1, alimentacion: 5, hidratacion: 5, fecha: "2026-09-04" }],
        saltos: [{ altura: 42.5, fecha: "2026-09-04" }],
      });

      crearController({ el, rutina: makeRutina([sesion]), periodizacion, perfil });

      // Historial
      const card = el.historialContainer.querySelector(".session-card");
      expect(card).toBeTruthy();
      expect(card.innerHTML).toContain("2026-09-04");
      expect(card.innerHTML).toContain("(60 min)");
      expect(card.innerHTML).toContain("5000kg");
      const li = card.querySelector(".session-details li");
      expect(li.textContent).toContain("Press Banca: 2 series (1RM est: 120.0kg)");

      // Periodización
      expect(el.bloqueActualInfo.textContent).toContain("Base Fuerza");
      expect(el.bloqueActualInfo.textContent).toContain("intensificacion");
      expect(el.bloqueActualInfo.textContent).toContain("Semana 2/4");
      expect(el.bloquePrescripcionInfo.textContent).toContain("Sobrecarga");
      expect(el.bloquePrescripcionInfo.textContent).toContain("4-5 series");
      expect(el.bloquePrescripcionInfo.textContent).toContain("RPE objetivo");
      expect(el.bloquePrescripcionInfo.textContent).toContain("7.5");

      // Wellness
      expect(el.wellnessEstado.innerHTML).toContain(
        "Óptimo para entrenar pesado"
      );
      expect(el.wellnessEstado.innerHTML).toContain("2026-09-04");

      // Saltos
      expect(el.saltosRecientes.textContent).toContain("42.5cm");
      expect(el.saltosRecientes.textContent).toContain("2026-09-04");
    });

    it("no rompe ni deja la pantalla en blanco sin datos (historial/bloque/wellness/saltos vacíos)", () => {
      const el = mountHistoryDOM();

      // rutina.historial indefinido => cae a [] gracias a `|| []`
      expect(() => crearController({ el, rutina: makeRutina(undefined) })).not.toThrow();

      expect(el.historialContainer.querySelector(".empty-message").textContent).toContain(
        "No hay sesiones guardadas"
      );
      expect(el.bloqueActualInfo.textContent).toBe(
        "No hay bloque activo de periodización."
      );
      expect(el.wellnessEstado.textContent).toBe("Sin registros de wellness hoy.");
      expect(el.saltosRecientes.textContent).toBe("Sin registros de salto CMJ.");
    });

    it("tolera historial con sesiones sin ejercicios (los omite del listado)", () => {
      const el = mountHistoryDOM();
      const sinEjercicios = { fecha: "2026-08-01", duracionMinutos: 40, ejercicios: [] };

      crearController({ el, rutina: makeRutina([sinEjercicios]) });

      const card = el.historialContainer.querySelector(".session-card");
      expect(card).toBeTruthy();
      expect(card.querySelector(".session-details").children.length).toBe(0);
    });
  });

  describe("_registrarWellness", () => {
    it("registra el wellness con los valores del formulario y dispara persistencia", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil();
      crearController({ el, perfil });

      el.wellnessSueno.value = "4";
      el.wellnessEstres.value = "2";
      el.wellnessDoms.value = "1";
      el.wellnessMotivacion.value = "5";
      el.registrarWellnessBtn.click();

      expect(perfil.registrarWellness).toHaveBeenCalledWith({
        sueno: 4,
        estres: 2,
        doms: 1,
        motivacion: 5,
      });
      expect(Store.guardar).toHaveBeenCalled();
      expect(Store.emit).toHaveBeenCalledWith("wellness:updated");
      expect(Toast.mostrar).toHaveBeenCalledWith(
        "Wellness de hoy registrado",
        "success"
      );
    });

    it("con inputs vacíos cae al fallback de 3 en cada métrica", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil();
      crearController({ el, perfil });

      el.wellnessSueno.value = "";
      el.wellnessDoms.value = "";
      el.registrarWellnessBtn.click();

      expect(perfil.registrarWellness).toHaveBeenCalledWith({
        sueno: 3,
        estres: 3,
        doms: 3,
        motivacion: 3,
      });
    });
  });

  describe("_registrarSalto", () => {
    it("registra una altura válida y dispara persistencia", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil();
      crearController({ el, perfil });

      el.saltoAltura.value = "35.5";
      el.registrarSaltoBtn.click();

      expect(perfil.registrarSalto).toHaveBeenCalledWith(35.5);
      expect(Store.guardar).toHaveBeenCalled();
      expect(Store.emit).toHaveBeenCalledWith("salto:updated");
      expect(Toast.mostrar).toHaveBeenCalledWith(
        "Salto CMJ registrado (35.5cm)",
        "success"
      );
    });

    it("rechaza una altura inválida (0/negativa) sin guardar", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil();
      crearController({ el, perfil });

      el.saltoAltura.value = "0";
      el.registrarSaltoBtn.click();

      expect(perfil.registrarSalto).not.toHaveBeenCalled();
      expect(Store.guardar).not.toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith(
        "Ingresa una altura de salto válida en cm",
        "warning"
      );
    });
  });

  describe("_exportarHistorialCSV", () => {
    it("avisa si no hay sesiones para exportar", () => {
      const el = mountHistoryDOM();
      crearController({ el, rutina: makeRutina([]) });

      el.exportHistorialBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith(
        "No hay sesiones para exportar",
        "warning"
      );
      expect(Utils.descargarArchivo).not.toHaveBeenCalled();
    });

    it("descarga el CSV con los datos del historial", () => {
      const el = mountHistoryDOM();
      const historial = [sesionDeEjemplo()];
      crearController({ el, rutina: makeRutina(historial) });

      vi.spyOn(csvExport, "seriesHistorialACSV").mockReturnValue("csv_data");
      el.exportHistorialBtn.click();

      expect(csvExport.seriesHistorialACSV).toHaveBeenCalledWith(historial);
      expect(Utils.descargarArchivo).toHaveBeenCalledWith(
        "gympro_series.csv",
        "csv_data",
        "text/csv"
      );
      expect(Toast.mostrar).toHaveBeenCalledWith(
        "Historial exportado en CSV",
        "success"
      );
    });
  });

  describe("_exportarHistorialPDF", () => {
    it("avisa si no hay series para imprimir", () => {
      const el = mountHistoryDOM();
      const historial = [{ fecha: "2026-09-04", ejercicios: [{ series: [] }] }];
      crearController({ el, rutina: makeRutina(historial) });

      el.exportHistorialPdfBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith(
        "No hay series para imprimir",
        "warning"
      );
    });

    it("abre la vista imprimible y muestra feedback info cuando hay series", () => {
      const el = mountHistoryDOM();
      const historial = [sesionDeEjemplo()];
      crearController({ el, rutina: makeRutina(historial) });

      vi.spyOn(pdfExport, "imprimirHistorial").mockReturnValue(true);
      el.exportHistorialPdfBtn.click();

      expect(pdfExport.imprimirHistorial).toHaveBeenCalledWith(
        historial,
        "Historial de series"
      );
      expect(Toast.mostrar).toHaveBeenCalledWith(
        "Vista imprimible abierta: guarda como PDF",
        "info"
      );
    });

    it("advierte si el navegador bloqueó la ventana de impresión", () => {
      const el = mountHistoryDOM();
      crearController({ el, rutina: makeRutina([sesionDeEjemplo()]) });

      vi.spyOn(pdfExport, "imprimirHistorial").mockReturnValue(false);
      el.exportHistorialPdfBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith(
        "El navegador bloqueó la ventana de impresión",
        "warning"
      );
    });
  });

  describe("_bindEvents y acciones sobre el DOM", () => {
    it("borra el historial tras confirmar en el diálogo", async () => {
      const el = mountHistoryDOM();
      const rutina = makeRutina([sesionDeEjemplo()]);
      crearController({ el, rutina });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(true);
      el.clearHistorialBtn.click();
      await new Promise((r) => setTimeout(r, 0));

      expect(rutina.data.historial).toEqual([]);
      expect(Store.guardar).toHaveBeenCalled();
      expect(Store.emit).toHaveBeenCalledWith("session:completed");
      expect(Toast.mostrar).toHaveBeenCalledWith("Historial borrado", "info");
    });

    it("no borra el historial si el usuario cancela", async () => {
      const el = mountHistoryDOM();
      const sesion = sesionDeEjemplo();
      const rutina = makeRutina([sesion]);
      crearController({ el, rutina });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(false);
      el.clearHistorialBtn.click();
      await new Promise((r) => setTimeout(r, 0));

      expect(rutina.data.historial).toEqual([sesion]);
      expect(Store.guardar).not.toHaveBeenCalled();
    });
  });

  describe("actualizarInstancias", () => {
    it("actualiza las dependencias recibidas y re-renderiza", () => {
      const el = mountHistoryDOM();
      const inicial = makePerfil();
      const controller = crearController({ el, perfil: inicial });

      const nuevoPerfil = makePerfil({
        saltos: [{ altura: 30, fecha: "2026-01-01" }],
      });
      controller.actualizarInstancias({ perfil: nuevoPerfil });

      expect(controller.perfil).toBe(nuevoPerfil);
      expect(el.saltosRecientes.textContent).toContain("30cm");
    });

    it("deja intactas las dependencias no provistas", () => {
      const el = mountHistoryDOM();
      const rutina = makeRutina([sesionDeEjemplo()]);
      const perfil = makePerfil();
      const controller = crearController({ el, rutina, perfil });

      const nuevoPeriodizacion = makePeriodizacion();
      controller.actualizarInstancias({ periodizacion: nuevoPeriodizacion });

      expect(controller.periodizacion).toBe(nuevoPeriodizacion);
      expect(controller.rutina).toBe(rutina);
      expect(controller.perfil).toBe(perfil);
      expect(controller.el).toBe(el);
    });
  });

  describe("_renderWellness · badge de estado con 8 métricas (wellnessScore)", () => {
    it("todo bien en las 8 métricas → 'Óptimo para entrenar pesado'", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil({
        wellness: [{ fecha: "2026-09-04", sueno: 5, motivacion: 5, estres: 1, doms: 1, energia: 5, fatiga: 1, alimentacion: 5, hidratacion: 5 }],
      });
      const controller = crearController({ el, perfil });
      controller._renderWellness();
      expect(el.wellnessEstado.textContent).toContain("Óptimo para entrenar pesado");
    });

    it("todo mal en las 8 métricas → 'Fatiga alta'", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil({
        wellness: [{ fecha: "2026-09-04", sueno: 1, motivacion: 1, estres: 5, doms: 5, energia: 1, fatiga: 5, alimentacion: 1, hidratacion: 1 }],
      });
      const controller = crearController({ el, perfil });
      controller._renderWellness();
      expect(el.wellnessEstado.textContent).toContain("Fatiga alta (considerar deload/descanso)");
    });

    it("mixto: bien en las viejas, mal en las nuevas → 'Moderado' en vez del falso 'Óptimo'", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil({
        wellness: [{ fecha: "2026-09-04", sueno: 5, motivacion: 5, estres: 1, doms: 1, energia: 1, fatiga: 5, alimentacion: 1, hidratacion: 1 }],
      });
      const controller = crearController({ el, perfil });
      controller._renderWellness();
      expect(el.wellnessEstado.textContent).toContain("Moderado (ajustar RPE)");
    });

    it("registro viejo sin campos nuevos (NEUTRAL=3) no rompe ni da NaN", () => {
      const el = mountHistoryDOM();
      const perfil = makePerfil({ wellness: [{ fecha: "2026-09-04", sueno: 3, estres: 3, doms: 3, motivacion: 3 }] });
      const controller = crearController({ el, perfil });
      expect(() => controller._renderWellness()).not.toThrow();
      expect(el.wellnessEstado.textContent).toContain("Moderado (ajustar RPE)"); // 3.0 → total 12
    });
  });
});