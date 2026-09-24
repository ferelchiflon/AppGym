/**
 * src/prefs.js
 * Capa centralizada de preferencias de UI (idioma, tema) sobre localStorage.
 *
 * Regla de arquitectura: este módulo es el ÚNICO punto de acceso a
 * localStorage para claves de preferencia "gympro:*" que NO pertenecen al
 * modelo de negocio (los datos de negocio viven en Store, que gestiona su
 * propio acceso con _ls()). Toda nueva preferencia de UI debe pasar por acá
 * para que el manejo de errores y la degradación sin storage sean uniformes.
 *
 * Envuelve el acceso en try/catch: en contextos sin storage disponible
 * (navegadores con storage bloqueado, SSR, Node sin polyfill) degrada a los
 * valores por defecto en lugar de lanzar.
 */

const _ls = () =>
  typeof globalThis !== "undefined" && globalThis.localStorage ? globalThis.localStorage : null;

/**
 * Lee una preferencia persistida.
 * @param {string} clave Nombre completo de la clave (ej. "gympro:tema").
 * @param {string|null} [fallback] Valor si no existe la clave o no hay storage.
 * @returns {string|null} El valor guardado o el fallback.
 */
export function getPref(clave, fallback = null) {
  try {
    return _ls()?.getItem(clave) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persiste una preferencia. No lanza si el storage no está disponible.
 * @param {string} clave
 * @param {string} valor
 * @returns {boolean} true si se pudo persistir.
 */
export function setPref(clave, valor) {
  try {
    _ls()?.setItem(clave, String(valor));
    return true;
  } catch {
    return false;
  }
}