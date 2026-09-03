/**
 * src/app.js
 * Orquestador principal modularizado y reactivo.
 * Delega la lógica de presentación en controladores de vista específicos:
 *   - WorkoutController: Rutina activa, series rápidas, 1RM, warm-up, calculadora de discos, timer.
 *   - HistoryController: Historial de sesiones, periodización, wellness, saltos CMJ.
 *   - AnalyticsController: Gráficos de 1RM, volumen por músculo/sesión, correlación wellness.
 *   - ProfileController: Perfil de atleta, medidas, IMC, métricas acumuladas, backups.
 */

import { Store } from "./store.js";
import { Toast } from "./toast.js";
import { Dialog } from "./dialog.js";
import { PerfilAtleta } from "./perfil-atleta.js";
import { GestorRutina } from "./gestor-rutina.js";
import { GestorPeriodizacion } from "./gestor-periodizacion.js";
import { GestorTimer } from "./gestor-timer.js";

import { WorkoutController } from "./controllers/workout.controller.js";
import { HistoryController } from "./controllers/history.controller.js";
import { AnalyticsController } from "./controllers/analytics.controller.js";
import { ProfileController } from "./controllers/profile.controller.js";
import { DashboardController } from "./controllers/dashboard.controller.js";
import { AppNavigator } from "./navigation/navigator.js";

export class AppGymPro {
  constructor() {
    const perfilActivo = Store.getPerfilActivo();

    this.perfil = new PerfilAtleta(perfilActivo);
    this.rutina = new GestorRutina(perfilActivo);
    this.periodizacion = new GestorPeriodizacion(perfilActivo.bloques);
    this.timer = new GestorTimer();

    this._bindDOM();
    Toast.init();

    // Inicializar controladores especializados de cada vista
    this.workoutCtrl = new WorkoutController({
      app: this,
      el: this.el,
      rutina: this.rutina,
      timer: this.timer,
    });

    this.historyCtrl = new HistoryController({
      el: this.el,
      rutina: this.rutina,
      periodizacion: this.periodizacion,
      perfil: this.perfil,
    });

    this.analyticsCtrl = new AnalyticsController({
      el: this.el,
      rutina: this.rutina,
      perfil: this.perfil,
    });

    this.profileCtrl = new ProfileController({
      app: this,
      el: this.el,
      perfil: this.perfil,
      rutina: this.rutina,
    });

    this.dashboardCtrl = new DashboardController({
      app: this,
      rutina: this.rutina,
      periodizacion: this.periodizacion,
      perfil: this.perfil,
      el: { container: this.el.dashboardContainer },
    });

    this._wakeLock = null;
    this._initWebAPIs();
    this._bindGlobalEvents();
    this._setupNavigation();
    this._renderPerfilesSelector();

    this.timer.vincularDisplay(this.el.timerDisplay);
    this.timer.agregarDisplay(this.el.miniTimerDisplay);
    this.timer.agregarDisplay(this.el.floatingTimerDisplay);
    this.timer.onTick = () => {
      this._actualizarFlotanteTimer();
      if (this.timer.corriendo) {
        this._solicitarWakeLock();
      }
    };
    this.timer.onFinish = () => {
      this._actualizarFlotanteTimer();
      this._liberarWakeLock();
      GestorTimer.vibrarPR();
      Toast.mostrar("⏰ Tiempo de descanso terminado", "success");
    };

    this._registrarServiceWorker();
  }

