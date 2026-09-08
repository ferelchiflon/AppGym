/**
 * src/components/Button.js
 * Botón reutilizable (DS dark + naranja).
 *
 * Devuelve un <button> construido con DOM nativo (nada de innerHTML con
 * datos de usuario → sin riesgo de XSS). Soporta variantes (primary,
 * secondary, danger, ghost), tamaños (sm, md, lg), estado de carga con
 * spinner y microinteracción de ripple.
 *
 * Uso:
 *   import { Button } from './Button.js';
 *   const el = Button({ text: 'Guardar', variant: 'primary', loading: true });
 */

export function Button({
  text = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  onClick = null,
} = {}) {
  const btn = document.createElement('button');
  btn.type = type;
  btn.className = ['gp-btn', `gp-btn--${variant}`, `gp-btn--${size}`, className]
    .filter(Boolean)
    .join(' ');

  if (disabled || loading) btn.disabled = true;

  // Icono opcional (nodo DOM) si se provee.
  if (icon) {
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);
  }

  // Etiqueta de texto (textContent: siempre seguro).
  const label = document.createElement('span');
  label.className = 'gp-btn__label';
  label.textContent = text || '';
  btn.appendChild(label);

  // Spinner de carga.
  if (loading) {
    btn.classList.add('is-loading');
    const spinner = document.createElement('span');
    spinner.className = 'gp-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    btn.prepend(spinner);
  }

  if (typeof onClick === 'function') btn.addEventListener('click', onClick);

  // Efecto ripple (ondulación concéntrica desde el punto de clic).
  btn.addEventListener('click', function onClickRipple(e) {
    const rect = btn.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'gp-ripple';
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - rect.left - diameter / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - diameter / 2}px`;
    btn.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 650);
  });

  return btn;
}

export default Button;