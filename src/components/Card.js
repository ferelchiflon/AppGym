/**
 * src/components/Card.js
 * Tarjeta reutilizable (DS dark + naranja) con header/body/footer.
 *
 * Construida con DOM nativo. `glow` activa el resplandor naranja
 * (--shadow-glow) en hover para superficies destacadas.
 *
 * Uso:
 *   import { Card } from './Card.js';
 *   const card = Card({ title: 'Volumen', body: '<p vía textContent o nodo>', glow: true });
 */

import Button from './Button.js'; // re-export práctico de conveniencia

export function Card({
  title = '',
  subtitle = '',
  body = null,
  footer = null,
  glow = false,
  className = '',
} = {}) {
  const card = document.createElement('section');
  card.className = ['gp-card', glow ? 'gp-card--glow' : '', className]
    .filter(Boolean)
    .join(' ');

  if (title || subtitle) {
    const head = document.createElement('header');
    head.className = 'gp-card__head';

    if (title) {
      const h = document.createElement('h3');
      h.className = 'gp-card__title';
      h.textContent = title;
      head.appendChild(h);
    }
    if (subtitle) {
      const p = document.createElement('p');
      p.className = 'gp-card__subtitle';
      p.textContent = subtitle;
      head.appendChild(p);
    }
    card.appendChild(head);
  }

  if (body) {
    const b = document.createElement('div');
    b.className = 'gp-card__body';
    if (body instanceof Node) {
      b.appendChild(body);
    } else {
      b.textContent = String(body);
    }
    card.appendChild(b);
  }

  if (footer) {
    const f = document.createElement('footer');
    f.className = 'gp-card__footer';
    if (footer instanceof Node) {
      f.appendChild(footer);
    } else {
      f.textContent = String(footer);
    }
    card.appendChild(f);
  }

  return card;
}

export default Card;
export { Button };