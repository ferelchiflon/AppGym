/**
 * tests/setup.js
 * Polyfill de localStorage para entornos de test sin storage (Node >= 20
 * no expone localStorage global sin --localstorage-file). Proporciona un
 * mock en memoria con la misma API síncrona que el navegador para que
 * Store sea reproducible y determinista en los tests.
 */

class MemoryStorage {
  constructor() {
    this._data = new Map();
  }

  get length() {
    return this._data.size;
  }

  key(index) {
    return Array.from(this._data.keys())[index] ?? null;
  }

  getItem(key) {
    return this._data.has(String(key)) ? this._data.get(String(key)) : null;
  }

  setItem(key, value) {
    this._data.set(String(key), String(value));
  }

  removeItem(key) {
    this._data.delete(String(key));
  }

  clear() {
    this._data.clear();
  }
}

// Solo inyectamos si el entorno no lo provee (evita pisar jsdom real).
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MemoryStorage();
}