/**
 * src/components/Timer.js
 * Componente de temporizador de descanso (presentational) que envuelve al
 * motor GestorTimer (sin duplicar su lógica de conteo/sonido/vibración).
 *
 * Renderiza un display MM:SS y controles de iniciar/pausar (▶/⏸) y reiniciar (⟳).
 * Expone el gestor subyacente para sincronización de displays o eventos.
 *
 * Uso:
 *   import { Timer } from '../components/Timer.js';
 *   const t = Timer({ segundos: 150, onFinish: () => {} });
 *   host.appendChild(t.el);
 *   // más tarde:
 *   t.destroy();
 */

import { GestorTimer } from '../gestor-timer.js';

export function Timer({
  segundos = 150,
  onTick = null,
  onFinish = null,
} = {}) {
  const gestor = new GestorTimer();
  gestor.setTiempo(0, segundos);

  const root = document.createElement('div');
  root.className = 'gp-timer';

  const display = document.createElement('div');
  display.className = 'gp-timer__display';
  display.setAttribute('aria-live', 'polite');
  display.textContent = gestor.getTiempoFormateado();

  const controls = document.createElement('div');
  controls.className = 'gp-timer__controls';

  const btnStart = document.createElement('button');
  btnStart.type = 'button';
  btnStart.className = 'gp-btn gp-btn--primary gp-btn--sm gp-timer__btn';
  btnStart.setAttribute('aria-label', 'Iniciar');
  btnStart.setAttribute('aria-pressed', 'false');
  btnStart.textContent = '▶';

  const btnReset = document.createElement('button');
  btnReset.type = 'button';
  btnReset.className = 'gp-btn gp-btn--ghost gp-btn--sm gp-timer__btn';
  btnReset.setAttribute('aria-label', 'Reiniciar');
  btnReset.textContent = '⟳';

  controls.append(btnStart, btnReset);
  root.append(display, controls);

  gestor.vincularDisplay(display);
  if (typeof onTick === 'function') gestor.onTick = onTick;
  if (typeof onFinish === 'function') gestor.onFinish = onFinish;

  function toggle() {
    if (gestor.corriendo) {
      gestor.pausar();
      btnStart.textContent = '▶';
      btnStart.setAttribute('aria-label', 'Iniciar');
      btnStart.setAttribute('aria-pressed', 'false');
    } else {
      gestor.iniciar();
      btnStart.textContent = '⏸';
      btnStart.setAttribute('aria-label', 'Pausar');
      btnStart.setAttribute('aria-pressed', 'true');
    }
  }

  btnStart.addEventListener('click', toggle);
  btnReset.addEventListener('click', () => {
    gestor.reset();
    btnStart.textContent = '▶';
    btnStart.setAttribute('aria-label', 'Iniciar');
    btnStart.setAttribute('aria-pressed', 'false');
  });

  function destroy() {
    gestor.detener();
    btnStart.removeEventListener('click', toggle);
    root.remove();
  }

  return {
    el: root,
    gestor,
    iniciar: () => gestor.iniciar(),
    pausar: () => gestor.pausar(),
    reset: () => gestor.reset(),
    destroy,
  };
}

export default Timer;