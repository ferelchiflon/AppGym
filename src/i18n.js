/**
 * src/i18n.js
 * Internacionalización ligera (es/en) del estilo del proyecto (hand-rolled,
 * sin dependencias, síncrono y testable).
 *
 * - t(clave, params): traduce con fallback al español y luego a la clave.
 * - aplicarIdioma(lang): persiste en localStorage (gympro:lang), actualiza
 *   <html lang/data-lang> y repinta las cadenas estáticas [data-i18n].
 * - aplicarTraduccionesEstaticas(raiz): reemplaza textContent/placeholder/
 *   title/aria-label de elementos marcados con data-i18n, data-i18n-placeholder,
 *   data-i18n-title, data-i18n-aria (se repite en cada cambio de idioma).
 *
 * Se puede sustituir por i18next más adelante manteniendo la misma API: t(),
 * aplicarIdioma() y el evento "app:langchange".
 */

import { es } from "./locales/es.js";
import { en } from "./locales/en.js";

const DICT = { es, en };
const FALLBACK = "es";
const STORAGE_KEY = "gympro:lang";

let langActual = FALLBACK;

/** Idioma corriente (es | en). */
export function idiomaActual() {
  return langActual;
}

/**
 * Idioma inicial: preferencia guardada, o español por defecto.
 * La detección por navigator.language queda desactivada por defecto para no
 * sorprender a la base de usuarios hispanohablantes; el selector lo permite.
 */
export function detectarIdioma() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado === "es" || guardado === "en") return guardado;
  } catch {
    /* almacenamiento no disponible */
  }
  return FALLBACK;
}

/** Interpola {params} en plantillas tipo "{n} resultados". */
function interpolar(cadena, params) {
  if (!cadena || !params) return cadena;
  return cadena.replace(/\{(\w+)\}/g, (match, k) => (k in params ? String(params[k]) : match));
}

/** Busca una ruta "a.b.c" dentro de un objeto de diccionario. */
function getByPath(dict, ruta) {
  let nodo = dict;
  for (const parte of ruta.split(".")) {
    if (!nodo) return undefined;
    nodo = nodo[parte];
  }
  return nodo;
}

/**
 * Traduce una clave. Ejemplo: t("workout.resultado", { n: 3 }).
 * Fallbacks: diccionario actual -> español -> la propia clave.
 */
export function t(clave, params) {
  let valor = getByPath(DICT[langActual] || {}, clave);
  if (typeof valor === "function") return interpolar(valor(params), params);
  if (typeof valor === "string") return interpolar(valor, params);

  valor = getByPath(DICT[FALLBACK], clave);
  if (typeof valor === "function") return interpolar(valor(params), params);
  if (typeof valor === "string") return interpolar(valor, params);
  return clave;
}

/** Cambia de idioma, persiste y repinta la interfaz. Devuelve es|en. */
export function aplicarIdioma(lang, persistir = true) {
  if (!DICT[lang]) lang = FALLBACK;
  langActual = lang;

  if (typeof document !== "undefined") {
    const raiz = document.documentElement;
    raiz.setAttribute("lang", lang);
    raiz.setAttribute("data-lang", lang);
    aplicarTraduccionesEstaticas(document);
    document.dispatchEvent(new CustomEvent("app:langchange", { detail: { lang } }));
  }

  if (persistir) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* almacenamiento no disponible */
    }
  }
  return lang;
}

/** Repinta las cadenas estáticas marcadas con data-i18n dentro de raiz. */
export function aplicarTraduccionesEstaticas(raiz) {
  const scope = raiz || (typeof document !== "undefined" ? document : null);
  if (!scope || typeof scope.querySelectorAll !== "function") return;

  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    const clave = el.getAttribute("data-i18n");
    if (clave) el.textContent = t(clave);
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
  });
}