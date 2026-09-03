/**
 * src/dnd.js
 * Reordenación por arrastre (Drag & Drop) mínima y sin dependencias.
 *
 * Usa Pointer Events (pointerdown/move/up) en lugar del HTML5 Drag & Drop,
 * porque este último no funciona en dispositivos táctiles (móvil/tablet).
 * Con Pointer Events cubrimos ratón y táctil con un único flujo.
 *
 * La lista DOM se reordena en vivo durante el arrastre y, al soltar, se
 * invoca `onReorder(fromIndex, toIndex)` para persistir el nuevo orden en
 * la capa de datos (GestureRutina → Store).
 *
 * Se entrega una API limpia:
 *   const dnd = hacerReordenable(container, { ...opciones });
 *   // ... más tarde:
 *   dnd.destroy();
 */

export function hacerReordenable(
  container,
  {
    selector = ".badge",
    handleSel = ".drag-handle",
    onReorder = () => {},
    activeClass = "dnd-active",
    draggingClass = "dnd-dragging",
    overClass = "dnd-over",
  } = {}
) {
  if (!container || typeof container.addEventListener !== "function") {
    return null;
  }

  let dragging = null;
  let startIndex = -1;
  let moved = false;
  let pointerId = null;

  const items = () => Array.from(container.querySelectorAll(selector));
  const indexOf = (el) => items().indexOf(el);

  const esManejador = (target) => !!(target && target.closest && target.closest(handleSel));
  const itemDe = (target) => (target && target.closest ? target.closest(selector) : null);

  function onPointerDown(e) {
    // La captura solo se dispara desde el manejador de arrastre, así los
    // botones internos (ⓘ / ×) y el click para seleccionar siguen funcionando.
    if (!esManejador(e.target)) return;
    const item = itemDe(e.target);
    if (!item) return;

    e.preventDefault();
    dragging = item;
    startIndex = indexOf(item);
    moved = false;
    pointerId = e.pointerId;

    if (typeof item.setPointerCapture === "function") {
      try {
        item.setPointerCapture(pointerId);
      } catch {
        /* noop */
      }
    }

    container.classList.add(activeClass);
    item.classList.add(draggingClass);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    moved = true;

    const siblings = items();
    let target = null;
    for (const sib of siblings) {
      if (sib === dragging) continue;
      const r = sib.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        target = sib;
        break;
      }
    }

    // Mover el elemento arrastrado a su nueva posición visual.
    if (target) {
      const targetMidY = target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
      if (e.clientY < targetMidY) {
        container.insertBefore(dragging, target);
      } else {
        container.insertBefore(dragging, target.nextSibling);
      }
    }

    siblings.forEach((s) => s.classList.toggle(overClass, s === target));
  }

  function onPointerUp() {
    if (!dragging) return;

    const endIndex = indexOf(dragging);
    container.classList.remove(activeClass);
    dragging.classList.remove(draggingClass);
    items().forEach((s) => s.classList.remove(overClass));

    if (moved && endIndex !== -1 && endIndex !== startIndex) {
      onReorder(startIndex, endIndex);
    }

    dragging = null;
    moved = false;
    pointerId = null;

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  }

  container.addEventListener("pointerdown", onPointerDown);
  if (!container.hasAttribute("data-dnd")) {
    container.setAttribute("data-dnd", "true");
  }

  return {
    destroy() {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    },
  };
}

/** Utilidad pura para reordenar un array manteniendo pares de superseries. */
export function reordenarArrayEjercicios(rutina, superseries, fromIdx, toIdx) {
  const pares = [];
  Object.entries(superseries || {}).forEach(([i, val]) => {
    const idx = Number(i);
    if (val && idx >= 0 && idx < rutina.length - 1) {
      pares.push([rutina[idx], rutina[idx + 1]]);
    }
  });

  const nuevo = [...rutina];
  const [movido] = nuevo.splice(fromIdx, 1);
  nuevo.splice(toIdx, 0, movido);

  // Remapeamos superseries: solo re-enlazamos pares que ya estaban vinculados
  // y que siguen siendo adyacentes tras el movimiento. Esto preserva la
  // semántica de la superserie (ejercicio i enlazado con el i+1).
  const nuevas = {};
  for (let i = 0; i < nuevo.length - 1; i++) {
    const par = `${nuevo[i]}|${nuevo[i + 1]}`;
    if (pares.some((p) => p.join("|") === par)) {
      nuevas[i] = true;
    }
  }

  return { rutina: nuevo, superseries: nuevas };
}