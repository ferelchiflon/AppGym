/**
 * src/sync.js
 * Sincronización offline-first con cola persistente.
 *
 * Estrategia:
 *  - Cada mutación del estado (que emita Store 'state:saved') se encola como
 *    una "operación" en IndexedDB (objeto `cola`). Así nada se pierde si la
 *    app se cierra mientras está offline.
 *  - Mientras haya conexión y exista una cola pendiente, se intenta drenar la
 *    cola hacia un endpoint REST configurable (SyncManager.manejarOperacion).
 *  - Si no hay endpoint configurado, las operaciones se conservan localmente:
 *    la cola es el propio "plan de sincronización" y el usuario puede vaciarla
 *    manualmente ("Marcar como sincronizado") desde el indicador del header.
 *
 * El estado visible (online/offline, operaciones pendientes) se comunica a la
 * UI a través de `onEstadoCambio(cola)` y los listeners `online`/`offline`.
 */

import { Toast } from "./toast.js";

const IDB_NAME = "gympro_sync";
const IDB_STORE = "cola";
const IDB_KEY = "id";

function abrirDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }
    const req = globalThis.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE, { keyPath: IDB_KEY });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function promisifyReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class SyncManager {
  constructor({
    intervaloColaMs = 10000,
    endpointUrl = null,
    onEstadoCambio = null,
    idFactory = null,
  } = {}) {
    this._intervaloColaMs = intervaloColaMs;
    this._endpointUrl = endpointUrl;
    this._onEstadoCambio = onEstadoCambio || (() => {});
    this._idFactory = idFactory || (() => Date.now().toString(36) + Math.random().toString(36).slice(2));
    this._db = null;
    this._online = typeof navigator === "undefined" ? true : navigator.onLine;
    this._timer = null;
    this._procesando = false;
    this._suscrito = null;
  }

  async iniciar() {
    try {
      this._db = await abrirDB();
    } catch {
      console.warn("[sync] IndexedDB no disponible; sync offline desactivado");
      this._db = null;
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", this._onOnline);
      window.addEventListener("offline", this._onOffline);
    }

    this._notificar();
    this._programarDrenado();
    return this;
  }

  destruir() {
    if (this._timer) clearTimeout(this._timer);
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this._onOnline);
      window.removeEventListener("offline", this._onOffline);
    }
    if (this._suscrito) this._suscrito();
  }

  _onOnline = () => {
    const cambio = !this._online;
    this._online = true;
    if (cambio) this._setOnline(true);
  };

  _onOffline = () => {
    const cambio = this._online;
    this._online = false;
    if (cambio) this._setOnline(false);
  };

  _setOnline(online) {
    this._online = online;
    if (online) {
      this._notificar(true);
      this._drenarCola();
    } else {
      Toast.mostrar("Sin conexión. Los cambios se guardarán en la cola local.", "warning");
      this._notificar();
    }
  }

  get online() {
    return this._online;
  }

  /** Escucha el evento 'state:saved' del Store y encola un snapshot del estado. */
  suscribirseAlStore(Store) {
    this._suscrito = Store.on("state:saved", (estado) => {
      this.encolarOperacion({ tipo: "estado_completo", entidad: "app", datos: estado });
    });
  }

  async encolarOperacion({ tipo, entidad, datos }) {
    if (!this._db) {
      console.warn("[sync] Cola no disponible; operación descartada", tipo);
      return null;
    }

    const op = {
      id: this._idFactory(),
      tipo,
      entidad,
      datos,
      createdAt: new Date().toISOString(),
      intentos: 0,
      sincronizada: false,
    };

    try {
      const tx = this._db.transaction(IDB_STORE, "readwrite");
      await promisifyReq(tx.objectStore(IDB_STORE).put(op));
      this._notificar();
    } catch (err) {
      console.error("[sync] No se pudo encolar la operación", err);
    }
    return op;
  }

  async _listarPendientes() {
    if (!this._db) return [];
    try {
      const tx = this._db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const cursorReq = store.openCursor();
      const ops = [];
      await new Promise((resolve, reject) => {
        cursorReq.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            ops.push(cursor.value);
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });
      return ops;
    } catch {
      return [];
    }
  }

  async _eliminar(id) {
    if (!this._db) return;
    try {
      const tx = this._db.transaction(IDB_STORE, "readwrite");
      await promisifyReq(tx.objectStore(IDB_STORE).delete(id));
    } catch (err) {
      console.error("[sync] No se pudo eliminar operación de la cola", err);
    }
  }

  async _marcarSincronizada(id) {
    if (!this._db) return;
    try {
      const tx = this._db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const op = await promisifyReq(store.get(id));
      if (op) {
        op.sincronizada = true;
        op.sincronizadaEn = new Date().toISOString();
        await promisifyReq(store.put(op));
      }
    } catch (err) {
      console.error("[sync] No se pudo marcar como sincronizada", err);
    }
  }

  /**
   * Procesa y envía cada operación pendiente. En ausencia de endpoint, marca
   * las operaciones como `sincronizada` (el "plan" se considera aplicado
   * localmente) y las elimina de la cola. Devuelve el número de operaciones procesadas.
   */
  async procesarCola() {
    if (this._procesando) return 0;
    if (!this._online) return 0;
    this._procesando = true;

    let procesadas = 0;
    try {
      const pendientes = await this._listarPendientes();
      for (const op of pendientes) {
        try {
          if (this._endpointUrl) {
            const res = await this.manejarOperacion(op);
            if (!res || res.ok === false) {
              op.intentos = (op.intentos || 0) + 1;
              if (this._db) {
                const tx = this._db.transaction(IDB_STORE, "readwrite");
                await promisifyReq(tx.objectStore(IDB_STORE).put(op));
              }
              break; // el back-end rechazó: detenemos el drenado
            }
          } else {
            await this._marcarSincronizada(op.id);
          }
          await this._eliminar(op.id);
          procesadas++;
        } catch (err) {
          console.error("[sync] Fallo procesando operación", op.id, err);
          break;
        }
      }
    } finally {
      this._procesando = false;
      this._notificar();
    }
    return procesadas;
  }

  /** Hook para sobreescribir el envío real (fetch). Devuelve un objeto con res.ok. */
  async manejarOperacion(op) {
    const res = await fetch(this._endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(op.datos),
    });
    return res.ok;
  }

  /** Drena la cola manualmente (botón del header o al reconectarse). */
  async _drenarCola() {
    const n = await this.procesarCola();
    if (n > 0) {
      Toast.mostrar("Cambios sincronizados (" + n + ")", "success");
    }
  }

  _programarDrenado() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      if (this._online) this._drenarCola();
      this._programarDrenado();
    }, this._intervaloColaMs);
  }

  /** Devuelve el estado actual de la cola para pintar el indicador del header. */
  async estado() {
    return {
      online: this._online,
      pendientes: (await this._listarPendientes()).length,
    };
  }

  /** Elimina todas las operaciones pendientes (el usuario acepta el estado local). */
  async limpiarCola() {
    if (!this._db) return 0;
    const pendientes = await this._listarPendientes();
    for (const op of pendientes) {
      await this._eliminar(op.id);
    }
    this._notificar();
    return pendientes.length;
  }

  _notificar(forzar = false) {
    if (forzar) {
      this.estado().then((estado) => {
        if (estado.pendientes > 0) {
          Toast.mostrar("Conexión restablecida. Sincronizando " + estado.pendientes + " cambio(s)…", "info");
        }
        this._onEstadoCambio(estado);
      });
      return;
    }
    this.estado().then((estado) => this._onEstadoCambio(estado));
  }
}