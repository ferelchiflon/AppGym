/**
 * src/controllers/history.controller.js
 * Controlador de la vista "Historial y Plan".
 * Maneja historial de sesiones, periodización por bloques, wellness diario y test CMJ.
 */

import { Store } from "../store.js";
import { Utils } from "../utils.js";
import { Toast } from "../toast.js";
import { Dialog } from "../dialog.js";
import { seriesHistorialACSV } from "../export/csv.js";
import { imprimirHistorial } from "../export/pdf.js";

export class HistoryController {
  constructor({ el, rutina, periodizacion, perfil }) {
    this.el = el;
    this.rutina = rutina;
    this.periodizacion = periodizacion;
    this.perfil = perfil;

    this._bindEvents();
    this._subscribeStore();
    this.render();
  }

  actualizarInstancias({ rutina, periodizacion, perfil }) {
    if (rutina) this.rutina = rutina;
    if (periodizacion) this.periodizacion = periodizacion;
    if (perfil) this.perfil = perfil;
    this.render();
  }

  _bindEvents() {
    // Exportar y borrar historial
    this.el.exportHistorialBtn.addEventListener("click", () => this._exportarHistorialCSV());
    this.el.exportHistorialPdfBtn.addEventListener("click", () => this._exportarHistorialPDF());
    this.el.clearHistorialBtn.addEventListener("click", () => this._borrarHistorial());

    // Periodización
    this.el.crearBloqueBtn.addEventListener("click", () => this._crearBloque());

    // Wellness
    this.el.registrarWellnessBtn.addEventListener("click", () => this._registrarWellness());

    // Salto CMJ
    this.el.registrarSaltoBtn.addEventListener("click", () => this._registrarSalto());
  }

  _subscribeStore() {
    Store.on("session:completed", () => {
      this._renderHistorial();
    });

    Store.on("wellness:updated", () => {
      this._renderWellness();
    });

    Store.on("salto:updated", () => {
      this._renderSaltos();
    });

    Store.on("blocks:updated", () => {
      this._renderPeriodizacion();
    });
  }

  render() {
    this._renderHistorial();
    this._renderPeriodizacion();
    this._renderWellness();
    this._renderSaltos();
  }

