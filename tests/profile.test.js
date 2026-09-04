import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileController } from "../src/controllers/profile.controller.js";
import { Store } from "../src/store.js";
import { Toast } from "../src/toast.js";
import { Dialog } from "../src/dialog.js";
import { Utils } from "../src/utils.js";
import * as csvExport from "../src/export/csv.js";
import * as pdfExport from "../src/export/pdf.js";
import profileViewHtml from "../src/views/profile.js";
import progressViewHtml from "../src/views/progress.js";

function mountProfileDOM() {
  document.body.innerHTML = profileViewHtml + progressViewHtml;
  return {
    // Perfil
    perfilEdad: document.getElementById("perfilEdad"),
    perfilGrasa: document.getElementById("perfilGrasa"),
    perfilObjetivo: document.getElementById("perfilObjetivo"),
    perfilNivel: document.getElementById("perfilNivel"),
    guardarPerfilBtn: document.getElementById("guardarPerfilBtn"),

    // Medidas
    pechoCm: document.getElementById("pechoCm"),
    cinturaCm: document.getElementById("cinturaCm"),
    caderaCm: document.getElementById("caderaCm"),
    pesoCorporalKg: document.getElementById("pesoCorporalKg"),
    alturaCm: document.getElementById("alturaCm"),
    guardarMedidasBtn: document.getElementById("guardarMedidasBtn"),
    calcularIMCBtn: document.getElementById("calcularIMCBtn"),
    imcValor: document.getElementById("imcValor"),
    estadoIMC: document.getElementById("estadoIMC"),

    // Métricas de sesión / progreso acumulado (de progress.js o inputs de cálculo)
    pesoKg: { value: "70" },
    tiempoMin: { value: "45" },
    kcalDisplay: document.createElement("span"),
    fuerzaDisplay: document.createElement("span"),
    volumenTotalDisplay: document.createElement("span"),
    calcularBtn: document.createElement("button"),
    resetProgresoBtn: document.getElementById("resetProgresoBtn"),
    kcalAcumuladas: document.getElementById("kcalAcumuladas"),
    fuerzaAcumulada: document.getElementById("fuerzaAcumulada"),
    volumenAcumulado: document.getElementById("volumenAcumulado"),

    // Backup
    exportTodoBtn: document.getElementById("exportTodoBtn"),
    importTodoInput: document.getElementById("importTodoInput"),

    // Exportación series
    exportarSeriesBtn: document.getElementById("exportarSeriesBtn"),
    printSeriesBtn: document.getElementById("printSeriesBtn"),
  };
}

function makePerfil() {
  return {
    data: {
      nombre: "Franco",
      perfil: { edad: 26, grasa: 14, objetivo: "hipertrofia", nivel: "intermedio" },
      medidas: { pecho: 100, cintura: 80, cadera: 95, pesoCorporal: 75, altura: 180 },
      acumulados: { fuerza: 500, kcal: 1200, volumen: 15000 },
    },
    guardar: vi.fn(function (p) {
      this.data.perfil = { ...this.data.perfil, ...p };
    }),
  };
}

function makeRutina(historial = []) {
  return {
    historial,
    rutina: ["press_banca", "sentadilla"],
    calcularVolumen: vi.fn((id) => (id === "press_banca" ? 1000 : 2000)),
  };
}

