/**
 * src/components/dashboard-widgets.js
 * Widgets informativos del dashboard (Fase 1 · 2.2):
 *   - Último entrenamiento
 *   - Próximo objetivo
 *   - Logros recientes
 *
 * Módulo PURO: calcula y devuelve marcado HTML a partir de datos ya
 * disponibles (historial, prescripción de periodización, racha, PRs, RM).
 * No muta Store ni depende del DOM; facilita el testeo unitario.
 *
 * Estilos: `.dw-*` en styles/dashboard.css (ds lima + Oswald).
 */

/** Tarjeta base reutilizando el DS existente (panel-card + eyebrow). */
function card(titulo, body) {
  return `
      <div class="dw-card panel-card">
        <div class="eyebrow">${String(titulo).toUpperCase()}</div>
        <div class="dw-card__body">${body}</div>
      </div>`;
}

function esc(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalizar(s) {
  s = esc(s);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

/** Extrae la clave de fecha más confiable de una sesión de historial. */
function _fechaClave(s) {
  return (s && (s.fechaISO || s.timestamp || s.fecha)) || "";
}

/** Formatea una clave de fecha a DD mes abreviado (es-ES). */
function _fechaCorta(clave) {
  const texto = String(clave || "").slice(0, 10);
  if (!texto) return "—";
  const d = new Date(texto.indexOf("T") === -1 ? texto + "T00:00:00Z" : texto);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(d);
}

/**
 * Widget "Último entrenamiento".
 * @param {Array} historial Sesiones con { fechaISO|timestamp|fecha, ejercicios:[{musculo,series}] }.
 */
export function ultimoEntrenamiento(historial = []) {
  const sesiones = Array.isArray(historial) ? historial.slice() : [];
  if (!sesiones.length) {
    return card("Último entrenamiento", '<p class="dw-empty">Aún no registraste entrenamientos.</p>');
  }
  sesiones.sort((a, b) => String(_fechaClave(b)).localeCompare(String(_fechaClave(a))));
  const ses = sesiones[0];
  const ejercicios = (ses && ses.ejercicios) || [];
  const musculos = [...new Set(ejercicios.map((e) => e && e.musculo).filter(Boolean))];
  const seriesTotales = ejercicios.reduce((n, e) => n + (e.series ? e.series.length : 0), 0);
  const chips = musculos.slice(0, 3).map((m) => `<span class="dw-chip">${capitalizar(m)}</span>`);
  return card(
    "Último entrenamiento",
    `<div class="dw-row"><span class="dw-fecha">${_fechaCorta(_fechaClave(ses))}</span>
      <span><strong>${ejercicios.length}</strong> ejercicios · <strong>${seriesTotales}</strong> series</span></div>
      <div class="dw-chips">${chips.length ? chips.join("") : ""}</div>`
  );
}

/**
 * Widget "Próximo objetivo".
 * @param {Object|null} periodizacion GestorPeriodizacion (getPrescripcionActual).
 * @param {string} grupo Foco muscular sugerido para el hoy.
 */
export function proximoObjetivo(periodizacion = null, grupo = "") {
  let titular = "";
  let detalle = "";
  if (periodizacion && typeof periodizacion.getPrescripcionActual === "function") {
    try {
      const p = periodizacion.getPrescripcionActual();
      if (p) {
        const fase = p.fase || p.modeloNombre || "";
        const semana = p.semana ? ` · Semana ${p.semana}` : "";
        titular = fase ? capitalizar(fase) + semana : "Entrenar hoy";
        detalle = p.modeloDesc ? `<span class="dw-muted">${esc(p.modeloDesc)}</span>` : "";
      } else {
        titular = "Entrenar hoy";
      }
    } catch {
      titular = "Entrenar hoy";
    }
  } else {
    titular = "Entrenar hoy";
  }
  const foco = grupo ? `<div class="dw-row">Enfocá en <strong>${capitalizar(grupo)}</strong></div>` : "";
  return card("Próximo objetivo", `<div class="dw-objetivo">${titular}</div>${foco}${detalle}`);
}

/**
 * Widget "Logros recientes".
 * @param {Object} opts { prs, stre, best } valores ya computados por render().
 */
export function logrosRecientes({ prs = null, stre = 0, best = null } = {}) {
  const items = [];
  const nStreak = Number(stre) || 0;
  if (nStreak > 0) items.push(`Racha activa de <strong>${nStreak}</strong> ${nStreak === 1 ? "día" : "días"}`);
  if (prs && Array.isArray(prs.recientes) && prs.recientes.length) {
    items.push(`<strong>${prs.recientes.length}</strong> ${prs.recientes.length === 1 ? "nuevo PR" : "nuevos PRs"} en los últimos 14 días`);
  }
  if (prs && prs.mejor && prs.mejor.nombre) {
    items.push(`Mejor marca personal: <strong>${esc(prs.mejor.nombre)}</strong>`);
  } else if (best && best.nombre) {
    items.push(`Mejor RM actual: <strong>${esc(best.nombre)}</strong>`);
  }
  const body = items.length
    ? `<ul class="dw-achievements">${items.map((i) => `<li class="dw-item">${i}</li>`).join("")}</ul>`
    : '<p class="dw-empty">Entrená para desbloquear logros.</p>';
  return card("Logros recientes", body);
}

/** Sección completa reutilizable por el controlador de dashboard. */
export function renderSeguimiento({ historial = [], periodizacion = null, grupo = "", prs = null, stre = 0, best = null } = {}) {
  return `
      <h2 class="section-title">Seguimiento</h2>
      <div class="dashboard-section">
        ${ultimoEntrenamiento(historial)}
        ${proximoObjetivo(periodizacion, grupo)}
        ${logrosRecientes({ prs, stre, best })}
      </div>`;
}

export default { ultimoEntrenamiento, proximoObjetivo, logrosRecientes, renderSeguimiento };