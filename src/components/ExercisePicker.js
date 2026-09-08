/**
 * src/components/ExercisePicker.js
 * Modal de búsqueda de ejercicios predefinidos con filtros por grupo muscular.
 *
 * Reutiliza Modal (DS lima + Oswald) y el catálogo src/data/exercises.js.
 * Al elegir un ejercicio dispara `onSelect(ejercicio)` y cierra el modal.
 *
 * Uso:
 *   import { ExercisePicker } from '../components/ExercisePicker.js';
 *   ExercisePicker.abrir({ onSelect: (ejercicio) => { ... } });
 */

import { Modal } from './Modal.js';
import { EJERCICIOS_CATALOGO } from '../data/exercises.js';

// "todos" primero, luego cada grupo muscular presente en el catálogo.
const GRUPOS = ['todos', ...new Set(EJERCICIOS_CATALOGO.map((e) => e.musculo))];

function capitalizarTexto(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function construirPicker({ onSelect }) {
  const body = document.createElement('div');
  body.className = 'exercise-picker';

  // Campo de búsqueda.
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'exercise-picker__search';
  search.setAttribute('placeholder', 'Buscar ejercicios…');
  search.setAttribute('aria-label', 'Buscar ejercicios');

  // Filtros por grupo muscular (chips).
  const filters = document.createElement('div');
  filters.className = 'exercise-picker__filters';
  let musculoActual = 'todos';

  const list = document.createElement('ul');
  list.className = 'exercise-picker__list';

  function actualizar() {
    const q = search.value.trim().toLowerCase();
    list.replaceChildren();
    EJERCICIOS_CATALOGO.filter(
      (e) =>
        (musculoActual === 'todos' || e.musculo === musculoActual) &&
        (!q || e.nombre.toLowerCase().includes(q))
    ).forEach((e) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'exercise-picker__item';
      btn.textContent = e.nombre;
      btn.addEventListener('click', () => {
        if (typeof onSelect === 'function') onSelect(e);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  GRUPOS.forEach((grupo) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'exercise-picker__filter';
    if (grupo === musculoActual) chip.classList.add('is-active');
    chip.textContent = grupo === 'todos' ? 'Todos' : capitalizarTexto(grupo);
    chip.addEventListener('click', () => {
      musculoActual = grupo;
      filters.querySelectorAll('.exercise-picker__filter').forEach((c) => c.classList.toggle('is-active', c === chip));
      actualizar();
    });
    filters.appendChild(chip);
  });

  search.addEventListener('input', actualizar);

  body.append(search, filters, list);
  actualizar();
  return body;
}

export const ExercisePicker = {
  _activo: null,

  abrir({ onSelect = null, title = 'Elegir ejercicio' } = {}) {
    if (this._activo) this.cerrar();

    const body = construirPicker({ onSelect });
    const handle = Modal.open({ title, body, showCancel: true, confirmText: 'Cerrar', cancelText: '' });

    this._activo = handle;

    // Devuelve un manejador por si el invocador quiere cerrarlo.
    return {
      cerrar: () => ExercisePicker.cerrar(),
      overlay: handle.el,
    };
  },

  cerrar() {
    if (this._activo && typeof this._activo.close === 'function') this._activo.close();
    this._activo = null;
  },
};

export default ExercisePicker;