describe("ProfileController", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Toast, "mostrar").mockImplementation(() => {});
    vi.spyOn(Store, "guardar").mockImplementation(() => {});
    vi.spyOn(Utils, "descargarArchivo").mockImplementation(() => {});
  });

  describe("Carga y Render", () => {
    it("carga valores de perfil, medidas y acumulados en el DOM al inicializarse", () => {
      const el = mountProfileDOM();
      const perfil = makePerfil();
      const rutina = makeRutina();

      new ProfileController({ app: {}, el, perfil, rutina });

      expect(el.perfilEdad.value).toBe("26");
      expect(el.perfilGrasa.value).toBe("14");
      expect(el.perfilObjetivo.value).toBe("hipertrofia");
      expect(el.perfilNivel.value).toBe("intermedio");

      expect(el.pechoCm.value).toBe("100");
      expect(el.cinturaCm.value).toBe("80");
      expect(el.caderaCm.value).toBe("95");
      expect(el.pesoCorporalKg.value).toBe("75");
      expect(el.alturaCm.value).toBe("180");

      expect(el.kcalAcumuladas.textContent).toBe("1200");
      expect(el.fuerzaAcumulada.textContent).toBe("500");
      expect(el.volumenAcumulado.textContent).toBe("15000kg");
    });

    it("soporta datos vacíos o por defecto en perfil y medidas", () => {
      const el = mountProfileDOM();
      const perfilVacio = { data: {} };
      const rutina = makeRutina();

      new ProfileController({ app: {}, el, perfil: perfilVacio, rutina });

      expect(el.perfilEdad.value).toBe("25");
      expect(el.pesoCorporalKg.value).toBe("72.5");
      expect(el.alturaCm.value).toBe("175");
      expect(el.kcalAcumuladas.textContent).toBe("0");
    });

    it("actualizarInstancias actualiza las referencias y ejecuta render()", () => {
      const el = mountProfileDOM();
      const perfil1 = makePerfil();
      const controller = new ProfileController({ app: {}, el, perfil: perfil1, rutina: makeRutina() });

      const perfil2 = {
        data: {
          perfil: { edad: 35, grasa: 18, objetivo: "fuerza", nivel: "avanzado" },
          medidas: { pecho: 110, cintura: 85, cadera: 100, pesoCorporal: 85, altura: 185 },
          acumulados: { fuerza: 800, kcal: 3000, volumen: 25000 },
        },
      };

      controller.actualizarInstancias({ perfil: perfil2 });

      expect(el.perfilEdad.value).toBe("35");
      expect(el.pesoCorporalKg.value).toBe("85");
      expect(el.volumenAcumulado.textContent).toBe("25000kg");
    });
  });

  describe("Interacción Guardar Perfil y Medidas", () => {
    it("guarda el perfil al hacer clic en guardarPerfilBtn", () => {
      const el = mountProfileDOM();
      const perfil = makePerfil();
      new ProfileController({ app: {}, el, perfil, rutina: makeRutina() });

      el.perfilEdad.value = "30";
      el.perfilGrasa.value = "12.5";
      el.perfilObjetivo.value = "power";
      el.perfilNivel.value = "avanzado";

      el.guardarPerfilBtn.click();

      expect(perfil.guardar).toHaveBeenCalledWith({
        edad: 30,
        grasa: 12.5,
        objetivo: "power",
        nivel: "avanzado",
      });
      expect(Store.guardar).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith("Perfil actualizado", "success");
    });

    it("guarda medidas corporales al hacer clic en guardarMedidasBtn", () => {
      const el = mountProfileDOM();
      const perfil = makePerfil();
      new ProfileController({ app: {}, el, perfil, rutina: makeRutina() });

      el.pechoCm.value = "105";
      el.cinturaCm.value = "82";
      el.caderaCm.value = "98";
      el.pesoCorporalKg.value = "78";
      el.alturaCm.value = "182";

      el.guardarMedidasBtn.click();

      expect(perfil.data.medidas).toEqual({
        pecho: 105,
        cintura: 82,
        cadera: 98,
        pesoCorporal: 78,
        altura: 182,
      });
      expect(Store.guardar).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith("Medidas guardadas", "success");
    });
  });

  describe("Cálculo de IMC", () => {
    it("calcula correctamente el IMC y clasifica (Normal)", () => {
      const el = mountProfileDOM();
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina() });

      el.pesoCorporalKg.value = "70";
      el.alturaCm.value = "175"; // 70 / (1.75 * 1.75) = 22.86 -> 22.9

      el.calcularIMCBtn.click();

      expect(el.imcValor.textContent).toBe("22.9");
      expect(el.estadoIMC.textContent).toBe("Normal");
    });

    it("clasifica Bajo peso, Sobrepeso y Obesidad", () => {
      const el = mountProfileDOM();
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina() });

      // Bajo peso: imc < 18.5
      el.pesoCorporalKg.value = "50";
      el.alturaCm.value = "180"; // 50 / 3.24 = 15.4
      el.calcularIMCBtn.click();
      expect(el.estadoIMC.textContent).toBe("Bajo peso");

      // Sobrepeso: 25 <= imc < 30
      el.pesoCorporalKg.value = "85";
      el.alturaCm.value = "175"; // 85 / 3.0625 = 27.7
      el.calcularIMCBtn.click();
      expect(el.estadoIMC.textContent).toBe("Sobrepeso");

      // Obesidad: imc >= 30
      el.pesoCorporalKg.value = "105";
      el.alturaCm.value = "175"; // 105 / 3.0625 = 34.3
      el.calcularIMCBtn.click();
      expect(el.estadoIMC.textContent).toBe("Obesidad");
    });

    it("alerta si los campos de peso o altura son inválidos o cero", () => {
      const el = mountProfileDOM();
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina() });

      el.pesoCorporalKg.value = "0";
      el.alturaCm.value = "175";
      el.calcularIMCBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith("Ingresa peso y altura válidos", "warning");
    });
  });

  describe("Cálculo y Acumulación de Métricas", () => {
    it("calcula métricas de la sesión y las suma a los acumulados", () => {
      const el = mountProfileDOM();
      const perfil = makePerfil();
      const rutina = makeRutina();
      new ProfileController({ app: {}, el, perfil, rutina });

      el.pesoKg.value = "80";
      el.tiempoMin.value = "60";

      // kcalSesion = Math.round((6.0 * 3.5 * 80 / 200) * 60) = 504
      // volumenTotal = 1000 + 2000 = 3000
      // indiceFuerza = Math.round(3000 / 80) = 38
      el.calcularBtn.click();

      expect(el.kcalDisplay.textContent).toBe("504");
      expect(el.fuerzaDisplay.textContent).toBe("38");
      expect(el.volumenTotalDisplay.textContent).toBe("3000kg");

      expect(perfil.data.acumulados.kcal).toBe(1200 + 504);
      expect(perfil.data.acumulados.fuerza).toBe(500 + 38);
      expect(perfil.data.acumulados.volumen).toBe(15000 + 3000);
      expect(Store.guardar).toHaveBeenCalled();
    });

    it("resetea el progreso acumulado tras confirmación del Dialog", async () => {
      const el = mountProfileDOM();
      const perfil = makePerfil();
      new ProfileController({ app: {}, el, perfil, rutina: makeRutina() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(true);

      await el.resetProgresoBtn.click();

      expect(Dialog.confirm).toHaveBeenCalledWith("¿Reiniciar todo el progreso acumulado?", { peligroso: true });
      expect(perfil.data.acumulados).toEqual({ fuerza: 0, kcal: 0, volumen: 0 });
      expect(Store.guardar).toHaveBeenCalled();
      expect(el.kcalAcumuladas.textContent).toBe("0");
    });

    it("no resetea el progreso acumulado si el usuario cancela el Dialog", async () => {
      const el = mountProfileDOM();
      const perfil = makePerfil();
      new ProfileController({ app: {}, el, perfil, rutina: makeRutina() });

      vi.spyOn(Dialog, "confirm").mockResolvedValue(false);

      await el.resetProgresoBtn.click();

      expect(perfil.data.acumulados.kcal).toBe(1200);
    });
  });

  describe("Backup y Exportaciones", () => {
    it("exporta backup completo descargando el json de Store", () => {
      const el = mountProfileDOM();
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina() });

      vi.spyOn(Store, "exportarTodo").mockReturnValue('{"backup": true}');

      el.exportTodoBtn.click();

      expect(Store.exportarTodo).toHaveBeenCalled();
      expect(Utils.descargarArchivo).toHaveBeenCalledWith("gympro_backup_completo.json", '{"backup": true}');
      expect(Toast.mostrar).toHaveBeenCalledWith("Backup descargado con éxito", "success");
    });

    it("importa backup restaurando el Store y notificando al app", async () => {
      const el = mountProfileDOM();
      const app = { actualizarPerfilActual: vi.fn() };
      new ProfileController({ app, el, perfil: makePerfil(), rutina: makeRutina() });

      vi.spyOn(Store, "importarTodo").mockImplementation(() => {});

      const fakeFile = { text: vi.fn().mockResolvedValue('{"restored": true}') };
      const event = { target: { files: [fakeFile] } };

      // Caso sin archivo
      await el.importTodoInput.dispatchEvent(new Event("change"));

      // Caso con archivo a través del handler del input
      const changeHandler = vi.spyOn(el.importTodoInput, "addEventListener");
      const controller = new ProfileController({ app, el, perfil: makePerfil(), rutina: makeRutina() });
      await controller._importarBackup(event);

      expect(Store.importarTodo).toHaveBeenCalledWith('{"restored": true}');
      expect(app.actualizarPerfilActual).toHaveBeenCalled();
      expect(Toast.mostrar).toHaveBeenCalledWith("Backup restaurado con éxito", "success");
    });

    it("importa backup disparando Store profile:changed si app.actualizarPerfilActual no existe", async () => {
      const el = mountProfileDOM();
      const controller = new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina() });

      vi.spyOn(Store, "importarTodo").mockImplementation(() => {});
      const emitSpy = vi.spyOn(Store, "emit");

      const fakeFile = { text: vi.fn().mockResolvedValue('{"restored": true}') };
      await controller._importarBackup({ target: { files: [fakeFile] } });

      expect(emitSpy).toHaveBeenCalledWith("profile:changed");
    });

    it("maneja error en importación si el archivo es inválido", async () => {
      const el = mountProfileDOM();
      const controller = new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina() });

      vi.spyOn(Store, "importarTodo").mockImplementation(() => {
        throw new Error("JSON corrupto");
      });

      const fakeFile = { text: vi.fn().mockResolvedValue('corrupt') };
      await controller._importarBackup({ target: { files: [fakeFile] } });

      expect(Toast.mostrar).toHaveBeenCalledWith("JSON corrupto", "error");
    });

    it("exportarSeriesCSV avisa si no hay series en el historial", () => {
      const el = mountProfileDOM();
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina([]) });

      el.exportarSeriesBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith("No hay series para exportar", "warning");
      expect(Utils.descargarArchivo).not.toHaveBeenCalled();
    });

    it("exportarSeriesCSV descarga CSV si hay series", () => {
      const el = mountProfileDOM();
      const historial = [{ fechaISO: "2026-09-04", ejercicios: [] }];
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina(historial) });

      vi.spyOn(csvExport, "seriesHistorialACSV").mockReturnValue("csv_data");

      el.exportarSeriesBtn.click();

      expect(Utils.descargarArchivo).toHaveBeenCalledWith("gympro_series.csv", "csv_data", "text/csv");
      expect(Toast.mostrar).toHaveBeenCalledWith("Historial de series exportado en CSV", "success");
    });

    it("exportarSeriesPDF avisa si no hay series para imprimir", () => {
      const el = mountProfileDOM();
      const historial = [{ fechaISO: "2026-09-04", ejercicios: [{ series: [] }] }];
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina(historial) });

      el.printSeriesBtn.click();

      expect(Toast.mostrar).toHaveBeenCalledWith("No hay series para imprimir", "warning");
    });

    it("exportarSeriesPDF invoca imprimirHistorial y muestra feedback", () => {
      const el = mountProfileDOM();
      const historial = [
        {
          fechaISO: "2026-09-04",
          ejercicios: [{ series: [{ reps: 10, peso: 50 }] }],
        },
      ];
      new ProfileController({ app: {}, el, perfil: makePerfil(), rutina: makeRutina(historial) });

      vi.spyOn(pdfExport, "imprimirHistorial").mockReturnValue(true);

      el.printSeriesBtn.click();

      expect(pdfExport.imprimirHistorial).toHaveBeenCalledWith(historial, "Historial de series — Franco");
      expect(Toast.mostrar).toHaveBeenCalledWith("Vista imprimible abierta: guarda como PDF", "info");
    });
  });
});