  _renderHistorial() {
    const container = this.el.historialContainer;
    container.replaceChildren();

    const historial = this.rutina.historial || [];
    if (historial.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "No hay sesiones guardadas en el historial todavía.";
      container.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    historial.slice().reverse().forEach((sesion) => {
      const card = document.createElement("div");
      card.className = "badge session-card";

      const header = document.createElement("div");
      header.className = "session-header";
      header.innerHTML = "<strong>" + (sesion.fecha || "Sesión") + "</strong> (" + (sesion.duracionMinutos || 45) + " min) — Vol: <strong>" + (sesion.volumenTotal || 0) + "kg</strong>";

      const list = document.createElement("ul");
      list.className = "session-details";

      if (Array.isArray(sesion.ejercicios)) {
        sesion.ejercicios.forEach((e) => {
          const li = document.createElement("li");
          li.textContent = e.nombre + ": " + (e.series ? e.series.length : 0) + " series (1RM est: " + (e.rmEstimado ? e.rmEstimado.toFixed(1) : "--") + "kg)";
          list.appendChild(li);
        });
      }

      card.append(header, list);
      frag.appendChild(card);
    });

    container.appendChild(frag);
  }

  _renderPeriodizacion() {
    const info = this.el.bloqueActualInfo;
    const prescripcionContainer = this.el.bloquePrescripcionInfo;
    info.replaceChildren();
    if (prescripcionContainer) prescripcionContainer.replaceChildren();

    const bloque = this.periodizacion.getBloqueActual();
    if (!bloque) {
      info.textContent = "No hay bloque activo de periodización.";
      return;
    }

    const semanaActual = this.periodizacion.getSemanaActual(bloque);
    const totalSemanas = bloque.semanas || bloque.duracionSemanas || 4;

    const box = document.createElement("div");
    box.className = "stats-grid";
    box.innerHTML =
      '<div class="stat-box"><div class="number">' + bloque.nombre + '</div><div class="label">Bloque</div></div>' +
      '<div class="stat-box"><div class="number">' + bloque.tipo + '</div><div class="label">Tipo</div></div>' +
      '<div class="stat-box"><div class="number">Semana ' + semanaActual + '/' + totalSemanas + '</div><div class="label">Microciclo</div></div>';

    info.appendChild(box);

    const prescripcion = this.periodizacion.getPrescripcionActual();
    if (prescripcion && prescripcionContainer) {
      const prescBox = document.createElement("div");
      prescBox.className = "autoreg-box mt-1";
      prescBox.innerHTML = `
        <strong>🎯 Prescripción Semanal (${prescripcion.fase}):</strong><br>
        • Series por ejercicio: <strong>${prescripcion.seriesRango} series</strong><br>
        • Repeticiones objetivo: <strong>${prescripcion.repsRango} reps</strong><br>
        • Carga sugerida: <strong>${prescripcion.pct1RM} 1RM</strong> (RPE objetivo: <strong>${prescripcion.rpeObjetivo}</strong>)
      `;
      prescripcionContainer.appendChild(prescBox);
    }
  }

  _renderWellness() {
    const estadoDiv = this.el.wellnessEstado;
    estadoDiv.replaceChildren();

    const registros = this.perfil.data.wellness || [];
    if (registros.length === 0) {
      estadoDiv.textContent = "Sin registros de wellness hoy.";
      return;
    }

    const ultimo = registros[registros.length - 1];
    const total = (ultimo.sueno || 3) + (6 - (ultimo.estres || 3)) + (6 - (ultimo.doms || 3)) + (ultimo.motivacion || 3);
    const estado = total >= 16 ? "Óptimo para entrenar pesado" : total >= 11 ? "Moderado (ajustar RPE)" : "Fatiga alta (considerar deload/descanso)";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.innerHTML = "Estado actual: <strong>" + estado + "</strong> (" + ultimo.fecha + ")";
    estadoDiv.appendChild(badge);
  }

  _renderSaltos() {
    const cont = this.el.saltosRecientes;
    cont.replaceChildren();

    const saltos = this.perfil.data.saltos || [];
    if (saltos.length === 0) {
      cont.textContent = "Sin registros de salto CMJ.";
      return;
    }

    const ultimo = saltos[saltos.length - 1];
    const div = document.createElement("div");
    div.className = "badge";
    div.textContent = "Último salto CMJ: " + ultimo.altura + "cm (" + ultimo.fecha + ")";
    cont.appendChild(div);
  }

  _crearBloque() {
    const nombre = this.el.bloqueNombre.value.trim() || "Bloque principal";
    const tipo = this.el.bloqueTipo.value;
    const semanas = parseInt(this.el.bloqueSemanas.value, 10) || 4;

    this.periodizacion.crearBloque({ nombre, tipo, semanas });
    Store.guardar();
    Store.emit("blocks:updated");
    Toast.mostrar("Bloque de periodización activado", "success");
  }

  _registrarWellness() {
    const sueno = parseInt(this.el.wellnessSueno.value, 10) || 3;
    const estres = parseInt(this.el.wellnessEstres.value, 10) || 3;
    const doms = parseInt(this.el.wellnessDoms.value, 10) || 3;
    const motivacion = parseInt(this.el.wellnessMotivacion.value, 10) || 3;

    this.perfil.registrarWellness({ sueno, estres, doms, motivacion });
    Store.guardar();
    Store.emit("wellness:updated");
    Toast.mostrar("Wellness de hoy registrado", "success");
  }

  _registrarSalto() {
    const altura = parseFloat(this.el.saltoAltura.value);
    if (!altura || altura <= 0) {
      Toast.mostrar("Ingresa una altura de salto válida en cm", "warning");
      return;
    }

    this.perfil.registrarSalto(altura);
    Store.guardar();
    Store.emit("salto:updated");
    Toast.mostrar("Salto CMJ registrado (" + altura + "cm)", "success");
  }

  _exportarHistorialCSV() {
    const historial = this.rutina.historial || [];
    if (historial.length === 0) {
      Toast.mostrar("No hay sesiones para exportar", "warning");
      return;
    }
    const csv = seriesHistorialACSV(historial);
    Utils.descargarArchivo("gympro_series.csv", csv, "text/csv");
    Toast.mostrar("Historial exportado en CSV", "success");
  }

  _exportarHistorialPDF() {
    const historial = this.rutina.historial || [];
    const haySeries = historial.some((sesion) =>
      (sesion.ejercicios || []).some((e) => (e.series || []).length > 0)
    );
    if (!haySeries) {
      Toast.mostrar("No hay series para imprimir", "warning");
      return;
    }
    const abierta = imprimirHistorial(historial, "Historial de series");
    Toast.mostrar(
      abierta ? "Vista imprimible abierta: guarda como PDF" : "El navegador bloqueó la ventana de impresión",
      abierta ? "info" : "warning"
    );
  }

  async _borrarHistorial() {
    const ok = await Dialog.confirm("¿Seguro que deseas borrar todo el historial?", { peligroso: true });
    if (ok) {
      this.rutina.data.historial = [];
      Store.guardar();
      Store.emit("session:completed");
      Toast.mostrar("Historial borrado", "info");
    }
  }
}
