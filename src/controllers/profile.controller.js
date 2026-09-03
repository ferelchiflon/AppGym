/**
 * src/controllers/profile.controller.js
 * Controlador de la vista "Atleta y Ajustes".
 * Maneja perfil del atleta, medidas corporales, IMC, métricas acumuladas y centro de backup.
 */

import { Store } from "../store.js";
import { Utils } from "../utils.js";
import { Toast } from "../toast.js";
import { Dialog } from "../dialog.js";
import { seriesHistorialACSV } from "../export/csv.js";
import { imprimirHistorial } from "../export/pdf.js";

export class ProfileController {
  constructor({ app, el, perfil, rutina }) {
    this.app = app;
    this.el = el;
    this.perfil = perfil;
    this.rutina = rutina;

    this._bindEvents();
    this.render();
  }

  actualizarInstancias({ perfil, rutina }) {
    if (perfil) this.perfil = perfil;
    if (rutina) this.rutina = rutina;
    this.render();
  }

  _bindEvents() {
    // Guardar perfil
    this.el.guardarPerfilBtn.addEventListener("click", () => this._guardarPerfil());

    // Medidas corporales & IMC
    this.el.guardarMedidasBtn.addEventListener("click", () => this._guardarMedidas());
    this.el.calcularIMCBtn.addEventListener("click", () => this._calcularIMC());

    // Métricas de sesión y acumular
    this.el.calcularBtn.addEventListener("click", () => this._calcularYAcumularMetricas());
    this.el.resetProgresoBtn.addEventListener("click", () => this._resetProgresoAcumulado());

    // Backup
    this.el.exportTodoBtn.addEventListener("click", () => this._exportarBackup());
    this.el.importTodoInput.addEventListener("change", (e) => this._importarBackup(e));

    // Exportar historial de series (CSV / PDF)
    this.el.exportarSeriesBtn.addEventListener("click", () => this._exportarSeriesCSV());
    this.el.printSeriesBtn.addEventListener("click", () => this._exportarSeriesPDF());
  }

  render() {
    this._cargarPerfil();
    this._cargarMedidas();
    this._actualizarMetricasUI();
  }

  _cargarPerfil() {
    const p = this.perfil.data.perfil || {};
    if (this.el.perfilEdad) this.el.perfilEdad.value = p.edad || 25;
    if (this.el.perfilGrasa) this.el.perfilGrasa.value = p.grasa || "";
    if (this.el.perfilObjetivo) this.el.perfilObjetivo.value = p.objetivo || "hipertrofia";
    if (this.el.perfilNivel) this.el.perfilNivel.value = p.nivel || "intermedio";
  }

  _guardarPerfil() {
    const edad = parseInt(this.el.perfilEdad.value, 10) || 25;
    const grasa = parseFloat(this.el.perfilGrasa.value) || null;
    const objetivo = this.el.perfilObjetivo.value;
    const nivel = this.el.perfilNivel.value;

    this.perfil.guardar({ edad, grasa, objetivo, nivel });
    Store.guardar();
    Toast.mostrar("Perfil actualizado", "success");
  }

  _cargarMedidas() {
    const m = this.perfil.data.medidas || {};
    if (this.el.pechoCm) this.el.pechoCm.value = m.pecho || "";
    if (this.el.cinturaCm) this.el.cinturaCm.value = m.cintura || "";
    if (this.el.caderaCm) this.el.caderaCm.value = m.cadera || "";
    if (this.el.pesoCorporalKg) this.el.pesoCorporalKg.value = m.pesoCorporal || 72.5;
    if (this.el.alturaCm) this.el.alturaCm.value = m.altura || 175;
  }

  _guardarMedidas() {
    const pecho = parseFloat(this.el.pechoCm.value) || 0;
    const cintura = parseFloat(this.el.cinturaCm.value) || 0;
    const cadera = parseFloat(this.el.caderaCm.value) || 0;
    const pesoCorporal = parseFloat(this.el.pesoCorporalKg.value) || 72.5;
    const altura = parseFloat(this.el.alturaCm.value) || 175;

    this.perfil.data.medidas = { pecho, cintura, cadera, pesoCorporal, altura };
    Store.guardar();
    Toast.mostrar("Medidas guardadas", "success");
  }

