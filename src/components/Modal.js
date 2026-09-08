/**
 * src/components/Modal.js
 * Modal accesible y reutilizable (DS dark + naranja).
 *
 * Overlay oscuro con backdrop-filter: blur(8px), transición de entrada
 * fade/scale, botones de confirmación/cancelación integrados (Button),
 * cierre con Escape / click en el fondo y restauración del foco previo.
 * SINGLETON: cada apertura cierra la instancia previa (mismo patrón que
 * ExerciseGuide/CardioForm).
 *
 * Uso:
 *   import { Modal } from './Modal.js';
 *   Modal.open({ title: 'Borrar', body: '¿Confirmás?', onConfirm: () => {...} });
 */

import { Button } from './Button.js';

let _activo = null;

function openModal({
  title = '',
  body = null,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = true,
  onConfirm = null,
  onClose = null,
} = {}) {
  if (_activo) Modal.close();

  const prevFocus = document.activeElement;

  const overlay = document.createElement('div');
  overlay.className = 'gp-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  if (title) overlay.setAttribute('aria-label', title);

  const box = document.createElement('div');
  box.className = 'gp-dialog';

  if (title) {
    const h = document.createElement('h2');
    h.className = 'gp-dialog__title';
    h.textContent = title;
    box.appendChild(h);
  }

  if (body) {
    if (body instanceof Node) {
      box.appendChild(body);
    } else {
      const p = document.createElement('p');
      p.className = 'gp-dialog__body';
      p.textContent = String(body);
      box.appendChild(p);
    }
  }

  const actions = document.createElement('div');
  actions.className = 'gp-dialog__actions';

  if (showCancel) {
    const btnCancel = Button({
      text: cancelText,
      variant: 'ghost',
      onClick: () => close(),
    });
    actions.appendChild(btnCancel);
  }

  const btnConfirm = Button({
    text: confirmText,
    variant: 'primary',
    onClick: () => {
      const res = typeof onConfirm === 'function' ? onConfirm() : true;
      if (res !== false) close();
    },
  });
  actions.appendChild(btnConfirm);

  box.appendChild(actions);
  overlay.appendChild(box);

  const onKeydown = (e) => {
    if (e.key === 'Escape') close();
  };
  const onOverlayClick = (e) => {
    if (e.target === overlay) close();
  };

  function close() {
    document.removeEventListener('keydown', onKeydown);
    overlay.removeEventListener('click', onOverlayClick);
    overlay.remove();
    document.body.classList.remove('gp-modal-open');
    if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    _activo = null;
    if (typeof onClose === 'function') onClose();
  }

  document.addEventListener('keydown', onKeydown);
  overlay.addEventListener('click', onOverlayClick);
  overlay._close = close;
  document.body.appendChild(overlay);
  document.body.classList.add('gp-modal-open');

  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    try {
      btnConfirm.focus();
    } catch {
      /* sin foco disponible */
    }
  });

  _activo = overlay;

  return { el: overlay, close };
}

export const Modal = {
  open: openModal,
  close() {
    if (_activo) _activo._close();
    if (_activo) _activo.remove();
  },
};

export default Modal;