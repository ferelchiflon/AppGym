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
import { GestorCardio } from "./gestor-cardio.js";
import { GestorPeriodizacion } from "./gestor-periodizacion.js";
import { GestorTimer } from "./gestor-timer.js";

import { WorkoutController } from "./controllers/workout.controller.js";
import { HistoryController } from "./controllers/history.controller.js";
import { AnalyticsController } from "./controllers/analytics.controller.js";
import { ProfileController } from "./controllers/profile.controller.js";
import { DashboardController } from "./controllers/dashboard.controller.js";
import { AppNavigator } from "./navigation/navigator.js";
import { SyncManager } from "./sync.js";

export class AppGymPro {
  constructor() {
    const perfilActivo = Store.getPerfilActivo();

    this.perfil = new PerfilAtleta(perfilActivo);
    this.rutina = new GestorRutina(perfilActivo);
    this.cardio = new GestorCardio(perfilActivo);
    this.periodizacion = new GestorPeriodizacion(perfilActivo.bloques);
    this.timer = new GestorTimer();

    this._bindDOM();
    Toast.init();
    this._initTheme();

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
      cardio: this.cardio,
      el: { container: this.el.dashboardContainer },
    });

    this._wakeLock = null;
    this._initWebAPIs();
    this._initSync();
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

  /**
   * Arranca la sincronización offline-first: cola persistente en IndexedDB,
   * listeners online/offline e indicador visual en la cabecera.
   */
  _initSync() {
    if (!this.el.syncStatusBtn) return;

    const pintar = (estado) => {
      const btn = this.el.syncStatusBtn;
      const dot = this.el.syncStatusDot;
      const label = this.el.syncStatusLabel;
      if (!btn) return;
      btn.dataset.estado = estado.online ? "online" : "offline";
      if (dot) {
        dot.className = "sync-status-dot " + (estado.online ? "on" : "off");
      }
      if (label) {
        label.textContent = estado.online
          ? estado.pendientes > 0
            ? "Sincronizando…"
            : "En línea"
          : "Sin conexión";
      }
      btn.title = estado.online
        ? estado.pendientes > 0
          ? estado.pendientes + " cambio(s) pendientes de sincronizar"
          : "Sincronización activa"
        : "Sin conexión. Tus cambios quedan en la cola local.";
    };

    this.sync = new SyncManager({
      intervaloColaMs: 8000,
      endpointUrl: null, // sin back-end; la cola es el respaldo offline-first local
      onEstadoCambio: pintar,
    });

    this.sync.iniciar().then(() => {
      this.sync.suscribirseAlStore(Store);
      this.sync.estado().then(pintar);
    });

    // Click en el indicador: intenta drenar la cola; si está offline, informa.
    this.el.syncStatusBtn.addEventListener("click", async () => {
      if (!this.sync.online) {
        Toast.mostrar("Sin conexión. Conéctate y pulsa de nuevo para sincronizar.", "info");
        return;
      }
      const n = await this.sync.procesarCola();
      if (n > 0) {
        Toast.mostrar("Sincronizado: " + n + " cambio(s)", "success");
      } else {
        Toast.mostrar("Todo sincronizado.", "info");
      }
      this.sync.estado().then(pintar);
    });
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
    this.cardio = new GestorCardio(perfilActivo);
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
      cardio: this.cardio,
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

  _initTheme() {
    // Botón de tema (menú + atajo del header): fuerza claro/oscuro de forma manual,
    // independiente de la preferencia del SO. Aprovecha los bloques
    // html[data-theme="light"/"dark"] ya definidos en tokens.css.
    const btns = [this.el.themeToggleBtn, this.el.themeHeaderBtn];
    const KEY = "gympro:tema";

    const temaDesdeSO = () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const aplicar = (tema, persistir = false) => {
      const raiz = document.documentElement;
      raiz.dataset.theme = tema;
      raiz.style.colorScheme = tema; // scrollbars/inputs nativos acordes al tema
      if (persistir) {
        try {
          localStorage.setItem(KEY, tema);
        } catch {
          /* almacenamiento no disponible */
        }
      }
      const oscuro = tema === "dark";
      btns.forEach((b) => b?.setAttribute("aria-pressed", String(oscuro)));

      // Botón del menú (icono + etiqueta textual)
      const menuBtn = this.el.themeToggleBtn;
      if (menuBtn) {
        const icono = menuBtn.querySelector(".theme-toggle-icon");
        const etiqueta = menuBtn.querySelector(".theme-toggle-label");
        if (icono) icono.textContent = oscuro ? "🌙" : "☀️";
        if (etiqueta) etiqueta.textContent = oscuro ? "Modo oscuro" : "Modo claro";
      }

      // Atajo del header (solo icono + tooltip accesible)
      const headerBtn = this.el.themeHeaderBtn;
      if (headerBtn) {
        const icono = headerBtn.querySelector(".theme-header-icon");
        if (icono) icono.textContent = oscuro ? "🌙" : "☀️";
        headerBtn.setAttribute(
          "aria-label",
          oscuro ? "Pulsando cambiarás al modo claro" : "Pulsando cambiarás al modo oscuro"
        );
        headerBtn.title = oscuro
          ? "Modo oscuro activo (pulsa para cambiar al modo claro)"
          : "Modo claro activo (pulsa para cambiar al modo oscuro)";
      }
    };

    // Preferencia guardada por el usuario; si no existe, la del sistema.
    let guardado = null;
    try {
      guardado = localStorage.getItem(KEY);
    } catch {
      /* sin acceso a storage */
    }
    const inicial = guardado === "light" || guardado === "dark" ? guardado : temaDesdeSO();
    aplicar(inicial);

    btns.forEach((btn) =>
      btn?.addEventListener("click", () => {
        const actual = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        const nuevo = actual === "dark" ? "light" : "dark";
        aplicar(nuevo, true);
        Toast.mostrar(nuevo === "dark" ? "🌙 Modo oscuro activado" : "☀️ Modo claro activado", "info");
      })
    );
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
      ejercicioBusqueda: this.$("ejercicioBusqueda"),
      ejercicioCountNote: this.$("ejercicioCountNote"),
      selectEjercicio: this.$("ejercicioSelect"),
      crearEjercicioBtn: this.$("crearEjercicioBtn"),
      rutinaContainer: this.$("rutinaContainer"),
      ejerciciosCount: this.$("ejerciciosCount"),
      agregarBtn: this.$("agregarEjercicioBtn"),
      resetRutinaBtn: this.$("resetRutinaBtn"),
      guardarPlantillaBtn: this.$("guardarPlantillaBtn"),
      plantillasContainer: this.$("plantillasContainer"),
      plantillasPredefinidasContainer: this.$("plantillasPredefinidasContainer"),
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
      syncStatusBtn: this.$("syncStatusBtn"),
      syncStatusDot: this.$("syncStatusDot"),
      syncStatusLabel: this.$("syncStatusLabel"),
      themeToggleBtn: this.$("themeToggleBtn"),
      themeHeaderBtn: this.$("themeHeaderBtn"),
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