  _calcularIMC() {
    const peso = parseFloat(this.el.pesoCorporalKg.value);
    const alturaCm = parseFloat(this.el.alturaCm.value);
    if (!peso || !alturaCm) {
      Toast.mostrar("Ingresa peso y altura válidos", "warning");
      return;
    }

    const alturaM = alturaCm / 100;
    const imc = peso / (alturaM * alturaM);
    this.el.imcValor.textContent = imc.toFixed(1);

    let estado = "Normal";
    if (imc < 18.5) estado = "Bajo peso";
    else if (imc >= 25 && imc < 30) estado = "Sobrepeso";
    else if (imc >= 30) estado = "Obesidad";

    this.el.estadoIMC.textContent = estado;
  }

  _calcularYAcumularMetricas() {
    const peso = parseFloat(this.el.pesoKg.value) || 72.5;
    const tiempoMin = parseInt(this.el.tiempoMin.value, 10) || 30;

    // Cálculo aproximado de kcal quemadas en entrenamiento de fuerza (MET ~ 6.0)
    const kcalSesion = Math.round((6.0 * 3.5 * peso / 200) * tiempoMin);
    const volumenTotal = this.rutina.rutina.reduce((t, id) => t + this.rutina.calcularVolumen(id), 0);
    const indiceFuerza = Math.round(volumenTotal / (peso || 1));

    this.el.kcalDisplay.textContent = kcalSesion;
    this.el.fuerzaDisplay.textContent = indiceFuerza;
    this.el.volumenTotalDisplay.textContent = volumenTotal + "kg";

    const acum = this.perfil.data.acumulados || { fuerza: 0, kcal: 0, volumen: 0 };
    acum.kcal += kcalSesion;
    acum.fuerza += indiceFuerza;
    acum.volumen += volumenTotal;

    this.perfil.data.acumulados = acum;
    Store.guardar();

    this._actualizarMetricasUI();
    Toast.mostrar("Métricas calculadas y acumuladas", "success");
  }

  _actualizarMetricasUI() {
    const acum = this.perfil.data.acumulados || { fuerza: 0, kcal: 0, volumen: 0 };
    if (this.el.kcalAcumuladas) this.el.kcalAcumuladas.textContent = acum.kcal || 0;
    if (this.el.fuerzaAcumulada) this.el.fuerzaAcumulada.textContent = acum.fuerza || 0;
    if (this.el.volumenAcumulado) this.el.volumenAcumulado.textContent = (acum.volumen || 0) + "kg";
  }

  async _resetProgresoAcumulado() {
    const ok = await Dialog.confirm("¿Reiniciar todo el progreso acumulado?", { peligroso: true });
    if (ok) {
      this.perfil.data.acumulados = { fuerza: 0, kcal: 0, volumen: 0 };
      Store.guardar();
      this._actualizarMetricasUI();
      Toast.mostrar("Progreso acumulado reiniciado", "info");
    }
  }

  _exportarBackup() {
    const json = Store.exportarTodo();
    Utils.descargarArchivo("gympro_backup_completo.json", json);
    Toast.mostrar("Backup descargado con éxito", "success");
  }

  _exportarSeriesCSV() {
    const historial = this.rutina.historial || [];
    if (historial.length === 0) {
      Toast.mostrar("No hay series para exportar", "warning");
      return;
    }
    const csv = seriesHistorialACSV(historial);
    Utils.descargarArchivo("gympro_series.csv", csv, "text/csv");
    Toast.mostrar("Historial de series exportado en CSV", "success");
  }

  _exportarSeriesPDF() {
    const historial = this.rutina.historial || [];
    const haySeries = historial.some((sesion) =>
      (sesion.ejercicios || []).some((e) => (e.series || []).length > 0)
    );
    if (!haySeries) {
      Toast.mostrar("No hay series para imprimir", "warning");
      return;
    }
    const nombre = (this.perfil && this.perfil.data && this.perfil.data.nombre) || "Atleta";
    const abierta = imprimirHistorial(historial, "Historial de series — " + nombre);
    Toast.mostrar(
      abierta ? "Vista imprimible abierta: guarda como PDF" : "El navegador bloqueó la ventana de impresión",
      abierta ? "info" : "warning"
    );
  }

  async _importarBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      Store.importarTodo(text);
      Toast.mostrar("Backup restaurado con éxito", "success");
      if (this.app && typeof this.app.actualizarPerfilActual === "function") {
        this.app.actualizarPerfilActual();
      } else {
        Store.emit("profile:changed");
      }
    } catch (err) {
      Toast.mostrar(err.message || "Error al importar el archivo", "error");
    }
  }
}