  _initWebAPIs() {
    // Desbloquear Web Audio API en la primera interacción táctil
    const unlockAudio = () => {
      GestorTimer.desbloquearAudio();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio, { passive: true, once: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true, once: true });

    // Re-adquirir Wake Lock si la página vuelve al primer plano y el timer está corriendo
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.timer && this.timer.corriendo) {
          this._solicitarWakeLock();
        }
      });
    }
  }

  async _solicitarWakeLock() {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator && !this._wakeLock) {
      try {
        this._wakeLock = await navigator.wakeLock.request("screen");
        this._wakeLock.addEventListener("release", () => {
          this._wakeLock = null;
        });
      } catch {
        /* Silencioso si el SO/navegador no permite Wake Lock */
      }
    }
  }

  _liberarWakeLock() {
    if (this._wakeLock) {
      try {
        this._wakeLock.release();
      } catch {
        /* Noop */
      }
      this._wakeLock = null;
    }
  }

  cambiarPerfilActivo(id) {
    if (!Store.cambiarPerfil(id)) return false;
    this.actualizarPerfilActual();
    const perfil = Store.getPerfilActivo();
    Toast.mostrar(`Atleta activo: ${perfil.nombre}`, "info");
    return true;
  }

  actualizarPerfilActual() {
    const perfilActivo = Store.getPerfilActivo();
    this.perfil = new PerfilAtleta(perfilActivo);
    this.rutina = new GestorRutina(perfilActivo);
    this.periodizacion = new GestorPeriodizacion(perfilActivo.bloques);

    this.workoutCtrl.actualizarInstancias({ rutina: this.rutina, timer: this.timer });
    this.historyCtrl.actualizarInstancias({
      rutina: this.rutina,
      periodizacion: this.periodizacion,
      perfil: this.perfil,
    });
    this.analyticsCtrl.actualizarInstancias({
      rutina: this.rutina,
      perfil: this.perfil,
    });
    this.profileCtrl.actualizarInstancias({
      perfil: this.perfil,
      rutina: this.rutina,
    });
    this.dashboardCtrl.actualizarInstancias({
      rutina: this.rutina,
      periodizacion: this.periodizacion,
      perfil: this.perfil,
    });

    this._renderPerfilesSelector();
    Store.emit("profile:changed", perfilActivo);
  }

  async crearNuevoPerfil(nombre) {
    if (!nombre) return;
    const nuevo = Store.crearPerfil(nombre);
    this.actualizarPerfilActual();
    Toast.mostrar(`Perfil "${nuevo.nombre}" creado y activado`, "success");
  }

  async eliminarPerfilActivo() {
    const data = Store.getData();
    if (Object.keys(data.profiles).length <= 1) {
      Toast.mostrar("Debe quedar al menos un perfil", "error");
      return;
    }
    const ok = await Dialog.confirm(
      "¿Eliminar este perfil y todos sus datos? Esta acción no se puede deshacer.",
      { textoConfirmar: "Eliminar", peligroso: true }
    );
    if (ok) {
      Store.eliminarPerfil(data.activeProfileId);
      this.actualizarPerfilActual();
      Toast.mostrar("Perfil eliminado correctamente", "info");
    }
  }

  _bindDOM() {
    this.$ = (id) => document.getElementById(id);
    this.el = {
      dashboardContainer: this.$("dashboardContainer"),
      profileSelect: this.$("profileSelect"),
      nuevoPerfilBtn: this.$("nuevoPerfilBtn"),
      eliminarPerfilBtn: this.$("eliminarPerfilBtn"),
      filtroMusculoSelect: this.$("filtroMusculoSelect"),
      filtroPatronSelect: this.$("filtroPatronSelect"),
      selectEjercicio: this.$("ejercicioSelect"),
      crearEjercicioBtn: this.$("crearEjercicioBtn"),
      rutinaContainer: this.$("rutinaContainer"),
      ejerciciosCount: this.$("ejerciciosCount"),
      agregarBtn: this.$("agregarEjercicioBtn"),
      resetRutinaBtn: this.$("resetRutinaBtn"),
      guardarPlantillaBtn: this.$("guardarPlantillaBtn"),
      plantillasContainer: this.$("plantillasContainer"),
      pesoKg: this.$("pesoKg"),
      tiempoMin: this.$("tiempoMin"),
      calcularBtn: this.$("calcularMetricasBtn"),
      kcalDisplay: this.$("kcalDisplay"),
      fuerzaDisplay: this.$("fuerzaDisplay"),
      volumenTotalDisplay: this.$("volumenTotalDisplay"),
      fuerzaAcumulada: this.$("fuerzaAcumulada"),
      kcalAcumuladas: this.$("kcalAcumuladas"),
      volumenAcumulado: this.$("volumenAcumulado"),
      resetProgresoBtn: this.$("resetProgresoBtn"),
      pechoCm: this.$("pechoCm"),
      cinturaCm: this.$("cinturaCm"),
      caderaCm: this.$("caderaCm"),
      pesoCorporalKg: this.$("pesoCorporalKg"),
      alturaCm: this.$("alturaCm"),
      guardarMedidasBtn: this.$("guardarMedidasBtn"),
      calcularIMCBtn: this.$("calcularIMCBtn"),
      imcValor: this.$("imcValor"),
      estadoIMC: this.$("estadoIMC"),
      medidasGuardadas: this.$("medidasGuardadas"),
      perfilEdad: this.$("perfilEdad"),
      perfilGrasa: this.$("perfilGrasa"),
      perfilObjetivo: this.$("perfilObjetivo"),
      perfilNivel: this.$("perfilNivel"),
      guardarPerfilBtn: this.$("guardarPerfilBtn"),
      seriesContainer: this.$("seriesContainer"),
      serieForm: this.$("serieForm"),
      serieFormEmpty: this.$("serieFormEmpty"),
      seriePeso: this.$("seriePeso"),
      serieReps: this.$("serieReps"),
      serieRPE: this.$("serieRPE"),
      serieRIR: this.$("serieRIR"),
      serieNotas: this.$("serieNotas"),
      rpePorcentajeDisplay: this.$("rpePorcentajeDisplay"),
      addSerieBtn: this.$("addSerieBtn"),
      guardarSesionBtn: this.$("guardarSesionBtn"),
      limpiarSeriesBtn: this.$("limpiarSeriesBtn"),
      rmEpley: this.$("rmEpley"),
      rmBrzycki: this.$("rmBrzycki"),
      rmLombardi: this.$("rmLombardi"),
      rmPromedio: this.$("rmPromedio"),
      autoregSugerencia: this.$("autoregSugerencia"),
      rpeObjetivoInput: this.$("rpeObjetivoInput"),
      warmUpContainer: this.$("warmUpContainer"),
      calcularWarmUpBtn: this.$("calcularWarmUpBtn"),
      discoPesoObjetivo: this.$("discoPesoObjetivo"),
      discoPesoBarra: this.$("discoPesoBarra"),
      calcularDiscosBtn: this.$("calcularDiscosBtn"),
      discosResultado: this.$("discosResultado"),
      historialContainer: this.$("historialContainer"),
      exportHistorialBtn: this.$("exportHistorialBtn"),
      exportHistorialPdfBtn: this.$("exportHistorialPdfBtn"),
      clearHistorialBtn: this.$("clearHistorialBtn"),
      exportTodoBtn: this.$("exportTodoBtn"),
      importTodoInput: this.$("importTodoInput"),
      exportarSeriesBtn: this.$("exportarSeriesBtn"),
      printSeriesBtn: this.$("printSeriesBtn"),
      timerMinutes: this.$("timerMinutes"),
      timerSeconds: this.$("timerSeconds"),
      setTimerBtn: this.$("setTimerBtn"),
      timerDisplay: this.$("timerDisplay"),
      startTimerBtn: this.$("startTimerBtn"),
      pauseTimerBtn: this.$("pauseTimerBtn"),
      resetTimerBtn: this.$("resetTimerBtn"),
      miniTimerDisplay: this.$("miniTimerDisplay"),
      miniTimerBtn: this.$("miniTimerBtn"),
      floatingTimerDisplay: this.$("floatingTimerDisplay"),
      floatPlayBtn: this.$("floatPlayBtn"),
      floatResetBtn: this.$("floatResetBtn"),
      wellnessSueno: this.$("wellnessSueno"),
      wellnessEstres: this.$("wellnessEstres"),
      wellnessDoms: this.$("wellnessDoms"),
      wellnessMotivacion: this.$("wellnessMotivacion"),
      registrarWellnessBtn: this.$("registrarWellnessBtn"),
      wellnessEstado: this.$("wellnessEstado"),
      saltoAltura: this.$("saltoAltura"),
      registrarSaltoBtn: this.$("registrarSaltoBtn"),
      saltosRecientes: this.$("saltosRecientes"),
      bloqueNombre: this.$("bloqueNombre"),
      bloqueTipo: this.$("bloqueTipo"),
      bloqueSemanas: this.$("bloqueSemanas"),
      crearBloqueBtn: this.$("crearBloqueBtn"),
      bloqueActualInfo: this.$("bloqueActualInfo"),
      bloquePrescripcionInfo: this.$("bloquePrescripcionInfo"),
      landmarksContainer: this.$("landmarksContainer"),
      chartEjercicioSelect: this.$("chartEjercicioSelect"),
      chartRM: this.$("chartRM"),
      chartVolumenMusculo: this.$("chartVolumenMusculo"),
      chartVolumenSesion: this.$("chartVolumenSesion"),
      chartWellness: this.$("chartWellness"),
      wellnessInsight: this.$("wellnessInsight"),
    };
  }

  _bindGlobalEvents() {
    // Manejo de Perfiles reactivo sin recarga de navegador
    this.el.profileSelect.addEventListener("change", () => {
      this.cambiarPerfilActivo(this.el.profileSelect.value);
    });

    this.el.nuevoPerfilBtn.addEventListener("click", async () => {
      const nombre = await Dialog.pedirTexto("Nombre del nuevo perfil de atleta:");
      if (nombre) {
        this.crearNuevoPerfil(nombre);
      }
    });

    this.el.eliminarPerfilBtn.addEventListener("click", () => {
      this.eliminarPerfilActivo();
    });
  }

  _renderPerfilesSelector() {
    const data = Store.getData();
    const frag = document.createDocumentFragment();
    Object.values(data.profiles).forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      if (p.id === data.activeProfileId) opt.selected = true;
      frag.appendChild(opt);
    });
    this.el.profileSelect.replaceChildren(frag);
  }

  _setupNavigation() {
    // Drawer hamburguesa + vista única + título de sección en el header.
    this.navigator = new AppNavigator();
    this.navigator.init();
    this.navigator.setOnTabEnter((tab) => {
      if (tab === "progress") {
        requestAnimationFrame(() => this.analyticsCtrl.render());
      }
      if (tab === "dashboard") {
        requestAnimationFrame(() => this.dashboardCtrl.render());
      }
    });

    // Dashboard es la vista de inicio: renderiza el contenido inicial.
    this.dashboardCtrl.render();

    // Tabs del bottom-nav: delegan al mismo navigator para mantener sincronía.
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.navigator.goTo(tab.getAttribute("data-tab"));
      });
    });

    // Toque en el mini timer del header -> abre el panel completo.
    this.el.miniTimerBtn?.addEventListener("click", () => {
      this.navigator.goTo("workout", "timerCard");
    });

    // Controles flotantes del timer (Play/Pausa + Reset), disponibles en todas las secciones.
    this.el.floatPlayBtn?.addEventListener("click", () => {
      if (this.timer.corriendo) this.timer.pausar();
      else this.timer.iniciar();
      this._actualizarFlotanteTimer();
    });
    this.el.floatResetBtn?.addEventListener("click", () => {
      this.timer.reset();
      this._actualizarFlotanteTimer();
    });

    this._actualizarFlotanteTimer();
  }

  _actualizarFlotanteTimer() {
    if (!this.el.floatPlayBtn) return;
    this.el.floatPlayBtn.textContent = this.timer.corriendo ? "⏸" : "▶";
    this.el.floatPlayBtn.classList.toggle("is-running", this.timer.corriendo);
  }

  _registrarServiceWorker() {
    if (
      "serviceWorker" in navigator &&
      (location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1")
    ) {
      navigator.serviceWorker.register("sw.js").catch(() => {
        // Silencioso: PWA progresiva
      });
    }
  }
}
